import 'dotenv/config';

const env = {
  port: Number(process.env.PORT) || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  demoCustomerPhone: process.env.DEMO_CUSTOMER_PHONE || '01700000000',
  demoCustomerPassword: process.env.DEMO_CUSTOMER_PASSWORD || 'pass1234',
  demoProviderPhone: process.env.DEMO_PROVIDER_PHONE || '01800000001',
  demoProviderPassword: process.env.DEMO_PROVIDER_PASSWORD || 'pass1234',
  githubToken: process.env.GITHUB_TOKEN || '',
  githubModel: process.env.GITHUB_MODEL || 'gpt-4o-mini',
  chromaUrl: process.env.CHROMA_URL || 'http://localhost:8000',
  redisUrl: process.env.REDIS_URL || ''
};

export default env;
