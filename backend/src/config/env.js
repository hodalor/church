import 'dotenv/config';

const requiredEnvVars = [
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_EXPIRES_IN',
  'JWT_REFRESH_EXPIRES_IN',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPER_ADMIN_TENANT_ID',
  'SUPER_ADMIN_USERNAME',
  'SUPER_ADMIN_PIN',
];

const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

const env = {
  PORT: Number(process.env.PORT),
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPER_ADMIN_TENANT_ID: process.env.SUPER_ADMIN_TENANT_ID,
  SUPER_ADMIN_USERNAME: process.env.SUPER_ADMIN_USERNAME,
  SUPER_ADMIN_PIN: process.env.SUPER_ADMIN_PIN,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || '*',
};

if (Number.isNaN(env.PORT) || env.PORT <= 0) {
  throw new Error('PORT must be a valid positive number.');
}

export default env;
