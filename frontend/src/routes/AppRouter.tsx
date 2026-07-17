import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuthStore } from '@/store/authStore';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const RoleSelectPage = lazy(() => import('@/pages/auth/RoleSelectPage').then((m) => ({ default: m.RoleSelectPage })));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const ChangePasswordPage = lazy(() => import('@/pages/auth/ChangePasswordPage').then((m) => ({ default: m.ChangePasswordPage })));
const RegisterPanelPage = lazy(() => import('@/pages/auth/RegisterPanelPage').then((m) => ({ default: m.RegisterPanelPage })));

const AdminOverviewPage = lazy(() => import('@/pages/admin/AdminOverviewPage').then((m) => ({ default: m.AdminOverviewPage })));
const GlobalManagementPage = lazy(() => import('@/pages/admin/GlobalManagementPage').then((m) => ({ default: m.GlobalManagementPage })));
const ProgramDashboardPage = lazy(() => import('@/pages/admin/ProgramDashboardPage').then((m) => ({ default: m.ProgramDashboardPage })));
const AdminFacultyPage = lazy(() => import('@/pages/admin/AdminFacultyPage').then((m) => ({ default: m.AdminFacultyPage })));
const AdminStudentsPage = lazy(() => import('@/pages/admin/AdminStudentsPage').then((m) => ({ default: m.AdminStudentsPage })));
const AdminAllocationsPage = lazy(() => import('@/pages/admin/AdminAllocationsPage').then((m) => ({ default: m.AdminAllocationsPage })));
const AdminConfigPage = lazy(() => import('@/pages/admin/AdminConfigPage').then((m) => ({ default: m.AdminConfigPage })));
const AdminDocumentsPage = lazy(() => import('@/pages/admin/AdminDocumentsPage').then((m) => ({ default: m.AdminDocumentsPage })));

const CoordinatorOverviewPage = lazy(() =>
  import('@/pages/coordinator/CoordinatorOverviewPage').then((m) => ({ default: m.CoordinatorOverviewPage }))
);
const CoordinatorReviewsPage = lazy(() =>
  import('@/pages/coordinator/CoordinatorReviewsPage').then((m) => ({ default: m.CoordinatorReviewsPage }))
);
const CoordinatorAttendancePage = lazy(() =>
  import('@/pages/coordinator/CoordinatorAttendancePage').then((m) => ({ default: m.CoordinatorAttendancePage }))
);
const CoordinatorVivaPage = lazy(() => import('@/pages/coordinator/CoordinatorVivaPage').then((m) => ({ default: m.CoordinatorVivaPage })));
const CoordinatorSchedulingPage = lazy(() =>
  import('@/pages/coordinator/CoordinatorSchedulingPage').then((m) => ({ default: m.CoordinatorSchedulingPage }))
);
const CoordinatorLetterEditorPage = lazy(() =>
  import('@/pages/coordinator/CoordinatorLetterEditorPage').then((m) => ({ default: m.CoordinatorLetterEditorPage }))
);

const GuideOverviewPage = lazy(() => import('@/pages/guide/GuideOverviewPage').then((m) => ({ default: m.GuideOverviewPage })));
const GuideRequestsPage = lazy(() => import('@/pages/guide/GuideRequestsPage').then((m) => ({ default: m.GuideRequestsPage })));
const GuideAvailabilityPage = lazy(() => import('@/pages/guide/GuideAvailabilityPage').then((m) => ({ default: m.GuideAvailabilityPage })));
const GuideReportsPage = lazy(() => import('@/pages/guide/GuideReportsPage').then((m) => ({ default: m.GuideReportsPage })));

const PanelOverviewPage = lazy(() => import('@/pages/panel/PanelOverviewPage').then((m) => ({ default: m.PanelOverviewPage })));
const PanelAvailabilityPage = lazy(() => import('@/pages/panel/PanelAvailabilityPage').then((m) => ({ default: m.PanelAvailabilityPage })));

