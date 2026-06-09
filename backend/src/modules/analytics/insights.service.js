import { createHttpError } from '../../utils/httpError.js';
import {
  addDays,
  addMonths,
  AttendanceRecord,
  AttendanceService,
  Budget,
  CareCase,
  Event,
  getDateRangeForPeriod,
  Member,
  MessageLog,
  Registration,
  round,
  Transaction,
  User,
  Visitor,
  Volunteer,
} from './analytics.helpers.js';
import {
  resolveAllowedBranchContext,
  resolveBranchProfileById,
} from './analytics.access.js';
import AiInsight from './models/aiInsight.model.js';

const normalizeTenantId = (value) => String(value || '').trim().toLowerCase();

const buildBranchIdByNameMap = async (tenantId) => {
  const context = await resolveAllowedBranchContext({ tenantId, actor: {} });
  return context.branchIdByName;
};

const buildInsightFilterForActor = async (tenantId, actor = {}, query = {}) => {
  const filters = {
    tenantId: normalizeTenantId(tenantId),
  };

  if (query.type) {
    filters.type = String(query.type).trim();
  }
  if (query.severity) {
    filters.severity = String(query.severity).trim();
  }
  if (query.isRead !== undefined) {
    filters.isRead = query.isRead === 'true' || query.isRead === true;
  }
  if (query.isActioned !== undefined) {
    filters.isActioned = query.isActioned === 'true' || query.isActioned === true;
  }

  const context = await resolveAllowedBranchContext({ tenantId, actor });
  if (context.branchNames.length && context.branchNames.length !== context.allBranchNames.length) {
    const allowedBranchIds = context.branchNames.map((name) => context.branchIdByName.get(name)).filter(Boolean);
    filters.branchId = { $in: allowedBranchIds };
  }

  return filters;
};

const saveInsightIfNew = async (tenantId, insight = {}) => {
  if (!insight) {
    return null;
  }

  const duplicate = await AiInsight.findOne({
    tenantId: normalizeTenantId(tenantId),
    branchId: insight.branchId || null,
    type: insight.type,
    title: insight.title,
    expiresAt: { $gte: new Date() },
  }).lean();

  if (duplicate) {
    return null;
  }

  return AiInsight.create({
    tenantId: normalizeTenantId(tenantId),
    branchId: insight.branchId || null,
    type: insight.type,
    severity: insight.severity || 'info',
    title: insight.title,
    message: insight.message,
    data: insight.data || {},
    recommendations: insight.recommendations || [],
    expiresAt: insight.expiresAt || addDays(new Date(), 14),
  });
};

export const getAllInsights = async (tenantId, query = {}, actor = {}) => {
  const filters = await buildInsightFilterForActor(tenantId, actor, query);
  const items = await AiInsight.find(filters)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(query.limit) || 50, 200))
    .lean();

  return {
    items,
    total: items.length,
  };
};

export const getCriticalInsights = async (tenantId, query = {}, actor = {}) => {
  const filters = await buildInsightFilterForActor(tenantId, actor, {
    ...query,
    severity: 'critical',
  });
  const items = await AiInsight.find(filters)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(query.limit) || 20, 100))
    .lean();

  return {
    items,
    total: items.length,
  };
};

export const markInsightRead = async (tenantId, insightId, actor = {}) => {
  const filters = await buildInsightFilterForActor(tenantId, actor, {});
  const insight = await AiInsight.findOne({
    ...filters,
    _id: insightId,
  });

  if (!insight) {
    throw createHttpError(404, 'Insight not found.');
  }

  insight.isRead = true;
  await insight.save();
  return insight.toObject();
};

export const markInsightActioned = async (tenantId, insightId, actor = {}) => {
  const filters = await buildInsightFilterForActor(tenantId, actor, {});
  const insight = await AiInsight.findOne({
    ...filters,
    _id: insightId,
  });

  if (!insight) {
    throw createHttpError(404, 'Insight not found.');
  }

  insight.isActioned = true;
  await insight.save();
  return insight.toObject();
};

