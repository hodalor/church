import Tenant from '../tenants/model.js';
import Member from '../members/member.model.js';
import AttendanceService from '../attendance/attendanceService.model.js';
import AttendanceRecord from '../attendance/attendanceRecord.model.js';
import Transaction from '../finance/models/transaction.model.js';
import Expense from '../finance/models/expense.model.js';
import Budget from '../finance/models/budget.model.js';
import Broadcast from '../communication/broadcast.model.js';
import MessageLog from '../communication/messageLog.model.js';
import PrayerRequest from '../communication/prayerRequest.model.js';
import Visitor from '../visitors/visitor.model.js';
import CareCase from '../pastoralCare/models/careCase.model.js';
import MemberDiscipleship from '../pastoralCare/models/memberDiscipleship.model.js';
import Volunteer from '../volunteers/models/volunteer.model.js';
import DutyRoster from '../volunteers/models/dutyRoster.model.js';
import Event from '../events/models/event.model.js';
import Registration from '../events/models/registration.model.js';
import User from '../users/model.js';
import BranchProfile from './models/branchProfile.model.js';

export const normalizeString = (value, { lowercase = false } = {}) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const nextValue = value.trim();
  if (!nextValue) {
    return undefined;
  }

  return lowercase ? nextValue.toLowerCase() : nextValue;
};

export const normalizeTenantId = (value) => normalizeString(value, { lowercase: true });

export const normalizeArray = (value) => {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))];
  }

  if (typeof value === 'string') {
    return [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))];
  }

  return [];
};

export const parseDate = (value, fallback = null) => {
  if (!value) {
    return fallback;
  }

  const nextDate = value instanceof Date ? value : new Date(value);
  return Number.isNaN(nextDate.getTime()) ? fallback : nextDate;
};

export const startOfDay = (value = new Date()) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate());

export const endOfDay = (value = new Date()) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999);

export const startOfWeek = (value = new Date()) => {
  const nextDate = startOfDay(value);
  const day = nextDate.getDay();
  nextDate.setDate(nextDate.getDate() - day);
  return nextDate;
};

export const endOfWeek = (value = new Date()) => endOfDay(new Date(startOfWeek(value).getTime() + 6 * 86400000));

export const startOfMonth = (value = new Date()) => new Date(value.getFullYear(), value.getMonth(), 1);

export const endOfMonth = (value = new Date()) =>
  new Date(value.getFullYear(), value.getMonth() + 1, 0, 23, 59, 59, 999);

export const addMonths = (value, amount) => {
  const nextDate = new Date(value);
  nextDate.setMonth(nextDate.getMonth() + amount);
  return nextDate;
};

export const addDays = (value, amount) => {
  const nextDate = new Date(value);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
};

export const clamp = (value, min = 0, max = 100) => Math.min(Math.max(Number(value || 0), min), max);

export const safeDivide = (numerator, denominator) => {
  const nextDenominator = Number(denominator || 0);
  if (!nextDenominator) {
    return 0;
  }

  return Number(numerator || 0) / nextDenominator;
};

export const round = (value, decimals = 2) => {
  const factor = 10 ** decimals;
  return Math.round(Number(value || 0) * factor) / factor;
};

export const percent = (numerator, denominator, decimals = 1) =>
  round(safeDivide(numerator, denominator) * 100, decimals);

export const toTrend = (value) => {
  if (value > 0) {
    return 'up';
  }
  if (value < 0) {
    return 'down';
  }
  return 'stable';
};

export const buildGrowthMetric = (currentValue, previousValue) => {
  const current = Number(currentValue || 0);
  const previous = Number(previousValue || 0);
  const value = current - previous;
  const percentValue = previous === 0 ? (current > 0 ? 100 : 0) : round((value / previous) * 100, 1);

  return {
    value,
    percent: percentValue,
    trend: toTrend(value),
  };
};

export const gradeFromHealthScore = (score) => {
  const nextScore = Number(score || 0);
  if (nextScore >= 85) {
    return 'A';
  }
  if (nextScore >= 70) {
    return 'B';
  }
  if (nextScore >= 55) {
    return 'C';
  }
  if (nextScore >= 40) {
    return 'D';
  }
  return 'F';
};

