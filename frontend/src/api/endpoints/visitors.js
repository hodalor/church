import { useAuthStore } from '../../stores/authStore';
import { useTenantStore } from '../../stores/tenantStore';
import {
  DEFAULT_VISITOR_WORKFLOW,
  HEAR_ABOUT_OPTIONS,
  SAMPLE_CARE_LEADERS,
  VISITOR_STAGE_ORDER,
  buildVisitorFullName,
  formatStageLabel,
  getDaysBetween,
  getFollowUpStatus,
  getLastCompletedFollowUp,
  getNextPendingFollowUp,
} from '../../utils/visitors';

const STORAGE_KEY = 'prynova-visitors-db';
const DEFAULT_TENANTS = [
  { tenantId: 'demo-tenant', churchName: 'Grace City Church' },
  { tenantId: 'redeemed-central', churchName: 'Redeemed Central Assembly' },
  { tenantId: 'living-word', churchName: 'Living Word Chapel' },
];

const todayIso = () => new Date().toISOString();
const dateOnly = (value = new Date()) => new Date(value).toISOString().slice(0, 10);
const wait = (value) => Promise.resolve(value);

const safeJsonParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const getStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
};

const getActiveTenantId = () =>
  useAuthStore.getState().tenantId || useTenantStore.getState().tenantId || DEFAULT_TENANTS[0].tenantId;

const generateId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const pickLeader = (seed = 0) => SAMPLE_CARE_LEADERS[seed % SAMPLE_CARE_LEADERS.length];

const buildVisitorSeed = (tenantId, churchName, index) => {
  const stage = VISITOR_STAGE_ORDER[index % 6];
  const leader = pickLeader(index);
  const firstVisitDate = new Date();
  firstVisitDate.setDate(firstVisitDate.getDate() - (index * 3 + 1));
  const followUpDate = new Date();
  followUpDate.setDate(followUpDate.getDate() + ((index % 3) - 1));

  return {
    id: generateId('visitor'),
    tenantId,
    tenantName: churchName,
    visitorId: `VIS-${tenantId.slice(0, 3).toUpperCase()}-${String(index + 1).padStart(4, '0')}`,
    firstName: ['Joel', 'Martha', 'Kofi', 'Sarah', 'Daniel', 'Abena'][index % 6],
    lastName: ['Mensah', 'Owusu', 'Grant', 'Agyemang', 'Boateng', 'Asante'][index % 6],
    phone: `+233200000${tenantId.length}${index}`,
    email: index % 2 === 0 ? `visitor${index + 1}@${tenantId}.org` : '',
    gender: index % 2 === 0 ? 'male' : 'female',
    ageGroup: ['adult', 'youth', 'senior', 'adult'][index % 4],
    heardAboutUs: HEAR_ABOUT_OPTIONS[index % HEAR_ABOUT_OPTIONS.length].value,
    referredByMember: index % 2 === 0 ? { memberId: `MBR-${100 + index}`, memberName: 'John Antwi' } : null,
    branch: ['Main Branch', 'North Branch', 'East Branch'][index % 3],
    firstVisitDate: dateOnly(firstVisitDate),
    interests: [['Choir', 'Prayer'], ['Youth'], ['Bible Study', 'Volunteer'], ['Media']][index % 4],
    prayerRequest: index % 2 === 0 ? 'Pray for my family and work.' : '',
    notes: index % 3 === 0 ? 'Warm welcome at entrance desk.' : '',
    photoUrl: '',
    stage,
    stageChangedAt: dateOnly(firstVisitDate),
    assignedTo: leader,
    totalVisits: 1 + (index % 3),
    converted: stage === 'converted',
    convertedAt: stage === 'converted' ? todayIso() : null,
    createdAt: todayIso(),
    updatedAt: todayIso(),
    visits: [
      {
        id: generateId('visit'),
        date: dateOnly(firstVisitDate),
        serviceName: ['Sunday Service', 'Midweek Service', 'Youth Service'][index % 3],
        notes: 'Initial visit recorded at the welcome center.',
        isFirstVisit: true,
      },
    ],
    followUps: [
      {
        id: generateId('follow-up'),
        method: ['call', 'whatsapp', 'sms'][index % 3],
        scheduledDate: dateOnly(followUpDate),
        status: index % 4 === 0 ? 'completed' : 'pending',
        outcome: index % 4 === 0 ? 'positive' : '',
        notes: index % 4 === 0 ? 'Spoke and shared service highlights.' : 'Follow-up pending.',
        createdAt: todayIso(),
        updatedAt: todayIso(),
        completedAt: index % 4 === 0 ? todayIso() : null,
      },
    ],
    stageHistory: [
      {
        id: generateId('stage-history'),
        stage,
        changedAt: todayIso(),
        changedBy: 'System Seed',
        note: `Visitor currently in ${formatStageLabel(stage)} stage.`,
      },
    ],
    workflowProgress: [
      {
        id: generateId('workflow-progress'),
        stepId: 'step-1',
        day: 0,
        actionType: 'send_message',
        sentAt: todayIso(),
        status: 'completed',
      },
    ],
    survey: index % 3 === 0
      ? {
          experience: 4,
          serviceQuality: 5,
          welcomeFeeling: 5,
          feedback: 'Warm people and clear teaching.',
          wouldReturn: true,
        }
      : null,
  };
};