export const generateMemberRiskInsights = async (tenantId) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const totalMembers = await Member.countDocuments({
    tenantId: normalizedTenantId,
    isDeleted: false,
  });
  const atRisk = await Member.countDocuments({
    tenantId: normalizedTenantId,
    isDeleted: false,
    'healthScore.status': { $in: ['at_risk', 'inactive'] },
  });

  const insights = [];
  if (totalMembers && atRisk / totalMembers > 0.1) {
    insights.push({
      type: 'member_risk',
      severity: 'warning',
      title: 'Member Engagement Alert',
      message: `${atRisk} members (${round((atRisk / totalMembers) * 100, 1)}% of congregation) show signs of disengagement.`,
      data: { totalMembers, atRisk },
      recommendations: [
        'Schedule a pastoral care review for at-risk members',
        'Consider a re-engagement event or outreach series',
        'Review care leader assignments',
      ],
    });
  }

  const cutoff = addDays(new Date(), -60);
  const attendanceRows = await AttendanceRecord.aggregate([
    {
      $match: {
        tenantId: normalizedTenantId,
        memberId: { $ne: null },
        isRemoved: false,
      },
    },
    { $sort: { serviceDate: -1 } },
    {
      $group: {
        _id: '$memberId',
        lastAttended: { $first: '$serviceDate' },
        visits: { $sum: 1 },
      },
    },
    {
      $match: {
        visits: { $gte: 4 },
        lastAttended: { $lt: cutoff },
      },
    },
    { $limit: 50 },
  ]);

  if (attendanceRows.length) {
    insights.push({
      type: 'member_risk',
      severity: 'warning',
      title: `${attendanceRows.length} members missing for 60+ days`,
      message: `${attendanceRows.length} previously engaged members have not attended in the last 60 days.`,
      data: {
        memberIds: attendanceRows.map((item) => item._id),
        count: attendanceRows.length,
      },
      recommendations: [
        'Assign each missing member to a follow-up leader',
        'Review attendance trends by branch and ministry',
      ],
    });
  }

  return insights;
};

export const generateAttendanceInsights = async (tenantId) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const services = await AttendanceService.find({
    tenantId: normalizedTenantId,
    date: { $gte: addDays(new Date(), -70) },
  })
    .select('branch date stats')
    .sort({ date: -1 })
    .lean();

  const sundayServices = services.filter((item) => new Date(item.date).getDay() === 0);
  const last4 = sundayServices.slice(0, 4);
  const previous4 = sundayServices.slice(4, 8);
  const avg = (rows) =>
    rows.length
      ? rows.reduce((sum, item) => sum + Number(item.stats?.totalCheckedIn || item.stats?.total || 0), 0) /
        rows.length
      : 0;
  const last4Avg = avg(last4);
  const previous4Avg = avg(previous4);
  const percentChange = previous4Avg ? round(((last4Avg - previous4Avg) / previous4Avg) * 100, 1) : 0;
  const insights = [];

  if (previous4Avg && percentChange <= -15) {
    insights.push({
      type: 'attendance_drop',
      severity: 'warning',
      title: 'Attendance declining',
      message: `Average attendance dropped ${Math.abs(percentChange)}% over the last 4 weeks.`,
      data: { last4Avg, previous4Avg, percentChange },
      recommendations: [
        'Review sermon and outreach cadence across branches',
        'Check branch-specific attendance drops for targeted action',
      ],
    });
  }

  if (previous4Avg && percentChange >= 10) {
    insights.push({
      type: 'growth_opportunity',
      severity: 'info',
      title: `Growth momentum - attendance up ${percentChange}%`,
      message: 'Consider expanding capacity or opening a new service time.',
      data: { last4Avg, previous4Avg, percentChange },
      recommendations: [
        'Review volunteer coverage for additional service capacity',
        'Assess seating and parking capacity',
      ],
    });
  }

  const branchIdMap = await buildBranchIdByNameMap(normalizedTenantId);
  const servicesByBranch = new Map();
  sundayServices.forEach((item) => {
    const key = item.branch || 'Unassigned';
    const rows = servicesByBranch.get(key) || [];
    rows.push(item);
    servicesByBranch.set(key, rows);
  });

  for (const [branchName, rows] of servicesByBranch.entries()) {
    if (rows.length < 2) {
      continue;
    }
    const current = Number(rows[0].stats?.totalCheckedIn || rows[0].stats?.total || 0);
    const previous = Number(rows[1].stats?.totalCheckedIn || rows[1].stats?.total || 0);
    if (previous && ((current - previous) / previous) * 100 <= -30) {
      insights.push({
        branchId: branchIdMap.get(branchName) || null,
        type: 'attendance_drop',
        severity: 'critical',
        title: `Significant attendance drop at ${branchName}`,
        message: `${branchName} attendance dropped sharply in the latest week.`,
        data: { branchName, current, previous },
        recommendations: [
          'Review attendance records and branch activity for the affected week',
          'Check for local events, weather, or service changes that impacted turnout',
        ],
      });
    }
  }

  return insights;
};

