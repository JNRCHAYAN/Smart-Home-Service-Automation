import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

/**
 * A lightweight, file-backed collection system that mimics the subset of the
 * Mongoose API used by this app. This keeps the project fully runnable without
 * a MongoDB server for the hackathon demo (start in demo mode). The query/update
 * surface is intentionally narrow but sufficient for the app.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.resolve(__dirname, '../../data/db.json');

let collections = new Map();
let loaded = false;

function uid() {
  return crypto.randomUUID();
}

function getValue(doc, pathStr) {
  return pathStr.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), doc);
}

function matches(doc, filter) {
  return Object.entries(filter || {}).every(([key, expected]) => {
    if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
      const ops = expected;
      const actual = getValue(doc, key);
      return Object.entries(ops).every(([op, val]) => {
        switch (op) {
          case '$in':
            return Array.isArray(val) && val.includes(actual);
          case '$nin':
            return Array.isArray(val) && !val.includes(actual);
          case '$ne':
            return actual !== val;
          case '$gte':
            return actual >= val;
          case '$lte':
            return actual <= val;
          case '$gt':
            return actual > val;
          case '$lt':
            return actual < val;
          case '$exists':
            return (actual != null) === Boolean(val);
          case '$elemMatch':
            return Array.isArray(actual) && actual.some((el) => matches(el, val));
          case '$regex':
            return typeof actual === 'string' ? new RegExp(val).test(actual) : false;
          default:
            // try a nested object equality against a sub-path
            return JSON.stringify(actual) === JSON.stringify(val);
        }
      });
    }
    const actual = getValue(doc, key);
    if (Array.isArray(actual)) return actual.includes(expected);
    return actual === expected;
  });
}

function clone(obj) {
  return obj == null ? obj : JSON.parse(JSON.stringify(obj));
}

function isIndex(k) {
  return /^\d+$/.test(k);
}

/** Read a (possibly dotted) path from an object. */
function atPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

/** Write a (possibly dotted) path, creating intermediate objects/arrays. */
function setAtPath(obj, path, value) {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const next = keys[i + 1];
    if (cur[key] == null) cur[key] = isIndex(next) ? [] : {};
    cur = cur[key];
  }
  cur[keys[keys.length - 1]] = value;
}

/** Delete a (possibly dotted) path. */
function unsetAtPath(obj, path) {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    cur = cur[keys[i]];
    if (cur == null) return;
  }
  delete cur[keys[keys.length - 1]];
}

class Collection {
  constructor(name) {
    this.name = name;
    this.items = [];
  }

  _id() {
    return `doc_${this.name}_${uid()}`;
  }

  find(filter = {}) {
    const results = this.items.filter((d) => matches(d, filter));
    return new Chain(results);
  }

  findOne(filter = {}) {
    const found = this.items.find((d) => matches(d, filter));
    return new Chain(found ? [found] : []);
  }

  findById(id) {
    const found = this.items.find((d) => d._id === id);
    return new Chain(found ? [found] : []);
  }

  countDocuments(filter = {}) {
    return this.items.filter((d) => matches(d, filter)).length;
  }

  create(doc) {
    const withId = { _id: this._id(), ...clone(doc), createdAt: doc.createdAt || new Date().toISOString() };
    this.items.push(withId);
    return withId;
  }

  updateOne(filter, update) {
    const idx = this.items.findIndex((d) => matches(d, filter));
    if (idx === -1) return { matchedCount: 0 };
    this._applyUpdate(this.items[idx], update);
    return { matchedCount: 1 };
  }

  findByIdAndUpdate(id, update, opts = {}) {
    const idx = this.items.findIndex((d) => d._id === id);
    if (idx === -1) return null;
    this._applyUpdate(this.items[idx], update);
    return opts.new !== false ? clone(this.items[idx]) : clone(this.items[idx]);
  }

  findOneAndUpdate(filter, update, opts = {}) {
    const idx = this.items.findIndex((d) => matches(d, filter));
    if (idx === -1) return null;
    this._applyUpdate(this.items[idx], update);
    return clone(this.items[idx]);
  }

  _applyUpdate(doc, update) {
    for (const [op, payload] of Object.entries(update || {})) {
      if (op === '$set') {
        for (const [k, v] of Object.entries(payload)) setAtPath(doc, k, clone(v));
      } else if (op === '$inc') {
        for (const [k, v] of Object.entries(payload)) {
          const cur = atPath(doc, k);
          setAtPath(doc, k, (cur == null ? 0 : Number(cur)) + Number(v));
        }
      } else if (op === '$unset') {
        for (const [k] of Object.keys(payload)) unsetAtPath(doc, k);
      } else if (op === '$push') {
        for (const [k, v] of Object.entries(payload)) {
          const arr = atPath(doc, k);
          if (!Array.isArray(arr)) setAtPath(doc, k, []);
          atPath(doc, k).push(clone(v));
        }
      } else if (op === '$pull') {
        for (const [k, v] of Object.entries(payload)) {
          const arr = atPath(doc, k);
          if (Array.isArray(arr)) setAtPath(doc, k, arr.filter((el) => !matches(el, v)));
        }
      } else if (op === '$addToSet') {
        for (const [k, v] of Object.entries(payload)) {
          const arr = atPath(doc, k);
          if (!Array.isArray(arr)) setAtPath(doc, k, []);
          const cur = atPath(doc, k);
          const existing = cur.some((el) => JSON.stringify(el) === JSON.stringify(v));
          if (!existing) cur.push(clone(v));
        }
      } else {
        Object.assign(doc, clone(payload));
      }
    }
  }

  deleteMany(filter = {}) {
    const before = this.items.length;
    this.items = this.items.filter((d) => !matches(d, filter));
    return { deletedCount: before - this.items.length };
  }

  deleteOne(filter = {}) {
    const idx = this.items.findIndex((d) => matches(d, filter));
    if (idx === -1) return { deletedCount: 0 };
    this.items.splice(idx, 1);
    return { deletedCount: 1 };
  }
}

class Chain {
  constructor(items) {
    this._items = items;
  }
  lean() {
    return clone(this._items);
  }
  exec() {
    return clone(this._items);
  }
  then(resolve, reject) {
    return Promise.resolve(clone(this._items)).then(resolve, reject);
  }
  sort(fn) {
    this._items = [...this._items].sort(fn);
    return this;
  }
  limit(n) {
    this._items = this._items.slice(0, n);
    return this;
  }
  populate() {
    return new Chain(this._items);
  }
  count() {
    return this._items.length;
  }
}

export function model(name) {
  if (!collections.has(name)) {
    const coll = new Collection(name);
    collections.set(name, coll);
  }
  return collections.get(name);
}

export function initDb() {
  if (loaded) return;
  if (fs.existsSync(DATA_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      for (const [name, items] of Object.entries(parsed)) {
        const coll = model(name);
        coll.items = items;
      }
    } catch (err) {
      console.warn('[db] could not read data file, starting empty:', err.message);
    }
  } else {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  }
  loaded = true;
}

export function persist() {
  const snapshot = {};
  for (const [name, coll] of collections.entries()) {
    snapshot[name] = coll.items;
  }
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(snapshot, null, 2));
}

export function resetDb() {
  collections = new Map();
  loaded = false;
  initDb();
}

export function clearAll() {
  collections = new Map();
  loaded = true;
  persist();
}

// Exposed for the optional Mongo adapter to register its own model.
export function registerModel(name, array) {
  const coll = model(name);
  coll.items = array;
}
