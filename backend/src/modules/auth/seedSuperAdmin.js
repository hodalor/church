import env from '../../config/env.js';
import { hashPin } from '../../utils/pinHelper.js';
import Tenant from '../tenants/model.js';
import User from '../users/model.js';

const seedSuperAdmin = async () => {
  const existingSuperAdmin = await User.findOne({
    tenantId: env.SUPER_ADMIN_TENANT_ID,
    role: 'super_admin',
  });

  if (existingSuperAdmin) {
    console.log('Super admin already exists');
    return existingSuperAdmin;
  }

  await Tenant.findOneAndUpdate(
    { tenantId: env.SUPER_ADMIN_TENANT_ID },
    {
      tenantId: env.SUPER_ADMIN_TENANT_ID,
      churchName: 'Prynova Master',
      email: `admin@${env.SUPER_ADMIN_TENANT_ID}.local`,
      country: 'United States',
      financial: {
        currencyCode: 'USD',
        currencySymbol: '$',
      },
      platformConfig: {
        eligibleCountries: [
          { name: 'Ghana', countryCode: 'GH', currencyCode: 'GHS', currencySymbol: 'GHs' },
          { name: 'Nigeria', countryCode: 'NG', currencyCode: 'NGN', currencySymbol: 'NGN' },
          { name: 'Kenya', countryCode: 'KE', currencyCode: 'KES', currencySymbol: 'KES' },
          { name: 'South Africa', countryCode: 'ZA', currencyCode: 'ZAR', currencySymbol: 'R' },
          { name: 'United Kingdom', countryCode: 'GB', currencyCode: 'GBP', currencySymbol: 'GBP' },
          { name: 'United States', countryCode: 'US', currencyCode: 'USD', currencySymbol: '$' },
        ],
      },
      isActive: true,
      isSuspended: false,
      subscriptionPlan: 'mega',
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );

  const pinHash = await hashPin(env.SUPER_ADMIN_PIN);

  const superAdmin = await User.create({
    tenantId: env.SUPER_ADMIN_TENANT_ID,
    username: env.SUPER_ADMIN_USERNAME,
    pinHash,
    role: 'super_admin',
    fullName: 'Prynova Super Admin',
    isActive: true,
  });

  console.log('Super admin seeded');
  return superAdmin;
};

export default seedSuperAdmin;
