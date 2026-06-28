import AiInsight from './models/aiInsight.model.js';
import {
  addDays,
  addMonths,
  AttendanceRecord,
  AttendanceService,
  Broadcast,
  Budget,
  buildGrowthMetric,
  buildSimpleProjection,
  calculateBranchHealthScore,
  CareCase,
  endOfMonth,
  Event,
  Expense,
  getDateRangeForPeriod,
  getPreviousRange,
  Member,
  MessageLog,
  PrayerRequest,
  Registration,
  round,
  summarizeSeasonalPatterns,
  Tenant,
  Transaction,
  User,
  Visitor,
  Volunteer,
  DutyRoster,
} from './analytics.helpers.js';
import {
  getScopedMetricsBundle,
  resolveAllowedBranchContext,
} from './analytics.access.js';

const normalizeTenantId = (value) => String(value || '').trim().toLowerCase();

const normalizeInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getMonthLabel = (date) =>
  date.toLocaleString('en-US', { month: 'short' });

const getMonthDates = (months = 12) =>
  Array.from({ length: months }, (_, index) => {
    const date = addMonths(new Date(), index - (months - 1));
    return {
      date,
      start: new Date(date.getFullYear(), date.getMonth(), 1),
      end: endOfMonth(date),
    };
  });

const buildBranchScope = async (tenantId, actor = {}, query = {}) => {
  const context = await resolveAllowedBranchContext({
    tenantId,
    actor,
    branch: query.branch,
    branches: query.branches,
    branchId: query.branchId,
    branchIds: query.branchIds,
  });

  return context.branchNames.map((branchName) => {
    const profile = context.profiles.find((item) => item.branchName === branchName);
    return {
      branchName,
      branchId: profile?.branchId || null,
      branchCode: profile?.branchCode || '',
      profile,
    };
  });
};

const buildScopedMemberFilter = async (tenantId, actor = {}, query = {}) => {
  const scopedBranches = await buildBranchScope(tenantId, actor, query);
  if (!scopedBranches.length) {
    return { tenantId, isDeleted: false };
  }

  const context = await resolveAllowedBranchContext({
    tenantId,
    actor,
    branch: query.branch,
    branches: query.branches,
    branchId: query.branchId,
    branchIds: query.branchIds,
  });

  if (context.branchNames.length === context.allBranchNames.length) {
    return { tenantId, isDeleted: false };
  }

  return {
    tenantId,
    isDeleted: false,
    branch: { $in: context.branchNames },
  };
};

const buildMemberIdScope = async (tenantId, actor = {}, query = {}) => {
  const memberFilter = await buildScopedMemberFilter(tenantId, actor, query);
  const memberIds = await Member.find(memberFilter).distinct('memberId');
  return memberIds.filter(Boolean);
};

const getAverageMemberHealth = async (tenantId, branchName) => {
  const rows = await Member.aggregate([
    {
      $match: {
        tenantId,
        isDeleted: false,
        ...(branchName ? { branch: branchName } : {}),
      },
    },
    {
      $group: {
        _id: null,
        avgOverall: { $avg: '$healthScore.overall' },
      },
    },
  ]);

  return Number(rows[0]?.avgOverall || 0);
};

const getLastServiceAttendance = async (tenantId, branchName) => {
  const service = await AttendanceService.findOne({
    tenantId,
    ...(branchName ? { branch: branchName } : {}),
  })
    .sort({ date: -1 })
    .select('stats totalCheckedIn date')
    .lean();

  return Number(service?.stats?.totalCheckedIn || service?.stats?.total || 0);
};

const getBranchAttendanceTrend = (currentAverage, previousAverage) => {
  const delta = Number(currentAverage || 0) - Number(previousAverage || 0);
  if (delta > 0.5) {
    return 'up';
  }
  if (delta < -0.5) {
    return 'down';
  }
  return 'stable';
};

const getHealthTrend = (currentScore, previousScore) => {
  const delta = Number(currentScore || 0) - Number(previousScore || 0);
  if (delta > 2) {
    return 'improving';
  }
  if (delta < -2) {
    return 'declining';
  }
  return 'stable';
};

const mapSeverityAlert = (item) => ({
  type: item.type,
  severity: item.severity,
  title: item.title,
  message: item.message,
});

