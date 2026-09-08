import { connectDb } from '../config/db.js';
import { ensureSeed } from '../repo/repo.js';
import { activeProviderDocs } from '../repo/repo.js';

async function main() {
  await connectDb();
  const seeded = await ensureSeed();
  const providers = await activeProviderDocs();
  console.log(`Seeded ${providers.length} providers across 7 categories.`);
  if (seeded) {
    console.log(`Demo customer: ${seeded.customer.name} (phone ${seeded.customer.phone})`);
  } else {
    console.log('Data already present — skipping seed.');
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
