import { hasAnyCapability } from '../access/capabilities.js';
import { getAssignedBranches, normalizeBranchList } from '../../utils/branchScope.js';
import { createHttpError } from '../../utils/httpError.js';
import {
  getBranchUniverse,
  getMetricsBundle,
  round,
} from './analytics.helpers.js';
import BranchProfile from './models/branchProfile.model.js';

const normalizeTenantId = (value) => String(value || '').trim().toLowerCase();

export const resolveScopedTenantId = (req, { optional = false } = {}) => {
  if (req.user?.role === 'super_admin') {
    const tenantId =
      req.query?.tenantId ||
      req.body?.tenantId ||
      req.headers['x-tenant-id'] ||
      req.params?.tenantId;

    if (!tenantId && !optional) {
      throw createHttpError(400, 'Tenant ID is required for this analytics request.');
    }

    return tenantId ? normalizeTenantId(tenantId) : undefined;
  }

  return normalizeTenantId(req.tenantId || req.user?.tenantId);
};

export const analyticsActor = (req) => ({
  userId: req.user?.userId,
  memberId: req.user?.memberId,
  role: req.user?.role,
  name: req.user?.fullName || req.user?.username || req.user?.role,
  allBranches: req.user?.allBranches,
  assignedBranches: req.user?.assignedBranches,
  capabilities: req.user?.capabilities || [],
});

export const ensureAnalyticsCapability = (
  req,
  capabilityOptions,
  message = 'You do not have permission for this analytics action.',
) => {
  if (req.user?.role === 'super_admin') {
    return;
  }

  const requiredCapabilities = Array.isArray(capabilityOptions)
    ? capabilityOptions
    : [capabilityOptions];

  if (!hasAnyCapability(req.user?.capabilities || [], requiredCapabilities)) {
    throw createHttpError(403, message);
  }
};

export const serializeBranchProfile = (branchProfileDocument) => {
  const profile = branchProfileDocument?.toObject ? branchProfileDocument.toObject() : branchProfileDocument;
  if (!profile) {
    return null;
  }

  return {
    ...profile,
    id: profile._id?.toString?.() || String(profile._id || ''),
    _id: profile._id?.toString?.() || String(profile._id || ''),
  };
};

export const buildEmptyMetricsBundle = () => ({
  members: {
    total: 0,
    active: 0,
    inactive: 0,
    new: 0,
    atRisk: 0,
    drifting: 0,
    converted: 0,
  },
  attendance: {
    totalServices: 0,
    totalHeadcount: 0,
    avgPerService: 0,
    memberAttendance: 0,
    visitorAttendance: 0,
    firstTimers: 0,
    onlineAttendance: 0,
  },
  finance: {
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
    tithes: 0,
    offerings: 0,
    pledges: 0,
    donations: 0,
  },
  visitors: {
    total: 0,
    converted: 0,
    conversionRate: 0,
    pendingFollowUps: 0,
    sourceRows: [],
  },
  communication: {
    broadcastsSent: 0,
    messagesDelivered: 0,
    deliveryRate: 0,
    openPrayerRequests: 0,
  },
  volunteers: {
    total: 0,
    active: 0,
    avgReliability: 0,
    rostersPublished: 0,
  },
  events: {
    total: 0,
    registrations: 0,
    avgAttendanceRate: 0,
    upcomingEvents: 0,
  },
  pastoral: {
    openCases: 0,
    resolvedCases: 0,
    criticalCases: 0,
    activeDiscipships: 0,
  },
});

