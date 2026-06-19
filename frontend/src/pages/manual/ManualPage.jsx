import AppShell from '../../components/layout/AppShell';
import SuperAdminShell from '../../components/layout/SuperAdminShell';
import Card from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';

const operatingRules = [
  {
    title: 'One Source Of Truth',
    description:
      'Create live branches in HQ > Branches, live ministries in Ministry, and live Bible study groups in CBS Groups. Use Settings only for departments, branding, and grouping hierarchy.',
  },
  {
    title: 'Members Are The Core Record',
    description:
      'Members connect almost every other module. Volunteers, pastoral care, giving history, discipleship, event registrations, referrals, and ministry assignment all become more useful when member records are complete.',
  },
  {
    title: 'Users Control Access',
    description:
      'Users are worker or staff accounts. A user can be given only the menus, submenus, and actions they need. The default church admin inherits every feature enabled for the tenant.',
  },
  {
    title: 'Intelligence Reads Operational Data',
    description:
      'HQ, Insights, Family Ministry, Audit, and AI do not replace daily workspaces. They read activity from members, attendance, finance, visitors, communication, volunteers, pastoral care, events, ministry, and CBS.',
  },
  {
    title: 'Start Simple, Then Go Deeper',
    description:
      'Most workers only need a few pages: Dashboard, Members, Visitors, Attendance, Finance, Volunteers, Communication, and Settings. Senior leaders then add HQ, Insights, AI, Strategic, and Leadership.',
  },
];

const setupMap = [
  {
    title: 'Branches',
    owner: 'HQ > Branches',
    description:
      'This is the real place to create branch records, assign branch pastors, and track branch performance. Branch names are mirrored into forms automatically.',
  },
  {
    title: 'Ministries',
    owner: 'Ministry',
    description:
      'This is the real place to create ministry records, assign leaders, manage members, schedule meetings, and review ministry reports.',
  },
  {
    title: 'CBS Groups',
    owner: 'CBS Groups',
    description:
      'This is the real place to create Bible study groups, add prospects, record sessions, track discipleship stages, and convert people into members.',
  },
  {
    title: 'Departments',
    owner: 'Settings > Content',
    description:
      'Use departments for service teams and work teams such as choir, ushers, protocol, media, hospitality, and security.',
  },
  {
    title: 'Grouping Hierarchy',
    owner: 'Settings > Content',
    description:
      'Use groupings for custom structure below branch level, such as region, zone, district, cell, cluster, sector, or any discipleship tree the church uses.',
  },
  {
    title: 'Branding And Platform Config',
    owner: 'Settings',
    description:
      'Use branding to control tenant identity in the app. Super admin uses Config for global branding, allowed countries, and currency defaults.',
  },
];

