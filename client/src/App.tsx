import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Layouts & Pages
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage, LoginPage, RegisterPage } from './pages/public/PublicPages';
import { OnboardingPage } from './pages/onboarding/OnboardingPage';
import {
  DashboardPage,
  KanbanPage,
  AllTicketsPage,
  MyTicketsPage,
} from './pages/workspace/WorkspacePages';
import { ProjectsView } from './pages/workspace/ProjectsView';
import { TeamsView } from './pages/workspace/TeamsView';
import { ReportsView } from './pages/workspace/ReportsView';
import { WorkflowsView } from './pages/workspace/WorkflowsView';
import { BillingView } from './pages/workspace/BillingView';
import { SettingsView } from './pages/workspace/SettingsView';
import { SuperAdminView } from './pages/admin/SuperAdminView';

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
    return <Navigate to="/workspace/dashboard" replace />;
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

              {/* Onboarding Wizard */}
              <Route path="/onboarding" element={<OnboardingPage />} />

              {/* Workspace Protected Routes */}
              <Route path="/workspace" element={<AppLayout />}>
                <Route index element={<Navigate to="/workspace/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="kanban" element={<KanbanPage />} />
                <Route path="tickets" element={<AllTicketsPage />} />
                <Route path="my-tickets" element={<MyTicketsPage />} />
                <Route path="projects" element={<ProjectsView />} />
                <Route path="teams" element={<TeamsView />} />
                <Route path="reports" element={<ReportsView />} />
                <Route path="workflows" element={<WorkflowsView />} />
                <Route path="billing" element={<BillingView />} />
                <Route path="settings" element={<SettingsView />} />
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

