export const capabilitySections = [
  {
    module: 'dashboard',
    label: 'Dashboard',
    description: 'Access the workspace overview and summary cards.',
    actions: [{ key: 'view', label: 'View Dashboard' }],
  },
  {
    module: 'members',
    label: 'Members',
    description: 'Manage member records and membership actions.',
    actions: [
      { key: 'view', label: 'Open Members' },
      { key: 'create', label: 'Create Members' },
      { key: 'modify', label: 'Edit Members' },
      { key: 'delete', label: 'Delete Members' },
    ],
  },
  {
    module: 'users',
    label: 'Users',
    description: 'Provision staff accounts and manage staff access.',
    actions: [
      { key: 'view', label: 'Open Users' },
      { key: 'create', label: 'Create Users' },
      { key: 'modify', label: 'Edit Users' },
      { key: 'delete', label: 'Delete Users' },
    ],
  },
  {
    module: 'finance',
    label: 'Finance',
    description: 'Grant detailed access to finance pages, submenus, and action buttons.',
    actions: [
      { key: 'view', label: 'Open Finance Workspace' },
      { key: 'create', label: 'Record Finance Entries' },
      { key: 'modify', label: 'Modify Finance Records' },
      { key: 'delete', label: 'Delete Finance Records' },
    ],
    groups: [
      {
        key: 'overview',
        label: 'Overview',
        description: 'Finance dashboard, smart cards, and summary widgets.',
        actions: [{ key: 'view', label: 'Open Overview' }],
      },
      {
        key: 'transactions',
        label: 'Transactions',
        description: 'Giving records, receipts, verification, and reversals.',
        actions: [
          { key: 'view', label: 'Open Transactions' },
          { key: 'create', label: 'Record Transactions' },
          { key: 'verify', label: 'Verify Transactions' },
          { key: 'reverse', label: 'Reverse Transactions' },
          { key: 'export', label: 'Export Transactions' },
        ],
      },
      {
        key: 'pledges',
        label: 'Pledges',
        description: 'Pledge creation, payment tracking, and pledge settlement.',
        actions: [
          { key: 'view', label: 'Open Pledges' },
          { key: 'create', label: 'Create Pledges' },
          { key: 'record_payment', label: 'Record Pledge Payments' },
        ],
      },
      {
        key: 'expenses',
        label: 'Expenses',
        description: 'Expense recording and approval workflow.',
        actions: [
          { key: 'view', label: 'Open Expenses' },
          { key: 'create', label: 'Record Expenses' },
          { key: 'approve', label: 'Approve Expenses' },
          { key: 'reject', label: 'Reject Expenses' },
        ],
      },
      {
        key: 'budgets',
        label: 'Budgets',
        description: 'Budget setup, editing, and activation.',
        actions: [
          { key: 'view', label: 'Open Budgets' },
          { key: 'create', label: 'Create Budgets' },
          { key: 'modify', label: 'Edit Budgets' },
          { key: 'activate', label: 'Activate Budgets' },
        ],
      },
      {
        key: 'reports',
        label: 'Reports',
        description: 'Reports, statements, giving goals, and report exports.',
        actions: [
          { key: 'view', label: 'Open Reports' },
          { key: 'export', label: 'Export Reports' },
          { key: 'manage_goals', label: 'Manage Giving Goals' },
        ],
      },
      {
        key: 'audit',
        label: 'Audit Log',
        description: 'Review the finance audit trail.',
        actions: [{ key: 'view', label: 'Open Audit Log' }],
      },
    ],
  },
  {
    module: 'communication',
    label: 'Communication',
    description: 'Use communication pages, submenus, and messaging actions.',
    actions: [
      { key: 'view', label: 'Open Communication Workspace' },
      { key: 'create', label: 'Create Communication Items' },
      { key: 'modify', label: 'Modify Communication Items' },
      { key: 'delete', label: 'Delete Communication Items' },
    ],
    groups: [
      {
        key: 'overview',
        label: 'Overview',
        description: 'Communication dashboard and summary cards.',
        actions: [{ key: 'view', label: 'Open Overview' }],
      },
      {
        key: 'broadcasts',
        label: 'Broadcasts',
        description: 'Broadcast creation and bulk sending.',
        actions: [
          { key: 'view', label: 'Open Broadcasts' },
          { key: 'create', label: 'Create Broadcasts' },
          { key: 'send', label: 'Send Broadcasts' },
        ],
      },
      {
        key: 'templates',
        label: 'Templates',
        description: 'Message template library.',
        actions: [
          { key: 'view', label: 'Open Templates' },
          { key: 'create', label: 'Create Templates' },
          { key: 'modify', label: 'Edit Templates' },
        ],
      },
      {
        key: 'prayer_requests',
        label: 'Prayer Requests',
        description: 'Prayer request inbox and follow-up actions.',
        actions: [
          { key: 'view', label: 'Open Prayer Requests' },
          { key: 'respond', label: 'Respond To Prayer Requests' },
        ],
      },
      {
        key: 'polls',
        label: 'Polls',
        description: 'Poll creation and results review.',
        actions: [
          { key: 'view', label: 'Open Polls' },
          { key: 'create', label: 'Create Polls' },
          { key: 'modify', label: 'Edit Polls' },
        ],
      },
      {
        key: 'inbox',
        label: 'Inbox',
        description: 'Notification and message inbox.',
        actions: [{ key: 'view', label: 'Open Inbox' }],
      },
    ],
  },
  {
    module: 'attendance',
    label: 'Attendance',
    description: 'Control attendance pages, reports, and check-in actions.',
    actions: [
      { key: 'view', label: 'Open Attendance Workspace' },
      { key: 'create', label: 'Create Attendance Records' },
      { key: 'modify', label: 'Modify Attendance Records' },
      { key: 'delete', label: 'Delete Attendance Records' },
    ],
    groups: [
      {
        key: 'services',
        label: 'Services',
        description: 'Service setup and service attendance detail.',
        actions: [
          { key: 'view', label: 'Open Services' },
          { key: 'create', label: 'Create Services' },
          { key: 'modify', label: 'Edit Services' },
          { key: 'delete', label: 'Delete Services' },
          { key: 'check_in', label: 'Run Check-in Console' },
        ],
      },
      {
        key: 'reports',
        label: 'Reports',
        description: 'Attendance reports and trends.',
        actions: [{ key: 'view', label: 'Open Reports' }],
      },
      {
        key: 'absentees',
        label: 'Absentees',
        description: 'Absentee review and follow-up.',
        actions: [
          { key: 'view', label: 'Open Absentees' },
          { key: 'follow_up', label: 'Follow Up Absentees' },
        ],
      },
    ],
  },
  {
    module: 'visitors',
    label: 'Visitors',
    description: 'Grant visitor registration, pipeline, follow-up, and workflow access.',
    actions: [
      { key: 'view', label: 'Open Visitor Workspace' },
      { key: 'create', label: 'Create Visitor Records' },
      { key: 'modify', label: 'Modify Visitor Records' },
      { key: 'delete', label: 'Delete Visitor Records' },
    ],
    groups: [
      {
        key: 'overview',
        label: 'Overview',
        description: 'Visitor summary and landing pages.',
        actions: [{ key: 'view', label: 'Open Visitor Overview' }],
      },
      {
        key: 'register',
        label: 'Register',
        description: 'Fast visitor registration page and kiosk-style entry.',
        actions: [
          { key: 'view', label: 'Open Register Page' },
          { key: 'create', label: 'Register Visitors' },
        ],
      },
      {
        key: 'list',
        label: 'List',
        description: 'Visitor list, bulk assignment, exports, and conversions.',
        actions: [
          { key: 'view', label: 'Open Visitor List' },
          { key: 'assign', label: 'Assign Care Leaders' },
          { key: 'export', label: 'Export Visitor List' },
          { key: 'convert', label: 'Convert Visitors To Members' },
        ],
      },
      {
        key: 'pipeline',
        label: 'Pipeline',
        description: 'Pipeline board and stage movement.',
        actions: [
          { key: 'view', label: 'Open Pipeline' },
          { key: 'move', label: 'Move Pipeline Cards' },
          { key: 'convert', label: 'Convert From Pipeline' },
        ],
      },
      {
        key: 'followups',
        label: 'Follow-ups',
        description: 'Follow-up queue and completion actions.',
        actions: [
          { key: 'view', label: 'Open Follow-ups' },
          { key: 'complete', label: 'Complete Follow-ups' },
          { key: 'reschedule', label: 'Reschedule Follow-ups' },
        ],
      },
      {
        key: 'workflow',
        label: 'Workflow',
        description: 'Visitor follow-up workflow builder.',
        actions: [
          { key: 'view', label: 'Open Workflow Builder' },
          { key: 'modify', label: 'Edit Workflow Builder' },
        ],
      },
      {
        key: 'reports',
        label: 'Reports',
        description: 'Visitor reports and exports.',
        actions: [
          { key: 'view', label: 'Open Visitor Reports' },
          { key: 'export', label: 'Export Visitor Reports' },
        ],
      },
    ],
  },
  {
    module: 'pastoral',
    label: 'Pastoral Care',
    description: 'Control pastoral overview, cases, appointments, discipleship, and reports.',
    actions: [
      { key: 'view', label: 'Open Pastoral Workspace' },
      { key: 'create', label: 'Create Pastoral Records' },
      { key: 'modify', label: 'Modify Pastoral Records' },
      { key: 'delete', label: 'Delete Pastoral Records' },
    ],
    groups: [
      {
        key: 'overview',
        label: 'Overview',
        description: 'Pastoral dashboard and summary cards.',
        actions: [{ key: 'view', label: 'Open Overview' }],
      },
      {
        key: 'cases',
        label: 'Cases',
        description: 'Case list, detail, and case assignment.',
        actions: [
          { key: 'view', label: 'Open Cases' },
          { key: 'create', label: 'Create Cases' },
          { key: 'modify', label: 'Edit Cases' },
          { key: 'assign', label: 'Assign Cases' },
        ],
      },
      {
        key: 'appointments',
        label: 'Appointments',
        description: 'Pastoral appointment scheduling and updates.',
        actions: [
          { key: 'view', label: 'Open Appointments' },
          { key: 'create', label: 'Create Appointments' },
          { key: 'modify', label: 'Edit Appointments' },
        ],
      },
      {
        key: 'discipleship',
        label: 'Discipleship',
        description: 'Tracks, enrollments, and discipleship progress.',
        actions: [
          { key: 'view', label: 'Open Discipleship' },
          { key: 'create', label: 'Create Tracks And Enrollments' },
          { key: 'modify', label: 'Edit Discipleship Records' },
        ],
      },
      {
        key: 'reports',
        label: 'Reports',
        description: 'Pastoral reports and summaries.',
        actions: [{ key: 'view', label: 'Open Reports' }],
      },
    ],
  },
  {
    module: 'settings',
    label: 'Settings',
    description: 'Open tenant settings and manage branding, content, and platform config.',
    actions: [
      { key: 'view', label: 'Open Settings Workspace' },
      { key: 'modify', label: 'Modify Settings Workspace' },
    ],
    groups: [
      {
        key: 'branding',
        label: 'Branding',
        description: 'Client app name, logo, and tagline.',
        actions: [
          { key: 'view', label: 'Open Branding' },
          { key: 'modify', label: 'Edit Branding' },
        ],
      },
      {
        key: 'content',
        label: 'Content',
        description: 'Branches, departments, ministries, and grouping tree.',
        actions: [
          { key: 'view', label: 'Open Content Settings' },
          { key: 'modify', label: 'Edit Content Settings' },
        ],
      },
      {
        key: 'config',
        label: 'Config',
        description: 'Super admin global config, eligible countries, and global branding.',
        actions: [
          { key: 'view', label: 'Open Config' },
          { key: 'modify', label: 'Edit Config' },
        ],
      },
    ],
  },
  {
    module: 'notifications',
    label: 'Notifications',
    description: 'Read and update notifications.',
    actions: [
      { key: 'view', label: 'Open Notifications' },
      { key: 'modify', label: 'Manage Notifications' },
    ],
  },
  {
    module: 'manual',
    label: 'Manual',
    description: 'Open the in-app user guide and training manual.',
    actions: [{ key: 'view', label: 'Open Manual' }],
  },
];

