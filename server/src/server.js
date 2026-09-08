import app from './app.js';
import env from './config/env.js';
import { connectDb } from './config/db.js';
import { ensureSeed } from './repo/repo.js';

// Process entry point: connect to MongoDB, seed demo data when the DB is empty,
// then start the HTTP listener on the configured port.
async function start() {
  await connectDb();
  // ensureSeed is a no-op when users already exist, so restarts never duplicate
  // the demo accounts and providers.
  await ensureSeed();
  app.listen(env.port, () => {
    console.log(`[server] API running on http://localhost:${env.port}`);
    console.log(`[server] health check: http://localhost:${env.port}/health`);
  });
}

start().catch((err) => {
  console.error('[server] failed to start', err);
  process.exit(1);
});
