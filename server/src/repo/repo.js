import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Provider from '../models/Provider.js';
import ServiceRequest from '../models/ServiceRequest.js';
import { buildProviders } from '../services/seedData.js';
import { STATUS, SERVICE_CATEGORIES } from '../constants/index.js';

/**
 * Repository layer backed by MongoDB (Mongoose models in src/models).
 *
 * Every exported function is async and returns plain JSON-safe documents
 * (ids stringified) so the API/controllers keep working with the same shapes
 * the file-backed store used to produce.
 */

function stripVersion(o) {
  if (o && '__v' in o) delete o.__v;
  return o;
}

function asMap(o) {
  return o instanceof Map ? Object.fromEntries(o) : o;
}

/** Normalise a lean User doc: string _id, drop version key. */
function asUser(doc) {
  if (!doc) return null;
  const o = stripVersion({ ...doc });
  o._id = String(o._id);
  return o;
}

/** Normalise a lean Provider doc: string ids, plain price map. */
function asProvider(doc) {
  if (!doc) return null;
  const o = stripVersion({ ...doc });
  o._id = String(o._id);
  if (o.userId != null) o.userId = String(o.userId);
  o.pricePerService = asMap(o.pricePerService) || {};
  return o;
}

/** Normalise a lean ServiceRequest doc: string ids. */
function asRequest(doc) {
  if (!doc) return null;
  const o = stripVersion({ ...doc });
  o._id = String(o._id);
  if (o.customerId != null) o.customerId = String(o.customerId);
  if (o.matchedProviderId != null) o.matchedProviderId = String(o.matchedProviderId);
  if (Array.isArray(o.candidateMatches)) {
    o.candidateMatches = o.candidateMatches.map((c) => ({
      ...c,
      providerId: c.providerId != null ? String(c.providerId) : c.providerId
    }));
  }
  return o;
}

function isValidId(id) {
  return mongoose.isValidObjectId(id);
}

function byCreatedDesc(a, b) {
  return new Date(b.createdAt) - new Date(a.createdAt);
}

function byDateAsc(a, b) {
  return a.preferredDate < b.preferredDate ? -1 : 1;
}

