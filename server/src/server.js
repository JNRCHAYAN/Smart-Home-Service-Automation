import app from './app.js';
import env from './config/env.js';
import { connectDb } from './config/db.js';
import { ensureSeed } from './repo/repo.js';

async function start() {
  await connectDb();
  ensureSeed();
  app.listen(env.port, () => {
    console.log(`[server] API running on http://localhost:${env.port}`);
    console.log(`[server] health check: http://localhost:${env.port}/health`);
  });
}

start().catch((err) => {
  console.error('[server] failed to start', err);
  process.exit(1);
});