export const getHQOverview = async (tenantId, query = {}, actor = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const currentRange = getDateRangeForPeriod({
    period: String(query.period || 'monthly'),
    date: query.date ? new Date(query.date) : new Date(),
    from: query.from || query.fromDate,
    to: query.to || query.toDate,
  });
  const previousRange = getPreviousRange(currentRange);

  const [current, previous, branchComparison, scopedBranches] = await Promise.all([
    getScopedMetricsBundle({
      tenantId: normalizedTenantId,
      actor,
      branchId: query.branchId,
      branch: query.branch,
      start: currentRange.start,
      end: currentRange.end,
    }),
    getScopedMetricsBundle({
      tenantId: normalizedTenantId,
      actor,
      branchId: query.branchId,
      branch: query.branch,
      start: previousRange.start,
      end: previousRange.end,
    }),
    getBranchComparison(normalizedTenantId, query, actor),
    buildBranchScope(normalizedTenantId, actor, query),
  ]);

  const branchIds = scopedBranches.map((item) => item.branchId).filter(Boolean);
  const insightFilter = {
    tenantId: normalizedTenantId,
    severity: { $in: ['warning', 'critical'] },
    ...(branchIds.length ? { $or: [{ branchId: null }, { branchId: { $in: branchIds } }] } : {}),
  };
  const alerts = await AiInsight.find(insightFilter)
    .sort({ severity: -1, createdAt: -1 })
    .limit(5)
    .lean();

  const topBranch = [...branchComparison.items].sort(
    (left, right) => Number(right.health?.score || 0) - Number(left.health?.score || 0),
  )[0];
  const needsAttention = branchComparison.items
    .filter(
      (item) =>
        Number(item.health?.score || 0) < 55 ||
        item.health?.trend === 'declining' ||
        Number(item.finance?.net || 0) < 0,
    )
    .slice(0, 5)
    .map((item) => ({
      branchName: item.branchName,
      issue:
        Number(item.finance?.net || 0) < 0
          ? 'Operating at a deficit'
          : item.health?.trend === 'declining'
            ? 'Health score is declining'
            : 'Branch health score below target',
      severity: Number(item.health?.score || 0) < 40 ? 'critical' : 'warning',
    }));

  return {
    summary: {
      totalMembers: current.members.total,
      activeMembers: current.members.active,
      totalBranches: branchComparison.items.length,
      totalVolunteers: current.volunteers.active,
      openCasesCount: current.pastoral.openCases,
      upcomingEvents: current.events.upcomingEvents,
    },
    thisMonth: {
      newMembers: current.members.new,
      attendance: current.attendance.totalHeadcount,
      income: current.finance.totalIncome,
      expenses: current.finance.totalExpenses,
      newVisitors: current.visitors.total,
      converted: current.visitors.converted,
      broadcastsSent: current.communication.broadcastsSent,
    },
    vsLastMonth: {
      membersGrowth: buildGrowthMetric(current.members.total, previous.members.total),
      attendanceGrowth: buildGrowthMetric(
        current.attendance.totalHeadcount,
        previous.attendance.totalHeadcount,
      ),
      incomeGrowth: buildGrowthMetric(current.finance.totalIncome, previous.finance.totalIncome),
      visitorGrowth: buildGrowthMetric(current.visitors.total, previous.visitors.total),
    },
    alerts: alerts.map(mapSeverityAlert),
    topBranch: topBranch
      ? {
          branchName: topBranch.branchName,
          metric: 'healthScore',
          value: topBranch.health.score,
        }
      : null,
    needsAttention,
  };
};