export const calculateBranchHealthScore = ({
  attendanceTrend = 'stable',
  income = 0,
  expenses = 0,
  avgMemberHealth = 0,
  conversionRate = 0,
  avgReliability = 0,
} = {}) => {
  const attendancePoints =
    attendanceTrend === 'up' ? 25 : attendanceTrend === 'stable' ? 15 : 5;
  const financialPoints = income > expenses ? 25 : income === expenses ? 15 : 0;
  const memberEngagementPoints = clamp(avgMemberHealth, 0, 100) * 0.2;
  const visitorPoints = clamp(conversionRate, 0, 100) * 0.15;
  const volunteerPoints = clamp(avgReliability, 0, 100) * 0.15;
  const score = round(
    attendancePoints + financialPoints + memberEngagementPoints + visitorPoints + volunteerPoints,
    1,
  );

  return {
    score,
    grade: gradeFromHealthScore(score),
  };
};

export const getDateRangeForPeriod = ({
  period = 'monthly',
  date = new Date(),
  from,
  to,
} = {}) => {
  if (from || to) {
    return {
      start: startOfDay(parseDate(from, new Date(0))),
      end: endOfDay(parseDate(to, new Date())),
    };
  }

  const referenceDate = parseDate(date, new Date());
  if (period === 'daily') {
    return { start: startOfDay(referenceDate), end: endOfDay(referenceDate) };
  }
  if (period === 'weekly') {
    return { start: startOfWeek(referenceDate), end: endOfWeek(referenceDate) };
  }
  return { start: startOfMonth(referenceDate), end: endOfMonth(referenceDate) };
};

export const getPreviousRange = ({ start, end }) => {
  const duration = end.getTime() - start.getTime();
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - duration);
  return {
    start: previousStart,
    end: previousEnd,
  };
};

export const getMonthKey = (value) => {
  const date = parseDate(value, new Date());
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

export const buildBranchMatch = (branchName) =>
  branchName ? { branch: branchName } : {};

export const getTenantOrThrow = async (tenantId) => {
  const tenant = await Tenant.findOne({ tenantId: normalizeTenantId(tenantId) });
  return tenant || null;
};

export const getBranchUniverse = async (tenantId) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const [profiles, tenant, memberBranches, attendanceBranches, financeBranches, visitorBranches, eventBranches] =
    await Promise.all([
      BranchProfile.find({ tenantId: normalizedTenantId, isActive: true }).lean(),
      Tenant.findOne({ tenantId: normalizedTenantId }).lean(),
      Member.distinct('branch', { tenantId: normalizedTenantId, isDeleted: false, branch: { $ne: null } }),
      AttendanceService.distinct('branch', { tenantId: normalizedTenantId, branch: { $ne: null } }),
      Transaction.distinct('branch', { tenantId: normalizedTenantId, branch: { $ne: null } }),
      Visitor.distinct('branch', { tenantId: normalizedTenantId, branch: { $ne: null } }),
      Event.distinct('branch', { tenantId: normalizedTenantId, branch: { $ne: null } }),
    ]);

  const branchNames = normalizeArray([
    ...(tenant?.content?.branches || []),
    ...profiles.map((profile) => profile.branchName),
    ...memberBranches,
    ...attendanceBranches,
    ...financeBranches,
    ...visitorBranches,
    ...eventBranches,
  ]);

  return {
    tenant,
    profiles,
    branchNames,
  };
};

export const getBranchProfileMap = async (tenantId) => {
  const profiles = await BranchProfile.find({ tenantId: normalizeTenantId(tenantId), isActive: true }).lean();
  return new Map(profiles.map((profile) => [profile.branchName, profile]));
};

export const buildScopedMemberQuery = (tenantId, branchName) => ({
  tenantId: normalizeTenantId(tenantId),
  isDeleted: false,
  ...(branchName ? { branch: branchName } : {}),
});

export const buildScopedQuery = (tenantId, branchName, extra = {}) => ({
  tenantId: normalizeTenantId(tenantId),
  ...(branchName ? { branch: branchName } : {}),
  ...extra,
});

