import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';

// Layouts & Pages
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/public/PublicPages';
import {
  VerifyEmailPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  AcceptInvitePage,
} from './pages/public/AuthFlowPages';
import {
  DashboardPage,
  KanbanPage,
  AllTicketsPage,
  MyTicketsPage,
} from './pages/workspace/WorkspacePages';
import { TicketDetailsPage } from './pages/workspace/TicketDetailsPage';
import { ProjectDetailsPage } from './pages/workspace/ProjectDetailsPage';
import { UserProfilePage } from './pages/workspace/UserProfilePage';
import { GanttTimelineView } from './pages/workspace/GanttTimelineView';
import { ProjectsView } from './pages/workspace/ProjectsView';
import { TeamsView } from './pages/workspace/TeamsView';
import { ReportsView } from './pages/workspace/ReportsView';
import { WorkflowsView } from './pages/workspace/WorkflowsView';
import { SettingsView } from './pages/workspace/SettingsView';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Auth Routes */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<Navigate to="/login" replace />} />
                <Route path="/onboarding" element={<Navigate to="/workspace/dashboard" replace />} />
                <Route path="/admin/login" element={<Navigate to="/login" replace />} />
                <Route path="/admin" element={<Navigate to="/login" replace />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/accept-invite" element={<AcceptInvitePage />} />
                <Route path="/invite" element={<AcceptInvitePage />} />

                {/* Workspace Protected Routes */}
                <Route path="/workspace" element={<AppLayout />}>
                  <Route index element={<Navigate to="/workspace/dashboard" replace />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="kanban" element={<KanbanPage />} />
                  <Route path="timeline" element={<GanttTimelineView />} />
                  <Route path="gantt" element={<GanttTimelineView />} />
                  <Route path="tickets" element={<AllTicketsPage />} />
                  <Route path="tickets/:ticketId" element={<TicketDetailsPage />} />
                  <Route path="ticket/:ticketId" element={<TicketDetailsPage />} />
                  <Route path="my-tickets" element={<MyTicketsPage />} />
                  <Route path="projects" element={<ProjectsView />} />
                  <Route path="projects/:projectId" element={<ProjectDetailsPage />} />
                  <Route path="teams" element={<TeamsView />} />
                  <Route path="analytics" element={<ReportsView />} />
                  <Route path="reports" element={<ReportsView />} />
                  <Route path="workflows" element={<WorkflowsView />} />
                  <Route path="settings" element={<SettingsView />} />
                  <Route path="profile" element={<UserProfilePage />} />
                  <Route path="*" element={<Navigate to="/workspace/dashboard" replace />} />
                </Route>

                {/* Fallback */}
                <Route
                  path="*"
                  element={
                    localStorage.getItem('godspeed_access_token') ? (
                      <Navigate to="/workspace/dashboard" replace />
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  }
                />
              </Routes>
            </BrowserRouter>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;

