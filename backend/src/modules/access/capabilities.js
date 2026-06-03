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
  },
  {
    module: 'communication',
    actions: ['view', 'create', 'modify', 'delete'],
  },
  {
    module: 'attendance',
    actions: ['view', 'create', 'modify', 'delete'],
  },
  {
    module: 'visitors',
    actions: ['view', 'create', 'modify', 'delete'],
  },
  {
    module: 'pastoral',
    actions: ['view', 'create', 'modify', 'delete'],
  },
  {
    module: 'settings',
    actions: ['view', 'modify'],
  },
  {
    module: 'notifications',
    actions: ['view', 'modify'],
  },
];

export const supportedCapabilities = capabilitySections.flatMap(({ module, actions }) =>
  actions.map((action) => `${module}.${action}`),
);

const memberCapabilities = ['dashboard.view'];
const leadershipCapabilities = [
  'dashboard.view',
  'members.view',
  'members.create',
  'members.modify',
  'communication.view',
  'communication.create',
  'communication.modify',
  'attendance.view',
  'attendance.create',
  'attendance.modify',
  'visitors.view',
  'visitors.create',
  'visitors.modify',
  'pastoral.view',
  'pastoral.create',
  'pastoral.modify',
  'notifications.view',
];
const pastoralLeadershipCapabilities = [
  'pastoral.view',
  'pastoral.create',
  'pastoral.modify',
  'pastoral.delete',
];
const financeFullCapabilities = [
  'dashboard.view',
  'finance.view',
  'finance.create',
  'finance.modify',
  'notifications.view',
];
const financeRecordOnlyCapabilities = [
  'dashboard.view',
  'finance.view',
  'finance.create',
  'notifications.view',
];
const financeReportCapabilities = ['dashboard.view', 'finance.view', 'notifications.view'];
const mediaCapabilities = [
  'dashboard.view',
  'communication.view',
  'communication.create',
  'communication.modify',
  'notifications.view',
];
const adminCapabilities = [
  ...supportedCapabilities.filter((capability) => !capability.startsWith('finance.')),
  'finance.view',
];

export const defaultCapabilitiesByRole = {
  super_admin: [...supportedCapabilities],
  head_pastor: [...supportedCapabilities],
  branch_pastor: [...financeReportCapabilities, 'members.view', 'visitors.view', ...pastoralLeadershipCapabilities],
  associate_pastor: [
    ...leadershipCapabilities,
    'members.delete',
    'visitors.delete',
    'settings.view',
    'finance.view',
    ...pastoralLeadershipCapabilities,
  ],
  treasurer: [...financeFullCapabilities, 'settings.view', 'members.view'],
  finance_officer: [...financeRecordOnlyCapabilities],
  media_team: [...mediaCapabilities],
  care_leader: [...leadershipCapabilities, 'visitors.delete', ...pastoralLeadershipCapabilities],
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