const getSectionCapabilities = (section) => [
  ...(section.actions || []).map(({ key }) => `${section.module}.${key}`),
  ...((section.groups || []).flatMap((group) =>
    (group.actions || []).map(({ key }) => `${section.module}.${group.key}.${key}`),
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
      .filter(({ key }) => matchesAction(key))
      .map(({ key }) => `${section.module}.${key}`),
    ...((section.groups || []).flatMap((group) =>
      (group.actions || [])
        .filter(({ key }) => matchesAction(key))
        .map(({ key }) => `${section.module}.${group.key}.${key}`),
    )),
  ];
};

export const allCapabilities = capabilitySections.flatMap((section) => getSectionCapabilities(section));

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
  super_admin: [...allCapabilities],
  head_pastor: [...allCapabilities],
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
    ...getCapabilitiesForSection('pastoral', ['delete']),
    ...getCapabilitiesForSection('finance', ['view', 'export']),
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
    ...getCapabilitiesForSection('pastoral', ['delete']),
  ],
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

export const hasAnyCapability = (capabilities = [], capabilityOptions = []) => {
  const normalized = new Set(normalizeCapabilities(capabilities));
  return capabilityOptions.some((capability) => normalized.has(capability));
};

export const formatCapabilityLabel = (capability) =>
  capability
    .split('.')
    .map((part) => part.replaceAll('_', ' '))
    .join(' ');