export const combineMetricBundles = (bundles = []) => {
  if (!bundles.length) {
    return buildEmptyMetricsBundle();
  }

  const combined = buildEmptyMetricsBundle();
  let reliabilityWeight = 0;
  let eventRegistrationWeight = 0;
  let deliveryRateCount = 0;

  bundles.forEach((bundle) => {
    combined.members.total += Number(bundle.members?.total || 0);
    combined.members.active += Number(bundle.members?.active || 0);
    combined.members.inactive += Number(bundle.members?.inactive || 0);
    combined.members.new += Number(bundle.members?.new || 0);
    combined.members.atRisk += Number(bundle.members?.atRisk || 0);
    combined.members.drifting += Number(bundle.members?.drifting || 0);
    combined.members.converted += Number(bundle.members?.converted || 0);

    combined.attendance.totalServices += Number(bundle.attendance?.totalServices || 0);
    combined.attendance.totalHeadcount += Number(bundle.attendance?.totalHeadcount || 0);
    combined.attendance.memberAttendance += Number(bundle.attendance?.memberAttendance || 0);
    combined.attendance.visitorAttendance += Number(bundle.attendance?.visitorAttendance || 0);
    combined.attendance.firstTimers += Number(bundle.attendance?.firstTimers || 0);
    combined.attendance.onlineAttendance += Number(bundle.attendance?.onlineAttendance || 0);

    combined.finance.totalIncome += Number(bundle.finance?.totalIncome || 0);
    combined.finance.totalExpenses += Number(bundle.finance?.totalExpenses || 0);
    combined.finance.netBalance += Number(bundle.finance?.netBalance || 0);
    combined.finance.tithes += Number(bundle.finance?.tithes || 0);
    combined.finance.offerings += Number(bundle.finance?.offerings || 0);
    combined.finance.pledges += Number(bundle.finance?.pledges || 0);
    combined.finance.donations += Number(bundle.finance?.donations || 0);

    combined.visitors.total += Number(bundle.visitors?.total || 0);
    combined.visitors.converted += Number(bundle.visitors?.converted || 0);
    combined.visitors.pendingFollowUps += Number(bundle.visitors?.pendingFollowUps || 0);
    combined.visitors.sourceRows.push(...(bundle.visitors?.sourceRows || []));

    combined.communication.broadcastsSent += Number(bundle.communication?.broadcastsSent || 0);
    combined.communication.messagesDelivered += Number(bundle.communication?.messagesDelivered || 0);
    combined.communication.openPrayerRequests += Number(bundle.communication?.openPrayerRequests || 0);

    combined.volunteers.total += Number(bundle.volunteers?.total || 0);
    combined.volunteers.active += Number(bundle.volunteers?.active || 0);
    combined.volunteers.rostersPublished += Number(bundle.volunteers?.rostersPublished || 0);

    combined.events.total += Number(bundle.events?.total || 0);
    combined.events.registrations += Number(bundle.events?.registrations || 0);
    combined.events.upcomingEvents += Number(bundle.events?.upcomingEvents || 0);

    combined.pastoral.openCases += Number(bundle.pastoral?.openCases || 0);
    combined.pastoral.resolvedCases += Number(bundle.pastoral?.resolvedCases || 0);
    combined.pastoral.criticalCases += Number(bundle.pastoral?.criticalCases || 0);
    combined.pastoral.activeDiscipships += Number(bundle.pastoral?.activeDiscipships || 0);

    reliabilityWeight += Number(bundle.volunteers?.active || 0);
    eventRegistrationWeight += Number(bundle.events?.registrations || 0);
    if (bundle.communication?.deliveryRate !== undefined) {
      deliveryRateCount += 1;
    }
  });

  combined.attendance.avgPerService = combined.attendance.totalServices
    ? round(combined.attendance.totalHeadcount / combined.attendance.totalServices, 1)
    : 0;
  combined.visitors.conversionRate = combined.visitors.total
    ? round((combined.visitors.converted / combined.visitors.total) * 100, 1)
    : 0;
  combined.communication.deliveryRate = deliveryRateCount
    ? round(
        bundles.reduce((sum, bundle) => sum + Number(bundle.communication?.deliveryRate || 0), 0) /
          deliveryRateCount,
        1,
      )
    : 0;
  combined.volunteers.avgReliability = reliabilityWeight
    ? round(
        bundles.reduce(
          (sum, bundle) =>
            sum + Number(bundle.volunteers?.avgReliability || 0) * Number(bundle.volunteers?.active || 0),
          0,
        ) / reliabilityWeight,
        1,
      )
    : 0;
  combined.events.avgAttendanceRate = eventRegistrationWeight
    ? round(
        bundles.reduce(
          (sum, bundle) =>
            sum + Number(bundle.events?.avgAttendanceRate || 0) * Number(bundle.events?.registrations || 0),
          0,
        ) / eventRegistrationWeight,
        1,
      )
    : 0;

  return combined;
};

export const resolveAllowedBranchContext = async ({
  tenantId,
  actor = {},
  branch,
  branches,
  branchId,
  branchIds,
} = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const { profiles, branchNames: allBranchNames } = await getBranchUniverse(normalizedTenantId);
  const profileMap = new Map(profiles.map((profile) => [profile.branchId, profile]));
  const branchIdByName = new Map(profiles.map((profile) => [profile.branchName, profile.branchId]));
  const requestedNames = normalizeBranchList(branches || branch);
  const requestedBranchIds = normalizeBranchList(branchIds || branchId);

  requestedBranchIds.forEach((id) => {
    const matched = profileMap.get(id);
    if (!matched) {
      throw createHttpError(404, `Branch ${id} not found.`);
    }
    requestedNames.push(matched.branchName);
  });

  const requestedUniqueNames = [...new Set(requestedNames)];
  const assignedBranches = getAssignedBranches(actor);
  const scopedNames = assignedBranches.length
    ? requestedUniqueNames.length
      ? requestedUniqueNames.filter((item) => assignedBranches.includes(item))
      : assignedBranches.filter((item) => allBranchNames.includes(item))
    : requestedUniqueNames.length
      ? requestedUniqueNames
      : allBranchNames;

  if (requestedUniqueNames.length && !scopedNames.length) {
    throw createHttpError(403, 'You do not have access to the requested branch scope.');
  }

  return {
    branchNames: scopedNames,
    allBranchNames,
    profiles,
    profileMap,
    branchIdByName,
  };
};

export const resolveBranchProfileById = async ({ tenantId, branchId, actor = {} } = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const profile = await BranchProfile.findOne({
    tenantId: normalizedTenantId,
    branchId: String(branchId || '').trim(),
  });

  if (!profile) {
    throw createHttpError(404, 'Branch not found.');
  }

  const assignedBranches = getAssignedBranches(actor);
  if (assignedBranches.length && !assignedBranches.includes(profile.branchName)) {
    throw createHttpError(403, 'You do not have access to this branch.');
  }

  return profile;
};

export const getScopedMetricsBundle = async ({
  tenantId,
  actor = {},
  branch,
  branches,
  branchId,
  branchIds,
  start,
  end,
} = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const assignedBranches = getAssignedBranches(actor);
  const hasExplicitScope = Boolean(branch || branches || branchId || branchIds);

  if (!assignedBranches.length && !hasExplicitScope) {
    return getMetricsBundle({ tenantId: normalizedTenantId, start, end });
  }

  const context = await resolveAllowedBranchContext({
    tenantId: normalizedTenantId,
    actor,
    branch,
    branches,
    branchId,
    branchIds,
  });

  if (!context.branchNames.length) {
    return buildEmptyMetricsBundle();
  }

  const bundles = await Promise.all(
    context.branchNames.map((branchName) =>
      getMetricsBundle({
        tenantId: normalizedTenantId,
        branchName,
        start,
        end,
      }),
    ),
  );

  return combineMetricBundles(bundles);
};
