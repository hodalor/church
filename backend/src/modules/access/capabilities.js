const capabilitySections = [
  {
    module: 'dashboard',
    actions: ['view'],
  },
  {
    module: 'members',
    actions: ['view', 'create', 'modify', 'delete'],
  },
  {
    module: 'users',
    actions: ['view', 'create', 'modify', 'delete'],
  },
  {
    module: 'finance',
    actions: ['view', 'create', 'modify', 'delete'],
    groups: [
      { key: 'overview', actions: ['view'] },
      { key: 'transactions', actions: ['view', 'create', 'verify', 'reverse', 'export'] },
      { key: 'pledges', actions: ['view', 'create', 'record_payment'] },
      { key: 'expenses', actions: ['view', 'create', 'approve', 'reject'] },
      { key: 'budgets', actions: ['view', 'create', 'modify', 'activate'] },
      { key: 'reports', actions: ['view', 'export', 'manage_goals'] },
      { key: 'audit', actions: ['view'] },
    ],
  },
  {
    module: 'communication',
    actions: ['view', 'create', 'modify', 'delete'],
    groups: [
      { key: 'overview', actions: ['view'] },
      { key: 'broadcasts', actions: ['view', 'create', 'send'] },
      { key: 'templates', actions: ['view', 'create', 'modify'] },
      { key: 'prayer_requests', actions: ['view', 'respond'] },
      { key: 'polls', actions: ['view', 'create', 'modify'] },
      { key: 'inbox', actions: ['view'] },
    ],
  },
  {
    module: 'attendance',
    actions: ['view', 'create', 'modify', 'delete'],
    groups: [
      { key: 'services', actions: ['view', 'create', 'modify', 'delete', 'check_in'] },
      { key: 'reports', actions: ['view'] },
      { key: 'absentees', actions: ['view', 'follow_up'] },
    ],
  },
  {
    module: 'visitors',
    actions: ['view', 'create', 'modify', 'delete'],
    groups: [
      { key: 'overview', actions: ['view'] },
      { key: 'register', actions: ['view', 'create'] },
      { key: 'list', actions: ['view', 'assign', 'export', 'convert'] },
      { key: 'pipeline', actions: ['view', 'move', 'convert'] },
      { key: 'followups', actions: ['view', 'complete', 'reschedule'] },
      { key: 'workflow', actions: ['view', 'modify'] },
      { key: 'reports', actions: ['view', 'export'] },
    ],
  },
  {
    module: 'pastoral',
    actions: ['view', 'create', 'modify', 'delete'],
    groups: [
      { key: 'overview', actions: ['view'] },
      { key: 'cases', actions: ['view', 'create', 'modify', 'assign'] },
      { key: 'appointments', actions: ['view', 'create', 'modify'] },
      { key: 'discipleship', actions: ['view', 'create', 'modify'] },
      { key: 'reports', actions: ['view'] },
    ],
  },
  {
    module: 'volunteers',
    actions: ['view', 'create', 'modify', 'delete'],
    groups: [
      { key: 'overview', actions: ['view', 'create', 'modify'] },
      { key: 'rosters', actions: ['view', 'create', 'modify', 'publish'] },
      { key: 'trainings', actions: ['view', 'create'] },
      { key: 'reports', actions: ['view'] },
    ],
  },
  {
    module: 'events',
    actions: ['view', 'create', 'modify', 'delete'],
    groups: [
      { key: 'overview', actions: ['view', 'create', 'modify', 'publish'] },
      { key: 'registrations', actions: ['view', 'create', 'modify', 'check_in', 'approve'] },
      { key: 'reports', actions: ['view'] },
    ],
  },
  {
    module: 'branches',
    actions: ['view', 'create', 'modify', 'delete'],
    groups: [
      { key: 'metrics', actions: ['view', 'refresh'] },
      { key: 'snapshot', actions: ['view'] },
    ],
  },
  {
    module: 'hq',
    actions: ['view'],
    groups: [
      { key: 'overview', actions: ['view'] },
      { key: 'comparison', actions: ['view'] },
      { key: 'growth', actions: ['view'] },
      { key: 'finance', actions: ['view'] },
      { key: 'members', actions: ['view'] },
      { key: 'operations', actions: ['view'] },
      { key: 'reports', actions: ['view'] },
    ],
  },
  {
    module: 'analytics',
    actions: ['view', 'create'],
    groups: [
      { key: 'snapshots', actions: ['view', 'create'] },
      { key: 'compare', actions: ['view'] },
    ],
  },
  {
    module: 'insights',
    actions: ['view', 'create', 'modify'],
    groups: [
      { key: 'critical', actions: ['view'] },
      { key: 'management', actions: ['modify'] },
    ],
  },
  {
    module: 'ai',
    actions: ['view', 'create'],
    groups: [{ key: 'history', actions: ['view'] }],
  },
  {
    module: 'audit',
    actions: ['view'],
    groups: [
      { key: 'suspicious', actions: ['view'] },
      { key: 'exports', actions: ['view'] },
    ],
  },
  {
    module: 'ministry',
    actions: ['view', 'create', 'modify', 'delete'],
    groups: [
      { key: 'members', actions: ['view', 'create', 'modify', 'delete', 'bulk'] },
      { key: 'meetings', actions: ['view', 'create', 'modify', 'record_attendance'] },
      { key: 'reports', actions: ['view'] },
    ],
  },
  {
    module: 'cbs',
    actions: ['view', 'create', 'modify', 'delete'],
    groups: [
      { key: 'prospects', actions: ['view', 'create', 'modify', 'convert'] },
      { key: 'sessions', actions: ['view', 'create', 'modify'] },
      { key: 'reports', actions: ['view'] },
    ],
  },
  {
    module: 'leadership',
    actions: ['view', 'create', 'modify', 'delete'],
    groups: [
      { key: 'candidates', actions: ['view', 'create', 'modify'] },
      { key: 'succession', actions: ['view', 'create', 'modify'] },
      { key: 'reports', actions: ['view'] },
    ],
  },
  {
    module: 'strategic',
    actions: ['view', 'create', 'modify', 'delete'],
    groups: [
      { key: 'plans', actions: ['view', 'create', 'modify'] },
      { key: 'kpis', actions: ['view', 'create', 'modify'] },
      { key: 'initiatives', actions: ['view', 'create', 'modify'] },
      { key: 'reports', actions: ['view'] },
    ],
  },
  {
    module: 'family',
    actions: ['view'],
    groups: [{ key: 'analytics', actions: ['view'] }],
  },
  {
    module: 'platform',
    actions: ['view'],
    groups: [
      { key: 'overview', actions: ['view'] },
      { key: 'growth', actions: ['view'] },
      { key: 'health', actions: ['view'] },
      { key: 'revenue', actions: ['view'] },
      { key: 'comparison', actions: ['view'] },
    ],
  },
  {
    module: 'settings',
    actions: ['view', 'modify'],
    groups: [
      { key: 'branding', actions: ['view', 'modify'] },
      { key: 'content', actions: ['view', 'modify'] },
      { key: 'config', actions: ['view', 'modify'] },
    ],
  },
  {
    module: 'notifications',
    actions: ['view', 'modify'],
  },
  {
    module: 'manual',
    actions: ['view'],
  },
];

