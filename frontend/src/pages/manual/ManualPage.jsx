import AppShell from '../../components/layout/AppShell';
import SuperAdminShell from '../../components/layout/SuperAdminShell';
import Card from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';

const manualSections = [
  {
    title: 'Dashboard',
    description:
      'Shows the church summary at a glance: member count, attendance, income, expenses, and growth charts. Start here each day to know what needs attention.',
  },
  {
    title: 'Members',
    description:
      'Stores full member records. Use it to register members, update contact details, assign branches, ministries, departments, and flexible grouping levels created under settings content.',
  },
  {
    title: 'Users',
    description:
      'Creates staff and worker logins. Each user can be limited by grants so they only see the menus, submenus, and action buttons they are meant to use.',
  },
  {
    title: 'Finance',
    description:
      'Records income, pledges, expenses, budgets, reports, and audit history. Amounts use the tenant currency selected from super admin country config. Treasurers should work here daily.',
  },
  {
    title: 'Attendance',
    description:
      'Creates services, runs check-in, and produces attendance reports. Use the services page before church starts, then use reports and absentees after service for follow-up.',
  },
  {
    title: 'Communication',
    description:
      'Handles broadcasts, templates, prayer requests, polls, and inbox items. Use templates to prepare messages once, then send broadcasts quickly to the right audience.',
  },
  {
    title: 'Visitors',
    description:
      'Runs the full visitor journey: register a first-time guest, track them in the list, move them in pipeline, complete follow-ups, configure workflow, and read reports.',
  },
  {
    title: 'Pastoral Care',
    description:
      'Used by pastors and care leaders for cases, appointments, discipleship, and reports. Confidential notes stay restricted to authorized pastoral roles only.',
  },
  {
    title: 'Settings',
    description:
      'Branding changes the client app name and logo. Content defines branches, departments, ministries, and grouping hierarchy. Super admin config controls eligible countries and default currencies.',
  },
];

const workflowSections = [
  {
    title: 'Visitor Kiosk Workflow',
    steps:
      'Open Visitors > Register. Enter name, phone, branch, and interests. If a duplicate appears, use return visit instead of creating a second record. After saving, continue follow-up from Visitors > Follow-ups or Visitors > Pipeline.',
  },
  {
    title: 'Pastoral Care Workflow',
    steps:
      'Open Pastoral Care > Cases to create or review a case. Add interactions as ministry happens. Use Appointments to schedule meetings. Use Discipleship to track progress and reports to review workload and outcomes.',
  },
  {
    title: 'Finance Daily Workflow',
    steps:
      'Open Finance > Transactions during service to record giving. Use Pledges for commitments, Expenses for spending, Budgets for planning, and Reports for statements, giving trends, and exported summaries.',
  },
  {
    title: 'Church Setup Workflow',
    steps:
      'Super admin first defines eligible countries in Settings > Config. Then create a tenant and choose the country. The tenant currency follows automatically. Next set branding, content, branches, ministries, and user grants.',
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
          <p className="max-w-4xl text-sm leading-6 text-white/60">
            This manual explains what each page does so a new worker can log in and use the
            system with little or no training.
          </p>
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          {manualSections.map((section) => (
            <Card key={section.title} className="space-y-3">
              <h2 className="text-xl font-semibold text-white">{section.title}</h2>
              <p className="text-sm leading-6 text-white/60">{section.description}</p>
            </Card>
          ))}
        </div>

        <Card className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Recommended Workflows</h2>
          <div className="grid gap-4 xl:grid-cols-2">
            {workflowSections.map((section) => (
              <div key={section.title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">{section.steps}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Shell>
  );
}