export const getMetricsBundle = async ({ tenantId, branchName, start, end }) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const branchFilter = buildBranchMatch(branchName);

  const [
    totalMembers,
    activeMembers,
    newMembers,
    atRiskMembers,
    driftingMembers,
    convertedVisitors,
    attendanceServices,
    attendanceRecords,
    transactions,
    expenses,
    totalVisitors,
    pendingFollowUps,
    broadcastsSent,
    messageLogs,
    openPrayerRequests,
    totalVolunteers,
    activeVolunteers,
    volunteersForReliability,
    publishedRosters,
    totalEvents,
    upcomingEvents,
    registrations,
    attendedRegistrations,
    openCases,
    resolvedCases,
    criticalCases,
    activeDiscipleships,
  ] = await Promise.all([
    Member.countDocuments(buildScopedMemberQuery(normalizedTenantId, branchName)),
    Member.countDocuments({
      ...buildScopedMemberQuery(normalizedTenantId, branchName),
      'healthScore.status': { $in: ['active', 'new'] },
    }),
    Member.countDocuments({
      ...buildScopedMemberQuery(normalizedTenantId, branchName),
      createdAt: { $gte: start, $lte: end },
    }),
    Member.countDocuments({
      ...buildScopedMemberQuery(normalizedTenantId, branchName),
      'healthScore.status': 'at_risk',
    }),
    Member.countDocuments({
      ...buildScopedMemberQuery(normalizedTenantId, branchName),
      'healthScore.status': 'drifting',
    }),
    Visitor.countDocuments({
      tenantId: normalizedTenantId,
      ...(branchName ? { branch: branchName } : {}),
      converted: true,
      convertedAt: { $gte: start, $lte: end },
    }),
    AttendanceService.find({
      tenantId: normalizedTenantId,
      ...branchFilter,
      date: { $gte: start, $lte: end },
    })
      .select('date stats')
      .lean(),
    AttendanceRecord.find({
      tenantId: normalizedTenantId,
      ...branchFilter,
      serviceDate: { $gte: start, $lte: end },
      isRemoved: false,
    })
      .select('attendeeType firstTimer')
      .lean(),
    Transaction.find({
      tenantId: normalizedTenantId,
      ...branchFilter,
      isReversed: false,
      serviceDate: { $gte: start, $lte: end },
    })
      .select('amount type memberId serviceDate')
      .lean(),
    Expense.find({
      tenantId: normalizedTenantId,
      ...branchFilter,
      expenseDate: { $gte: start, $lte: end },
    })
      .select('amount category approvalStatus expenseDate')
      .lean(),
    Visitor.find({
      tenantId: normalizedTenantId,
      ...(branchName ? { branch: branchName } : {}),
      firstVisitDate: { $gte: start, $lte: end },
    })
      .select('stage converted followUps heardAboutUs referredByMember ageGroup')
      .lean(),
    Visitor.aggregate([
      {
        $match: {
          tenantId: normalizedTenantId,
          ...(branchName ? { branch: branchName } : {}),
        },
      },
      { $unwind: { path: '$followUps', preserveNullAndEmptyArrays: false } },
      {
        $match: {
          'followUps.status': 'pending',
        },
      },
      { $count: 'count' },
    ]),
    Broadcast.countDocuments({
      tenantId: normalizedTenantId,
      ...(branchName ? { 'audience.branch': branchName } : {}),
      createdAt: { $gte: start, $lte: end },
      status: 'sent',
    }),
    MessageLog.find({
      tenantId: normalizedTenantId,
      createdAt: { $gte: start, $lte: end },
    })
      .select('status')
      .lean(),
    PrayerRequest.countDocuments({
      tenantId: normalizedTenantId,
      status: { $in: ['open', 'in_prayer'] },
      createdAt: { $lte: end },
    }),
    Volunteer.countDocuments(buildScopedQuery(normalizedTenantId, branchName)),
    Volunteer.countDocuments({
      ...buildScopedQuery(normalizedTenantId, branchName),
      status: 'active',
    }),
    Volunteer.find(buildScopedQuery(normalizedTenantId, branchName))
      .select('performance')
      .lean(),
    DutyRoster.countDocuments({
      tenantId: normalizedTenantId,
      ...(branchName ? { branch: branchName } : {}),
      isPublished: true,
      date: { $gte: start, $lte: end },
    }),
    Event.countDocuments({
      tenantId: normalizedTenantId,
      ...(branchName ? { branch: branchName } : {}),
      startDate: { $gte: start, $lte: end },
    }),
    Event.countDocuments({
      tenantId: normalizedTenantId,
      ...(branchName ? { branch: branchName } : {}),
      startDate: { $gte: new Date(), $lte: endOfMonth(addMonths(new Date(), 1)) },
      status: { $nin: ['completed', 'cancelled'] },
    }),
    Registration.find({
      tenantId: normalizedTenantId,
      createdAt: { $gte: start, $lte: end },
    })
      .select('status eventId')
      .lean(),
    Registration.countDocuments({
      tenantId: normalizedTenantId,
      status: 'attended',
      createdAt: { $gte: start, $lte: end },
    }),
    CareCase.countDocuments({
      tenantId: normalizedTenantId,
      status: { $in: ['open', 'in_progress', 'on_hold'] },
      createdAt: { $lte: end },
    }),
    CareCase.countDocuments({
      tenantId: normalizedTenantId,
      status: { $in: ['resolved', 'closed'] },
      updatedAt: { $gte: start, $lte: end },
    }),
    CareCase.countDocuments({
      tenantId: normalizedTenantId,
      urgency: 'critical',
      status: { $nin: ['resolved', 'closed'] },
    }),
    MemberDiscipleship.countDocuments({
      tenantId: normalizedTenantId,
      status: 'active',
    }),
  ]);

  const totalHeadcount = attendanceServices.reduce(
    (sum, service) => sum + Number(service.stats?.totalCheckedIn || service.stats?.total || 0),
    0,
  );
  const totalServiceCount = attendanceServices.length;
  const memberAttendance = attendanceRecords.filter((record) => record.attendeeType === 'member').length;
  const visitorAttendance = attendanceRecords.filter((record) => record.attendeeType === 'visitor').length;
  const onlineAttendance = attendanceRecords.filter((record) => record.attendeeType === 'online').length;
  const firstTimers = attendanceRecords.filter((record) => record.firstTimer === true).length;
  const totalIncome = transactions.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const tithes = transactions
    .filter((item) => item.type === 'tithe')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const offerings = transactions
    .filter((item) => item.type === 'offering')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const pledges = transactions
    .filter((item) => item.type === 'pledge_payment')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const donations = transactions
    .filter((item) => ['donation', 'special_seed', 'other_income'].includes(item.type))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const visitorCount = totalVisitors.length;
  const convertedCount = totalVisitors.filter((item) => item.converted === true).length;
  const totalDeliveredMessages = messageLogs.filter((item) => ['delivered', 'read'].includes(item.status)).length;
  const avgReliability = volunteersForReliability.length
    ? round(
        volunteersForReliability.reduce(
          (sum, volunteer) => sum + Number(volunteer.performance?.reliabilityScore || 0),
          0,
        ) / volunteersForReliability.length,
        1,
      )
    : 0;

  return {
    members: {
      total: totalMembers,
      active: activeMembers,
      inactive: Math.max(totalMembers - activeMembers, 0),
      new: newMembers,
      atRisk: atRiskMembers,
      drifting: driftingMembers,
      converted: convertedVisitors,
    },
    attendance: {
      totalServices: totalServiceCount,
      totalHeadcount,
      avgPerService: totalServiceCount ? round(totalHeadcount / totalServiceCount, 1) : 0,
      memberAttendance,
      visitorAttendance,
      firstTimers,
      onlineAttendance,
    },
    finance: {
      totalIncome: round(totalIncome, 2),
      totalExpenses: round(totalExpenses, 2),
      netBalance: round(totalIncome - totalExpenses, 2),
      tithes: round(tithes, 2),
      offerings: round(offerings, 2),
      pledges: round(pledges, 2),
      donations: round(donations, 2),
    },
    visitors: {
      total: visitorCount,
      converted: convertedCount,
      conversionRate: percent(convertedCount, visitorCount),
      pendingFollowUps: Number(pendingFollowUps[0]?.count || 0),
      sourceRows: totalVisitors,
    },
    communication: {
      broadcastsSent,
      messagesDelivered: totalDeliveredMessages,
      deliveryRate: percent(totalDeliveredMessages, messageLogs.length),
      openPrayerRequests,
    },
    volunteers: {
      total: totalVolunteers,
      active: activeVolunteers,
      avgReliability,
      rostersPublished: publishedRosters,
    },
    events: {
      total: totalEvents,
      registrations: registrations.length,
      avgAttendanceRate: percent(attendedRegistrations, registrations.length),
      upcomingEvents,
    },
    pastoral: {
      openCases,
      resolvedCases,
      criticalCases,
      activeDiscipships: activeDiscipleships,
    },
  };
};