const buildDefaultDatabase = () => ({
  visitors: DEFAULT_TENANTS.flatMap((tenant, tenantIndex) =>
    Array.from({ length: 4 }, (_, index) => buildVisitorSeed(tenant.tenantId, tenant.churchName, tenantIndex * 4 + index)),
  ),
  workflow: DEFAULT_VISITOR_WORKFLOW,
});

const readDb = () => {
  const storage = getStorage();
  if (!storage) {
    return buildDefaultDatabase();
  }

  const existing = safeJsonParse(storage.getItem(STORAGE_KEY), null);
  if (existing?.visitors && existing?.workflow) {
    return existing;
  }

  const seeded = buildDefaultDatabase();
  storage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
};

const writeDb = (nextDb) => {
  const storage = getStorage();
  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(nextDb));
  }
  return nextDb;
};

const normalizeVisitor = (visitor) => {
  const nextPendingFollowUp = getNextPendingFollowUp(visitor.followUps || []);
  const lastCompletedFollowUp = getLastCompletedFollowUp(visitor.followUps || []);
  const firstVisitDate = visitor.firstVisitDate || visitor.visits?.[0]?.date;

  return {
    ...visitor,
    fullName: buildVisitorFullName(visitor),
    firstVisitDate,
    totalVisits: visitor.visits?.length || visitor.totalVisits || 0,
    nextPendingFollowUp,
    lastCompletedFollowUp,
    followUpStatus: getFollowUpStatus(visitor.followUps || []),
    daysSinceFirstVisit: getDaysBetween(firstVisitDate),
    daysInCurrentStage: getDaysBetween(visitor.stageChangedAt || firstVisitDate),
  };
};

const getTenantScopedVisitors = (db, tenantId, includeAllTenants = false) =>
  db.visitors
    .filter((visitor) => (includeAllTenants ? true : visitor.tenantId === tenantId))
    .map(normalizeVisitor);

const filterVisitors = (visitors, filters = {}) => {
  const searchValue = String(filters.search || '').trim().toLowerCase();
  const stageValue = filters.stage && filters.stage !== 'all' ? filters.stage : '';
  const branchValue = filters.branch && filters.branch !== 'all' ? filters.branch : '';
  const assignedToValue = filters.assignedTo && filters.assignedTo !== 'all' ? filters.assignedTo : '';
  const convertedValue = filters.converted;
  const fromDate = filters.fromDate ? new Date(filters.fromDate) : null;
  const toDate = filters.toDate ? new Date(filters.toDate) : null;

  return visitors.filter((visitor) => {
    const visitorDate = new Date(visitor.firstVisitDate);
    const matchesSearch = !searchValue
      || [visitor.fullName, visitor.phone, visitor.visitorId].filter(Boolean).join(' ').toLowerCase().includes(searchValue);
    const matchesStage = !stageValue || visitor.stage === stageValue;
    const matchesBranch = !branchValue || visitor.branch === branchValue;
    const matchesAssigned = !assignedToValue || visitor.assignedTo?.id === assignedToValue;
    const matchesConverted = convertedValue === undefined || convertedValue === null || convertedValue === ''
      ? true
      : Boolean(visitor.converted) === Boolean(convertedValue);
    const matchesFrom = !fromDate || visitorDate >= fromDate;
    const matchesTo = !toDate || visitorDate <= toDate;

    return matchesSearch && matchesStage && matchesBranch && matchesAssigned && matchesConverted && matchesFrom && matchesTo;
  });
};