export const generateFinanceInsights = async (tenantId) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const today = new Date();
  const currentMonthRange = getDateRangeForPeriod({ period: 'monthly', date: today });
  const previousMonthDate = addMonths(today, -1);
  const previousMonthRange = getDateRangeForPeriod({ period: 'monthly', date: previousMonthDate });
  const sameDayLastMonth = new Date(previousMonthDate.getFullYear(), previousMonthDate.getMonth(), today.getDate(), 23, 59, 59, 999);

  const [currentTransactions, lastMonthTransactions, currentBudgets, latestTithe, giverRows] = await Promise.all([
    Transaction.find({
      tenantId: normalizedTenantId,
      isReversed: false,
      serviceDate: { $gte: currentMonthRange.start, $lte: today },
    })
      .select('amount type serviceDate memberId')
      .lean(),
    Transaction.find({
      tenantId: normalizedTenantId,
      isReversed: false,
      serviceDate: { $gte: previousMonthRange.start, $lte: sameDayLastMonth },
    })
      .select('amount type serviceDate memberId')
      .lean(),
    Budget.find({
      tenantId: normalizedTenantId,
      year: today.getFullYear(),
      month: today.getMonth() + 1,
    }).lean(),
    Transaction.findOne({
      tenantId: normalizedTenantId,
      type: 'tithe',
      isReversed: false,
    })
      .sort({ serviceDate: -1 })
      .select('serviceDate')
      .lean(),
    Transaction.aggregate([
      {
        $match: {
          tenantId: normalizedTenantId,
          isReversed: false,
          memberId: { $ne: null },
          serviceDate: { $gte: addDays(new Date(), -84) },
        },
      },
      {
        $group: {
          _id: '$memberId',
          total: { $sum: 1 },
          lastGave: { $max: '$serviceDate' },
        },
      },
    ]),
  ]);

  const currentIncome = currentTransactions.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const previousIncome = lastMonthTransactions.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const projectedPercent = previousIncome
    ? round(((currentIncome - previousIncome) / previousIncome) * 100, 1)
    : 0;
  const insights = [];

  if (previousIncome && projectedPercent <= -20) {
    insights.push({
      type: 'finance_alert',
      severity: 'warning',
      title: 'Income trending below last month',
      message: `Current income pace is ${Math.abs(projectedPercent)}% below the same point last month.`,
      data: { currentIncome, previousIncome, projectedPercent },
      recommendations: [
        'Review giving trends by branch and member segment',
        'Confirm that finance entries are up to date for the current month',
      ],
    });
  }

  currentBudgets.forEach((budget) => {
    (budget.lines || []).forEach((line) => {
      const allocated = Number(line.allocated || 0);
      const spent = Number(line.spent || 0);
      if (allocated > 0 && spent > allocated * 1.2) {
        insights.push({
          type: 'finance_alert',
          severity: 'warning',
          title: `Budget overrun in ${line.category}`,
          message: `${line.category} has exceeded budget by more than 20%.`,
          data: { category: line.category, allocated, spent },
          recommendations: [
            'Review recent expenses in this category',
            'Consider budget reallocation or cost controls',
          ],
        });
      }
    });
  });

  if (!latestTithe || new Date(latestTithe.serviceDate) < addDays(new Date(), -7)) {
    insights.push({
      type: 'finance_alert',
      severity: 'info',
      title: 'No income recorded this week - is service data up to date?',
      message: 'No tithe entries have been recorded in the last 7 days.',
      recommendations: [
        'Confirm finance entries have been posted after recent services',
        'Check whether branch finance teams need reminders',
      ],
    });
  }

  const lapsedRegularGivers = giverRows.filter(
    (item) => Number(item.total || 0) >= 8 && new Date(item.lastGave) < addDays(new Date(), -28),
  );
  if (lapsedRegularGivers.length) {
    insights.push({
      type: 'finance_alert',
      severity: 'warning',
      title: `${lapsedRegularGivers.length} regular givers have lapsed`,
      message: `${lapsedRegularGivers.length} members who gave consistently in the last 12 weeks have now stopped.`,
      data: {
        memberIds: lapsedRegularGivers.map((item) => item._id),
      },
      recommendations: [
        'Review member follow-up for recent giving lapses',
        'Cross-check attendance and pastoral engagement for these members',
      ],
    });
  }

  return insights;
};

