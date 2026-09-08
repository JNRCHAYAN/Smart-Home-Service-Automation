import { connectDb } from '../config/db.js';
import { ensureSeed } from '../repo/repo.js';
import { chromaRag } from './chromaRag.js';
import { ingestAllKnowledge } from './ingestKnowledge.js';

// Full bootstrap script: connects to MongoDB, seeds demo data, then ingests the
// knowledge base into ChromaDB. An unavailable ChromaDB only warns and skips
// ingestion rather than failing the whole seed.
async function main() {
  console.log('🔄 Starting full seed with knowledge base...');

  await connectDb();
  const seeded = ensureSeed();
  console.log('✅ Database seeded');

  try {
    await chromaRag.ensureCollection();
    console.log('✅ ChromaDB collection ready');

    await ingestAllKnowledge();
    console.log('✅ Knowledge base ingested');
  } catch (error) {
    console.warn('⚠️ ChromaDB not available, skipping knowledge ingestion:', error.message);
    console.log('   Start ChromaDB with: docker run -p 8000:8000 chromadb/chroma');
  }

  if (seeded) {
    console.log(`Demo customer: ${seeded.customer.name} (phone ${seeded.customer.phone})`);
  } else {
    console.log('Data already present — skipping seed.');
  }

  console.log('🎉 Full seed complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
