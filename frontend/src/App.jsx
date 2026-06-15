import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/layout/AppShell';
import DashboardPage from './pages/dashboard/DashboardPage';
import LoginPage from './pages/auth/LoginPage';
import AbsenteesPage from './pages/attendance/AbsenteesPage';
import AttendanceReportsPage from './pages/attendance/AttendanceReportsPage';
import CheckInConsolePage from './pages/attendance/CheckInConsolePage';
import CreateServicePage from './pages/attendance/CreateServicePage';
import ServiceDetailPage from './pages/attendance/ServiceDetailPage';
import ServicesPage from './pages/attendance/ServicesPage';
import BroadcastDetailPage from './pages/communication/BroadcastDetailPage';
import BroadcastsPage from './pages/communication/BroadcastsPage';
import CommunicationDashboard from './pages/communication/CommunicationDashboard';
import CreateBroadcastPage from './pages/communication/CreateBroadcastPage';
import CreatePollPage from './pages/communication/CreatePollPage';
import InboxPage from './pages/communication/InboxPage';
import PollsPage from './pages/communication/PollsPage';
import PrayerRequestsPage from './pages/communication/PrayerRequestsPage';
import TemplatesPage from './pages/communication/TemplatesPage';
import AIPastorAssistant from './pages/ai/AIPastorAssistant';
import CreateMemberPage from './pages/members/CreateMemberPage';
import ManualPage from './pages/manual/ManualPage';
import MemberDetailPage from './pages/members/MemberDetailPage';
import MembersListPage from './pages/members/MembersListPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import CreateEventPage from './pages/events/CreateEventPage';
import EditEventPage from './pages/events/EditEventPage';
import EventCheckInPage from './pages/events/EventCheckInPage';
import EventDetailPage from './pages/events/EventDetailPage';
import EventRegistrationsPage from './pages/events/EventRegistrationsPage';
import EventsDashboard from './pages/events/EventsDashboard';
import AppointmentsPage from './pages/pastoral/AppointmentsPage';
import CaseDetailPage from './pages/pastoral/CaseDetailPage';
import CasesPage from './pages/pastoral/CasesPage';
import CreateAppointmentPage from './pages/pastoral/CreateAppointmentPage';
import CreateCasePage from './pages/pastoral/CreateCasePage';
import CreateTrackPage from './pages/pastoral/CreateTrackPage';
import DiscipleshipPage from './pages/pastoral/DiscipleshipPage';
import EnrollmentDetailPage from './pages/pastoral/EnrollmentDetailPage';
import PastoralDashboard from './pages/pastoral/PastoralDashboard';
import PastoralReportsPage from './pages/pastoral/PastoralReportsPage';
import TracksPage from './pages/pastoral/TracksPage';
import CreateRosterPage from './pages/volunteers/CreateRosterPage';
import RosterDetailPage from './pages/volunteers/RosterDetailPage';
import RostersPage from './pages/volunteers/RostersPage';
import RegisterVolunteerPage from './pages/volunteers/RegisterVolunteerPage';
import VolunteerDetailPage from './pages/volunteers/VolunteerDetailPage';
import VolunteersDashboard from './pages/volunteers/VolunteersDashboard';
import VolunteersListPage from './pages/volunteers/VolunteersListPage';
import UsersPage from './pages/users/UsersPage';
import BranchDetailPage from './pages/hq/BranchDetailPage';
import BranchesPage from './pages/hq/BranchesPage';
import ConsolidatedReportsPage from './pages/hq/ConsolidatedReportsPage';
import CreateBranchPage from './pages/hq/CreateBranchPage';
import HQDashboard from './pages/hq/HQDashboard';
import IntelligencePage from './pages/hq/IntelligencePage';
import FamilyMinistryDashboard from './pages/hq/FamilyMinistryDashboard';
import InsightsPage from './pages/insights/InsightsPage';
import FinanceAuditLogPage from './pages/finance/AuditLogPage';
import AuditLogPage from './pages/audit/AuditLogPage';
import BudgetDetailPage from './pages/finance/BudgetDetailPage';
import BudgetsPage from './pages/finance/BudgetsPage';
import CreateBudgetPage from './pages/finance/CreateBudgetPage';
import CreatePledgePage from './pages/finance/CreatePledgePage';
import ExpenseDetailPage from './pages/finance/ExpenseDetailPage';
import ExpensesPage from './pages/finance/ExpensesPage';
import FinanceDashboard from './pages/finance/FinanceDashboard';
import MemberStatementPage from './pages/finance/MemberStatementPage';
import PledgeDetailPage from './pages/finance/PledgeDetailPage';
import PledgesPage from './pages/finance/PledgesPage';
import RecordExpensePage from './pages/finance/RecordExpensePage';
import RecordTransactionPage from './pages/finance/RecordTransactionPage';
import ReportsPage from './pages/finance/ReportsPage';
import TransactionDetailPage from './pages/finance/TransactionDetailPage';
import TransactionsPage from './pages/finance/TransactionsPage';
import SettingsPage from './pages/settings/SettingsPage';
import FollowUpsPage from './pages/visitors/FollowUpsPage';
import PipelinePage from './pages/visitors/PipelinePage';
import RegisterVisitorPage from './pages/visitors/RegisterVisitorPage';
import VisitorDetailPage from './pages/visitors/VisitorDetailPage';
import VisitorReportsPage from './pages/visitors/VisitorReportsPage';
import VisitorsListPage from './pages/visitors/VisitorsListPage';
import WorkflowBuilderPage from './pages/visitors/WorkflowBuilderPage';
import SuperAdminCommunicationPage from './pages/superadmin/SuperAdminCommunicationPage';
import SuperAdminAttendancePage from './pages/superadmin/SuperAdminAttendancePage';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import SuperAdminNotificationsPage from './pages/superadmin/SuperAdminNotificationsPage';
import SuperAdminEventsPage from './pages/superadmin/SuperAdminEventsPage';
import SuperAdminPastoralPage from './pages/superadmin/SuperAdminPastoralPage';
import SuperAdminVolunteersPage from './pages/superadmin/SuperAdminVolunteersPage';
import SuperAdminVisitorsPage from './pages/superadmin/SuperAdminVisitorsPage';
import PlatformBIPage from './pages/superadmin/PlatformBIPage';
import TenantDetailPage from './pages/superadmin/TenantDetailPage';
import TenantComparisonPage from './pages/superadmin/TenantComparisonPage';
import TenantsListPage from './pages/superadmin/TenantsListPage';
import SuperAdminUsersPage from './pages/superadmin/SuperAdminUsersPage';
import {
  CreateMeetingPage,
  CreateMinistryPage,
  MinistriesListPage,
  MinistryDashboard,
  MinistryDetailPage,
} from './pages/ministry/Phase11MinistryPages';
import {
  AllProspectsPage,
  CBSDashboard,
  CBSGroupDetailPage,
  CBSGroupsPage,
  CBSPipelinePage,
  CBSReportsPage,
  CreateCBSGroupPage,
  ProspectDetailPage,
} from './pages/cbs/Phase11CbsPages';
import {
  CreateProfilePage,
  LeadershipDashboard,
  LeadershipProfilesPage,
  LeadershipReportsPage,
  ProfileDetailPage,
  SuccessionPlanningPage,
} from './pages/leadership/Phase11LeadershipPages';
import StrategicDashboard from './pages/strategic/StrategicDashboard';
import StrategicPlanPage from './pages/strategic/StrategicPlanPage';
import KPIsPage from './pages/strategic/KPIsPage';
import CreateKPIPage from './pages/strategic/CreateKPIPage';
import BalancedScorecardPage from './pages/strategic/BalancedScorecardPage';
import StrategicReportsPage from './pages/strategic/StrategicReportsPage';
import { useAuthStore } from './stores/authStore';