function hour(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

function overlaps(sa, ea, sb, eb) {
  return sa < eb && sb < ea;
}

// ---------------------------------------------------------------- seeding

export async function ensureSeed() {
  // Seed only an empty database: if any user exists the demo data is skipped,
  // so repeated restarts never duplicate accounts or providers.
  const existing = await User.countDocuments({});
  if (existing > 0) return null;

  const customer = await createUser({
    name: 'Aminul Rahman',
    phone: process.env.DEMO_CUSTOMER_PHONE || '01700000000',
    email: 'aminul@demo.com',
    password: process.env.DEMO_CUSTOMER_PASSWORD || 'pass1234',
    role: 'customer',
    location: { address: 'Dhanmondi, Dhaka', lat: 23.746, lng: 90.376 }
  });

  const providerUser = await createUser({
    name: 'Karim Uddin',
    phone: process.env.DEMO_PROVIDER_PHONE || '01800000001',
    email: 'karim@demo.com',
    password: process.env.DEMO_PROVIDER_PASSWORD || 'pass1234',
    role: 'provider',
    location: { address: 'Dhanmondi, Dhaka', lat: 23.746, lng: 90.376 }
  });

  const adminUser = await createUser({
    name: 'System Administrator',
    phone: process.env.DEMO_ADMIN_PHONE || '01900000000',
    email: 'admin@servio.local',
    password: process.env.DEMO_ADMIN_PASSWORD || 'admin1234',
    role: 'admin',
    location: { address: 'Dhaka', lat: 23.75, lng: 90.38 }
  });

  const providers = buildProviders(providerUser._id);
  await Provider.insertMany(providers);

  return {
    customer: await findUserById(customer._id),
    provider: providerUser,
    admin: await findUserById(adminUser._id)
  };
}

// ---------------------------------------------------------------- users

export async function createUser({ name, phone, email, password, role, location }) {
  const hashed = bcrypt.hashSync(password, 10);
  const doc = await User.create({ name, phone, email, password: hashed, role, location });
  return asUser(await User.findById(doc._id).lean());
}

export async function findUserByPhone(phone) {
  if (!phone) return null;
  const doc = await User.findOne({ phone }).lean();
  return asUser(doc);
}

export async function findUserByEmail(email) {
  if (!email) return null;
  const doc = await User.findOne({ email: String(email).toLowerCase() }).lean();
  return asUser(doc);
}

export async function findUserById(id) {
  if (!isValidId(id)) return null;
  const doc = await User.findById(id).lean();
  return asUser(doc);
}

export async function updateUser(userId, patch) {
  const allowed = ['name', 'email', 'location'];
  const set = {};
  for (const k of allowed) if (patch[k] !== undefined && patch[k] !== null) set[k] = patch[k];
  if (Object.keys(set).length === 0) return findUserById(userId);
  await User.findByIdAndUpdate(userId, { $set: set });
  return findUserById(userId);
}

export async function updateProviderInfo(providerId, patch) {
  const allowed = ['businessName', 'serviceTypes', 'pricePerService', 'availability', 'isActive'];
  const set = {};
  for (const k of allowed) if (patch[k] !== undefined && patch[k] !== null) set[k] = patch[k];
  if (Object.keys(set).length === 0) return providerById(providerId);
  await Provider.findByIdAndUpdate(providerId, { $set: set });
  return providerById(providerId);
}

export async function providerByUserId(userId) {
  if (!isValidId(userId)) return null;
  const doc = await Provider.findOne({ userId }).lean();
  return asProvider(doc);
}

export async function createProviderProfile(userId, businessName) {
  const doc = await Provider.create({
    userId,
    businessName: businessName || 'New Service Provider',
    serviceTypes: [],
    rating: 4.0,
    pricePerService: {},
    location: { address: '', lat: 23.746, lng: 90.376 },
    availability: [],
    activeJobCount: 0,
    isActive: true
  });
  return providerById(doc._id);
}

export async function providerById(id) {
  if (!isValidId(id)) return null;
  const doc = await Provider.findById(id).lean();
  return asProvider(doc);
}

export async function allProviders() {
  const docs = await Provider.find({}).lean();
  return docs.map(asProvider);
}

export async function activeProviders() {
  const docs = await Provider.find({ isActive: { $ne: false } }).lean();
  return docs.map(asProvider);
}

export async function activeProviderDocs() {
  return activeProviders();
}

const ACTIVE_STATUSES = [STATUS.ACCEPTED, STATUS.ON_THE_WAY, STATUS.IN_PROGRESS];

/** Count of currently-active jobs per provider (computed, never drifts). */
export async function activeJobCountsMap() {
  const requests = await ServiceRequest.find({}).lean();
  const map = {};
  for (const r of requests) {
    if (r.matchedProviderId && ACTIVE_STATUSES.includes(r.status)) {
      const pid = String(r.matchedProviderId);
      map[pid] = (map[pid] || 0) + 1;
    }
  }
  return map;
}

// ---------------------------------------------------------------- requests

export async function createRequest(data) {
  const doc = await ServiceRequest.create({
    customerId: data.customerId,
    serviceType: data.serviceType,
    category: data.category,
    location: data.location,
    preferredDate: data.preferredDate,
    preferredTimeWindow: data.preferredTimeWindow,
    urgency: data.urgency,
    problemDetails: data.problemDetails,
    imageUrl: data.imageUrl,
    contact: data.contact,
    status: STATUS.REQUESTED,
    candidateMatches: [],
    timeline: [{ status: STATUS.REQUESTED, timestamp: new Date().toISOString() }]
  });
  return requestById(doc._id);
}

export async function requestById(id) {
  if (!isValidId(id)) return null;
  const doc = await ServiceRequest.findById(id).lean();
  return asRequest(doc);
}

export async function requestsByCustomer(customerId) {
  const docs = await ServiceRequest.find({ customerId }).lean();
  return docs.map(asRequest).sort(byCreatedDesc);
}

export async function saveCandidateMatches(requestId, matches) {
  const candidates = matches.map((m) => ({
    providerId: String(m.providerId),
    businessName: m.businessName,
    rating: m.rating,
    distanceKm: m.distanceKm,
    price: m.price,
    serviceTypes: m.serviceTypes,
    score: m.score,
    breakdown: m.breakdown,
    reason: m.reason,
    matched: false
  }));
  await ServiceRequest.findByIdAndUpdate(requestId, { $set: { candidateMatches: candidates } });
  return candidates;
}

export async function requestMatches(requestId) {
  const req = await requestById(requestId);
  return req ? req.candidateMatches : [];
}

// Double-booking guard: atomically lock a free slot for the provider.
export async function lockAvailabilitySlot(providerId, request) {
  const provider = await Provider.findById(providerId).lean();
  if (!provider) return false;
  const availability = Array.isArray(provider.availability) ? provider.availability : [];
  const reqDate = request.preferredDate;
  const rStart = hour(request.preferredTimeWindow.start);
  const rEnd = hour(request.preferredTimeWindow.end);

  let targetIndex = -1;
  for (let i = 0; i < availability.length; i++) {
    const slot = availability[i];
    if (slot.isBooked) continue;
    const sStart = hour(slot.startTime);
    const sEnd = hour(slot.endTime);
    if (slot.date === reqDate && overlaps(sStart, sEnd, rStart, rEnd)) {
      targetIndex = i;
      break;
    }
  }
  if (targetIndex === -1) return false;

  const next = availability.map((slot, i) => (i === targetIndex ? { ...slot, isBooked: true } : slot));
  await Provider.findByIdAndUpdate(providerId, { $set: { availability: next } });
  return true;
}

export async function unlockAvailabilitySlot(providerId, request) {
  const provider = await Provider.findById(providerId).lean();
  if (!provider) return;
  const availability = Array.isArray(provider.availability) ? provider.availability : [];
  const next = availability.map((slot) =>
    slot.isBooked && slot.date === request.preferredDate ? { ...slot, isBooked: false } : slot
  );
  await Provider.findByIdAndUpdate(providerId, { $set: { availability: next } });
}

export async function confirmMatch(requestId, providerId) {
  const req = await requestById(requestId);
  if (!req) throw new Error('Request not found');
  if (req.status !== STATUS.REQUESTED) throw new Error('Request is not awaiting confirmation');
  const ok = await lockAvailabilitySlot(providerId, req);
  if (!ok) throw new Error('No available slot for the selected provider');

  // Only assign the provider here; the opening "Requested" timeline entry was
  // already written by createRequest, so pushing it again would duplicate it.
  await ServiceRequest.findByIdAndUpdate(requestId, {
    $set: { matchedProviderId: String(providerId) }
  });
  return requestById(requestId);
}

// Provider sets a new status (Accept / On the Way / In Progress / Completed / Reject).
export async function setStatus(requestId, status, providerId) {
  const req = await requestById(requestId);
  if (!req) throw new Error('Request not found');
  const newStatus = status;

  const patch = {
    $set: { status: newStatus },
    $push: { timeline: { status: newStatus, timestamp: new Date().toISOString() } }
  };

  if (newStatus === STATUS.ACCEPTED) {
    // Resolve the provider document id from the acting provider's user account if
    // no match was confirmed by the customer (defensive, avoids user-id drift).
    if (!req.matchedProviderId) {
      const prov = await providerByUserId(providerId);
      if (prov) patch.$set.matchedProviderId = prov._id;
    }
  }
  if (newStatus === STATUS.REJECTED || newStatus === STATUS.CANCELLED) {
    if (req.matchedProviderId) await unlockAvailabilitySlot(req.matchedProviderId, req);
  }

  await ServiceRequest.findByIdAndUpdate(requestId, patch);
  return requestById(requestId);
}

export async function rescheduleRequest(requestId, customerId) {
  const req = await requestById(requestId);
  if (!req) throw new Error('Request not found');
  if (req.customerId !== customerId) throw new Error('Not your request');
  // Free the previous provider's locked slot before re-matching.
  if (req.matchedProviderId) await unlockAvailabilitySlot(req.matchedProviderId, req);
  await ServiceRequest.findByIdAndUpdate(requestId, {
    $set: { status: STATUS.REQUESTED, candidateMatches: [] },
    $push: { timeline: { status: 'Rescheduled', timestamp: new Date().toISOString() } }
  });
  return requestById(requestId);
}

// Move a request to a different date/time slot (chosen from the availability
// suggestions) and clear stale matches so the next /matches call recomputes.
export async function updateRequestSlot(requestId, customerId, { date, start, end }) {
  const req = await requestById(requestId);
  if (!req) throw new Error('Request not found');
  if (String(req.customerId) !== String(customerId)) throw new Error('Not your request');
  const changeable = [STATUS.REQUESTED, STATUS.REJECTED, STATUS.CANCELLED].includes(req.status);
  if (!changeable) throw new Error('Only requests awaiting a provider can change their time');
  if (req.matchedProviderId) await unlockAvailabilitySlot(req.matchedProviderId, req);
  await ServiceRequest.findByIdAndUpdate(requestId, {
    $set: {
      preferredDate: date,
      preferredTimeWindow: { start, end },
      status: STATUS.REQUESTED,
      matchedProviderId: null,
      candidateMatches: []
    },
    $push: { timeline: { status: 'Time changed', timestamp: new Date().toISOString() } }
  });
  return requestById(requestId);
}

export async function cancelRequest(requestId, customerId) {
  const req = await requestById(requestId);
  if (!req) throw new Error('Request not found');
  if (req.customerId !== customerId) throw new Error('Not your request');
  if (req.matchedProviderId) await unlockAvailabilitySlot(req.matchedProviderId, req);
  const updated = await ServiceRequest.findByIdAndUpdate(requestId, {
    $set: { status: STATUS.CANCELLED },
    $push: { timeline: { status: STATUS.CANCELLED, timestamp: new Date().toISOString() } }
  });
  return requestById(updated._id);
}

export async function addFeedback(requestId, rating, comment) {
  await ServiceRequest.findByIdAndUpdate(requestId, {
    $set: { feedback: { rating, comment, createdAt: new Date().toISOString() } }
  });
  return requestById(requestId);
}

// ---------------------------------------------------------------- provider views

export async function providerDashboard(providerId) {
  const requests = await ServiceRequest.find({ matchedProviderId: String(providerId) }).lean();
  const plain = requests.map(asRequest);
  const incoming = plain.filter((r) => r.status === STATUS.REQUESTED);
  const active = plain.filter((r) => ACTIVE_STATUSES.includes(r.status));
  const completed = plain.filter((r) => r.status === STATUS.COMPLETED);
  const provider = await providerById(providerId);
  return {
    provider,
    counts: {
      incoming: incoming.length,
      active: active.length,
      completed: completed.length,
      activeJobCount: active.length
    },
    incoming,
    active,
    completed
  };
}

export async function providerSchedule(providerId) {
  const provider = await providerById(providerId);
  const requests = await ServiceRequest.find({ matchedProviderId: String(providerId) }).lean();
  const plain = requests.map(asRequest).sort(byDateAsc);
  const bookedSlots = (provider?.availability || []).filter((s) => s.isBooked);
  const upcoming = plain.filter((r) =>
    [STATUS.REQUESTED, STATUS.ACCEPTED, STATUS.ON_THE_WAY, STATUS.IN_PROGRESS].includes(r.status)
  );
  return { provider, bookedSlots, upcoming };
}

export async function setProviderAvailability(providerId, availability) {
  await Provider.findByIdAndUpdate(providerId, { $set: { availability } });
  return providerById(providerId);
}

export async function invoiceFor(requestId) {
  const req = await requestById(requestId);
  if (!req) return null;
  const provider = req.matchedProviderId ? await providerById(req.matchedProviderId) : null;
  const price = provider ? Number(provider.pricePerService?.[req.serviceType]) || 0 : 0;
  const serviceCharge = Math.round(price * 0.06);
  const tax = Math.round((price + serviceCharge) * 0.05);
  return {
    requestId,
    invoiceNo: `INV-${requestId.slice(-6).toUpperCase()}`,
    providerName: provider?.businessName || '—',
    serviceType: req.serviceType,
    customerName: req.contact?.name,
    category: req.category,
    basePrice: price,
    serviceCharge,
    tax,
    total: price + serviceCharge + tax,
    currency: 'BDT',
    date: new Date().toISOString()
  };
}

export async function customerNotifications(customerId) {
  const requests = await ServiceRequest.find({ customerId }).lean();
  const items = [];
  for (const r of requests) {
    const t = r.timeline || [];
    const last = t[t.length - 1];
    if (last) {
      items.push({
        id: `${r._id}_${last.timestamp}`,
        requestId: String(r._id),
        serviceType: r.serviceType,
        status: last.status,
        timestamp: last.timestamp
      });
    }
  }
  items.sort((a, b) => (new Date(a.timestamp) < new Date(b.timestamp) ? 1 : -1));
  return items.slice(0, 20);
}

// ---------------------------------------------------------------- admin

export async function listUsers() {
  const docs = await User.find({ role: { $in: ['customer', 'provider'] } }).lean();
  return docs.map(asUser).sort(byCreatedDesc);
}

export async function listProviders() {
  const docs = await Provider.find({}).lean();
  return docs.map(asProvider);
}

export async function listRequests() {
  const docs = await ServiceRequest.find({}).lean();
  return docs.map(asRequest).sort(byCreatedDesc);
}

export async function updateUserAsAdmin(userId, patch) {
  const allowed = ['name', 'email', 'phone', 'role', 'location'];
  const set = {};
  for (const k of allowed) if (patch[k] !== undefined) set[k] = patch[k];
  if (set.role && !['customer', 'provider'].includes(set.role)) delete set.role;
  if (Object.keys(set).length === 0) return findUserById(userId);
  await User.findByIdAndUpdate(userId, { $set: set });
  return findUserById(userId);
}

export async function deleteUser(userId) {
  const user = await findUserById(userId);
  if (!user) return null;
  await Provider.deleteMany({ userId });
  await User.deleteOne({ _id: userId });
  return user;
}

export async function updateProviderAsAdmin(providerId, patch) {
  const allowed = ['businessName', 'serviceTypes', 'pricePerService', 'availability', 'rating', 'isActive'];
  const set = {};
  for (const k of allowed) if (patch[k] !== undefined) set[k] = patch[k];
  if (Object.keys(set).length === 0) return providerById(providerId);
  await Provider.findByIdAndUpdate(providerId, { $set: set });
  return providerById(providerId);
}

export async function adminStats() {
  const users = await listUsers();
  const providers = await listProviders();
  const reqs = await listRequests();
  const providersById = new Map(providers.map((p) => [p._id, p]));
  return {
    customers: users.filter((u) => u.role === 'customer').length,
    providers: providers.length,
    providerAccounts: users.filter((u) => u.role === 'provider').length,
    requests: reqs.length,
    pending: reqs.filter((r) => r.status === STATUS.REQUESTED).length,
    active: reqs.filter((r) => ACTIVE_STATUSES.includes(r.status)).length,
    completed: reqs.filter((r) => r.status === STATUS.COMPLETED).length,
    revenue: reqs
      .filter((r) => r.status === STATUS.COMPLETED && r.matchedProviderId)
      .reduce((sum, r) => {
        const p = providersById.get(r.matchedProviderId);
        return sum + (p ? Number(p.pricePerService?.[r.serviceType]) || 0 : 0);
      }, 0)
  };
}

// ---------------------------------------------------------------- category helpers

export function categoryForService(serviceType) {
  const cat = SERVICE_CATEGORIES.find((c) => c.services.includes(serviceType));
  return cat ? cat.label : null;
}