const AssistantFacultyPage = lazy(() =>
  import('@/pages/assistant/AssistantFacultyPage').then((m) => ({ default: m.AssistantFacultyPage }))
);
const AssistantExportsPage = lazy(() =>
  import('@/pages/assistant/AssistantExportsPage').then((m) => ({ default: m.AssistantExportsPage }))
);

const StudentTeamPage = lazy(() => import('@/pages/student/StudentTeamPage').then((m) => ({ default: m.StudentTeamPage })));
const StudentGuidesPage = lazy(() => import('@/pages/student/StudentGuidesPage').then((m) => ({ default: m.StudentGuidesPage })));
const StudentReviewsPage = lazy(() => import('@/pages/student/StudentReviewsPage').then((m) => ({ default: m.StudentReviewsPage })));
const StudentNotificationsPage = lazy(() =>
  import('@/pages/student/StudentNotificationsPage').then((m) => ({ default: m.StudentNotificationsPage }))
);
const StudentReportPage = lazy(() => import('@/pages/student/StudentReportPage').then((m) => ({ default: m.StudentReportPage })));
const StudentMyPanelPage = lazy(() => import('@/pages/student/StudentMyPanelPage').then((m) => ({ default: m.StudentMyPanelPage })));

const MarksEntryPage = lazy(() => import('@/pages/shared/MarksEntryPage').then((m) => ({ default: m.MarksEntryPage })));
const AttendanceViewerPage = lazy(() =>
  import('@/pages/shared/AttendanceViewerPage').then((m) => ({ default: m.AttendanceViewerPage }))
);
const MarksViewerPage = lazy(() => import('@/pages/shared/MarksViewerPage').then((m) => ({ default: m.MarksViewerPage })));
const CreditsPage = lazy(() => import('@/pages/shared/CreditsPage').then((m) => ({ default: m.CreditsPage })));

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-paper)]">
      <div className="h-8 w-8 rounded-full border-2 border-[var(--color-ink)]/15 border-t-[var(--color-seal)] animate-spin" />
    </div>
  );
}

function DefaultRedirect() {
  const profile = useAuthStore((s) => s.profile);
  if (!profile) return <Navigate to="/login" replace />;
  const map: Record<string, string> = {
    admin: '/admin',
    coordinator: '/coordinator',
    guide: '/guide',
    panel: '/panel',
    assistant: '/assistant/faculty',
    student: '/student',
  };
  return <Navigate to={map[profile.role] ?? '/login'} replace />;
}