function HomeRedirect() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.role);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={role === 'super_admin' ? '/superadmin/dashboard' : '/dashboard'} replace />;
}

function PublicRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.role);

  if (isAuthenticated) {
    return <Navigate to={role === 'super_admin' ? '/superadmin/dashboard' : '/dashboard'} replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppShell>
              <DashboardPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hq"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'head_pastor']}>
            <HQDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hq/branches"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'head_pastor', 'branch_pastor', 'associate_pastor']}>
            <BranchesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hq/branches/new"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'head_pastor']}>
            <CreateBranchPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hq/branches/:branchId"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'head_pastor', 'branch_pastor', 'associate_pastor']}>
            <BranchDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hq/intelligence"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'head_pastor']}>
            <IntelligencePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hq/reports"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'head_pastor']}>
            <ConsolidatedReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'head_pastor', 'associate_pastor']}>
            <AIPastorAssistant />
          </ProtectedRoute>
        }
      />
      <Route
        path="/insights"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'head_pastor']}>
            <InsightsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manual"
        element={
          <ProtectedRoute>
            <ManualPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/members"
        element={
          <ProtectedRoute>
            <MembersListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/members/new"
        element={
          <ProtectedRoute>
            <CreateMemberPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/members/:memberId"
        element={
          <ProtectedRoute>
            <MemberDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance"
        element={
          <ProtectedRoute>
            <Navigate to="/attendance/services" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance/services"
        element={
          <ProtectedRoute>
            <ServicesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance/services/new"
        element={
          <ProtectedRoute>
            <CreateServicePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance/services/:serviceId"
        element={
          <ProtectedRoute>
            <ServiceDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance/check-in/:serviceId"
        element={
          <ProtectedRoute>
            <CheckInConsolePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance/reports"
        element={
          <ProtectedRoute>
            <AttendanceReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance/absentees"
        element={
          <ProtectedRoute>
            <AbsenteesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/visitors"
        element={
          <ProtectedRoute>
            <VisitorsListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/visitors/register"
        element={
          <ProtectedRoute>
            <RegisterVisitorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/visitors/pipeline"
        element={
          <ProtectedRoute>
            <PipelinePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/visitors/follow-ups"
        element={
          <ProtectedRoute>
            <FollowUpsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/visitors/workflow"
        element={
          <ProtectedRoute>
            <WorkflowBuilderPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/visitors/reports"
        element={
          <ProtectedRoute>
            <VisitorReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/visitors/:visitorId"
        element={
          <ProtectedRoute>
            <VisitorDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/communication"
        element={
          <ProtectedRoute>
            <CommunicationDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/communication/broadcasts"
        element={
          <ProtectedRoute>
            <BroadcastsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/communication/broadcasts/new"
        element={
          <ProtectedRoute>
            <CreateBroadcastPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/communication/broadcasts/:broadcastId"
        element={
          <ProtectedRoute>
            <BroadcastDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/communication/templates"
        element={
          <ProtectedRoute>
            <TemplatesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/communication/prayer-requests"
        element={
          <ProtectedRoute>
            <PrayerRequestsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/communication/polls"
        element={
          <ProtectedRoute>
            <PollsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/communication/polls/new"
        element={
          <ProtectedRoute>
            <CreatePollPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/communication/inbox"
        element={
          <ProtectedRoute>
            <InboxPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/volunteers"
        element={
          <ProtectedRoute>
            <VolunteersDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/volunteers/list"
        element={
          <ProtectedRoute>
            <VolunteersListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/volunteers/new"
        element={
          <ProtectedRoute>
            <RegisterVolunteerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/volunteers/rosters"
        element={
          <ProtectedRoute>
            <RostersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/volunteers/rosters/new"
        element={
          <ProtectedRoute>
            <CreateRosterPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/volunteers/rosters/:rosterId"
        element={
          <ProtectedRoute>
            <RosterDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/volunteers/:volunteerId"
        element={
          <ProtectedRoute>
            <VolunteerDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events"
        element={
          <ProtectedRoute>
            <EventsDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/new"
        element={
          <ProtectedRoute>
            <CreateEventPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/:eventId/edit"
        element={
          <ProtectedRoute>
            <EditEventPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/:eventId/registrations"
        element={
          <ProtectedRoute>
            <EventRegistrationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/:eventId/checkin"
        element={
          <ProtectedRoute>
            <EventCheckInPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/:eventId"
        element={
          <ProtectedRoute>
            <EventDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ministry"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'head_pastor', 'associate_pastor', 'volunteer_leader']}>
            <MinistryDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ministry/list"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'head_pastor', 'associate_pastor', 'volunteer_leader']}>
            <MinistriesListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ministry/new"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'head_pastor', 'associate_pastor', 'volunteer_leader']}>
            <CreateMinistryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ministry/:ministryId"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'head_pastor', 'associate_pastor', 'volunteer_leader']}>
            <MinistryDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ministry/:ministryId/meetings/new"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'head_pastor', 'associate_pastor', 'volunteer_leader']}>
            <CreateMeetingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cbs"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'head_pastor', 'associate_pastor', 'care_leader', 'cbs_leader']}>
            <CBSDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cbs/groups"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'head_pastor', 'associate_pastor', 'care_leader', 'cbs_leader']}>
            <CBSGroupsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cbs/groups/new"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'head_pastor', 'associate_pastor', 'care_leader', 'cbs_leader']}>
            <CreateCBSGroupPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cbs/groups/:groupId"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'head_pastor', 'associate_pastor', 'care_leader', 'cbs_leader']}>
            <CBSGroupDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cbs/prospects"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'head_pastor', 'associate_pastor', 'care_leader', 'cbs_leader']}>
            <AllProspectsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cbs/prospects/pipeline"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'head_pastor', 'associate_pastor', 'care_leader', 'cbs_leader']}>
            <CBSPipelinePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cbs/prospects/:prospectId"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'head_pastor', 'associate_pastor', 'care_leader', 'cbs_leader']}>
            <ProspectDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cbs/reports"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'head_pastor', 'associate_pastor', 'care_leader', 'cbs_leader']}>
            <CBSReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leadership"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'head_pastor']}>
            <LeadershipDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leadership/profiles"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'head_pastor']}>
            <LeadershipProfilesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leadership/profiles/new"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'head_pastor']}>
            <CreateProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leadership/profiles/:profileId"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'head_pastor']}>
            <ProfileDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leadership/succession"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'head_pastor']}>
            <SuccessionPlanningPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leadership/reports"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'head_pastor']}>
            <LeadershipReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/strategic"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'head_pastor']}>
            <StrategicDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/strategic/plan"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'head_pastor']}>
            <StrategicPlanPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/strategic/kpis"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'head_pastor']}>
            <KPIsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/strategic/kpis/new"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'head_pastor']}>
            <CreateKPIPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/strategic/scorecard"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'head_pastor']}>
            <BalancedScorecardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/strategic/reports"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'head_pastor']}>
            <StrategicReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'head_pastor']}>
            <AuditLogPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hq/family-ministry"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'head_pastor', 'associate_pastor', 'care_leader']}>
            <FamilyMinistryDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <UsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pastoral"
        element={
          <ProtectedRoute>
            <PastoralDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pastoral/cases"
        element={
          <ProtectedRoute>
            <CasesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pastoral/cases/new"
        element={
          <ProtectedRoute>
            <CreateCasePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pastoral/cases/:caseId"
        element={
          <ProtectedRoute>
            <CaseDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pastoral/appointments"
        element={
          <ProtectedRoute>
            <AppointmentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pastoral/appointments/new"
        element={
          <ProtectedRoute>
            <CreateAppointmentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pastoral/discipleship"
        element={
          <ProtectedRoute>
            <DiscipleshipPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pastoral/discipleship/tracks"
        element={
          <ProtectedRoute>
            <TracksPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pastoral/discipleship/tracks/new"
        element={
          <ProtectedRoute>
            <CreateTrackPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pastoral/discipleship/:enrollmentId"
        element={
          <ProtectedRoute>
            <EnrollmentDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pastoral/reports"
        element={
          <ProtectedRoute>
            <PastoralReportsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/finance" element={<ProtectedRoute><FinanceDashboard /></ProtectedRoute>} />
      <Route path="/finance/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
      <Route path="/finance/transactions/new" element={<ProtectedRoute><RecordTransactionPage /></ProtectedRoute>} />
      <Route path="/finance/transactions/:id" element={<ProtectedRoute><TransactionDetailPage /></ProtectedRoute>} />
      <Route path="/finance/pledges" element={<ProtectedRoute><PledgesPage /></ProtectedRoute>} />
      <Route path="/finance/pledges/new" element={<ProtectedRoute><CreatePledgePage /></ProtectedRoute>} />
      <Route path="/finance/pledges/:pledgeId" element={<ProtectedRoute><PledgeDetailPage /></ProtectedRoute>} />
      <Route path="/finance/expenses" element={<ProtectedRoute><ExpensesPage /></ProtectedRoute>} />
      <Route path="/finance/expenses/new" element={<ProtectedRoute><RecordExpensePage /></ProtectedRoute>} />
      <Route path="/finance/expenses/:expenseId" element={<ProtectedRoute><ExpenseDetailPage /></ProtectedRoute>} />
      <Route path="/finance/budgets" element={<ProtectedRoute><BudgetsPage /></ProtectedRoute>} />
      <Route path="/finance/budgets/new" element={<ProtectedRoute><CreateBudgetPage /></ProtectedRoute>} />
      <Route path="/finance/budgets/:budgetId" element={<ProtectedRoute><BudgetDetailPage /></ProtectedRoute>} />
      <Route path="/finance/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
      <Route path="/finance/reports/statement/:memberId" element={<ProtectedRoute><MemberStatementPage /></ProtectedRoute>} />
      <Route path="/finance/audit" element={<ProtectedRoute><FinanceAuditLogPage /></ProtectedRoute>} />
      <Route
        path="/superadmin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/manual"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <ManualPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/members"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <MembersListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/members/new"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <CreateMemberPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/members/:memberId"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <MemberDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/settings"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/users"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminUsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/visitors"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminVisitorsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/communication"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminCommunicationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/attendance"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminAttendancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/pastoral"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminPastoralPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/events"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminEventsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/volunteers"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminVolunteersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/notifications"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminNotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/tenants"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <TenantsListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/platform"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <PlatformBIPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/platform/tenants"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <TenantComparisonPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/tenants/new"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <Navigate to="/superadmin/tenants?create=tenant" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/tenants/:tenantId"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <TenantDetailPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
