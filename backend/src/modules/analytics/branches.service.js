import { createHttpError } from '../../utils/httpError.js';
import AnalyticsSnapshot from './models/analyticsSnapshot.model.js';
import BranchProfile from './models/branchProfile.model.js';
import {
  getDateRangeForPeriod,
  getTenantOrThrow,
  refreshBranchCache,
} from './analytics.helpers.js';
import {
  getScopedMetricsBundle,
  resolveAllowedBranchContext,
  resolveBranchProfileById,
  serializeBranchProfile,
} from './analytics.access.js';

const normalizeString = (value) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const nextValue = value.trim();
  return nextValue || undefined;
};

const normalizeTenantId = (value) => String(value || '').trim().toLowerCase();

export const createBranch = async (tenantId, payload = {}, actor = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const tenant = await getTenantOrThrow(normalizedTenantId);
  if (!tenant) {
    throw createHttpError(404, 'Tenant not found.');
  }

  const branchName = normalizeString(payload.branchName);
  if (!branchName) {
    throw createHttpError(400, 'Branch name is required.');
  }

  const existing = await BranchProfile.findOne({ tenantId: normalizedTenantId, branchName });
  if (existing) {
    throw createHttpError(409, 'Branch already exists for this tenant.');
  }

  const branchCode = normalizeString(payload.branchCode);
  if (branchCode) {
    const duplicateCode = await BranchProfile.findOne({
      tenantId: normalizedTenantId,
      branchCode,
    });
    if (duplicateCode) {
      throw createHttpError(409, 'Branch code already exists for this tenant.');
    }
  }

  const branchId = await BranchProfile.generateNextBranchId(normalizedTenantId);
  const branchProfile = await BranchProfile.create({
    tenantId: normalizedTenantId,
    branchId,
    branchName,
    branchCode,
    headPastorId: normalizeString(payload.headPastorId),
    headPastorName: normalizeString(payload.headPastorName),
    address: normalizeString(payload.address),
    city: normalizeString(payload.city),
    country: normalizeString(payload.country),
    phone: normalizeString(payload.phone),
    email: normalizeString(payload.email),
    logoUrl: normalizeString(payload.logoUrl),
    gpsCoordinates: payload.gpsCoordinates,
    establishedDate: payload.establishedDate,
    parentBranchId: normalizeString(payload.parentBranchId),
    isHeadquarters: payload.isHeadquarters === true,
    isActive: payload.isActive !== false,
    createdBy: actor.userId || actor.name || 'system',
  });

  await refreshBranchCache(branchProfile);
  return serializeBranchProfile(await BranchProfile.findById(branchProfile._id));
};

export const getAllBranches = async (tenantId, query = {}, actor = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const search = normalizeString(query.search);
  const context = await resolveAllowedBranchContext({
    tenantId: normalizedTenantId,
    actor,
    branch: query.branch,
    branches: query.branches,
  });

  const profiles = await BranchProfile.find({
    tenantId: normalizedTenantId,
    ...(query.includeInactive === 'true' ? {} : { isActive: true }),
    ...(context.branchNames.length ? { branchName: { $in: context.branchNames } } : {}),
    ...(search
      ? {
          $or: [
            { branchName: { $regex: search, $options: 'i' } },
            { branchCode: { $regex: search, $options: 'i' } },
            { city: { $regex: search, $options: 'i' } },
          ],
        }
      : {}),
  }).sort({ isHeadquarters: -1, branchName: 1 });

  const profiledNames = new Set(profiles.map((item) => item.branchName));
  const unprofiledBranches = context.branchNames
    .filter((branchName) => !profiledNames.has(branchName))
    .map((branchName) => ({ branchName, branchId: null, isProfileMissing: true }));

  return {
    items: profiles.map(serializeBranchProfile),
    unprofiledBranches,
    total: profiles.length,
  };
};

export const getBranchById = async (tenantId, branchId, actor = {}) => {
  const profile = await resolveBranchProfileById({ tenantId, branchId, actor });
  return serializeBranchProfile(profile);
};