export const generateVolunteerInsights = async (tenantId) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const volunteers = await Volunteer.find({
    tenantId: normalizedTenantId,
    status: 'active',
  })
    .select('primaryDepartment departments performance')
    .lean();

  const insights = [];
  const departmentMap = new Map();
  volunteers.forEach((item) => {
    const department = item.primaryDepartment || item.departments?.[0];
    if (department) {
      departmentMap.set(department, (departmentMap.get(department) || 0) + 1);
    }
  });

  for (const [department, total] of departmentMap.entries()) {
    if (total < 2) {
      insights.push({
        type: 'volunteer_shortage',
        severity: 'warning',
        title: `Volunteer shortage in ${department}`,
        message: `${department} currently has fewer than 2 active volunteers.`,
        data: { department, total },
        recommendations: ['Recruit from members with relevant skills'],
      });
    }
  }

  const avgReliability = volunteers.length
    ? round(
        volunteers.reduce((sum, item) => sum + Number(item.performance?.reliabilityScore || 0), 0) /
          volunteers.length,
        1,
      )
    : 0;
  if (avgReliability < 70) {
    insights.push({
      type: 'volunteer_shortage',
      severity: 'warning',
      title: 'Volunteer reliability below target',
      message: `Average volunteer reliability is ${avgReliability}%, below the 70% target.`,
      data: { avgReliability },
      recommendations: [
        'Review volunteer training and reminder cadence',
        'Identify volunteers with repeated declines or absences',
      ],
    });
  }

  const upcomingEvents = await Event.find({
    tenantId: normalizedTenantId,
    startDate: { $gte: new Date(), $lte: addDays(new Date(), 7) },
    status: { $nin: ['completed', 'cancelled'] },
  })
    .select('title volunteers')
    .lean();

  upcomingEvents.forEach((event) => {
    if (!(event.volunteers || []).length) {
      insights.push({
        type: 'volunteer_shortage',
        severity: 'critical',
        title: `No volunteers assigned for upcoming event: ${event.title}`,
        message: `${event.title} is within 7 days and still has no volunteer assignments.`,
        data: { eventTitle: event.title },
        recommendations: [
          'Publish a volunteer call immediately',
          'Assign a volunteer leader to coordinate staffing',
        ],
      });
    }
  });

  return insights;
};