const getSectionCapabilities = (section) => [
  ...(section.actions || []).map((action) => `${section.module}.${action}`),
  ...((section.groups || []).flatMap((group) =>
    (group.actions || []).map((action) => `${section.module}.${group.key}.${action}`),
  )),
];

const getCapabilitiesForSection = (module, actionKeys = []) => {
  const section = capabilitySections.find((item) => item.module === module);
  if (!section) {
    return [];
  }

  const matchesAction = (key) => actionKeys.length === 0 || actionKeys.includes(key);

  return [
    ...(section.actions || [])
      .filter((key) => matchesAction(key))
      .map((key) => `${section.module}.${key}`),
    ...((section.groups || []).flatMap((group) =>
      (group.actions || [])
        .filter((key) => matchesAction(key))
        .map((key) => `${section.module}.${group.key}.${key}`),
    )),
  ];
};

export const supportedCapabilities = capabilitySections.flatMap((section) => getSectionCapabilities(section));

const memberCapabilities = ['dashboard.view', 'manual.view'];
const leadershipCapabilities = [
  'dashboard.view',
  ...getCapabilitiesForSection('members', ['view', 'create', 'modify']),
  ...getCapabilitiesForSection('communication', ['view', 'create', 'modify', 'send', 'respond']),
  ...getCapabilitiesForSection('attendance', ['view', 'create', 'modify', 'check_in', 'follow_up']),
  ...getCapabilitiesForSection('visitors', ['view', 'create', 'modify', 'assign', 'move', 'complete', 'reschedule', 'convert']),
  ...getCapabilitiesForSection('pastoral', ['view', 'create', 'modify', 'assign']),
  'notifications.view',
  'manual.view',
];
const pastoralLeadershipCapabilities = [
  ...getCapabilitiesForSection('pastoral', ['view', 'create', 'modify', 'delete', 'assign']),
];
const financeFullCapabilities = [
  'dashboard.view',
  ...getCapabilitiesForSection('finance', [
    'view',
    'create',
    'modify',
    'approve',
    'reject',
    'verify',
    'reverse',
    'activate',
    'record_payment',
    'export',
    'manage_goals',
  ]),
  'notifications.view',
  'manual.view',
];
const financeRecordOnlyCapabilities = [
  'dashboard.view',
  ...getCapabilitiesForSection('finance', ['view', 'create', 'record_payment']),
  'notifications.view',
  'manual.view',
];
const financeReportCapabilities = [
  'dashboard.view',
  ...getCapabilitiesForSection('finance', ['view', 'export']),
  'notifications.view',
  'manual.view',
];
const mediaCapabilities = [
  'dashboard.view',
  ...getCapabilitiesForSection('communication', ['view', 'create', 'modify', 'send']),
  'notifications.view',
  'manual.view',
];
const volunteerManagementCapabilities = [
  'dashboard.view',
  ...getCapabilitiesForSection('volunteers', ['view', 'create', 'modify', 'publish']),
  ...getCapabilitiesForSection('events', ['view', 'create', 'modify', 'publish', 'check_in', 'approve']),
  'notifications.view',
  'manual.view',
];
const volunteerEventViewCapabilities = [
  'dashboard.view',
  ...getCapabilitiesForSection('volunteers', ['view']),
  ...getCapabilitiesForSection('events', ['view']),
  'notifications.view',
  'manual.view',
];
const analyticsLeadershipCapabilities = [
  'dashboard.view',
  ...getCapabilitiesForSection('branches', ['view', 'create', 'modify', 'refresh']),
  ...getCapabilitiesForSection('hq', ['view']),
  ...getCapabilitiesForSection('analytics', ['view', 'create']),
  ...getCapabilitiesForSection('insights', ['view', 'create', 'modify']),
  ...getCapabilitiesForSection('ai', ['view', 'create']),
  'notifications.view',
  'manual.view',
];
const phase11LeadershipCapabilities = [
  ...getCapabilitiesForSection('audit', ['view']),
  ...getCapabilitiesForSection('ministry', ['view', 'create', 'modify', 'delete', 'bulk', 'record_attendance']),
  ...getCapabilitiesForSection('cbs', ['view', 'create', 'modify', 'delete', 'convert']),
  ...getCapabilitiesForSection('leadership', ['view', 'create', 'modify']),
  ...getCapabilitiesForSection('strategic', ['view', 'create', 'modify']),
  ...getCapabilitiesForSection('family', ['view']),
];
export const defaultCapabilitiesByRole = {
  super_admin: [...supportedCapabilities],
  head_pastor: [...supportedCapabilities],
  branch_pastor: [
    ...financeReportCapabilities,
    ...getCapabilitiesForSection('members', ['view']),
    ...getCapabilitiesForSection('communication', ['view']),
    ...getCapabilitiesForSection('attendance', ['view']),
    ...getCapabilitiesForSection('visitors', ['view', 'assign', 'complete', 'reschedule', 'convert']),
    ...getCapabilitiesForSection('pastoral', ['view', 'create', 'modify', 'assign']),
    ...volunteerManagementCapabilities,
    ...analyticsLeadershipCapabilities,
  ],
  associate_pastor: [
    ...leadershipCapabilities,
    ...getCapabilitiesForSection('members', ['delete']),
    ...getCapabilitiesForSection('visitors', ['delete']),
    ...getCapabilitiesForSection('settings', ['view']),
    ...getCapabilitiesForSection('finance', ['view', 'export']),
    ...getCapabilitiesForSection('pastoral', ['delete']),
    ...getCapabilitiesForSection('volunteers', ['delete']),
    ...getCapabilitiesForSection('events', ['delete']),
    ...analyticsLeadershipCapabilities,
    ...phase11LeadershipCapabilities,
  ],
  treasurer: [
    ...financeFullCapabilities,
    ...getCapabilitiesForSection('settings', ['view']),
    ...getCapabilitiesForSection('members', ['view']),
    ...getCapabilitiesForSection('analytics', ['view']),
    ...getCapabilitiesForSection('hq', ['view']),
    ...getCapabilitiesForSection('strategic', ['view', 'create', 'modify']),
  ],
  finance_officer: [...financeRecordOnlyCapabilities, ...getCapabilitiesForSection('analytics', ['view'])],
  media_team: [...mediaCapabilities],
  care_leader: [
    ...leadershipCapabilities,
    ...getCapabilitiesForSection('visitors', ['delete']),
    ...pastoralLeadershipCapabilities,
    ...volunteerEventViewCapabilities,
    ...getCapabilitiesForSection('insights', ['view']),
    ...getCapabilitiesForSection('ai', ['create', 'view']),
    ...getCapabilitiesForSection('family', ['view']),
    ...getCapabilitiesForSection('cbs', ['view', 'create', 'modify', 'convert']),
    ...getCapabilitiesForSection('ministry', ['view']),
  ],
  volunteer_leader: [
    ...leadershipCapabilities,
    ...volunteerManagementCapabilities,
    ...getCapabilitiesForSection('insights', ['view']),
    ...getCapabilitiesForSection('ministry', ['view', 'create', 'modify', 'record_attendance']),
  ],
  member: [...memberCapabilities],
};

