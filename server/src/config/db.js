import mongoose from 'mongoose';
import env from './env.js';

/**
 * Initialise the persistence layer.
 *
 * The app is fully backed by MongoDB (via Mongoose models in src/models). A
 * reachable MONGODB_URI is required; the server refuses to start without it so
 * the app never silently falls back to a demo store.
 */
export async function connectDb() {
  if (!env.mongoUri) {
    throw new Error(
      '[db] MONGODB_URI is not set. Add your MongoDB connection string to server/.env ' +
        '(MONGODB_URI=mongodb+srv://...) and restart the server.'
    );
  }
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
  console.log('[db] connected to MongoDB');
}