const navigationGroups = [
  {
    title: 'Overview',
    audience: 'All users',
    items: [
      {
        name: 'Dashboard',
        description:
          'Your daily starting point. It shows summary cards, quick actions, and a high-level view of what needs attention today.',
      },
      {
        name: 'Manual',
        description:
          'The built-in handbook. Open it when training new workers, clarifying workflows, or learning which page is the right place for a task.',
      },
    ],
  },
  {
    title: 'Intelligence',
    audience: 'Senior leaders and analysts',
    items: [
      {
        name: 'Headquarters',
        description:
          'The executive command center. Use HQ Overview for branch-wide summaries, Branches for live branch profiles, Intelligence for deeper member and risk analysis, and Reports for consolidated reporting.',
      },
      {
        name: 'Insights',
        description:
          'This page highlights patterns the system thinks leadership should notice, such as slowing attendance, weak giving, poor follow-up, engagement gaps, or ministry pressure points.',
      },
      {
        name: 'Family Ministry',
        description:
          'This page looks at households, risk indicators, and family health trends. Use it to identify families who may need care, discipleship, or intervention.',
      },
      {
        name: 'Audit Trail',
        description:
          'This page shows activity history and sensitive actions. Use it when checking who changed a record, who exported data, or which unusual events need review.',
      },
      {
        name: 'AI Assistant',
        description:
          'This is the guided assistant for summaries, recommendations, and pattern review. It is best used after the main modules already contain real data.',
      },
    ],
  },
  {
    title: 'Church Growth',
    audience: 'Church leadership and ministry heads',
    items: [
      {
        name: 'Ministry',
        description:
          'Use Overview for ministry health, Ministry List for all ministries, each ministry detail page for members and meetings, and reports for attendance, action points, and growth.',
      },
      {
        name: 'CBS Groups',
        description:
          'Use Overview for disciple-making momentum, Groups for Bible study group records, Prospects for cross-group follow-up, Pipeline for stage movement, and Reports for conversion analysis.',
      },
      {
        name: 'Leadership',
        description:
          'Use this for leadership profiles, readiness review, succession planning, and leadership development reporting.',
      },
      {
        name: 'Strategic Plan',
        description:
          'Use this for long-range planning. Plans define the strategy, KPIs track measurable progress, Scorecard gives the executive summary, and Reports show results over time.',
      },
    ],
  },
  {
    title: 'Ministry',
    audience: 'Daily workers and administrators',
    items: [
      {
        name: 'Members',
        description:
          'The central directory for everyone in the church. Use it to register people, update branch and ministry assignment, track grouping hierarchy, and manage family links.',
      },
      {
        name: 'Visitors',
        description:
          'Use Register for first-time capture, List for all guests, Pipeline for journey stages, Follow-ups for assigned actions, Workflow for step design, and Reports for visitor analytics.',
      },
      {
        name: 'Volunteers',
        description:
          'Use Overview to check coverage, Registry to manage volunteer records, and Rosters to plan who serves where and when.',
      },
      {
        name: 'Users',
        description:
          'Use this to create worker logins, assign roles, and control what each person can see or do inside the system.',
      },
      {
        name: 'Inbox',
        description:
          'This is the internal notification center. Use it to review alerts, reminders, system notices, and communication updates.',
      },
      {
        name: 'Pastoral Care',
        description:
          'Use Overview for care status, Cases for individual care work, Appointments for meetings, Discipleship for spiritual growth tracks, and Reports for oversight and workload review.',
      },
    ],
  },
  {
    title: 'Operations',
    audience: 'Operations teams',
    items: [
      {
        name: 'Finance',
        description:
          'Overview gives the financial snapshot. Transactions records giving, Pledges tracks commitments, Expenses records spend, Budgets handles planning, Reports handles analysis, and Audit Log tracks sensitive finance activity.',
      },
      {
        name: 'Attendance',
        description:
          'Services defines service records, check-in runs live attendance, Reports shows attendance trends, and Absentees helps plan follow-up after services.',
      },
      {
        name: 'Events',
        description:
          'Use this for event setup, registrations, tickets, check-in, and attendance at special programs, conferences, camps, or church-wide gatherings.',
      },
      {
        name: 'Communication',
        description:
          'Overview shows activity, Broadcasts sends bulk communication, Templates saves reusable messages, Prayer Requests tracks prayer workflow, Polls gathers input, and Inbox captures message-related items.',
      },
      {
        name: 'Broadcasts Shortcut',
        description:
          'This is a direct menu entry into bulk communication for teams that send messages regularly and do not need to pass through the full communication dashboard first.',
      },
    ],
  },
  {
    title: 'System',
    audience: 'Admins and setup teams',
    items: [
      {
        name: 'Settings',
        description:
          'Use Branding for the tenant identity, Content for departments and grouping hierarchy, and Config for super admin platform controls.',
      },
    ],
  },
  {
    title: 'Super Admin Platform Pages',
    audience: 'Super admin only',
    items: [
      {
        name: 'Super Admin Dashboard',
        description:
          'This is the platform-wide executive view across tenants. It is not a single church dashboard.',
      },
      {
        name: 'Tenants',
        description:
          'Use this to create churches, assign features, manage platform access, and review each tenant detail page.',
      },
      {
        name: 'Platform BI And Tenant Comparison',
        description:
          'Use these pages to compare churches, spot health and growth patterns, and understand platform-wide adoption or weakness.',
      },
      {
        name: 'Super Admin Workspace Pages',
        description:
          'Members, Users, Events, Visitors, Volunteers, Communication, Attendance, Pastoral, Notifications, and Settings also exist in platform-level versions for cross-tenant oversight.',
      },
    ],
  },
];

