import React, { useState } from 'react';
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import { CreateTicketModal } from '../ticket/CreateTicketModal';
import { Ticket } from '../../types';

export const AppLayout: React.FC = () => {
  const { user, organization, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
            Loading QubixDesk Workspace...
          </p>
        </div>
      </div>
    );
  }

  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user has no active organization, redirect to onboarding wizard
  if (!organization && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC]">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <TopHeader
          onOpenCreateTicket={() => setIsCreateModalOpen(true)}
          onSearchChange={setSearchFilter}
        />

        <main className="flex-1 flex overflow-hidden">
          <Outlet
            context={{
              onSelectTicket: (id: string) => navigate(`/workspace/tickets/${id}`),
              onOpenCreateTicket: () => setIsCreateModalOpen(true),
              searchFilter,
            }}
          />
        </main>
      </div>

      {/* New Ticket Modal */}
      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};