export const generateVisitorInsights = async (tenantId) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const currentMonthRange = getDateRangeForPeriod({ period: 'monthly', date: new Date() });
  const visitors = await Visitor.find({
    tenantId: normalizedTenantId,
    firstVisitDate: { $gte: currentMonthRange.start, $lte: currentMonthRange.end },
  })
    .select('firstVisitDate followUps converted')
    .lean();

  const unfollowed = visitors.filter((visitor) => {
    const dueDate = addDays(new Date(visitor.firstVisitDate), 7);
    const hasFollowUp = (visitor.followUps || []).some((item) => item.status === 'completed');
    return dueDate < new Date() && !hasFollowUp;
  });
  const converted = visitors.filter((item) => item.converted === true).length;
  const conversionRate = visitors.length ? round((converted / visitors.length) * 100, 1) : 0;
  const insights = [];

  if (unfollowed.length) {
    insights.push({
      type: 'visitor_pipeline',
      severity: 'warning',
      title: `${unfollowed.length} new visitors have not been followed up`,
      message: `${unfollowed.length} recent visitors have crossed the 7-day follow-up window.`,
      data: { count: unfollowed.length },
      recommendations: [
        'Assign these visitors to care leaders today',
        'Review the visitor follow-up workflow for delays',
      ],
    });
  }

  if (visitors.length && conversionRate < 20) {
    insights.push({
      type: 'visitor_pipeline',
      severity: 'warning',
      title: 'Visitor conversion rate declining',
      message: `Visitor conversion rate is ${conversionRate}% this month.`,
      data: { conversionRate, total: visitors.length },
      recommendations: [
        'Review follow-up speed and quality',
        'Check branch hospitality and assimilation workflows',
      ],
    });
  }

  if (visitors.length && conversionRate > 40) {
    insights.push({
      type: 'growth_opportunity',
      severity: 'info',
      title: 'Excellent visitor conversion this month',
      message: `Visitor conversion rate reached ${conversionRate}% this month.`,
      data: { conversionRate, total: visitors.length },
      recommendations: [
        'Document the branches or teams driving this performance',
        'Replicate the visitor assimilation process across the tenant',
      ],
    });
  }

  return insights;
};

export const generatePastoralInsights = async (tenantId) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const openCases = await CareCase.find({
    tenantId: normalizedTenantId,
    status: { $in: ['open', 'in_progress', 'on_hold'] },
  })
    .select('caseId memberName urgency assignedTo assignedToName interactions createdAt')
    .lean();
  const insights = [];

  openCases.forEach((item) => {
    const lastInteraction = (item.interactions || [])
      .map((interaction) => interaction.date)
      .filter(Boolean)
      .sort((left, right) => new Date(right) - new Date(left))[0];

    if (
      item.urgency === 'critical' &&
      (!lastInteraction || new Date(lastInteraction) < addDays(new Date(), -3))
    ) {
      insights.push({
        type: 'pastoral_alert',
        severity: 'critical',
        title: 'Critical care case unattended',
        message: `${item.memberName || 'Member'} has a critical care case with no recent interaction.`,
        data: {
          caseId: item.caseId,
          memberName: item.memberName,
          daysOpen: Math.max(Math.ceil((Date.now() - new Date(item.createdAt).getTime()) / 86400000), 0),
        },
        recommendations: [
          'Assign or escalate this case immediately',
          'Record an interaction and next follow-up time',
        ],
      });
    }
  });

  const caseloadMap = new Map();
  openCases.forEach((item) => {
    const key = item.assignedTo || item.assignedToName || 'Unassigned';
    caseloadMap.set(key, (caseloadMap.get(key) || 0) + 1);
  });
  [...caseloadMap.entries()].forEach(([name, total]) => {
    if (total > 15) {
      insights.push({
        type: 'pastoral_alert',
        severity: 'warning',
        title: `Pastor ${name} case overload - consider redistribution`,
        message: `${name} currently has ${total} open pastoral cases.`,
        data: { name, total },
        recommendations: [
          'Redistribute open cases where possible',
          'Review care leader availability for support',
        ],
      });
    }
  });

  const overdueFollowUps = openCases.filter((item) =>
    (item.interactions || []).some(
      (interaction) => interaction.nextFollowUpDate && new Date(interaction.nextFollowUpDate) < new Date(),
    ),
  );
  if (overdueFollowUps.length > 10) {
    insights.push({
      type: 'pastoral_alert',
      severity: 'warning',
      title: `${overdueFollowUps.length} pastoral follow-ups overdue`,
      message: `${overdueFollowUps.length} pastoral follow-ups are overdue across open cases.`,
      data: { count: overdueFollowUps.length },
      recommendations: [
        'Run a pastoral follow-up sprint this week',
        'Review assignee capacity and overdue cases by urgency',
      ],
    });
  }

  return insights;
};