export const getDefaultTenantCapabilities = () => [...supportedCapabilities];

export const getDefaultUserCapabilities = (role = 'member') => {
  return [...(defaultCapabilitiesByRole[role] || defaultCapabilitiesByRole.member)];
};

export const normalizeCapabilities = (capabilities, fallback = []) => {
  const source = Array.isArray(capabilities) ? capabilities : fallback;

  return [...new Set(source.map((capability) => String(capability).trim()).filter(Boolean))].filter(
    (capability) => supportedCapabilities.includes(capability),
  );
};

export const areCapabilitiesSupported = (capabilities) => {
  if (!Array.isArray(capabilities)) {
    return false;
  }

  return capabilities.every((capability) => supportedCapabilities.includes(String(capability).trim()));
};

export const isCapabilitySubset = (requestedCapabilities = [], allowedCapabilities = []) => {
  const allowed = new Set(normalizeCapabilities(allowedCapabilities));
  return normalizeCapabilities(requestedCapabilities).every((capability) => allowed.has(capability));
};

export const resolveTenantCapabilities = (tenant) => {
  return normalizeCapabilities(tenant?.capabilities, getDefaultTenantCapabilities());
};

export const resolveUserCapabilities = ({ role = 'member', capabilities, tenantCapabilities }) => {
  const normalizedTenantCapabilities = normalizeCapabilities(
    tenantCapabilities,
    getDefaultTenantCapabilities(),
  );
  const requestedCapabilities = normalizeCapabilities(capabilities, getDefaultUserCapabilities(role));

  return requestedCapabilities.filter((capability) =>
    normalizedTenantCapabilities.includes(capability),
  );
};

export const hasCapability = (capabilities = [], capability) => {
  if (!capability) {
    return false;
  }

  return normalizeCapabilities(capabilities).includes(capability);
};

export const hasAnyCapability = (capabilities = [], capabilityOptions = []) => {
  const normalizedCapabilities = new Set(normalizeCapabilities(capabilities));
  return capabilityOptions.some((capability) => normalizedCapabilities.has(capability));
};