const paginate = (items, page = 1, limit = 10) => {
  const safePage = Math.max(1, Number(page || 1));
  const safeLimit = Math.max(1, Number(limit || 10));
  const start = (safePage - 1) * safeLimit;
  const pagedItems = items.slice(start, start + safeLimit);

  return {
    items: pagedItems,
    page: safePage,
    limit: safeLimit,
    total: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / safeLimit)),
  };
};

const updateVisitorRecord = (visitorId, updater) => {
  const db = readDb();
  const visitorIndex = db.visitors.findIndex((item) => item.id === visitorId || item.visitorId === visitorId);
  if (visitorIndex < 0) {
    throw new Error('Visitor not found.');
  }

  const current = db.visitors[visitorIndex];
  db.visitors[visitorIndex] = {
    ...updater(current),
    updatedAt: todayIso(),
  };
  writeDb(db);
  return normalizeVisitor(db.visitors[visitorIndex]);
};

export const getVisitorAssignableLeaders = async () => wait(SAMPLE_CARE_LEADERS);

export const searchVisitors = async ({ search = '', phone = '' } = {}) => {
  const tenantId = getActiveTenantId();
  const db = readDb();
  const visitors = getTenantScopedVisitors(db, tenantId).filter((visitor) => {
    const haystack = [visitor.fullName, visitor.phone, visitor.visitorId].filter(Boolean).join(' ').toLowerCase();
    return String(search || phone).trim() ? haystack.includes(String(search || phone).trim().toLowerCase()) : true;
  });

  return wait({ items: visitors.slice(0, 8) });
};

export const checkVisitorDuplicateByPhone = async (phone) => {
  const normalizedPhone = String(phone || '').trim();
  if (!normalizedPhone) {
    return wait(null);
  }

  const tenantId = getActiveTenantId();
  const db = readDb();
  const match = getTenantScopedVisitors(db, tenantId).find((visitor) => visitor.phone === normalizedPhone) || null;
  return wait(match);
};

export const registerVisitor = async (payload) => {
  const db = readDb();
  const tenantId = payload.tenantId || getActiveTenantId();
  const tenantName = DEFAULT_TENANTS.find((tenant) => tenant.tenantId === tenantId)?.churchName || useTenantStore.getState().churchName || 'Workspace Church';
  const leader = pickLeader(db.visitors.length);
  const firstVisitDate = payload.firstVisitDate || dateOnly();
  const visitor = normalizeVisitor({
    id: generateId('visitor'),
    tenantId,
    tenantName,
    visitorId: `VIS-${tenantId.slice(0, 3).toUpperCase()}-${String(db.visitors.filter((item) => item.tenantId === tenantId).length + 1).padStart(4, '0')}`,
    firstName: payload.firstName,
    lastName: payload.lastName,
    phone: payload.phone || '',
    email: payload.email || '',
    gender: payload.gender || '',
    ageGroup: payload.ageGroup || '',
    heardAboutUs: payload.heardAboutUs || '',
    referredByMember: payload.referredByMember || null,
    branch: payload.branch || 'Main Branch',
    firstVisitDate,
    interests: payload.interests || [],
    prayerRequest: payload.prayerRequest || '',
    notes: payload.notes || '',
    photoUrl: payload.photoUrl || '',
    stage: 'new_visitor',
    stageChangedAt: todayIso(),
    assignedTo: leader,
    converted: false,
    convertedAt: null,
    createdAt: todayIso(),
    updatedAt: todayIso(),
    visits: [
      {
        id: generateId('visit'),
        date: firstVisitDate,
        serviceName: payload.serviceName || 'Welcome Service',
        notes: payload.notes || 'First visit recorded from register visitor form.',
        isFirstVisit: true,
      },
    ],
    followUps: [
      {
        id: generateId('follow-up'),
        method: 'call',
        scheduledDate: dateOnly(new Date(Date.now() + 24 * 60 * 60 * 1000)),
        status: 'pending',
        outcome: '',
        notes: 'Initial welcome follow-up created automatically.',
        createdAt: todayIso(),
        updatedAt: todayIso(),
        completedAt: null,
      },
    ],
    stageHistory: [
      {
        id: generateId('stage-history'),
        stage: 'new_visitor',
        changedAt: todayIso(),
        changedBy: 'Front Desk',
        note: 'Visitor registered at church entrance.',
      },
    ],
    workflowProgress: [
      {
        id: generateId('workflow-progress'),
        stepId: 'step-1',
        day: 0,
        actionType: 'send_message',
        sentAt: todayIso(),
        status: 'completed',
      },
    ],
    survey: null,
  });

  db.visitors.unshift(visitor);
  writeDb(db);
  return wait({
    visitor,
    message: 'Visitor registered successfully.',
    assignedCareLeader: leader,
  });
};

