import mongoose from 'mongoose';
import env from './env.js';
import { initDb } from '../repo/db.js';

/**
 * Initialise the persistence layer.
 *
 * The app ships with an embedded, file-backed store (see repo/db.js) so it runs
 * out of the box without any infrastructure — ideal for a hackathon demo. If a
 * reachable MONGODB_URI is supplied, Mongoose connects and logs it; model schemas
 * are provided in src/models for teams that want real MongoDB persistence.
 */
export async function connectDb() {
  initDb();
  if (env.mongoUri) {
    try {
      await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 4000 });
      console.log('[db] connected to MongoDB');
    } catch (err) {
      console.warn('[db] MongoDB unreachable, using embedded file store:', err.message);
    }
  } else {
    console.log('[db] no MONGODB_URI set — using embedded store (server/data/db.json)');
  }
}
