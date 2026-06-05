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
  ],
  associate_pastor: [
    ...leadershipCapabilities,
    ...getCapabilitiesForSection('members', ['delete']),
    ...getCapabilitiesForSection('visitors', ['delete']),
    ...getCapabilitiesForSection('settings', ['view']),
    ...getCapabilitiesForSection('finance', ['view', 'export']),
    ...getCapabilitiesForSection('pastoral', ['delete']),
  ],
  treasurer: [
    ...financeFullCapabilities,
    ...getCapabilitiesForSection('settings', ['view']),
    ...getCapabilitiesForSection('members', ['view']),
  ],
  finance_officer: [...financeRecordOnlyCapabilities],
  media_team: [...mediaCapabilities],
  care_leader: [
    ...leadershipCapabilities,
    ...getCapabilitiesForSection('visitors', ['delete']),
    ...pastoralLeadershipCapabilities,
  ],
  volunteer_leader: [...leadershipCapabilities],
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