export const refreshBranchCache = async (branchProfileDocument) => {
  const branchProfile = branchProfileDocument?.toObject
    ? branchProfileDocument
    : await BranchProfile.findOne({ branchId: branchProfileDocument.branchId });

  if (!branchProfile) {
    return null;
  }

  const { start, end } = getDateRangeForPeriod({ period: 'monthly', date: new Date() });
  const metrics = await getMetricsBundle({
    tenantId: branchProfile.tenantId,
    branchName: branchProfile.branchName,
    start,
    end,
  });

  const avgMemberHealth = await Member.aggregate([
    {
      $match: buildScopedMemberQuery(branchProfile.tenantId, branchProfile.branchName),
    },
    {
      $group: {
        _id: null,
        avgOverall: { $avg: '$healthScore.overall' },
      },
    },
  ]);

  const health = calculateBranchHealthScore({
    attendanceTrend: 'stable',
    income: metrics.finance.totalIncome,
    expenses: metrics.finance.totalExpenses,
    avgMemberHealth: Number(avgMemberHealth[0]?.avgOverall || 0),
    conversionRate: metrics.visitors.conversionRate,
    avgReliability: metrics.volunteers.avgReliability,
  });

  const updated = await BranchProfile.findOneAndUpdate(
    { branchId: branchProfile.branchId },
    {
      $set: {
        cachedMetrics: {
          totalMembers: metrics.members.total,
          activeMembers: metrics.members.active,
          avgSundayAttendance: metrics.attendance.avgPerService,
          monthlyIncome: metrics.finance.totalIncome,
          conversionRate: metrics.visitors.conversionRate,
          volunteerCount: metrics.volunteers.active,
          healthScore: health.score,
          lastUpdated: new Date(),
        },
      },
    },
    { new: true },
  ).lean();

  return updated;
};

