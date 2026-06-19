import { randomUUID } from 'node:crypto';
import Tenant from './model.js';
import User from '../users/model.js';
import { createUser } from '../users/service.js';
import {
  getDefaultTenantCapabilities,
  isCapabilitySubset,
  normalizeCapabilities,
  resolveTenantCapabilities,
  resolveUserCapabilities,
} from '../access/capabilities.js';
import { createHttpError } from '../../utils/httpError.js';

const tenantSlugRegex = /^[a-z0-9-]{3,20}$/;
const defaultEligibleCountries = [
  { name: 'Ghana', countryCode: 'GH', currencyCode: 'GHS', currencySymbol: 'GHs' },
  { name: 'Nigeria', countryCode: 'NG', currencyCode: 'NGN', currencySymbol: 'NGN' },
  { name: 'Kenya', countryCode: 'KE', currencyCode: 'KES', currencySymbol: 'KES' },
  { name: 'South Africa', countryCode: 'ZA', currencyCode: 'ZAR', currencySymbol: 'R' },
  { name: 'United Kingdom', countryCode: 'GB', currencyCode: 'GBP', currencySymbol: 'GBP' },
  { name: 'United States', countryCode: 'US', currencyCode: 'USD', currencySymbol: '$' },
];

const normalizeString = (value, { lowercase = false } = {}) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const nextValue = value.trim();
  if (!nextValue) {
    return undefined;
  }

  return lowercase ? nextValue.toLowerCase() : nextValue;
};

const normalizeStringList = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.map((item) => normalizeString(String(item))).filter(Boolean))];
};

const normalizeGroupingNodes = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenIds = new Set();

  return value
    .map((item) => {
      const id = normalizeString(item?.id) || randomUUID();
      if (seenIds.has(id)) {
        return null;
      }

      const name = normalizeString(item?.name);
      if (!name) {
        return null;
      }

      seenIds.add(id);
      return {
        id,
        name,
        parentId: normalizeString(item?.parentId) || null,
        kind: normalizeString(item?.kind) || 'group',
        description: normalizeString(item?.description),
      };
    })
    .filter(Boolean);
};

const normalizeEligibleCountries = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set();

  return value
    .map((item) => {
      const name = normalizeString(item?.name);
      if (!name) {
        return null;
      }

      const key = name.toLowerCase();
      if (seen.has(key)) {
        return null;
      }

      seen.add(key);

      return {
        name,
        countryCode: normalizeString(item?.countryCode, { lowercase: false })?.toUpperCase() || '',
        currencyCode: normalizeString(item?.currencyCode, { lowercase: false })?.toUpperCase() || 'USD',
        currencySymbol: normalizeString(item?.currencySymbol) || '$',
      };
    })
    .filter(Boolean);
};

const buildTenantBranding = (tenantOrPayload = {}) => ({
  appName:
    normalizeString(tenantOrPayload.branding?.appName) ||
    normalizeString(tenantOrPayload.appName) ||
    normalizeString(tenantOrPayload.churchName) ||
    '',
  logoUrl:
    normalizeString(tenantOrPayload.branding?.logoUrl) ||
    normalizeString(tenantOrPayload.logoUrl) ||
    '',
  tagline:
    normalizeString(tenantOrPayload.branding?.tagline) ||
    normalizeString(tenantOrPayload.tagline) ||
    'Tenant workspace',
});

const buildTenantContent = (tenantOrPayload = {}) => ({
  branches: normalizeStringList(tenantOrPayload.content?.branches || tenantOrPayload.branches),
  departments: normalizeStringList(
    tenantOrPayload.content?.departments || tenantOrPayload.departments,
  ),
  ministries: normalizeStringList(tenantOrPayload.content?.ministries || tenantOrPayload.ministries),
  groupings: normalizeGroupingNodes(tenantOrPayload.content?.groupings || tenantOrPayload.groupings),
});

const buildTenantFinancial = (tenantOrPayload = {}) => ({
  currencyCode:
    normalizeString(tenantOrPayload.financial?.currencyCode, { lowercase: false })?.toUpperCase() ||
    normalizeString(tenantOrPayload.currencyCode, { lowercase: false })?.toUpperCase() ||
    'USD',
  currencySymbol:
    normalizeString(tenantOrPayload.financial?.currencySymbol) ||
    normalizeString(tenantOrPayload.currencySymbol) ||
    '$',
});

const buildPlatformConfig = (tenantOrPayload = {}) => ({
  eligibleCountries:
    normalizeEligibleCountries(
      tenantOrPayload.platformConfig?.eligibleCountries || tenantOrPayload.eligibleCountries,
    ) || [],
});

