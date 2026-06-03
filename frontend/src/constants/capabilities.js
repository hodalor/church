export const capabilitySections = [
  {
    module: 'dashboard',
    label: 'Dashboard',
    description: 'Access the workspace overview and summary cards.',
    actions: [{ key: 'view', label: 'View' }],
  },
  {
    module: 'members',
    label: 'Members',
    description: 'Manage member records and membership actions.',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'create', label: 'Create' },
      { key: 'modify', label: 'Modify' },
      { key: 'delete', label: 'Delete' },
    ],
  },
  {
    module: 'users',
    label: 'Users',
    description: 'Provision staff accounts and manage staff access.',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'create', label: 'Create' },
      { key: 'modify', label: 'Modify' },
      { key: 'delete', label: 'Delete' },
    ],
  },
  {
    module: 'finance',
    label: 'Finance',
    description: 'Access finance pages and finance actions.',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'create', label: 'Create' },
      { key: 'modify', label: 'Modify' },
      { key: 'delete', label: 'Delete' },
    ],
  },
  {
    module: 'communication',
    label: 'Communication',
    description: 'Use communication and media workflows.',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'create', label: 'Create' },
      { key: 'modify', label: 'Modify' },
      { key: 'delete', label: 'Delete' },
    ],
  },
  {
    module: 'attendance',
    label: 'Attendance',
    description: 'Access attendance tracking and editing.',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'create', label: 'Create' },
      { key: 'modify', label: 'Modify' },
      { key: 'delete', label: 'Delete' },
    ],
  },
  {
    module: 'pastoral',
    label: 'Pastoral Care',
    description: 'Access pastoral care, appointments, discipleship, and pastoral reporting.',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'create', label: 'Create' },
      { key: 'modify', label: 'Modify' },
      { key: 'delete', label: 'Delete' },
    ],
  },
  {
    module: 'settings',
    label: 'Settings',
    description: 'Open and update tenant workspace settings.',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'modify', label: 'Modify' },
    ],
  },
  {
    module: 'notifications',
    label: 'Notifications',
    description: 'Read and act on notifications.',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'modify', label: 'Modify' },
    ],
  },
];

export const allCapabilities = capabilitySections.flatMap(({ module, actions }) =>
  actions.map(({ key }) => `${module}.${key}`),
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
  'pastoral.view',
  'pastoral.create',
  'pastoral.modify',
  'notifications.view',
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

export const defaultCapabilitiesByRole = {
  super_admin: [...allCapabilities],
  head_pastor: [...allCapabilities],
  branch_pastor: [
    ...financeReportCapabilities,
    'members.view',
    'communication.view',
    'attendance.view',
    'pastoral.view',
    'pastoral.create',
    'pastoral.modify',
  ],
  associate_pastor: [
    ...leadershipCapabilities,
    'members.delete',
    'settings.view',
    'finance.view',
    'pastoral.delete',
  ],
  treasurer: [...financeFullCapabilities, 'settings.view', 'members.view'],
  finance_officer: [...financeRecordOnlyCapabilities],
  media_team: [...mediaCapabilities],
  care_leader: [...leadershipCapabilities],
  volunteer_leader: [...leadershipCapabilities],
  member: [...memberCapabilities],
};

export const userRoleOptions = [
  'head_pastor',
  'associate_pastor',
  'branch_pastor',
  'treasurer',
  'finance_officer',
  'media_team',
  'care_leader',
  'volunteer_leader',
  'member',
];

export const normalizeCapabilities = (capabilities, fallback = []) => {
  const source = Array.isArray(capabilities) ? capabilities : fallback;

  return [...new Set(source.map((capability) => String(capability).trim()).filter(Boolean))].filter(
    (capability) => allCapabilities.includes(capability),
  );
};

export const getRoleDefaultCapabilities = (role = 'member') =>
  normalizeCapabilities(defaultCapabilitiesByRole[role], defaultCapabilitiesByRole.member);

export const hasCapability = (capabilities = [], capability) =>
  normalizeCapabilities(capabilities).includes(capability);

export const formatCapabilityLabel = (capability) =>
  capability
    .split('.')
    .map((part) => part.replaceAll('_', ' '))
    .join(' ');
