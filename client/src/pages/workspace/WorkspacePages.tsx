import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { DashboardView } from './DashboardView';
import { KanbanView } from './KanbanView';
import { TicketListView } from './TicketListView';

interface WorkspaceContextType {
  onSelectTicket: (ticketId: string) => void;
  onOpenCreateTicket: () => void;
  searchFilter: string;
}

export const DashboardPage: React.FC = () => {
  const context = useOutletContext<WorkspaceContextType>();
  return (
    <DashboardView
      onSelectTicket={context.onSelectTicket}
      onOpenCreateTicket={context.onOpenCreateTicket}
    />
  );
};

export const KanbanPage: React.FC = () => {
  const context = useOutletContext<WorkspaceContextType>();
  return (
    <KanbanView
      onSelectTicket={context.onSelectTicket}
      onOpenCreateTicket={context.onOpenCreateTicket}
      searchFilter={context.searchFilter}
    />
  );
};

export const AllTicketsPage: React.FC = () => {
  const context = useOutletContext<WorkspaceContextType>();
  return (
    <TicketListView
      onSelectTicket={context.onSelectTicket}
      onOpenCreateTicket={context.onOpenCreateTicket}
      myTicketsOnly={false}
    />
  );
};

export const MyTicketsPage: React.FC = () => {
  const context = useOutletContext<WorkspaceContextType>();
  return (
    <TicketListView
      onSelectTicket={context.onSelectTicket}
      onOpenCreateTicket={context.onOpenCreateTicket}
      myTicketsOnly={true}
    />
  );
};