export const getBranchComparison = async (tenantId, query = {}, actor = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const currentRange = getDateRangeForPeriod({
    period: String(query.period || 'monthly'),
    date: query.date ? new Date(query.date) : new Date(),
  });
  const previousRange = getPreviousRange(currentRange);
  const scopedBranches = await buildBranchScope(normalizedTenantId, actor, query);

  const items = await Promise.all(
    scopedBranches.map(async ({ branchName, branchId, branchCode }) => {
      const [current, previous, avgMemberHealth, lastService] = await Promise.all([
        getScopedMetricsBundle({
          tenantId: normalizedTenantId,
          actor,
          branchId,
          start: currentRange.start,
          end: currentRange.end,
        }),
        getScopedMetricsBundle({
          tenantId: normalizedTenantId,
          actor,
          branchId,
          start: previousRange.start,
          end: previousRange.end,
        }),
        getAverageMemberHealth(normalizedTenantId, branchName),
        getLastServiceAttendance(normalizedTenantId, branchName),
      ]);

      const attendanceTrend = getBranchAttendanceTrend(
        current.attendance.avgPerService,
        previous.attendance.avgPerService,
      );
      const currentHealth = calculateBranchHealthScore({
        attendanceTrend,
        income: current.finance.totalIncome,
        expenses: current.finance.totalExpenses,
        avgMemberHealth,
        conversionRate: current.visitors.conversionRate,
        avgReliability: current.volunteers.avgReliability,
      });
      const previousHealth = calculateBranchHealthScore({
        attendanceTrend: getBranchAttendanceTrend(
          previous.attendance.avgPerService,
          previous.attendance.avgPerService,
        ),
        income: previous.finance.totalIncome,
        expenses: previous.finance.totalExpenses,
        avgMemberHealth,
        conversionRate: previous.visitors.conversionRate,
        avgReliability: previous.volunteers.avgReliability,
      });

      return {
        branchId,
        branchName,
        branchCode,
        members: {
          total: current.members.total,
          active: current.members.active,
          new: current.members.new,
          atRisk: current.members.atRisk,
        },
        attendance: {
          avg: current.attendance.avgPerService,
          lastService,
          trend: attendanceTrend,
        },
        finance: {
          income: current.finance.totalIncome,
          expenses: current.finance.totalExpenses,
          net: current.finance.netBalance,
          trend: buildGrowthMetric(current.finance.totalIncome, previous.finance.totalIncome).trend,
        },
        visitors: {
          total: current.visitors.total,
          converted: current.visitors.converted,
          rate: current.visitors.conversionRate,
        },
        health: {
          score: currentHealth.score,
          grade: currentHealth.grade,
          trend: getHealthTrend(currentHealth.score, previousHealth.score),
        },
      };
    }),
  );

  const metric = String(query.metric || 'health').trim();
  const metricSorter = {
    attendance: (item) => Number(item.attendance?.avg || 0),
    income: (item) => Number(item.finance?.income || 0),
    members: (item) => Number(item.members?.total || 0),
    growth: (item) => Number(item.members?.new || 0),
    health: (item) => Number(item.health?.score || 0),
  };

  const sorter = metricSorter[metric] || metricSorter.health;
  const sorted = [...items].sort((left, right) => sorter(right) - sorter(left));

  return {
    metric,
    items: sorted,
  };
};

export const getGrowthTrends = async (tenantId, query = {}, actor = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const months = Math.max(Math.min(normalizeInteger(query.months, 12), 24), 3);
  const monthDates = getMonthDates(months);
  const items = [];
  let previousTotalMembers = 0;

  for (const { date, start, end } of monthDates) {
    const metrics = await getScopedMetricsBundle({
      tenantId: normalizedTenantId,
      actor,
      branchId: query.branchId,
      branch: query.branch,
      start,
      end,
    });

    const totalMembers = metrics.members.total;
    const net = totalMembers - previousTotalMembers;
    const lost = Math.max(previousTotalMembers + metrics.members.new - totalMembers, 0);

    items.push({
      month: getMonthLabel(date),
      year: date.getFullYear(),
      members: {
        total: totalMembers,
        new: metrics.members.new,
        lost,
        net,
      },
      attendance: {
        total: metrics.attendance.totalHeadcount,
        avg: metrics.attendance.avgPerService,
        members: metrics.attendance.memberAttendance,
        visitors: metrics.attendance.visitorAttendance,
      },
      finance: {
        income: metrics.finance.totalIncome,
        expenses: metrics.finance.totalExpenses,
      },
      visitors: {
        registered: metrics.visitors.total,
        converted: metrics.visitors.converted,
      },
      events: {
        count: metrics.events.total,
        registrations: metrics.events.registrations,
      },
    });

    previousTotalMembers = totalMembers;
  }

  const first = items[0] || {};
  const last = items[items.length - 1] || {};
  const memberSeries = items.map((item) => item.members.total);
  const attendanceSeries = items.map((item) => item.attendance.total);
  const incomeSeries = items.map((item) => item.finance.income);
  const futureMonths = Array.from({ length: 3 }, (_, index) => addMonths(new Date(), index + 1));
  const memberProjection = buildSimpleProjection(memberSeries, 3);
  const attendanceProjection = buildSimpleProjection(attendanceSeries, 3);
  const incomeProjection = buildSimpleProjection(incomeSeries, 3);

  return {
    items,
    memberGrowthRate: buildGrowthMetric(last.members?.total || 0, first.members?.total || 0).percent,
    attendanceGrowthRate: buildGrowthMetric(
      last.attendance?.total || 0,
      first.attendance?.total || 0,
    ).percent,
    incomeGrowthRate: buildGrowthMetric(last.finance?.income || 0, first.finance?.income || 0).percent,
    projections: futureMonths.map((date, index) => ({
      month: getMonthLabel(date),
      year: date.getFullYear(),
      members: memberProjection[index] || 0,
      attendance: attendanceProjection[index] || 0,
      income: incomeProjection[index] || 0,
    })),
  };
};