export const updateBranch = async (tenantId, branchId, payload = {}, actor = {}) => {
  const profile = await resolveBranchProfileById({ tenantId, branchId, actor });
  const nextBranchName = normalizeString(payload.branchName) || profile.branchName;
  const nextBranchCode = normalizeString(payload.branchCode);

  const duplicate = await BranchProfile.findOne({
    tenantId: profile.tenantId,
    branchName: nextBranchName,
    _id: { $ne: profile._id },
  });
  if (duplicate) {
    throw createHttpError(409, 'Another branch already uses this branch name.');
  }

  if (nextBranchCode) {
    const duplicateCode = await BranchProfile.findOne({
      tenantId: profile.tenantId,
      branchCode: nextBranchCode,
      _id: { $ne: profile._id },
    });
    if (duplicateCode) {
      throw createHttpError(409, 'Another branch already uses this branch code.');
    }
  }

  profile.branchName = nextBranchName;
  profile.branchCode = nextBranchCode ?? profile.branchCode;
  profile.headPastorId = normalizeString(payload.headPastorId) ?? profile.headPastorId;
  profile.headPastorName = normalizeString(payload.headPastorName) ?? profile.headPastorName;
  profile.address = normalizeString(payload.address) ?? profile.address;
  profile.city = normalizeString(payload.city) ?? profile.city;
  profile.country = normalizeString(payload.country) ?? profile.country;
  profile.phone = normalizeString(payload.phone) ?? profile.phone;
  profile.email = normalizeString(payload.email) ?? profile.email;
  profile.logoUrl = normalizeString(payload.logoUrl) ?? profile.logoUrl;
  profile.gpsCoordinates = payload.gpsCoordinates ?? profile.gpsCoordinates;
  profile.establishedDate = payload.establishedDate ?? profile.establishedDate;
  profile.parentBranchId = normalizeString(payload.parentBranchId) ?? profile.parentBranchId;
  profile.isActive = payload.isActive !== undefined ? payload.isActive === true : profile.isActive;
  profile.isHeadquarters =
    payload.isHeadquarters !== undefined ? payload.isHeadquarters === true : profile.isHeadquarters;
  profile.updatedAt = new Date();

  await profile.save();
  return serializeBranchProfile(await refreshBranchCache(profile));
};

export const deactivateBranch = async (tenantId, branchId, actor = {}) => {
  const profile = await resolveBranchProfileById({ tenantId, branchId, actor });
  profile.isActive = false;
  profile.updatedAt = new Date();
  await profile.save();
  return serializeBranchProfile(profile);
};

export const getBranchMetrics = async (tenantId, branchId, actor = {}) => {
  const profile = await resolveBranchProfileById({ tenantId, branchId, actor });
  const { start, end } = getDateRangeForPeriod({ period: 'monthly', date: new Date() });
  const metrics = await getScopedMetricsBundle({
    tenantId: profile.tenantId,
    actor,
    branchId: profile.branchId,
    start,
    end,
  });

  return {
    branch: serializeBranchProfile(profile),
    cachedMetrics: profile.cachedMetrics || {},
    liveMetrics: metrics,
    period: {
      start,
      end,
    },
  };
};

export const getBranchSnapshot = async (tenantId, branchId, query = {}, actor = {}) => {
  const profile = await resolveBranchProfileById({ tenantId, branchId, actor });
  const period = String(query.period || 'monthly').trim();
  const date = query.date ? new Date(query.date) : new Date();
  const { start, end } = getDateRangeForPeriod({ period, date });

  const snapshot = await AnalyticsSnapshot.findOne({
    tenantId: profile.tenantId,
    branchId: profile.branchId,
    period,
    snapshotDate: start,
  }).lean();

  if (snapshot) {
    return snapshot;
  }

  const liveMetrics = await getScopedMetricsBundle({
    tenantId: profile.tenantId,
    actor,
    branchId: profile.branchId,
    start,
    end,
  });

  return {
    tenantId: profile.tenantId,
    branchId: profile.branchId,
    snapshotDate: start,
    period,
    ...liveMetrics,
    isLivePreview: true,
  };
};

export const refreshBranchCacheById = async (tenantId, branchId, actor = {}) => {
  const profile = await resolveBranchProfileById({ tenantId, branchId, actor });
  const updated = await refreshBranchCache(profile);
  return serializeBranchProfile(updated);
};
