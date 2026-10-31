import React, { useState, useEffect } from 'react';
import { Ticket, TicketStatus } from '../../types';
import { apiClient } from '../../api/client';
import { useSocket } from '../../context/SocketContext';
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
  const { socket } = useSocket();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectAll, setSelectAll] = useState<boolean>(false);
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
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-white font-sans text-slate-800">
      {/* Top Header matching reference Screenshot 2 */}
      <div className="px-6 py-3 border-b border-[#EAECF0] flex items-center justify-between gap-4 shrink-0 bg-white">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <TicketIcon className="w-4 h-4 text-slate-800" />
            <h1 className="text-sm font-bold text-slate-900 tracking-tight">Tickets</h1>
          </div>

          <div className="h-4 w-[1px] bg-slate-200" />

          {/* Select All */}
          <label className="flex items-center gap-2 text-xs text-slate-600 font-medium cursor-pointer hover:text-slate-900">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={(e) => setSelectAll(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
            />
            <span>Select all</span>
          </label>

          {/* Filters Button */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-[#EAECF0] text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs">
            <SlidersHorizontal className="w-3 h-3 text-slate-500" />
            <span>Filters</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Options */}
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#EAECF0] text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs transition-colors">
            <Sliders className="w-3 h-3 text-slate-500" />
            <span>View options</span>
          </button>

          {/* + New Ticket Button (High contrast dark button like in screenshot) */}
          <button
            onClick={onOpenCreateTicket}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New ticket</span>
          </button>
        </div>
      </div>

      {/* Kanban Columns Container */}
      <div className="flex-1 overflow-x-auto p-6 bg-[#FAFAFA]">
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
                className="w-80 shrink-0 flex flex-col max-h-[calc(100vh-8.5rem)] select-none"
              >
                {/* Column Header matching screenshot */}
                <div className="flex items-center justify-between pb-2.5 px-1 mb-2">
                  <div className="flex items-center gap-2">
                    {col.icon}
                    <h3 className="text-xs font-bold text-slate-800 tracking-tight">
                      {col.label}
                    </h3>
                    <span className="text-xs text-slate-400 font-medium ml-0.5">
                      {columnTickets.length}
                    </span>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600 p-0.5 rounded">
                    <Plus className="w-3.5 h-3.5" onClick={onOpenCreateTicket} />
                  </button>
                </div>

                {/* Column Cards Stream */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {columnTickets.map((t) => (
                    <div
                      key={t._id}
                      draggable
                      onDragStart={() => handleDragStart(t._id)}
                      onClick={() => onSelectTicket(t._id)}
                      className={`bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group ${
                        draggedTicketId === t._id ? 'opacity-40 scale-95' : 'opacity-100'
                      }`}
                    >
                      {/* Top Row: Priority Signal + Number + Tag + Avatar + Menu */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 min-w-0 text-[11px] text-slate-500 font-medium truncate">
                          {getPriorityIcon(t.priority)}
                          <span className="font-mono text-slate-700 font-semibold">{t.ticketNumber}</span>
                          <span>·</span>
                          <span className="truncate">{t.category || 'Features'}</span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Avatar
                            name={t.assigneeId?.name || 'User'}
                            src={t.assigneeId?.avatarUrl}
                            size="xs"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTicket(t._id);
                            }}
                            className="text-slate-300 hover:text-slate-600 p-0.5 rounded"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-3">
                        {t.title}
                      </h4>

                      {/* Action Tags based on sources / categories (Colorful action tags like in screenshot) */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                        <span className="inline-flex items-center gap-1 bg-[#F4F0F7] text-[#4A154B] border border-[#E8DCEE] text-[10px] px-1.5 py-0.5 rounded font-medium">
                          <Hash className="w-2.5 h-2.5" />
                          Slack
                        </span>
                        <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 border border-sky-100 text-[10px] px-1.5 py-0.5 rounded font-medium">
                          <Globe className="w-2.5 h-2.5" />
                          Web
                        </span>
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] px-1.5 py-0.5 rounded font-medium">
                          <Smartphone className="w-2.5 h-2.5" />
                          Mobile
                        </span>
                        <span className="bg-purple-50 text-purple-700 border border-purple-100 text-[10px] px-1.5 py-0.5 rounded font-medium">
                          Feature
                        </span>
                      </div>

                      {/* Timestamp */}
                      <div className="text-[10px] text-slate-400 font-medium">
                        {t.createdAt
                          ? formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })
                          : '2 hours ago'}
                      </div>
                    </div>
                  ))}

                  {columnTickets.length === 0 && (
                    <div className="py-8 text-center border-2 border-dashed border-slate-200/80 rounded-xl">
                      <p className="text-xs text-slate-400">No tickets in this column</p>
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