export const getFinancialIntelligence = async (tenantId, query = {}, actor = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const year = normalizeInteger(query.year, new Date().getFullYear());
  const scopedBranches = await buildBranchScope(normalizedTenantId, actor, query);
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59, 999);
  const consolidated = await getScopedMetricsBundle({
    tenantId: normalizedTenantId,
    actor,
    branchId: query.branchId,
    branch: query.branch,
    start,
    end,
  });

  const byBranch = await Promise.all(
    scopedBranches.map(async ({ branchName, branchId }) => {
      const metrics = await getScopedMetricsBundle({
        tenantId: normalizedTenantId,
        actor,
        branchId,
        start,
        end,
      });
      return {
        branchName,
        income: metrics.finance.totalIncome,
        expenses: metrics.finance.totalExpenses,
        net: metrics.finance.netBalance,
        incomePerMember: metrics.members.total
          ? round(metrics.finance.totalIncome / metrics.members.total, 2)
          : 0,
      };
    }),
  );

  const monthly12months = [];
  for (let month = 0; month < 12; month += 1) {
    const monthDate = new Date(year, month, 1);
    const range = getDateRangeForPeriod({ period: 'monthly', date: monthDate });
    const metrics = await getScopedMetricsBundle({
      tenantId: normalizedTenantId,
      actor,
      branchId: query.branchId,
      branch: query.branch,
      start: range.start,
      end: range.end,
    });

    monthly12months.push({
      month: getMonthLabel(monthDate),
      year,
      income: metrics.finance.totalIncome,
      expenses: metrics.finance.totalExpenses,
    });
  }

  const transactions = await Transaction.find({
    tenantId: normalizedTenantId,
    serviceDate: { $gte: start, $lte: end },
    isReversed: false,
  })
    .select('amount serviceDate')
    .lean();

  const anomalies = [];
  for (const branch of byBranch) {
    const branchSeries = [];
    for (let month = 0; month < 12; month += 1) {
      const monthDate = new Date(year, month, 1);
      const range = getDateRangeForPeriod({ period: 'monthly', date: monthDate });
      const metrics = await getScopedMetricsBundle({
        tenantId: normalizedTenantId,
        actor,
        branch: branch.branchName,
        start: range.start,
        end: range.end,
      });
      branchSeries.push({
        month: getMonthLabel(monthDate),
        income: metrics.finance.totalIncome,
      });
    }

    for (let index = 1; index < branchSeries.length; index += 1) {
      const previous = branchSeries[index - 1];
      const current = branchSeries[index];
      const metric = buildGrowthMetric(current.income, previous.income);
      if (Math.abs(metric.percent) >= 20) {
        anomalies.push({
          branchName: branch.branchName,
          type: metric.value >= 0 ? 'spike' : 'drop',
          month: current.month,
          percent: metric.percent,
          message: `${branch.branchName} income ${metric.value >= 0 ? 'rose' : 'fell'} by ${metric.percent}% in ${current.month}.`,
        });
      }
    }
  }

  const incomeProjection = buildSimpleProjection(monthly12months.map((item) => item.income), 3);
  const budgetRows = await Budget.find({
    tenantId: normalizedTenantId,
    year,
  })
    .select('month totalAllocated totalSpent title')
    .lean();

  const totalAllocated = budgetRows.reduce((sum, row) => sum + Number(row.totalAllocated || 0), 0);
  const totalSpent = budgetRows.reduce((sum, row) => sum + Number(row.totalSpent || 0), 0);

  return {
    consolidated: {
      totalIncome: consolidated.finance.totalIncome,
      totalExpenses: consolidated.finance.totalExpenses,
      netBalance: consolidated.finance.netBalance,
    },
    byBranch,
    incomePerMember: {
      overall: consolidated.members.total
        ? round(consolidated.finance.totalIncome / consolidated.members.total, 2)
        : 0,
      byBranch: byBranch.map((item) => ({
        branchName: item.branchName,
        value: item.incomePerMember,
      })),
    },
    givingTrends: {
      monthly12months,
      seasonalPatterns: summarizeSeasonalPatterns(transactions, 'amount'),
    },
    anomalies,
    forecast: {
      nextMonthIncome: incomeProjection[0] || 0,
      nextQuarterIncome: round(
        (incomeProjection[0] || 0) + (incomeProjection[1] || 0) + (incomeProjection[2] || 0),
        2,
      ),
      confidence: monthly12months.length >= 12 ? 'high' : monthly12months.length >= 6 ? 'medium' : 'low',
      basis: 'Based on 12-month average with seasonal adjustment',
    },
    budgetVsActual: {
      byBranch: byBranch.map((item) => ({
        branchName: item.branchName,
        budgetAllocated: 0,
        actualSpent: item.expenses,
        variance: round(0 - item.expenses, 2),
      })),
      overall: {
        budgetAllocated: totalAllocated,
        actualSpent: totalSpent,
        variance: round(totalAllocated - totalSpent, 2),
      },
    },
  };
};

