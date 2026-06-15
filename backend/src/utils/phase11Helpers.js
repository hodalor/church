import { createHttpError } from './httpError.js';

export const normalizeString = (value, { lowercase = false, uppercase = false } = {}) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const nextValue = value.trim();
  if (!nextValue) {
    return undefined;
  }

  if (lowercase) {
    return nextValue.toLowerCase();
  }

  if (uppercase) {
    return nextValue.toUpperCase();
  }

  return nextValue;
};

export const parseDate = (value) => {
  if (!value) {
    return undefined;
  }

  const nextDate = value instanceof Date ? value : new Date(value);
  return Number.isNaN(nextDate.getTime()) ? undefined : nextDate;
};

export const parseNumber = (value) => {
  if (value === null || typeof value === 'undefined' || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const parseBoolean = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
  }

  return undefined;
};

export const normalizeArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeString(String(item))).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => normalizeString(item))
      .filter(Boolean);
  }

  return [];
};

export const compactObject = (payload = {}) =>
  Object.fromEntries(
    Object.entries(payload).filter(([, value]) => {
      if (typeof value === 'undefined') {
        return false;
      }

      if (Array.isArray(value)) {
        return true;
      }

      if (value && typeof value === 'object' && !(value instanceof Date)) {
        return Object.keys(value).length > 0;
      }

      return true;
    }),
  );

export const escapeRegex = (value = '') =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const buildPagination = (query = {}, { defaultLimit = 20, maxLimit = 100 } = {}) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || defaultLimit, 1), maxLimit);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

export const buildSequenceId = (prefix, tenantId, sequence, width = 5) => {
  const normalizedTenantId = normalizeString(tenantId, { lowercase: true });
  return `${prefix}-${normalizedTenantId}-${String(sequence).padStart(width, '0')}`;
};

export const generateSequence = async (Model, tenantId, field, prefix, width = 5, filters = {}) => {
  const normalizedTenantId = normalizeString(tenantId, { lowercase: true });
  const latest = await Model.findOne({ tenantId: normalizedTenantId, ...filters })
    .sort({ createdAt: -1, _id: -1 })
    .select(field);

  const currentSequence = latest?.[field]
    ? Number(String(latest[field]).split('-').pop()) || 0
    : 0;

  return buildSequenceId(prefix, normalizedTenantId, currentSequence + 1, width);
};

export const formatPersonName = (...parts) =>
  parts.map((part) => normalizeString(part)).filter(Boolean).join(' ');

export const requireTenantIdForSuperAdmin = (req, fallbackSources = []) => {
  if (req.user?.role !== 'super_admin') {
    return req.tenantId;
  }

  const tenantId = [
    req.query?.tenantId,
    req.body?.tenantId,
    req.headers['x-tenant-id'],
    ...fallbackSources,
  ].find(Boolean);

  if (!tenantId) {
    throw createHttpError(400, 'Tenant ID is required for super admin requests.');
  }

  return normalizeString(tenantId, { lowercase: true });
};

export const startOfDay = (value = new Date()) => {
  const nextDate = new Date(value);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
};

export const endOfDay = (value = new Date()) => {
  const nextDate = new Date(value);
  nextDate.setHours(23, 59, 59, 999);
  return nextDate;
};
