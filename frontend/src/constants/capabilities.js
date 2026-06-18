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
    module: 'volunteers',
    label: 'Volunteers',
    description: 'Manage volunteers, trainings, rosters, and volunteer reporting.',
    actions: [
      { key: 'view', label: 'Open Volunteer Workspace' },
      { key: 'create', label: 'Create Volunteer Records' },
      { key: 'modify', label: 'Modify Volunteer Records' },
      { key: 'delete', label: 'Delete Volunteer Records' },
    ],
    groups: [
      {
        key: 'overview',
        label: 'Overview',
        description: 'Volunteer dashboard, registry, and volunteer profile access.',
        actions: [
          { key: 'view', label: 'Open Volunteer Overview' },
          { key: 'create', label: 'Register Volunteers' },
          { key: 'modify', label: 'Edit Volunteer Profiles' },
        ],
      },
      {
        key: 'rosters',
        label: 'Rosters',
        description: 'Duty roster building, assignment, publication, and attendance tracking.',
        actions: [
          { key: 'view', label: 'Open Rosters' },
          { key: 'create', label: 'Create Rosters' },
          { key: 'modify', label: 'Edit Rosters' },
          { key: 'publish', label: 'Publish Rosters' },
        ],
      },
      {
        key: 'trainings',
        label: 'Trainings',
        description: 'Volunteer training records and certificate management.',
        actions: [
          { key: 'view', label: 'Open Trainings' },
          { key: 'create', label: 'Add Training Records' },
        ],
      },
      {
        key: 'reports',
        label: 'Reports',
        description: 'Volunteer performance, reliability, and department insights.',
        actions: [{ key: 'view', label: 'Open Volunteer Reports' }],
      },
    ],
  },
  {
    module: 'events',
    label: 'Events',
    description: 'Manage event creation, publishing, registrations, and event reporting.',
    actions: [
      { key: 'view', label: 'Open Event Workspace' },
      { key: 'create', label: 'Create Events' },
      { key: 'modify', label: 'Modify Events' },
      { key: 'delete', label: 'Delete Events' },
    ],
    groups: [
      {
        key: 'overview',
        label: 'Overview',
        description: 'Event dashboard, event detail, and publish workflows.',
        actions: [
          { key: 'view', label: 'Open Event Overview' },
          { key: 'create', label: 'Create Events From Workspace' },
          { key: 'modify', label: 'Edit Event Details' },
          { key: 'publish', label: 'Publish Events' },
        ],
      },
      {
        key: 'registrations',
        label: 'Registrations',
        description: 'Registration approval, attendee check-in, and attendee management.',
        actions: [
          { key: 'view', label: 'Open Event Registrations' },
          { key: 'create', label: 'Register Attendees' },
          { key: 'modify', label: 'Edit Registrations' },
          { key: 'check_in', label: 'Check In Registrants' },
          { key: 'approve', label: 'Approve Registrations' },
        ],
      },
      {
        key: 'reports',
        label: 'Reports',
        description: 'Event statistics, attendance analysis, and event revenue reporting.',
        actions: [{ key: 'view', label: 'Open Event Reports' }],
      },
    ],
  },
  {
    module: 'audit',
    label: 'Audit Trail',
    description: 'Review audit activity, suspicious events, and export history.',
    actions: [{ key: 'view', label: 'Open Audit Workspace' }],
    groups: [
      {
        key: 'suspicious',
        label: 'Suspicious Events',
        description: 'Review suspicious platform and tenant activity.',
        actions: [{ key: 'view', label: 'Open Suspicious Events' }],
      },
      {
        key: 'exports',
        label: 'Exports',
        description: 'Review audit exports and export history.',
        actions: [{ key: 'view', label: 'Open Export History' }],
      },
    ],
  },
  {
    module: 'ministry',
    label: 'Ministry',
    description: 'Manage ministries, members, meetings, and ministry reporting.',
    actions: [
      { key: 'view', label: 'Open Ministry Workspace' },
      { key: 'create', label: 'Create Ministry Records' },
      { key: 'modify', label: 'Modify Ministry Records' },
      { key: 'delete', label: 'Delete Ministry Records' },
    ],
    groups: [
      {
        key: 'members',
        label: 'Members',
        description: 'Assign ministry members and manage ministry rosters.',
        actions: [
          { key: 'view', label: 'Open Ministry Members' },
          { key: 'create', label: 'Add Ministry Members' },
          { key: 'modify', label: 'Edit Ministry Members' },
          { key: 'delete', label: 'Remove Ministry Members' },
          { key: 'bulk', label: 'Bulk Update Ministry Members' },
        ],
      },
      {
        key: 'meetings',
        label: 'Meetings',
        description: 'Create meetings and capture ministry attendance.',
        actions: [
          { key: 'view', label: 'Open Meetings' },
          { key: 'create', label: 'Create Meetings' },
          { key: 'modify', label: 'Edit Meetings' },
          { key: 'record_attendance', label: 'Record Meeting Attendance' },
        ],
      },
      {
        key: 'reports',
        label: 'Reports',
        description: 'View ministry insights and reporting.',
        actions: [{ key: 'view', label: 'Open Ministry Reports' }],
      },
    ],
  },
  {
    module: 'cbs',
    label: 'CBS Groups',
    description: 'Manage CBS prospects, sessions, conversions, and reporting.',
    actions: [
      { key: 'view', label: 'Open CBS Workspace' },
      { key: 'create', label: 'Create CBS Records' },
      { key: 'modify', label: 'Modify CBS Records' },
      { key: 'delete', label: 'Delete CBS Records' },
    ],
    groups: [
      {
        key: 'prospects',
        label: 'Prospects',
        description: 'Manage CBS prospects and conversions.',
        actions: [
          { key: 'view', label: 'Open Prospects' },
          { key: 'create', label: 'Create Prospects' },
          { key: 'modify', label: 'Edit Prospects' },
          { key: 'convert', label: 'Convert Prospects' },
        ],
      },
      {
        key: 'sessions',
        label: 'Sessions',
        description: 'Manage CBS sessions and session updates.',
        actions: [
          { key: 'view', label: 'Open Sessions' },
          { key: 'create', label: 'Create Sessions' },
          { key: 'modify', label: 'Edit Sessions' },
        ],
      },
      {
        key: 'reports',
        label: 'Reports',
        description: 'View CBS reporting and summaries.',
        actions: [{ key: 'view', label: 'Open CBS Reports' }],
      },
    ],
  },
  {
    module: 'leadership',
    label: 'Leadership Development',
    description: 'Review leadership candidates, succession, and leadership reports.',
    actions: [
      { key: 'view', label: 'Open Leadership Workspace' },
      { key: 'create', label: 'Create Leadership Records' },
      { key: 'modify', label: 'Modify Leadership Records' },
      { key: 'delete', label: 'Delete Leadership Records' },
    ],
    groups: [
      {
        key: 'candidates',
        label: 'Candidates',
        description: 'Manage leadership candidates and readiness profiles.',
        actions: [
          { key: 'view', label: 'Open Candidates' },
          { key: 'create', label: 'Create Candidates' },
          { key: 'modify', label: 'Edit Candidates' },
        ],
      },
      {
        key: 'succession',
        label: 'Succession',
        description: 'Manage succession planning and successor pathways.',
        actions: [
          { key: 'view', label: 'Open Succession' },
          { key: 'create', label: 'Create Succession Plans' },
          { key: 'modify', label: 'Edit Succession Plans' },
        ],
      },
      {
        key: 'reports',
        label: 'Reports',
        description: 'View leadership development reporting.',
        actions: [{ key: 'view', label: 'Open Leadership Reports' }],
      },
    ],
  },
  {
    module: 'strategic',
    label: 'Strategic Planning',
    description: 'Manage strategic plans, KPIs, initiatives, and strategic reports.',
    actions: [
      { key: 'view', label: 'Open Strategic Workspace' },
      { key: 'create', label: 'Create Strategic Records' },
      { key: 'modify', label: 'Modify Strategic Records' },
      { key: 'delete', label: 'Delete Strategic Records' },
    ],
    groups: [
      {
        key: 'plans',
        label: 'Plans',
        description: 'Manage strategic plans and plan structure.',
        actions: [
          { key: 'view', label: 'Open Plans' },
          { key: 'create', label: 'Create Plans' },
          { key: 'modify', label: 'Edit Plans' },
        ],
      },
      {
        key: 'kpis',
        label: 'KPIs',
        description: 'Manage KPI definitions and scorecard data.',
        actions: [
          { key: 'view', label: 'Open KPIs' },
          { key: 'create', label: 'Create KPIs' },
          { key: 'modify', label: 'Edit KPIs' },
        ],
      },
      {
        key: 'initiatives',
        label: 'Initiatives',
        description: 'Manage initiatives and execution tracking.',
        actions: [
          { key: 'view', label: 'Open Initiatives' },
          { key: 'create', label: 'Create Initiatives' },
          { key: 'modify', label: 'Edit Initiatives' },
        ],
      },
      {
        key: 'reports',
        label: 'Reports',
        description: 'View strategic reports and summaries.',
        actions: [{ key: 'view', label: 'Open Strategic Reports' }],
      },
    ],
  },
  {
    module: 'family',
    label: 'Family Ministry',
    description: 'Access family analytics and family ministry dashboards.',
    actions: [{ key: 'view', label: 'Open Family Workspace' }],
    groups: [
      {
        key: 'analytics',
        label: 'Analytics',
        description: 'View family ministry analytics and at-risk snapshots.',
        actions: [{ key: 'view', label: 'Open Family Analytics' }],
      },
    ],
  },
  {
    module: 'platform',
    label: 'Platform BI',
    description: 'Access platform-wide dashboards and tenant comparison insights.',
    actions: [{ key: 'view', label: 'Open Platform Workspace' }],
    groups: [
      {
        key: 'overview',
        label: 'Overview',
        description: 'Platform overview and summary cards.',
        actions: [{ key: 'view', label: 'Open Platform Overview' }],
      },
      {
        key: 'growth',
        label: 'Growth',
        description: 'Platform growth trends and forecasts.',
        actions: [{ key: 'view', label: 'Open Platform Growth' }],
      },
      {
        key: 'health',
        label: 'Health',
        description: 'Platform health monitoring and health scoring.',
        actions: [{ key: 'view', label: 'Open Platform Health' }],
      },
      {
        key: 'revenue',
        label: 'Revenue',
        description: 'Platform revenue and monetization views.',
        actions: [{ key: 'view', label: 'Open Platform Revenue' }],
      },
      {
        key: 'comparison',
        label: 'Comparison',
        description: 'Tenant comparison tables and rankings.',
        actions: [{ key: 'view', label: 'Open Platform Comparison' }],
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
    module: 'branches',
    label: 'Branches',
    description: 'Manage branch profiles and branch-level analytics access.',
    actions: [
      { key: 'view', label: 'Open Branch Workspace' },
      { key: 'create', label: 'Create Branches' },
      { key: 'modify', label: 'Edit Branches' },
      { key: 'delete', label: 'Deactivate Branches' },
    ],
    groups: [
      {
        key: 'metrics',
        label: 'Metrics',
        description: 'Branch KPI cards, health scores, and operational metrics.',
        actions: [
          { key: 'view', label: 'Open Branch Metrics' },
          { key: 'refresh', label: 'Refresh Branch Cache' },
        ],
      },
      {
        key: 'snapshot',
        label: 'Snapshot',
        description: 'Branch analytics snapshots and cached period views.',
        actions: [{ key: 'view', label: 'Open Branch Snapshots' }],
      },
    ],
  },
  {
    module: 'hq',
    label: 'Headquarters BI',
    description: 'Access multi-branch dashboards, reports, and intelligence tools.',
    actions: [{ key: 'view', label: 'Open Headquarters Workspace' }],
    groups: [
      {
        key: 'overview',
        label: 'Overview',
        description: 'HQ dashboard overview and comparison cards.',
        actions: [{ key: 'view', label: 'Open HQ Overview' }],
      },
      {
        key: 'comparison',
        label: 'Comparison',
        description: 'Branch comparison tables and performance views.',
        actions: [{ key: 'view', label: 'Open Branch Comparison' }],
      },
      {
        key: 'growth',
        label: 'Growth',
        description: 'Growth trend charts and forecasting insights.',
        actions: [{ key: 'view', label: 'Open Growth Intelligence' }],
      },
      {
        key: 'finance',
        label: 'Finance',
        description: 'Financial intelligence charts and anomalies.',
        actions: [{ key: 'view', label: 'Open Financial Intelligence' }],
      },
      {
        key: 'members',
        label: 'Members',
        description: 'Member intelligence, risk scoring, and retention views.',
        actions: [{ key: 'view', label: 'Open Member Intelligence' }],
      },
      {
        key: 'operations',
        label: 'Operations',
        description: 'Operational health, volunteer gaps, and care workload.',
        actions: [{ key: 'view', label: 'Open Operational Health' }],
      },
      {
        key: 'reports',
        label: 'Reports',
        description: 'Consolidated reporting and intelligence exports.',
        actions: [{ key: 'view', label: 'Open HQ Reports' }],
      },
    ],
  },
  {
    module: 'analytics',
    label: 'Analytics',
    description: 'View and generate analytics snapshots and period comparisons.',
    actions: [
      { key: 'view', label: 'Open Analytics' },
      { key: 'create', label: 'Generate Analytics' },
    ],
    groups: [
      {
        key: 'snapshots',
        label: 'Snapshots',
        description: 'Stored analytics snapshots by period.',
        actions: [
          { key: 'view', label: 'Open Snapshots' },
          { key: 'create', label: 'Generate Snapshots' },
        ],
      },
      {
        key: 'compare',
        label: 'Compare',
        description: 'Compare analytics across periods.',
        actions: [{ key: 'view', label: 'Compare Periods' }],
      },
    ],
  },
  {
    module: 'insights',
    label: 'AI Insights',
    description: 'Review, action, and generate AI insights.',
    actions: [
      { key: 'view', label: 'Open Insights' },
      { key: 'create', label: 'Generate Insights' },
      { key: 'modify', label: 'Manage Insights' },
    ],
    groups: [
      {
        key: 'critical',
        label: 'Critical',
        description: 'Critical alerts and urgent AI findings.',
        actions: [{ key: 'view', label: 'Open Critical Insights' }],
      },
      {
        key: 'management',
        label: 'Management',
        description: 'Read/actioned workflows for insights.',
        actions: [{ key: 'modify', label: 'Update Insight Status' }],
      },
    ],
  },
  {
    module: 'ai',
    label: 'AI Assistant',
    description: 'Use the AI pastor assistant and access request history.',
    actions: [
      { key: 'view', label: 'Open AI Assistant' },
      { key: 'create', label: 'Generate AI Content' },
    ],
    groups: [
      {
        key: 'history',
        label: 'History',
        description: 'Review previous AI requests.',
        actions: [{ key: 'view', label: 'Open AI History' }],
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
const branchAnalyticsViewCapabilities = [
  ...getCapabilitiesForSection('branches', ['view']),
  ...getCapabilitiesForSection('branches', ['view', 'refresh']).filter((capability) =>
    capability.startsWith('branches.metrics.') || capability.startsWith('branches.snapshot.'),
  ),
];
const aiAssistantCapabilities = [
  ...getCapabilitiesForSection('ai', ['view', 'create']),
  ...getCapabilitiesForSection('ai', ['view']).filter((capability) =>
    capability.startsWith('ai.history.'),
  ),
];
const ministryManagementCapabilities = getCapabilitiesForSection('ministry', [
  'view',
  'create',
  'modify',
  'delete',
  'bulk',
  'record_attendance',
]);
const cbsCapabilities = getCapabilitiesForSection('cbs', [
  'view',
  'create',
  'modify',
  'delete',
  'convert',
]);
const familyMinistryCapabilities = getCapabilitiesForSection('family', ['view']);
const leadershipDevelopmentCapabilities = getCapabilitiesForSection('leadership', [
  'view',
  'create',
  'modify',
  'delete',
]);
const strategicPlanningCapabilities = getCapabilitiesForSection('strategic', [
  'view',
  'create',
  'modify',
  'delete',
]);
const auditCapabilities = getCapabilitiesForSection('audit', ['view']);

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
    ...volunteerManagementCapabilities,
    ...branchAnalyticsViewCapabilities,
  ],
  associate_pastor: [
    ...leadershipCapabilities,
    ...getCapabilitiesForSection('members', ['delete']),
    ...getCapabilitiesForSection('visitors', ['delete']),
    ...getCapabilitiesForSection('settings', ['view']),
    ...getCapabilitiesForSection('pastoral', ['delete']),
    ...getCapabilitiesForSection('finance', ['view', 'export']),
    ...getCapabilitiesForSection('volunteers', ['delete']),
    ...getCapabilitiesForSection('events', ['delete']),
    ...leadershipDevelopmentCapabilities,
    ...strategicPlanningCapabilities,
    ...ministryManagementCapabilities,
    ...cbsCapabilities,
    ...familyMinistryCapabilities,
    ...auditCapabilities,
    ...branchAnalyticsViewCapabilities,
    ...aiAssistantCapabilities,
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
    ...cbsCapabilities,
    ...familyMinistryCapabilities,
    ...getCapabilitiesForSection('ministry', ['view']),
    ...volunteerEventViewCapabilities,
  ],
  volunteer_leader: [...leadershipCapabilities, ...volunteerManagementCapabilities, ...ministryManagementCapabilities],
  cbs_leader: [
    'dashboard.view',
    ...cbsCapabilities,
    'notifications.view',
    'manual.view',
  ],
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
  'cbs_leader',
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