export const getMemberIntelligence = async (tenantId, actor = {}, query = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const memberFilter = await buildScopedMemberFilter(normalizedTenantId, actor, query);
  const members = await Member.find(memberFilter)
    .select(
      'memberId firstName lastName phone branch gender dateOfBirth department membershipStatus membershipDate createdAt healthScore',
    )
    .lean();
  const memberIds = members.map((item) => item.memberId).filter(Boolean);
  const memberIdSet = new Set(memberIds);

  const [attendanceRows, givingRows, attendanceCountRows, careRows, totalServicesLast8Weeks, growthSourceRows] =
    await Promise.all([
      AttendanceRecord.aggregate([
        {
          $match: {
            tenantId: normalizedTenantId,
            memberId: { $in: memberIds },
            isRemoved: false,
          },
        },
        { $sort: { serviceDate: -1 } },
        {
          $group: {
            _id: '$memberId',
            lastAttended: { $first: '$serviceDate' },
          },
        },
      ]),
      Transaction.aggregate([
        {
          $match: {
            tenantId: normalizedTenantId,
            memberId: { $in: memberIds },
            isReversed: false,
          },
        },
        { $sort: { serviceDate: -1 } },
        {
          $group: {
            _id: '$memberId',
            lastGave: { $first: '$serviceDate' },
          },
        },
      ]),
      AttendanceRecord.aggregate([
        {
          $match: {
            tenantId: normalizedTenantId,
            memberId: { $in: memberIds },
            serviceDate: { $gte: addDays(new Date(), -56) },
            isRemoved: false,
          },
        },
        {
          $group: {
            _id: '$memberId',
            total: { $sum: 1 },
          },
        },
      ]),
      CareCase.aggregate([
        {
          $match: {
            tenantId: normalizedTenantId,
            memberId: { $in: memberIds },
          },
        },
        { $sort: { updatedAt: -1 } },
        {
          $group: {
            _id: '$memberId',
            lastCareContact: { $first: '$updatedAt' },
          },
        },
      ]),
      AttendanceService.countDocuments({
        tenantId: normalizedTenantId,
        date: { $gte: addDays(new Date(), -56) },
      }),
      Visitor.aggregate([
        {
          $match: {
            tenantId: normalizedTenantId,
            converted: true,
          },
        },
        {
          $project: {
            source: {
              $cond: [
                { $ifNull: ['$referredByMember.memberId', false] },
                'referral',
                {
                  $switch: {
                    branches: [
                      { case: { $regexMatch: { input: '$heardAboutUs', regex: 'event', options: 'i' } }, then: 'event' },
                      { case: { $regexMatch: { input: '$heardAboutUs', regex: 'visit', options: 'i' } }, then: 'visit' },
                    ],
                    default: 'outreach',
                  },
                },
              ],
            },
          },
        },
        {
          $group: {
            _id: '$source',
            total: { $sum: 1 },
          },
        },
      ]),
    ]);

  const lastAttendanceMap = new Map(attendanceRows.map((item) => [item._id, item.lastAttended]));
  const lastGivingMap = new Map(givingRows.map((item) => [item._id, item.lastGave]));
  const attendanceCountMap = new Map(attendanceCountRows.map((item) => [item._id, Number(item.total || 0)]));
  const careMap = new Map(careRows.map((item) => [item._id, item.lastCareContact]));

  const now = Date.now();
  const atRiskMembers = members
    .filter((item) => ['at_risk', 'inactive', 'drifting'].includes(item.healthScore?.status))
    .map((member) => {
      const lastAttended = lastAttendanceMap.get(member.memberId);
      const lastGave = lastGivingMap.get(member.memberId);
      const lastCareContact = careMap.get(member.memberId);
      const missedServices = Math.max(
        Number(totalServicesLast8Weeks || 0) - Number(attendanceCountMap.get(member.memberId) || 0),
        0,
      );
      const riskFactors = [];

      if (!lastAttended || now - new Date(lastAttended).getTime() > 60 * 86400000) {
        riskFactors.push('not_attending');
      }
      if (!lastGave || now - new Date(lastGave).getTime() > 60 * 86400000) {
        riskFactors.push('stopped_giving');
      }
      if (!lastCareContact || now - new Date(lastCareContact).getTime() > 90 * 86400000) {
        riskFactors.push('no_care_contact');
      }

      return {
        memberId: member.memberId,
        name: [member.firstName, member.lastName].filter(Boolean).join(' ').trim(),
        phone: member.phone || '',
        branch: member.branch || '',
        healthScore: Number(member.healthScore?.overall || 0),
        lastAttended: lastAttended || null,
        lastGave: lastGave || null,
        missedServices,
        riskFactors,
      };
    })
    .sort((left, right) => left.healthScore - right.healthScore || right.missedServices - left.missedServices)
    .slice(0, 20);

  const countRetention = (months) => {
    const from = addMonths(new Date(), -(months + 1));
    const to = addMonths(new Date(), -months);
    const cohort = members.filter((member) => {
      const joinedAt = new Date(member.membershipDate || member.createdAt || 0);
      return joinedAt >= from && joinedAt < to;
    });
    if (!cohort.length) {
      return 0;
    }
    const retained = cohort.filter((member) => member.healthScore?.status === 'active').length;
    return round((retained / cohort.length) * 100, 1);
  };

  const maleCount = members.filter((item) => item.gender === 'male').length;
  const femaleCount = members.filter((item) => item.gender === 'female').length;
  const ageBuckets = { youth: 0, adult: 0, senior: 0 };
  members.forEach((member) => {
    if (!member.dateOfBirth) {
      return;
    }
    const age = Math.floor((now - new Date(member.dateOfBirth).getTime()) / (365.25 * 86400000));
    if (age < 25) {
      ageBuckets.youth += 1;
    } else if (age >= 60) {
      ageBuckets.senior += 1;
    } else {
      ageBuckets.adult += 1;
    }
  });

  const departmentMap = new Map();
  const membershipStatusMap = new Map();
  members.forEach((member) => {
    (member.department || []).forEach((dept) => {
      departmentMap.set(dept, (departmentMap.get(dept) || 0) + 1);
    });
    membershipStatusMap.set(
      member.membershipStatus || 'unknown',
      (membershipStatusMap.get(member.membershipStatus || 'unknown') || 0) + 1,
    );
  });

  const growthSourceMap = new Map(growthSourceRows.map((item) => [item._id, item.total]));

  return {
    totalMembers: members.length,
    activeCount: members.filter((item) => item.healthScore?.status === 'active').length,
    atRiskCount: members.filter((item) => item.healthScore?.status === 'at_risk').length,
    driftingCount: members.filter((item) => item.healthScore?.status === 'drifting').length,
    atRiskMembers,
    retentionRate: {
      oneMonth: countRetention(1),
      threeMonths: countRetention(3),
      sixMonths: countRetention(6),
      oneYear: countRetention(12),
    },
    engagementDistribution: {
      highly_active: members.filter((item) => Number(item.healthScore?.overall || 0) > 75).length,
      engaged: members.filter((item) => {
        const score = Number(item.healthScore?.overall || 0);
        return score >= 50 && score <= 75;
      }).length,
      disengaged: members.filter((item) => {
        const score = Number(item.healthScore?.overall || 0);
        return score >= 25 && score < 50;
      }).length,
      inactive: members.filter((item) => Number(item.healthScore?.overall || 0) < 25).length,
    },
    demographicInsights: {
      genderBalance: {
        male: members.length ? round((maleCount / members.length) * 100, 1) : 0,
        female: members.length ? round((femaleCount / members.length) * 100, 1) : 0,
      },
      ageGroupBalance: {
        youth: members.length ? round((ageBuckets.youth / members.length) * 100, 1) : 0,
        adult: members.length ? round((ageBuckets.adult / members.length) * 100, 1) : 0,
        senior: members.length ? round((ageBuckets.senior / members.length) * 100, 1) : 0,
      },
      departmentCoverage: [...departmentMap.entries()].map(([dept, count]) => ({
        dept,
        count,
        percentage: members.length ? round((count / members.length) * 100, 1) : 0,
      })),
      membershipStatusBreakdown: Object.fromEntries(
        [...membershipStatusMap.entries()].map(([key, count]) => [key, count]),
      ),
    },
    growthSources: {
      byReferral: Number(growthSourceMap.get('referral') || 0),
      byEvent: Number(growthSourceMap.get('event') || 0),
      byVisit: Number(growthSourceMap.get('visit') || 0),
      byOutreach: Number(growthSourceMap.get('outreach') || 0),
    },
    scopedMemberCount: memberIdSet.size,
  };
};