export const getVisitors = async ({ page = 1, limit = 10, ...filters } = {}) => {
  const db = readDb();
  const tenantId = getActiveTenantId();
  const visitors = filterVisitors(getTenantScopedVisitors(db, tenantId), filters).sort(
    (left, right) => new Date(right.firstVisitDate) - new Date(left.firstVisitDate),
  );
  const paged = paginate(visitors, page, limit);

  return wait({
    ...paged,
    items: paged.items,
    careLeaders: SAMPLE_CARE_LEADERS,
    branches: [...new Set(visitors.map((visitor) => visitor.branch).filter(Boolean))],
  });
};

export const getVisitorById = async (visitorId) => {
  const db = readDb();
  const visitor = db.visitors.find((item) => item.id === visitorId || item.visitorId === visitorId);
  return wait(visitor ? normalizeVisitor(visitor) : null);
};

export const updateVisitorStage = async (visitorId, stage, note = '') =>
  wait(
    updateVisitorRecord(visitorId, (visitor) => ({
      ...visitor,
      stage,
      stageChangedAt: todayIso(),
      converted: stage === 'converted' ? true : visitor.converted,
      stageHistory: [
        {
          id: generateId('stage-history'),
          stage,
          changedAt: todayIso(),
          changedBy: 'Workspace User',
          note: note || `Stage updated to ${formatStageLabel(stage)}.`,
        },
        ...(visitor.stageHistory || []),
      ],
    })),
  );

export const assignVisitorsToCareLeader = async (visitorIds = [], leaderId) => {
  const leader = SAMPLE_CARE_LEADERS.find((item) => item.id === leaderId) || SAMPLE_CARE_LEADERS[0];
  const db = readDb();
  db.visitors = db.visitors.map((visitor) =>
    visitorIds.includes(visitor.id)
      ? {
          ...visitor,
          assignedTo: leader,
          updatedAt: todayIso(),
        }
      : visitor,
  );
  writeDb(db);
  return wait({ leader, updatedIds: visitorIds });
};

export const recordVisitorReturnVisit = async (visitorId, payload) =>
  wait(
    updateVisitorRecord(visitorId, (visitor) => ({
      ...visitor,
      visits: [
        ...(visitor.visits || []),
        {
          id: generateId('visit'),
          date: payload.date || dateOnly(),
          serviceName: payload.serviceName || 'Return Service',
          notes: payload.notes || '',
          isFirstVisit: false,
        },
      ],
      totalVisits: (visitor.visits || []).length + 1,
      stage: visitor.stage === 'new_visitor' ? 'second_visit' : visitor.stage,
    })),
  );

export const createVisitorFollowUp = async (visitorId, payload) =>
  wait(
    updateVisitorRecord(visitorId, (visitor) => ({
      ...visitor,
      followUps: [
        {
          id: generateId('follow-up'),
          method: payload.method || 'call',
          scheduledDate: payload.scheduledDate || dateOnly(),
          status: 'pending',
          outcome: '',
          notes: payload.notes || '',
          createdAt: todayIso(),
          updatedAt: todayIso(),
          completedAt: null,
        },
        ...(visitor.followUps || []),
      ],
    })),
  );