export const generateGrowthOpportunityInsights = async (tenantId) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const [visitors, members, attendanceServices] = await Promise.all([
    Visitor.find({
      tenantId: normalizedTenantId,
      firstVisitDate: { $gte: addMonths(new Date(), -3) },
    })
      .select('converted referredByMember heardAboutUs')
      .lean(),
    Member.find({
      tenantId: normalizedTenantId,
      isDeleted: false,
    })
      .select('dateOfBirth')
      .lean(),
    AttendanceService.find({
      tenantId: normalizedTenantId,
      date: { $gte: addMonths(new Date(), -2) },
    })
      .select('date stats')
      .sort({ date: -1 })
      .lean(),
  ]);

  const insights = [];
  const referred = visitors.filter((item) => item.referredByMember?.memberId);
  const referredConverted = referred.filter((item) => item.converted === true);
  const referralRate = referred.length ? round((referredConverted.length / referred.length) * 100, 1) : 0;
  if (referred.length && referralRate > 50) {
    insights.push({
      type: 'growth_opportunity',
      severity: 'info',
      title: 'Referral program is working well',
      message: `Referred visitors are converting at ${referralRate}%.`,
      data: { referralRate, referred: referred.length },
      recommendations: ['Launch a structured member referral campaign'],
    });
  }

  const youthCount = members.filter((member) => {
    if (!member.dateOfBirth) {
      return false;
    }
    const age = Math.floor((Date.now() - new Date(member.dateOfBirth).getTime()) / (365.25 * 86400000));
    return age < 25;
  }).length;
  const youthPercent = members.length ? round((youthCount / members.length) * 100, 1) : 0;
  if (members.length && youthPercent < 20) {
    insights.push({
      type: 'growth_opportunity',
      severity: 'info',
      title: 'Youth engagement opportunity',
      message: `Youth represent ${youthPercent}% of current membership.`,
      data: { youthCount, totalMembers: members.length, youthPercent },
      recommendations: ['Consider targeted youth event or program'],
    });
  }

  const currentOnline = attendanceServices
    .slice(0, 4)
    .reduce((sum, item) => sum + Number(item.stats?.online || 0), 0);
  const previousOnline = attendanceServices
    .slice(4, 8)
    .reduce((sum, item) => sum + Number(item.stats?.online || 0), 0);
  const onlineGrowth = previousOnline ? round(((currentOnline - previousOnline) / previousOnline) * 100, 1) : 0;
  if (previousOnline && onlineGrowth > 20) {
    insights.push({
      type: 'growth_opportunity',
      severity: 'info',
      title: 'Online congregation growing - consider dedicated online pastor',
      message: `Online attendance is up ${onlineGrowth}% compared with the previous month.`,
      data: { currentOnline, previousOnline, onlineGrowth },
      recommendations: ['Consider dedicated online pastor or digital engagement team'],
    });
  }

  return insights;
};

export const generateAllInsights = async (tenantId) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  await AiInsight.deleteMany({
    tenantId: normalizedTenantId,
    expiresAt: { $lt: new Date() },
  });

  const generatedInsights = [
    ...(await generateMemberRiskInsights(normalizedTenantId)),
    ...(await generateAttendanceInsights(normalizedTenantId)),
    ...(await generateFinanceInsights(normalizedTenantId)),
    ...(await generateVolunteerInsights(normalizedTenantId)),
    ...(await generateVisitorInsights(normalizedTenantId)),
    ...(await generatePastoralInsights(normalizedTenantId)),
    ...(await generateGrowthOpportunityInsights(normalizedTenantId)),
  ];

  let generated = 0;
  let critical = 0;
  let warnings = 0;

  for (const insight of generatedInsights) {
    const saved = await saveInsightIfNew(normalizedTenantId, insight);
    if (!saved) {
      continue;
    }
    generated += 1;
    if (saved.severity === 'critical') {
      critical += 1;
    }
    if (saved.severity === 'warning') {
      warnings += 1;
    }
  }

  return {
    generated,
    critical,
    warnings,
  };
};

export const generateInsights = async (tenantId, _payload = {}, _actor = {}) =>
  generateAllInsights(tenantId);