export const getOperationalHealth = async (tenantId, actor = {}, query = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const tenant = await Tenant.findOne({ tenantId: normalizedTenantId }).lean();
  const branchContext = await resolveAllowedBranchContext({ tenantId: normalizedTenantId, actor, ...query });
  const branchNames =
    branchContext.branchNames.length === branchContext.allBranchNames.length ? [] : branchContext.branchNames;
  const memberIds = await buildMemberIdScope(normalizedTenantId, actor, query);
  const memberMatch = memberIds.length ? { memberId: { $in: memberIds } } : {};

  const [activeVolunteers, rosters, openCases, resolvedCases, latestBroadcast, prayerCount, upcomingEvents, users] =
    await Promise.all([
      Volunteer.find({
        tenantId: normalizedTenantId,
        status: 'active',
      }).lean(),
      DutyRoster.find({
        tenantId: normalizedTenantId,
        date: { $gte: new Date(), $lte: addDays(new Date(), 30) },
        ...(branchNames.length ? { branch: { $in: branchNames } } : {}),
      }).lean(),
      CareCase.find({
        tenantId: normalizedTenantId,
        status: { $in: ['open', 'in_progress', 'on_hold'] },
        ...memberMatch,
      }).lean(),
      CareCase.find({
        tenantId: normalizedTenantId,
        status: { $in: ['resolved', 'closed'] },
        ...memberMatch,
      }).lean(),
      Broadcast.find({
        tenantId: normalizedTenantId,
        status: 'sent',
      })
        .sort({ sentAt: -1, createdAt: -1 })
        .select('sentAt createdAt')
        .lean(),
      PrayerRequest.countDocuments({
        tenantId: normalizedTenantId,
        status: { $in: ['open', 'in_prayer'] },
      }),
      Event.find({
        tenantId: normalizedTenantId,
        startDate: { $gte: new Date(), $lte: addDays(new Date(), 30) },
        ...(branchNames.length ? { branch: { $in: branchNames } } : {}),
      }).lean(),
      User.find({
        tenantId: normalizedTenantId,
        role: { $in: ['head_pastor', 'associate_pastor', 'branch_pastor', 'care_leader'] },
        isActive: true,
      }).lean(),
    ]);

  const departments =
    tenant?.content?.departments?.length
      ? tenant.content.departments
      : [...new Set(activeVolunteers.map((item) => item.primaryDepartment).filter(Boolean))];
  const departmentCounts = new Map();
  activeVolunteers.forEach((volunteer) => {
    const department = volunteer.primaryDepartment || volunteer.departments?.[0];
    if (department) {
      departmentCounts.set(department, (departmentCounts.get(department) || 0) + 1);
    }
  });

  const upcomingGaps = [];
  rosters.forEach((roster) => {
    const groupedAssignments = new Map();
    (roster.assignments || []).forEach((assignment) => {
      const department = assignment.department || 'General';
      groupedAssignments.set(department, (groupedAssignments.get(department) || 0) + 1);
    });

    [...groupedAssignments.entries()].forEach(([department, available]) => {
      if (available < 2) {
        upcomingGaps.push({
          date: roster.date,
          department,
          needed: 2,
          available,
        });
      }
    });
  });

  const avgReliability = activeVolunteers.length
    ? round(
        activeVolunteers.reduce(
          (sum, item) => sum + Number(item.performance?.reliabilityScore || 0),
          0,
        ) / activeVolunteers.length,
        1,
      )
    : 0;

  const openByPastor = new Map();
  const resolvedByPastor = new Map();
  openCases.forEach((item) => {
    const key = item.assignedTo || 'unassigned';
    openByPastor.set(key, (openByPastor.get(key) || 0) + 1);
  });
  resolvedCases.forEach((item) => {
    const key = item.assignedTo || 'unassigned';
    resolvedByPastor.set(key, (resolvedByPastor.get(key) || 0) + 1);
  });

  const overdueFollowUps = openCases.filter((item) =>
    (item.interactions || []).some(
      (interaction) => interaction.nextFollowUpDate && new Date(interaction.nextFollowUpDate) < new Date(),
    ),
  ).length;
  const criticalUnattended = openCases.filter((item) => {
    if (item.urgency !== 'critical') {
      return false;
    }
    const lastInteraction = (item.interactions || [])
      .map((interaction) => interaction.date)
      .filter(Boolean)
      .sort((left, right) => new Date(right) - new Date(left))[0];
    return !lastInteraction || new Date(lastInteraction) < addDays(new Date(), -3);
  }).length;

  const messageRows = await MessageLog.find({
    tenantId: normalizedTenantId,
    createdAt: { $gte: addDays(new Date(), -90) },
  })
    .select('status')
    .lean();
  const deliveredCount = messageRows.filter((item) => ['delivered', 'read'].includes(item.status)).length;
  const avgDeliveryRate = messageRows.length ? round((deliveredCount / messageRows.length) * 100, 1) : 0;

  const overduePreparation = upcomingEvents
    .filter((event) => {
      const daysUntil = Math.ceil((new Date(event.startDate).getTime() - Date.now()) / 86400000);
      return daysUntil <= 14 && (event.status === 'draft' || (event.volunteers || []).length === 0);
    })
    .map((event) => ({
      eventTitle: event.title,
      daysUntil: Math.ceil((new Date(event.startDate).getTime() - Date.now()) / 86400000),
      issueType: event.status === 'draft' ? 'event_not_published' : 'volunteers_missing',
    }));

  const systemAlerts = [];
  if (avgReliability < 70) {
    systemAlerts.push({
      module: 'volunteers',
      type: 'reliability',
      message: 'Volunteer reliability is below the target threshold.',
      severity: 'warning',
    });
  }
  if (criticalUnattended > 0) {
    systemAlerts.push({
      module: 'pastoral',
      type: 'critical_cases',
      message: `${criticalUnattended} critical care cases need immediate follow-up.`,
      severity: 'critical',
    });
  }
  if (overduePreparation.length > 0) {
    systemAlerts.push({
      module: 'events',
      type: 'preparation',
      message: `${overduePreparation.length} upcoming events require attention.`,
      severity: 'warning',
    });
  }

  return {
    volunteers: {
      coverageRate: departments.length
        ? round(
            (departments.filter((dept) => Number(departmentCounts.get(dept) || 0) >= 2).length /
              departments.length) *
              100,
            1,
          )
        : 0,
      avgReliability,
      upcomingGaps: upcomingGaps.slice(0, 10),
    },
    pastoral: {
      caseloadPerPastor: users.map((user) => ({
        name: user.fullName || user.username,
        open: Number(openByPastor.get(user._id?.toString?.() || '') || 0),
        resolved: Number(resolvedByPastor.get(user._id?.toString?.() || '') || 0),
      })),
      overdueFollowUps,
      criticalUnattended,
    },
    communication: {
      lastBroadcastDays: latestBroadcast?.sentAt || latestBroadcast?.createdAt
        ? Math.floor(
            (Date.now() - new Date(latestBroadcast.sentAt || latestBroadcast.createdAt).getTime()) /
              86400000,
          )
        : null,
      avgDeliveryRate,
      unreadPrayerRequests: prayerCount,
    },
    events: {
      upcomingCount: upcomingEvents.length,
      overduePreparation,
    },
    systemAlerts,
  };
};