export const completeVisitorFollowUp = async (visitorId, followUpId, payload) => {
  const visitor = updateVisitorRecord(visitorId, (current) => ({
    ...current,
    followUps: (current.followUps || []).map((followUp) =>
      followUp.id === followUpId
        ? {
            ...followUp,
            status: 'completed',
            outcome: payload.outcome,
            notes: payload.notes || followUp.notes,
            updatedAt: todayIso(),
            completedAt: todayIso(),
          }
        : followUp,
    ),
  }));

  if (payload.scheduleNextFollowUp) {
    await createVisitorFollowUp(visitor.id, {
      method: payload.nextMethod,
      scheduledDate: payload.nextScheduledDate,
      notes: payload.nextNotes || 'Next follow-up scheduled from completion flow.',
    });
  }

  return wait(visitor);
};

export const rescheduleVisitorFollowUp = async (visitorId, followUpId, payload) =>
  wait(
    updateVisitorRecord(visitorId, (current) => ({
      ...current,
      followUps: (current.followUps || []).map((followUp) =>
        followUp.id === followUpId
          ? {
              ...followUp,
              method: payload.method || followUp.method,
              scheduledDate: payload.scheduledDate || followUp.scheduledDate,
              notes: payload.notes || followUp.notes,
              updatedAt: todayIso(),
            }
          : followUp,
      ),
    })),
  );

export const convertVisitorToMember = async (visitorId, payload) =>
  wait(
    updateVisitorRecord(visitorId, (visitor) => ({
      ...visitor,
      stage: 'converted',
      converted: true,
      convertedAt: todayIso(),
      conversionPayload: payload,
      stageChangedAt: todayIso(),
      stageHistory: [
        {
          id: generateId('stage-history'),
          stage: 'converted',
          changedAt: todayIso(),
          changedBy: 'Workspace User',
          note: 'Converted to member profile from visitor detail.',
        },
        ...(visitor.stageHistory || []),
      ],
    })),
  );

export const getVisitorPipeline = async (filters = {}) => {
  const db = readDb();
  const tenantId = getActiveTenantId();
  const visitors = filterVisitors(getTenantScopedVisitors(db, tenantId), filters);

  const stages = VISITOR_STAGE_ORDER.map((stage) => ({
    stage,
    label: formatStageLabel(stage),
    items: visitors
      .filter((visitor) => visitor.stage === stage)
      .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt)),
  }));

  return wait({ stages, careLeaders: SAMPLE_CARE_LEADERS });
};

export const getVisitorFollowUps = async (filters = {}) => {
  const db = readDb();
  const tenantId = getActiveTenantId();
  const visitors = filterVisitors(getTenantScopedVisitors(db, tenantId), filters);
  const items = visitors.flatMap((visitor) =>
    (visitor.followUps || []).map((followUp) => ({
      ...followUp,
      visitorId: visitor.id,
      visitorName: visitor.fullName,
      visitorPhone: visitor.phone,
      stage: visitor.stage,
      branch: visitor.branch,
      assignedTo: visitor.assignedTo,
      overdueDays:
        followUp.status === 'completed' ? 0 : Math.max(0, getDaysBetween(followUp.scheduledDate) * (new Date(followUp.scheduledDate) < new Date(dateOnly()) ? 1 : 0)),
    })),
  );

  return wait({
    items,
    overdue: items.filter((item) => item.status !== 'completed' && new Date(item.scheduledDate) < new Date(dateOnly())),
    today: items.filter((item) => item.scheduledDate === dateOnly()),
    upcoming: items.filter((item) => item.status !== 'completed' && new Date(item.scheduledDate) > new Date(dateOnly())),
  });
};

export const getVisitorWorkflow = async () => wait(readDb().workflow);

export const saveVisitorWorkflow = async (steps) => {
  const db = readDb();
  db.workflow = steps;
  writeDb(db);
  return wait(steps);
};

export const testVisitorWorkflow = async (steps = readDb().workflow) =>
  wait(
    steps.map((step) => ({
      id: step.id,
      day: step.day,
      name: step.name,
      actionsSummary: (step.actions || []).map((action) => action.type.replaceAll('_', ' ')).join(', '),
    })),
  );