const serializeTenant = (tenantDocument) => {
  const tenant = tenantDocument?.toObject ? tenantDocument.toObject() : tenantDocument;
  const branding = buildTenantBranding(tenant);
  const content = buildTenantContent(tenant);
  const financial = buildTenantFinancial(tenant);
  const platformConfig = buildPlatformConfig(tenant);
  const { kioskPasscode, ...safeTenant } = tenant || {};

  return {
    ...safeTenant,
    capabilities: resolveTenantCapabilities(tenant),
    branding,
    content,
    financial,
    platformConfig: {
      eligibleCountries:
        platformConfig.eligibleCountries.length > 0
          ? platformConfig.eligibleCountries
          : defaultEligibleCountries,
    },
  };
};

const syncDefaultAdminCapabilities = async (tenantId, tenantCapabilities) => {
  if (!tenantId || !Array.isArray(tenantCapabilities) || !tenantCapabilities.length) {
    return;
  }

  const defaultAdmin = await User.findOne({
    tenantId: tenantId.trim().toLowerCase(),
    role: 'head_pastor',
  }).sort({ createdAt: 1 });

  if (!defaultAdmin) {
    return;
  }

  defaultAdmin.capabilities = [...tenantCapabilities];
  await defaultAdmin.save();
};

export const createTenant = async (payload) => {
  const normalizedTenantId = payload.tenantId.trim().toLowerCase();

  if (!tenantSlugRegex.test(normalizedTenantId)) {
    throw createHttpError(400, 'Tenant ID must be 3-20 characters and contain only lowercase letters, numbers, and hyphens.');
  }

  const tenantCapabilities = normalizeCapabilities(
    payload.capabilities,
    getDefaultTenantCapabilities(),
  );
  const initialUserCapabilities = [...tenantCapabilities];
  const branding = buildTenantBranding(payload);
  const content = buildTenantContent(payload);
  const financial = buildTenantFinancial(payload);

  const [existingTenant, existingEmail] = await Promise.all([
    Tenant.findOne({ tenantId: normalizedTenantId }),
    Tenant.findOne({ email: payload.email.trim().toLowerCase() }),
  ]);

  if (existingTenant) {
    throw createHttpError(409, 'Tenant ID already exists');
  }

  if (existingEmail) {
    throw createHttpError(409, 'Tenant email already exists');
  }

  const tenant = await Tenant.create({
    tenantId: normalizedTenantId,
    churchName: payload.churchName.trim(),
    email: payload.email.trim().toLowerCase(),
    phone: payload.phone?.trim(),
    country: payload.country?.trim(),
    logoUrl: payload.logoUrl?.trim(),
    subscriptionPlan: payload.subscriptionPlan || 'small',
    capabilities: tenantCapabilities,
    branding,
    content,
    financial,
  });

  const user = await createUser({
    tenantId: tenant.tenantId,
    username: payload.initialUsername.trim(),
    pin: payload.initialPin,
    role: 'head_pastor',
    fullName: payload.initialFullName?.trim(),
    email: payload.email.trim().toLowerCase(),
    phone: payload.phone?.trim(),
    capabilities: initialUserCapabilities,
  });

  return {
    tenant: serializeTenant(tenant),
    initialUser: {
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      capabilities: user.capabilities,
    },
  };
};

export const listTenants = async ({ page = 1, limit = 10, search = '', isActive }) => {
  const normalizedPage = Math.max(Number(page) || 1, 1);
  const normalizedLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const skip = (normalizedPage - 1) * normalizedLimit;

  const filters = {};

  if (search) {
    filters.$or = [
      { churchName: { $regex: search, $options: 'i' } },
      { tenantId: { $regex: search, $options: 'i' } },
    ];
  }

  if (typeof isActive !== 'undefined') {
    filters.isActive = isActive === 'true';
  }

  const [tenants, total, activeTenants, suspendedTenants, plansBreakdown] = await Promise.all([
    Tenant.find(filters).sort({ createdAt: -1 }).skip(skip).limit(normalizedLimit),
    Tenant.countDocuments(filters),
    Tenant.countDocuments({ ...filters, isActive: true }),
    Tenant.countDocuments({ ...filters, isSuspended: true }),
    Tenant.aggregate([
      { $match: filters },
      { $group: { _id: '$subscriptionPlan', count: { $sum: 1 } } },
    ]),
  ]);

  const plans = {
    small: 0,
    medium: 0,
    mega: 0,
  };

  plansBreakdown.forEach(({ _id, count }) => {
    plans[_id] = count;
  });

  return {
    tenants: tenants.map((tenant) => serializeTenant(tenant)),
    total,
    page: normalizedPage,
    totalPages: Math.ceil(total / normalizedLimit) || 1,
    summary: {
      total,
      active: activeTenants,
      suspended: suspendedTenants,
      plans,
    },
  };
};

