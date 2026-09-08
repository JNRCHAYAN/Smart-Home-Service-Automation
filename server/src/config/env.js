import 'dotenv/config';

// Reads server/.env (via dotenv) into a single env object. Every value has a
// development-oriented default so the app runs with minimal setup but can be
// overridden per environment.
const env = {
  port: Number(process.env.PORT) || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  demoCustomerPhone: process.env.DEMO_CUSTOMER_PHONE || '01700000000',
  demoCustomerPassword: process.env.DEMO_CUSTOMER_PASSWORD || 'pass1234',
  demoProviderPhone: process.env.DEMO_PROVIDER_PHONE || '01800000001',
  demoProviderPassword: process.env.DEMO_PROVIDER_PASSWORD || 'pass1234',
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
  deepseekModel: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiEmbeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
  chromaUrl: process.env.CHROMA_URL || 'http://localhost:8000',
  redisUrl: process.env.REDIS_URL || ''
};

export default env;
