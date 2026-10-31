import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Layouts & Pages
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage, LoginPage, RegisterPage } from './pages/public/PublicPages';
import {
  VerifyEmailPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  AcceptInvitePage,
} from './pages/public/AuthFlowPages';
import { OnboardingPage } from './pages/onboarding/OnboardingPage';
import {
  DashboardPage,
  KanbanPage,
  AllTicketsPage,
  MyTicketsPage,
} from './pages/workspace/WorkspacePages';
import { TicketDetailsPage } from './pages/workspace/TicketDetailsPage';
import { ProjectDetailsPage } from './pages/workspace/ProjectDetailsPage';
import { UserProfilePage } from './pages/workspace/UserProfilePage';
import { ProjectsView } from './pages/workspace/ProjectsView';
import { TeamsView } from './pages/workspace/TeamsView';
import { ReportsView } from './pages/workspace/ReportsView';
import { WorkflowsView } from './pages/workspace/WorkflowsView';
import { BillingView } from './pages/workspace/BillingView';
import { SettingsView } from './pages/workspace/SettingsView';
import { SuperAdminView } from './pages/admin/SuperAdminView';
import { SuperAdminLoginPage } from './pages/admin/SuperAdminLoginPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
});

const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user || !user.isSuperAdmin) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <Routes>
              {/* Public SaaS Pages */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/admin/login" element={<SuperAdminLoginPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/accept-invite" element={<AcceptInvitePage />} />
              <Route path="/invite" element={<AcceptInvitePage />} />

              {/* Onboarding Wizard */}
              <Route path="/onboarding" element={<OnboardingPage />} />

              {/* Workspace Protected Routes */}
              <Route path="/workspace" element={<AppLayout />}>
                <Route index element={<Navigate to="/workspace/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="kanban" element={<KanbanPage />} />
                <Route path="tickets" element={<AllTicketsPage />} />
                <Route path="tickets/:ticketId" element={<TicketDetailsPage />} />
                <Route path="ticket/:ticketId" element={<TicketDetailsPage />} />
                <Route path="my-tickets" element={<MyTicketsPage />} />
                <Route path="projects" element={<ProjectsView />} />
                <Route path="projects/:projectId" element={<ProjectDetailsPage />} />
                <Route path="teams" element={<TeamsView />} />
                <Route path="reports" element={<ReportsView />} />
                <Route path="workflows" element={<WorkflowsView />} />
                <Route path="billing" element={<BillingView />} />
                <Route path="settings" element={<SettingsView />} />
                <Route path="profile" element={<UserProfilePage />} />
              </Route>

              {/* Platform Super Admin Console */}
              <Route
                path="/admin"
                element={
                  <SuperAdminRoute>
                    <SuperAdminView />
                  </SuperAdminRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