export const buildSimpleProjection = (series = [], months = 3) => {
  if (!series.length) {
    return [];
  }

  const numericSeries = series.map((value) => Number(value || 0));
  const deltas = [];
  for (let index = 1; index < numericSeries.length; index += 1) {
    deltas.push(numericSeries[index] - numericSeries[index - 1]);
  }
  const averageGrowth = deltas.length
    ? deltas.reduce((sum, value) => sum + value, 0) / deltas.length
    : 0;
  const lastValue = numericSeries[numericSeries.length - 1];

  return Array.from({ length: months }, (_, index) =>
    round(lastValue + averageGrowth * (index + 1), 2),
  );
};

export const summarizeSeasonalPatterns = (rows = [], valueKey = 'value') => {
  const buckets = new Map();
  rows.forEach((row) => {
    const month = parseDate(row.date || row.month || row.createdAt);
    if (!month) {
      return;
    }
    const key = month.getMonth() + 1;
    buckets.set(key, [...(buckets.get(key) || []), Number(row[valueKey] || row.amount || 0)]);
  });

  return [...buckets.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([month, values]) => ({
      month,
      average: round(values.reduce((sum, value) => sum + value, 0) / values.length, 2),
    }));
};

export {
  AttendanceRecord,
  AttendanceService,
  BranchProfile,
  Broadcast,
  Budget,
  CareCase,
  Event,
  Expense,
  Member,
  MemberDiscipleship,
  MessageLog,
  PrayerRequest,
  Registration,
  Tenant,
  Transaction,
  User,
  Visitor,
  Volunteer,
  DutyRoster,
};