export const getVisitorReports = async () => {
  const db = readDb();
  const tenantId = getActiveTenantId();
  const visitors = getTenantScopedVisitors(db, tenantId);
  const totalVisitors = visitors.length;
  const converted = visitors.filter((visitor) => visitor.converted).length;
  const stageCounts = VISITOR_STAGE_ORDER.map((stage) => {
    const count = visitors.filter((visitor) => visitor.stage === stage).length;
    return {
      stage,
      label: formatStageLabel(stage),
      count,
      percentage: totalVisitors ? Math.round((count / totalVisitors) * 100) : 0,
    };
  });
  const heardAbout = HEAR_ABOUT_OPTIONS.map((option) => ({
    label: option.label,
    value: visitors.filter((visitor) => visitor.heardAboutUs === option.value).length,
  }));
  const branchBreakdown = [...new Set(visitors.map((visitor) => visitor.branch).filter(Boolean))].map((branch) => ({
    label: branch,
    value: visitors.filter((visitor) => visitor.branch === branch).length,
  }));
  const topReferrers = Object.values(
    visitors.reduce((accumulator, visitor) => {
      const key = visitor.referredByMember?.memberId;
      if (!key) {
        return accumulator;
      }

      const current = accumulator[key] || {
        memberId: key,
        name: visitor.referredByMember.memberName,
        referrals: 0,
        converted: 0,
      };
      current.referrals += 1;
      if (visitor.converted) {
        current.converted += 1;
      }
      accumulator[key] = current;
      return accumulator;
    }, {}),
  ).map((item) => ({
    ...item,
    successRate: item.referrals ? Math.round((item.converted / item.referrals) * 100) : 0,
  }));

  return wait({
    totalVisitors,
    converted,
    conversionRate: totalVisitors ? Math.round((converted / totalVisitors) * 100) : 0,
    averageDaysToConvert: converted
      ? Math.round(
          visitors
            .filter((visitor) => visitor.converted)
            .reduce((sum, visitor) => sum + getDaysBetween(visitor.firstVisitDate, visitor.convertedAt), 0) / converted,
        )
      : 0,
    funnel: stageCounts,
    dropOff: stageCounts.slice(0, -1).map((item, index) => ({
      from: item.label,
      to: stageCounts[index + 1].label,
      dropOffPercentage:
        item.count ? Math.max(0, 100 - Math.round((stageCounts[index + 1].count / item.count) * 100)) : 0,
      averageDaysStuck: 3 + index * 2,
    })),
    conversionTrend: Array.from({ length: 12 }, (_, index) => ({
      month: new Date(new Date().getFullYear(), index, 1).toLocaleString('en-US', { month: 'short' }),
      rate: 20 + ((index * 7) % 36),
    })),
    heardAbout,
    branchBreakdown,
    topReferrers,
    satisfaction: {
      score: 4.3,
      experience: 4.5,
      serviceQuality: 4.2,
      welcomeFeeling: 4.7,
      wouldReturn: 88,
      topWords: ['warm', 'clear', 'welcoming', 'music', 'family'],
    },
    referralTrend: Array.from({ length: 8 }, (_, index) => ({
      period: `W${index + 1}`,
      referrals: 4 + ((index * 3) % 7),
    })),
  });
};

export const getPlatformVisitorOverview = async () => {
  const db = readDb();
  const visitors = db.visitors.map(normalizeVisitor);
  const tenantRows = DEFAULT_TENANTS.map((tenant) => {
    const tenantVisitors = visitors.filter((visitor) => visitor.tenantId === tenant.tenantId);
    const converted = tenantVisitors.filter((visitor) => visitor.converted).length;
    const pendingFollowUps = tenantVisitors.reduce(
      (sum, visitor) => sum + (visitor.followUps || []).filter((followUp) => followUp.status !== 'completed').length,
      0,
    );

    return {
      tenantId: tenant.tenantId,
      churchName: tenant.churchName,
      visitorsThisMonth: tenantVisitors.length,
      totalVisitors: tenantVisitors.length,
      converted,
      conversionRate: tenantVisitors.length ? Math.round((converted / tenantVisitors.length) * 100) : 0,
      pendingFollowUps,
      workflowActive: true,
    };
  });

  return wait({
    totalVisitors: visitors.length,
    averageConversionRate: tenantRows.length
      ? Math.round(tenantRows.reduce((sum, item) => sum + item.conversionRate, 0) / tenantRows.length)
      : 0,
    pendingFollowUps: visitors.reduce(
      (sum, visitor) => sum + (visitor.followUps || []).filter((followUp) => followUp.status !== 'completed').length,
      0,
    ),
    lostVisitors: visitors.filter((visitor) => visitor.stage === 'lost').length,
    tenants: tenantRows,
  });
};