export const getConsolidatedReport = async (tenantId, query = {}, actor = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const month =
    Math.min(Math.max(normalizeInteger(query.month, new Date().getMonth() + 1), 1), 12) - 1;
  const year = normalizeInteger(query.year, new Date().getFullYear());
  const targetDate = new Date(year, month, 1);
  const range = getDateRangeForPeriod({ period: 'monthly', date: targetDate });
  const tenant = await Tenant.findOne({ tenantId: normalizedTenantId }).lean();
  const metrics = await getScopedMetricsBundle({
    tenantId: normalizedTenantId,
    actor,
    branchId: query.branchId,
    branch: query.branch,
    start: range.start,
    end: range.end,
  });
  const [memberIntelligence, operationalHealth, branchBreakdown] = await Promise.all([
    getMemberIntelligence(normalizedTenantId, actor, query),
    getOperationalHealth(normalizedTenantId, actor, query),
    getBranchComparison(normalizedTenantId, query, actor),
  ]);

  const highlights = [];
  const concerns = [];

  if (metrics.finance.netBalance > 0) {
    highlights.push(`Income exceeded expenses by ${metrics.finance.netBalance}.`);
  }
  if (metrics.visitors.conversionRate >= 40) {
    highlights.push(`Visitor conversion reached ${metrics.visitors.conversionRate}%.`);
  }
  if (metrics.members.new > 0) {
    highlights.push(`${metrics.members.new} new members were added this month.`);
  }
  if (metrics.members.atRisk > 0) {
    concerns.push(`${metrics.members.atRisk} members are currently at risk.`);
  }
  if (operationalHealth.systemAlerts.length) {
    concerns.push(...operationalHealth.systemAlerts.map((item) => item.message));
  }

  return {
    reportPeriod: {
      month: month + 1,
      year,
    },
    tenant: {
      churchName: tenant?.churchName || '',
      tenantId: normalizedTenantId,
    },
    executiveSummary: {
      highlights,
      concerns,
    },
    membership: memberIntelligence,
    attendance: metrics.attendance,
    finance: metrics.finance,
    visitors: metrics.visitors,
    pastoralCare: metrics.pastoral,
    volunteers: {
      ...metrics.volunteers,
      coverageRate: operationalHealth.volunteers.coverageRate,
    },
    events: {
      ...metrics.events,
      upcomingCount: operationalHealth.events.upcomingCount,
    },
    branchBreakdown: branchBreakdown.items,
    aiNarrative: null,
  };
};
