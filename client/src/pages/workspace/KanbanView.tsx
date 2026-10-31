import React, { useState, useEffect } from 'react';
import { Ticket, TicketStatus } from '../../types';
import { apiClient } from '../../api/client';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import {
  Ticket as TicketIcon,
  SlidersHorizontal,
  Sliders,
  Plus,
  MoreHorizontal,
  SignalLow,
  SignalMedium,
  SignalHigh,
  Signal,
  CheckCircle2,
  Clock,
  Circle,
  Hash,
  Globe,
  Smartphone,
  Sparkles,
  Layers,
  Filter,
  Lock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface KanbanViewProps {
  onSelectTicket: (ticketId: string) => void;
  onOpenCreateTicket: () => void;
  searchFilter?: string;
}

interface ColumnDef {
  id: TicketStatus;
  label: string;
  icon: React.ReactNode;
}

const COLUMNS: ColumnDef[] = [
  {
    id: 'To Do',
    label: 'Open',
    icon: <Circle className="w-3.5 h-3.5 text-blue-500 fill-blue-500/20" />,
  },
  {
    id: 'In Progress',
    label: 'In Progress',
    icon: <Circle className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />,
  },
  {
    id: 'Under Review',
    label: 'Customer in Review',
    icon: <Circle className="w-3.5 h-3.5 text-rose-400 fill-rose-400/20" />,
  },
  {
    id: 'Resolved',
    label: 'Resolved',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
  },
];

export const KanbanView: React.FC<KanbanViewProps> = ({
  onSelectTicket,
  onOpenCreateTicket,
  searchFilter = '',
}) => {
  const { user, organization } = useAuth();
  const { socket } = useSocket();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);

  const userRole = organization?.role || 'employee';
  const isManager = ['owner', 'admin', 'project_manager'].includes(userRole);
  const currentUserId = user?.id;

  const canEditTicket = (t: Ticket) => {
    if (isManager) return true;
    const isAssigned =
      (t.assigneeId && (t.assigneeId.id === currentUserId || (t.assigneeId as any)._id === currentUserId)) ||
      (t.assigneeIds && t.assigneeIds.some((a) => a.id === currentUserId || (a as any)._id === currentUserId)) ||
      t.reporterId?.id === currentUserId ||
      (t.reporterId as any)?._id === currentUserId;
    return !!isAssigned;
  };

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

    if (!canEditTicket(ticketToMove)) {
      alert('You can only update tasks assigned to you.');
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
    } catch (err: any) {
      console.error('Failed to persist status change, rolling back:', err);
      const errMsg = err?.response?.data?.message || 'Failed to update task status';
      alert(errMsg);
      setTickets(previousTickets);
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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return <Signal className="w-3 h-3 text-red-500 shrink-0" />;
      case 'Urgent':
      case 'High':
        return <SignalHigh className="w-3 h-3 text-amber-500 shrink-0" />;
      case 'Normal':
        return <SignalMedium className="w-3 h-3 text-blue-500 shrink-0" />;
      default:
        return <SignalLow className="w-3 h-3 text-slate-400 shrink-0" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-[#F1F5F9] dark:bg-[#0B0F19] font-sans text-slate-800 dark:text-slate-200">
      {/* Sub-Toolbar: Clean Minimalist Filter Bar */}
      <div className="px-5 py-2.5 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-white dark:bg-slate-900 text-xs shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 font-medium text-xs">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
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
            <span className="text-slate-500 dark:text-slate-400 font-medium text-xs">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
            >
              <option value="all">All Categories</option>
              <option value="Task">Task</option>
              <option value="Feature">Feature</option>
              <option value="Improvement">Improvement</option>
              <option value="General Work">General Work</option>
              <option value="Client Request">Client Request</option>
              <option value="Operations">Operations</option>
              <option value="UI/UX Design">UI/UX Design</option>
              <option value="Bug">Bug</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-medium">
          <span>{filteredTickets.length} tasks on board</span>
          <div className="h-3.5 w-[1px] bg-slate-200 dark:bg-slate-700" />
          <span className="inline-flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-bold bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-900 px-2.5 py-0.5 rounded-full text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
            Live Sync
          </span>
        </div>
      </div>

      {/* Kanban Columns Container */}
      <div className="flex-1 overflow-x-auto p-5 bg-[#F1F5F9] dark:bg-[#0B0F19]">
        <div className="flex gap-5 min-h-full items-start">
          {COLUMNS.map((col) => {
            const columnTickets = filteredTickets.filter((t) => {
              if (col.id === 'To Do') return ['To Do', 'Open'].includes(t.status);
              if (col.id === 'In Progress') return ['In Progress', 'Waiting for Response', 'On Hold'].includes(t.status);
              if (col.id === 'Under Review') return ['Under Review'].includes(t.status);
              if (col.id === 'Resolved') return ['Resolved', 'Closed'].includes(t.status);
              return t.status === col.id;
            });

            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(col.id)}
                className="w-80 shrink-0 flex flex-col max-h-[calc(100vh-8.5rem)] select-none bg-slate-200/50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2.5 px-1 mb-2">
                  <div className="flex items-center gap-2">
                    {col.icon}
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                      {col.label}
                    </h3>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold ml-0.5 bg-white/70 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                      {columnTickets.length}
                    </span>
                  </div>
                  <button
                    onClick={onOpenCreateTicket}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 rounded cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Column Cards Stream */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {columnTickets.map((t) => {
                    const editable = canEditTicket(t);
                    const assignees = (t.assigneeIds && t.assigneeIds.length > 0)
                      ? t.assigneeIds
                      : (t.assigneeId ? [t.assigneeId] : []);

                    return (
                      <div
                        key={t._id}
                        draggable={editable}
                        onDragStart={() => {
                          if (editable) handleDragStart(t._id);
                        }}
                        onClick={() => onSelectTicket(t._id)}
                        className={`bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer group ${
                          draggedTicketId === t._id ? 'opacity-40 scale-95' : 'opacity-100'
                        }`}
                      >
                        {/* Top Row: Priority Signal + Number + Tag + Avatars + Menu */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 min-w-0 text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                            {getPriorityIcon(t.priority)}
                            <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{t.ticketNumber}</span>
                            <span>·</span>
                            <span className="truncate">{t.category || 'Task'}</span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* Stacked avatars for multiple assignees */}
                            <div className="flex items-center -space-x-1.5 overflow-hidden">
                              {assignees.length > 0 ? (
                                assignees.slice(0, 3).map((a, idx) => (
                                  <Avatar
                                    key={a.id || (a as any)._id || idx}
                                    name={a.name || 'Member'}
                                    src={a.avatarUrl}
                                    size="xs"
                                  />
                                ))
                              ) : (
                                <Avatar name="Unassigned" size="xs" />
                              )}
                              {assignees.length > 3 && (
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-full px-1 ring-1 ring-white dark:ring-slate-900">
                                  +{assignees.length - 3}
                                </span>
                              )}
                            </div>

                            {!editable && (
                              <span title="Assigned tasks only" className="text-slate-400 ml-0.5">
                                <Lock className="w-3 h-3 text-slate-400" />
                              </span>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectTicket(t._id);
                              }}
                              className="text-slate-300 hover:text-slate-600 dark:hover:text-slate-400 p-0.5 rounded"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug mb-3">
                          {t.title}
                        </h4>

                        {/* Ticket Real Tags & Metadata */}
                        {t.tags && t.tags.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                            {t.tags.map((tag: string) => (
                              <span
                                key={tag}
                                className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 text-[10px] px-1.5 py-0.5 rounded font-medium"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Timestamp */}
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                          {t.createdAt
                            ? formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })
                            : 'Recently'}
                        </div>
                      </div>
                    );
                  })}

                  {columnTickets.length === 0 && (
                    <div className="py-8 text-center border-2 border-dashed border-slate-200/80 dark:border-slate-800 rounded-xl">
                      <p className="text-xs text-slate-400">No tasks in this column</p>
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
