import React, { useState, useEffect } from 'react';
import { Ticket, TicketStatus } from '../../types';
import { apiClient } from '../../api/client';
import { useSocket } from '../../context/SocketContext';
import { PriorityBadge, StatusBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import {
  MessageSquare,
  Paperclip,
  Calendar,
  Filter,
  Search,
  Plus,
  ArrowUpDown,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';

interface KanbanViewProps {
  onSelectTicket: (ticketId: string) => void;
  onOpenCreateTicket: () => void;
  searchFilter?: string;
}

const COLUMNS: { id: TicketStatus; label: string; dotColor: string }[] = [
  { id: 'To Do', label: 'To Do', dotColor: 'bg-slate-400' },
  { id: 'In Progress', label: 'In Progress', dotColor: 'bg-blue-600' },
  { id: 'Resolved', label: 'Resolved', dotColor: 'bg-emerald-600' },
];

export const KanbanView: React.FC<KanbanViewProps> = ({
  onSelectTicket,
  onOpenCreateTicket,
  searchFilter = '',
}) => {
  const { socket } = useSocket();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);

  const fetchTickets = async () => {
    try {
      const res = await apiClient.get('/tickets?limit=100');
      if (res.data.success) {
        setTickets(res.data.data);
      }
    } catch (err) {
      console.error('Fetch tickets error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Real-time socket sync
  useEffect(() => {
    if (!socket) return;

    const handleCreated = (newTicket: Ticket) => {
      setTickets((prev) => [newTicket, ...prev]);
    };

    const handleUpdated = (updatedTicket: Ticket) => {
      setTickets((prev) =>
        prev.map((t) => (t._id === updatedTicket._id ? updatedTicket : t))
      );
    };

    const handleDeleted = (data: { ticketId: string }) => {
      setTickets((prev) => prev.filter((t) => t._id !== data.ticketId));
    };

    socket.on('ticket:created', handleCreated);
    socket.on('ticket:updated', handleUpdated);
    socket.on('ticket:status_changed', handleUpdated);
    socket.on('ticket:deleted', handleDeleted);

    return () => {
      socket.off('ticket:created', handleCreated);
      socket.off('ticket:updated', handleUpdated);
      socket.off('ticket:status_changed', handleUpdated);
      socket.off('ticket:deleted', handleDeleted);
    };
  }, [socket]);

  // Drag and drop handlers
  const handleDragStart = (ticketId: string) => {
    setDraggedTicketId(ticketId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetColumn: TicketStatus) => {
    if (!draggedTicketId) return;

    const previousTickets = [...tickets];
    const ticketToMove = tickets.find((t) => t._id === draggedTicketId);
    if (!ticketToMove || ticketToMove.status === targetColumn) {
      setDraggedTicketId(null);
      return;
    }

    // Optimistic UI update
    setTickets((prev) =>
      prev.map((t) =>
        t._id === draggedTicketId
          ? {
              ...t,
              status: targetColumn,
              resolvedAt: targetColumn === 'Resolved' ? new Date().toISOString() : t.resolvedAt,
            }
          : t
      )
    );
    setDraggedTicketId(null);

    try {
      await apiClient.patch(`/tickets/${ticketToMove._id}/status`, {
        status: targetColumn,
      });
    } catch (err) {
      console.error('Failed to persist status change, rolling back:', err);
      setTickets(previousTickets); // Rollback
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchNum = t.ticketNumber.toLowerCase().includes(q);
      const matchDesc = (t.description || '').toLowerCase().includes(q);
      if (!matchTitle && !matchNum && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-[#F8FAFC]">
      {/* Top Filter Bar */}
      <div className="px-6 py-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Priority:
            </span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Category:
            </span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="Bug">Bug</option>
              <option value="UI/UX Issue">UI/UX Issue</option>
              <option value="Feature Request">Feature Request</option>
              <option value="Security Issue">Security Issue</option>
              <option value="Performance Issue">Performance Issue</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredTickets.length} of {tickets.length} tickets
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenCreateTicket}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Card
          </Button>
        </div>
      </div>

      {/* Board Columns Container */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-6 min-h-full items-start">
          {COLUMNS.map((col) => {
            const columnTickets = filteredTickets.filter((t) => {
              if (col.id === 'To Do') return ['To Do', 'Open'].includes(t.status);
              if (col.id === 'In Progress') return ['In Progress', 'Under Review', 'Waiting for Response', 'On Hold'].includes(t.status);
              if (col.id === 'Resolved') return ['Resolved', 'Closed'].includes(t.status);
              return t.status === col.id;
            });

            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(col.id)}
                className="w-80 shrink-0 bg-slate-100/70 border border-slate-200/80 rounded-xl p-3 flex flex-col max-h-[calc(100vh-10rem)] transition-colors"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200/60 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {col.label}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-full px-2 py-0.5 shadow-2xs">
                    {columnTickets.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {columnTickets.map((t) => (
                    <div
                      key={t._id}
                      draggable
                      onDragStart={() => handleDragStart(t._id)}
                      onClick={() => onSelectTicket(t._id)}
                      className={`bg-white border border-slate-200 rounded-xl p-4 shadow-subtle hover:shadow-card hover:border-blue-400 transition-all cursor-pointer select-none group ${
                        draggedTicketId === t._id ? 'opacity-40 scale-95' : 'opacity-100'
                      }`}
                    >
                      {/* Card Header: Key + Priority */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                          {t.ticketNumber}
                        </span>
                        <PriorityBadge priority={t.priority} size="sm" />
                      </div>

                      {/* Card Title */}
                      <h4 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                        {t.title}
                      </h4>

                      {/* Category & Project */}
                      <p className="text-[11px] text-slate-500 mt-1 truncate">
                        {t.projectId?.name} • <span className="font-medium text-slate-600">{t.category}</span>
                      </p>

                      {/* Card Footer: Due Date, Counts & Assignee */}
                      <div className="flex items-center justify-between mt-3.5 pt-2.5 border-t border-slate-100 text-slate-400 text-xs">
                        <div className="flex items-center gap-3">
                          {t.dueDate && (
                            <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {format(new Date(t.dueDate), 'MMM d')}
                            </span>
                          )}

                          {t.commentCount > 0 && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-500">
                              <MessageSquare className="w-3 h-3" />
                              {t.commentCount}
                            </span>
                          )}

                          {t.attachmentCount > 0 && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-500">
                              <Paperclip className="w-3 h-3" />
                              {t.attachmentCount}
                            </span>
                          )}
                        </div>

                        <Avatar
                          name={t.assigneeId?.name || 'Unassigned'}
                          src={t.assigneeId?.avatarUrl}
                          size="xs"
                        />
                      </div>
                    </div>
                  ))}

                  {columnTickets.length === 0 && (
                    <div className="h-28 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-400">
                      Drag tickets here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