const workflowSections = [
  {
    title: 'New Church Setup',
    steps: [
      'Super admin sets allowed countries and currency defaults in Settings > Config.',
      'Super admin creates the tenant and turns on the features the church should use.',
      'The default church admin logs in and sees every feature enabled for that tenant.',
      'Church admin opens HQ > Branches to create real branch profiles.',
      'Church admin opens Ministry and CBS Groups to create operational ministry and discipleship records.',
      'Church admin opens Settings > Content to define departments and grouping hierarchy only.',
      'Church admin creates users so workers only see the areas they are responsible for.',
    ],
  },
  {
    title: 'Visitor To Member Journey',
    steps: [
      'Use Visitors > Register at the entrance or reception desk.',
      'If the phone already exists, use return visit instead of creating a duplicate profile.',
      'Review the visitor in Visitors > List and move them through follow-up stages.',
      'Use Visitors > Follow-ups to assign calls, visits, or messages.',
      'If the person joins a Bible study, add them into CBS Groups as a prospect.',
      'When the person is fully received into church life, create or convert them into a member profile.',
    ],
  },
  {
    title: 'Volunteer Management',
    steps: [
      'Make sure the person already exists in Members.',
      'Open Volunteers > Registry or Register Volunteer and link the member profile.',
      'Assign departments, skills, and availability.',
      'Use Rosters to place people on services or task rotations.',
      'Use volunteer dashboards to spot shortages, overused workers, and no-show patterns.',
    ],
  },
  {
    title: 'Pastoral Care And Discipleship',
    steps: [
      'Open Pastoral Care > Cases when a person needs focused care, counseling, or crisis support.',
      'Add notes and interactions as ministry happens so the record stays current.',
      'Use Appointments for scheduled meetings and follow-up commitments.',
      'Use Discipleship tracks when the person is growing through a planned spiritual journey.',
      'Use Reports to review care workload, overdue cases, and outcome quality.',
    ],
  },
  {
    title: 'CBS Discipleship Flow',
    steps: [
      'Create a group in CBS Groups > Groups.',
      'Add prospects inside the group detail page or through the global prospects view.',
      'Record every session, attendees, guests, and outcomes.',
      'Move people across the pipeline from first contact to study, baptism, and member.',
      'Use CBS Reports to review conversion rate, leader performance, and stage bottlenecks.',
    ],
  },
  {
    title: 'Finance Daily Flow',
    steps: [
      'Record normal giving in Finance > Transactions.',
      'Track long-term commitments in Pledges.',
      'Enter church spending in Expenses.',
      'Use Budgets to plan expected spending and compare against actual spend.',
      'Use Reports for statements, giving trends, and executive summaries.',
      'Use Finance Audit Log when checking sensitive activity or corrections.',
    ],
  },
  {
    title: 'Attendance And Follow-Up',
    steps: [
      'Create the service before church in Attendance > Services.',
      'Run check-in during service or after service depending the church process.',
      'Review attendance patterns in Reports.',
      'Open Absentees and Pastoral Care when recurring members stop attending.',
      'HQ and Insights will later use this same attendance data for intelligence and risk signals.',
    ],
  },
  {
    title: 'How To Use Insights And AI Well',
    steps: [
      'Do not start with AI first. First make sure members, attendance, finance, visitors, volunteers, communication, ministry, CBS, and pastoral care are being used consistently.',
      'Use Insights when you want the system to highlight urgent patterns or blind spots.',
      'Use AI Assistant when you want suggestions, summaries, or leadership briefing language.',
      'Always verify AI output against the real operational pages before acting on a major recommendation.',
    ],
  },
];

export default function ManualPage() {
  const { role } = useAuth();
  const Shell = role === 'super_admin' ? SuperAdminShell : AppShell;

  return (
    <Shell>
      <div className="space-y-6">
        <Card className="space-y-4">
          <p className="text-[11px] uppercase tracking-[0.28em] text-accent/80">Manual</p>
          <h1 className="text-3xl font-semibold text-white">System Working Guide</h1>
          <p className="max-w-5xl text-sm leading-6 text-white/60">
            This handbook explains how the whole system fits together, what each menu and submenu
            is for, where each type of data should be created, and how a non-technical worker can
            use the platform step by step without getting lost.
          </p>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">How The System Works</h2>
          <div className="grid gap-4 xl:grid-cols-2">
            {operatingRules.map((section) => (
              <div key={section.title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">{section.description}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Where To Set Things Up</h2>
          <div className="grid gap-4 xl:grid-cols-2">
            {setupMap.map((section) => (
              <div key={section.title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-accent/80">
                  {section.owner}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/60">{section.description}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-5">
          {navigationGroups.map((group) => (
            <Card key={group.title} className="space-y-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-accent/80">
                  {group.audience}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{group.title}</h2>
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                {group.items.map((item) => (
                  <div key={item.name} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/60">{item.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <Card className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Step-By-Step Workflows</h2>
          <div className="grid gap-4 xl:grid-cols-2">
            {workflowSections.map((section) => (
              <div key={section.title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                <div className="mt-3 space-y-2">
                  {section.steps.map((step) => (
                    <p key={step} className="text-sm leading-6 text-white/60">
                      {step}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Shell>
  );
}
