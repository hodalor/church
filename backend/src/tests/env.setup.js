process.env.PORT = process.env.PORT || '5000';
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/prynova_test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test_jwt_secret_for_ci_minimum_32_chars';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_for_ci_minimum_32_chars';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
process.env.SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://example-project.supabase.co';
process.env.SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || 'test_supabase_anon_key';
process.env.SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'test_supabase_service_role_key';
process.env.SUPER_ADMIN_TENANT_ID =
  process.env.SUPER_ADMIN_TENANT_ID || 'prynova-master';
process.env.SUPER_ADMIN_USERNAME =
  process.env.SUPER_ADMIN_USERNAME || 'superadmin';
process.env.SUPER_ADMIN_PIN = process.env.SUPER_ADMIN_PIN || '123456';
process.env.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