export function AppRouter() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Public auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/select-role" element={<RoleSelectPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/register-panel" element={<RegisterPanelPage />} />
        <Route path="/credits" element={<CreditsPage />} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute allow={['admin']}><AdminOverviewPage /></ProtectedRoute>} />
        <Route path="/admin/global-management" element={<ProtectedRoute allow={['admin']}><GlobalManagementPage /></ProtectedRoute>} />
        <Route path="/admin-dashboard/programme/:programId" element={<ProtectedRoute allow={['admin']}><ProgramDashboardPage /></ProtectedRoute>} />
        <Route path="/admin/faculty" element={<ProtectedRoute allow={['admin']}><AdminFacultyPage /></ProtectedRoute>} />
        <Route path="/admin/students" element={<ProtectedRoute allow={['admin']}><AdminStudentsPage /></ProtectedRoute>} />
        <Route path="/admin/allocations" element={<ProtectedRoute allow={['admin']}><AdminAllocationsPage /></ProtectedRoute>} />
        <Route path="/admin/config" element={<ProtectedRoute allow={['admin']}><AdminConfigPage /></ProtectedRoute>} />
        <Route path="/admin/documents" element={<ProtectedRoute allow={['admin']}><AdminDocumentsPage /></ProtectedRoute>} />
        <Route
          path="/admin/attendance"
          element={<ProtectedRoute allow={['admin']}><AttendanceViewerPage title="Attendance" /></ProtectedRoute>}
        />
        <Route path="/admin/marks" element={<ProtectedRoute allow={['admin']}><MarksViewerPage title="Marks" /></ProtectedRoute>} />

        {/* Coordinator */}
        <Route path="/coordinator" element={<ProtectedRoute allow={['coordinator']}><CoordinatorOverviewPage /></ProtectedRoute>} />
        <Route
          path="/coordinator/reviews"
          element={<ProtectedRoute allow={['coordinator']}><CoordinatorReviewsPage /></ProtectedRoute>}
        />
        <Route
          path="/coordinator/attendance"
          element={<ProtectedRoute allow={['coordinator']}><CoordinatorAttendancePage /></ProtectedRoute>}
        />
        <Route path="/coordinator/viva" element={<ProtectedRoute allow={['coordinator']}><CoordinatorVivaPage /></ProtectedRoute>} />
        <Route
          path="/coordinator/marks"
          element={<ProtectedRoute allow={['coordinator']}><MarksViewerPage title="Marks" /></ProtectedRoute>}
        />
        <Route
          path="/coordinator/scheduling"
          element={<ProtectedRoute allow={['coordinator']}><CoordinatorSchedulingPage /></ProtectedRoute>}
        />
        <Route
          path="/coordinator/letters"
          element={<ProtectedRoute allow={['coordinator']}><CoordinatorLetterEditorPage /></ProtectedRoute>}
        />

        {/* Guide */}
        <Route path="/guide" element={<ProtectedRoute allow={['guide']}><GuideOverviewPage /></ProtectedRoute>} />
        <Route path="/guide/requests" element={<ProtectedRoute allow={['guide']}><GuideRequestsPage /></ProtectedRoute>} />
        <Route
          path="/guide/marks"
          element={<ProtectedRoute allow={['guide']}><MarksEntryPage title="Marks Entry" /></ProtectedRoute>}
        />
        <Route path="/guide/availability" element={<ProtectedRoute allow={['guide']}><GuideAvailabilityPage /></ProtectedRoute>} />
        <Route path="/guide/reports" element={<ProtectedRoute allow={['guide']}><GuideReportsPage /></ProtectedRoute>} />

        {/* Panel */}
        <Route path="/panel" element={<ProtectedRoute allow={['panel']}><PanelOverviewPage /></ProtectedRoute>} />
        <Route
          path="/panel/marks"
          element={<ProtectedRoute allow={['panel']}><MarksEntryPage title="Marks Entry" /></ProtectedRoute>}
        />
        <Route path="/panel/availability" element={<ProtectedRoute allow={['panel']}><PanelAvailabilityPage /></ProtectedRoute>} />

        {/* Assistant */}
        <Route
          path="/assistant/faculty"
          element={<ProtectedRoute allow={['assistant']}><AssistantFacultyPage /></ProtectedRoute>}
        />
        <Route
          path="/assistant/attendance"
          element={<ProtectedRoute allow={['assistant']}><AttendanceViewerPage title="Attendance" /></ProtectedRoute>}
        />
        <Route
          path="/assistant/marks"
          element={<ProtectedRoute allow={['assistant']}><MarksViewerPage title="Marks" /></ProtectedRoute>}
        />
        <Route
          path="/assistant/exports"
          element={<ProtectedRoute allow={['assistant']}><AssistantExportsPage /></ProtectedRoute>}
        />

        {/* Student */}
        <Route path="/student" element={<ProtectedRoute allow={['student']}><StudentTeamPage /></ProtectedRoute>} />
        <Route path="/student/guides" element={<ProtectedRoute allow={['student']}><StudentGuidesPage /></ProtectedRoute>} />
        <Route path="/student/reviews" element={<ProtectedRoute allow={['student']}><StudentReviewsPage /></ProtectedRoute>} />
        <Route
          path="/student/notifications"
          element={<ProtectedRoute allow={['student']}><StudentNotificationsPage /></ProtectedRoute>}
        />
        <Route path="/student/report" element={<ProtectedRoute allow={['student']}><StudentReportPage /></ProtectedRoute>} />
        <Route path="/student/my-panel" element={<ProtectedRoute allow={['student']}><StudentMyPanelPage /></ProtectedRoute>} />

        <Route path="/" element={<DefaultRedirect />} />
        <Route path="*" element={<DefaultRedirect />} />
      </Routes>
    </Suspense>
  );
}
