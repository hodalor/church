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
import CreateMemberPage from './pages/members/CreateMemberPage';
import ManualPage from './pages/manual/ManualPage';
import MemberDetailPage from './pages/members/MemberDetailPage';
import MembersListPage from './pages/members/MembersListPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
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
import UsersPage from './pages/users/UsersPage';
import AuditLogPage from './pages/finance/AuditLogPage';
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
import SuperAdminPastoralPage from './pages/superadmin/SuperAdminPastoralPage';
import SuperAdminVisitorsPage from './pages/superadmin/SuperAdminVisitorsPage';
import TenantDetailPage from './pages/superadmin/TenantDetailPage';
import TenantsListPage from './pages/superadmin/TenantsListPage';
import SuperAdminUsersPage from './pages/superadmin/SuperAdminUsersPage';
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
      <Route path="/finance/audit" element={<ProtectedRoute><AuditLogPage /></ProtectedRoute>} />
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