export const getTenantById = async (tenantId) => {
  const tenant = await Tenant.findOne({ tenantId: tenantId.trim().toLowerCase() });
  if (!tenant) {
    throw createHttpError(404, 'Tenant not found');
  }
  return serializeTenant(tenant);
};

export const updateTenant = async (tenantId, payload) => {
  const normalizedCapabilities = Array.isArray(payload.capabilities)
    ? normalizeCapabilities(payload.capabilities)
    : null;
  const branding = payload.branding || payload.appName || payload.tagline || payload.logoUrl
    ? buildTenantBranding(payload)
    : null;
  const content = payload.content || payload.branches || payload.departments || payload.ministries || payload.groupings
    ? buildTenantContent(payload)
    : null;
  const financial =
    payload.financial || payload.currencyCode || payload.currencySymbol
      ? buildTenantFinancial(payload)
      : null;
  const platformConfig =
    payload.platformConfig || payload.eligibleCountries ? buildPlatformConfig(payload) : null;

  const tenant = await Tenant.findOneAndUpdate(
    { tenantId: tenantId.trim().toLowerCase() },
    {
      ...(payload.churchName ? { churchName: payload.churchName.trim() } : {}),
      ...(payload.email ? { email: payload.email.trim().toLowerCase() } : {}),
      ...(payload.phone ? { phone: payload.phone.trim() } : {}),
      ...(payload.country ? { country: payload.country.trim() } : {}),
      ...(payload.logoUrl ? { logoUrl: payload.logoUrl.trim() } : {}),
      ...(payload.subscriptionPlan ? { subscriptionPlan: payload.subscriptionPlan } : {}),
      ...(payload.kioskPasscode !== undefined ? { kioskPasscode: payload.kioskPasscode?.trim() || '' } : {}),
      ...(normalizedCapabilities ? { capabilities: normalizedCapabilities } : {}),
      ...(branding ? { branding } : {}),
      ...(content ? { content } : {}),
      ...(financial ? { financial } : {}),
      ...(platformConfig ? { platformConfig } : {}),
    },
    { new: true, runValidators: true },
  );

  if (!tenant) {
    throw createHttpError(404, 'Tenant not found');
  }

  if (normalizedCapabilities) {
    await syncDefaultAdminCapabilities(tenant.tenantId, normalizedCapabilities);
  }

  return serializeTenant(tenant);
};

export const suspendTenant = async (tenantId, suspendedReason) => {
  const tenant = await Tenant.findOneAndUpdate(
    { tenantId: tenantId.trim().toLowerCase() },
    { isSuspended: true, isActive: false, suspendedReason: suspendedReason?.trim() },
    { new: true, runValidators: true },
  );

  if (!tenant) {
    throw createHttpError(404, 'Tenant not found');
  }

  return tenant;
};

export const activateTenant = async (tenantId) => {
  const tenant = await Tenant.findOneAndUpdate(
    { tenantId: tenantId.trim().toLowerCase() },
    { isSuspended: false, isActive: true, suspendedReason: '' },
    { new: true, runValidators: true },
  );

  if (!tenant) {
    throw createHttpError(404, 'Tenant not found');
  }

  return tenant;
};

export const deleteTenant = async (tenantId) => {
  const tenant = await Tenant.findOneAndUpdate(
    { tenantId: tenantId.trim().toLowerCase() },
    { isActive: false },
    { new: true },
  );

  if (!tenant) {
    throw createHttpError(404, 'Tenant not found');
  }

  return tenant;
};

export const getPlatformAnalytics = async () => {
  const [totalTenants, activeTenants, suspendedTenants, totalUsers] = await Promise.all([
    Tenant.countDocuments(),
    Tenant.countDocuments({ isActive: true }),
    Tenant.countDocuments({ isSuspended: true }),
    User.countDocuments(),
  ]);

  return {
    totalTenants,
    activeTenants,
    suspendedTenants,
    totalUsers,
  };
};

export const getTenantCapabilities = async (tenantId) => {
  const tenant = await Tenant.findOne({ tenantId: tenantId.trim().toLowerCase() });

  if (!tenant) {
    throw createHttpError(404, 'Tenant not found');
  }

  return resolveTenantCapabilities(tenant);
};

export const validateCapabilitiesAgainstTenant = async (tenantId, capabilities) => {
  const tenantCapabilities = await getTenantCapabilities(tenantId);
  const normalizedCapabilities = normalizeCapabilities(capabilities);

  if (!isCapabilitySubset(normalizedCapabilities, tenantCapabilities)) {
    throw createHttpError(
      400,
      'Assigned user capabilities must stay within the church tenant capabilities.',
    );
  }

  return {
    tenantCapabilities,
    capabilities: normalizedCapabilities,
  };
};
