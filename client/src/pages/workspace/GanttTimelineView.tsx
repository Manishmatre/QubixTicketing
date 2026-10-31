import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { apiClient } from '../../api/client';
import { Ticket, Project } from '../../types';
import { TicketDrawer } from '../../components/ticket/TicketDrawer';
import { Avatar } from '../../components/ui/Avatar';
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Layers,
  Clock,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  format,
  addDays,
  subDays,
  differenceInDays,
  isSameDay,
  isWithinInterval,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from 'date-fns';

export const GanttTimelineView: React.FC = () => {
  const { organization } = useAuth();
  const { socket } = useSocket();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Timeline viewport settings
  const [startDate, setStartDate] = useState<Date>(() => subDays(new Date(), 5));
  const daysToShow = 24; // 24-day sliding window

  const days = useMemo(() => {
    return Array.from({ length: daysToShow }, (_, i) => addDays(startDate, i));
  }, [startDate, daysToShow]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [ticketsRes, projectsRes] = await Promise.all([
        apiClient.get('/tickets?limit=100'),
        apiClient.get('/projects'),
      ]);

      if (ticketsRes.data.success) {
        setTickets(ticketsRes.data.data);
      }
      if (projectsRes.data.success) {
        setProjects(projectsRes.data.data);
      }
    } catch (err) {
      console.error('Fetch timeline error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Real-time socket sync
  useEffect(() => {
    if (!socket) return;

    const handleCreated = (newTicket: Ticket) => {
      setTickets((prev) => [newTicket, ...prev.filter((t) => t._id !== newTicket._id)]);
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

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (selectedProjectId !== 'all') {
        const pId = typeof t.projectId === 'string' ? t.projectId : t.projectId?._id;
        if (pId !== selectedProjectId) return false;
      }
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      return true;
    });
  }, [tickets, selectedProjectId, statusFilter]);

  const navigateDays = (offset: number) => {
    setStartDate((prev) => addDays(prev, offset));
  };

  const jumpToToday = () => {
    setStartDate(subDays(new Date(), 4));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white font-sans text-slate-800 overflow-hidden">
      {/* Top Filter & Timeline Controls */}
      <div className="h-14 px-6 border-b border-[#EAECF0] flex items-center justify-between gap-4 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <CalendarRange className="w-4 h-4 text-blue-600" />
            <span>Sprint Timeline & Gantt View</span>
          </div>

          <span className="text-slate-300">|</span>

          {/* Project Filter */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-[#F8FAFC] border border-[#EAECF0] rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">All Projects ({projects.length})</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.key})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#F8FAFC] border border-[#EAECF0] rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Code Review">Code Review</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        {/* Timeline Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={jumpToToday}
            className="px-2.5 py-1 rounded-lg border border-[#EAECF0] hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
          >
            Today
          </button>
          <div className="flex items-center border border-[#EAECF0] rounded-lg overflow-hidden">
            <button
              onClick={() => navigateDays(-7)}
              title="Previous 7 days"
              className="p-1 hover:bg-slate-50 text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigateDays(7)}
              title="Next 7 days"
              className="p-1 hover:bg-slate-50 text-slate-600 transition-colors border-l border-[#EAECF0]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Gantt Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Ticket List Table (Fixed Width) */}
        <div className="w-80 border-r border-[#EAECF0] flex flex-col shrink-0 bg-white">
          <div className="h-10 px-4 border-b border-[#EAECF0] bg-[#F8FAFC] flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Ticket / Work Item</span>
            <span>Assignee</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading timeline...</div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No tickets found</div>
            ) : (
              filteredTickets.map((t) => (
                <div
                  key={t._id}
                  onClick={() => setSelectedTicketId(t._id)}
                  className={`h-12 px-4 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                    selectedTicketId === t._id ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-blue-600 shrink-0">
                      {t.ticketNumber}
                    </span>
                    <span className="text-xs font-medium text-slate-800 truncate" title={t.title}>
                      {t.title}
                    </span>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5">
                    <Avatar
                      name={t.assigneeId?.name || 'Unassigned'}
                      src={t.assigneeId?.avatarUrl}
                      size="xs"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Horizontal Timeline Schedule */}
        <div className="flex-1 overflow-x-auto flex flex-col bg-white">
          {/* Header Row: Days & Dates */}
          <div className="h-10 border-b border-[#EAECF0] bg-[#F8FAFC] flex shrink-0">
            {days.map((day) => {
              const isToday = isSameDay(day, new Date());
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;

              return (
                <div
                  key={day.toISOString()}
                  className={`w-14 shrink-0 border-r border-slate-100 flex flex-col items-center justify-center text-[10px] ${
                    isToday
                      ? 'bg-blue-50/80 font-bold text-blue-700'
                      : isWeekend
                      ? 'bg-slate-50 text-slate-400 font-medium'
                      : 'text-slate-600 font-medium'
                  }`}
                >
                  <span className="uppercase text-[9px]">{format(day, 'EEE')}</span>
                  <span className="font-bold">{format(day, 'd')}</span>
                </div>
              );
            })}
          </div>

          {/* Schedule Bars Grid */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 relative">
            {filteredTickets.map((t) => {
              // Calculate ticket start and end dates
              const createdDate = t.createdAt ? new Date(t.createdAt) : new Date();
              const dueDate = t.dueDate ? new Date(t.dueDate) : addDays(createdDate, 3);

              // Calculate offset relative to timeline startDate
              const startDiff = differenceInDays(createdDate, startDate);
              const durationDays = Math.max(1, differenceInDays(dueDate, createdDate) + 1);

              // Position calculations (w-14 = 56px per day)
              const dayWidth = 56;
              const leftPx = Math.max(0, startDiff * dayWidth);
              const widthPx = Math.min(daysToShow * dayWidth - leftPx, durationDays * dayWidth);

              // Status color mapping
              const barColor =
                t.status === 'Resolved' || t.status === 'Closed'
                  ? 'bg-emerald-500 border-emerald-600 text-white'
                  : t.status === 'In Progress'
                  ? 'bg-blue-600 border-blue-700 text-white'
                  : t.status === 'Under Review'
                  ? 'bg-purple-600 border-purple-700 text-white'
                  : 'bg-slate-300 border-slate-400 text-slate-800';

              return (
                <div
                  key={t._id}
                  className="h-12 relative flex items-center hover:bg-slate-50/50 transition-colors"
                  style={{ width: `${daysToShow * dayWidth}px` }}
                >
                  {/* Grid background column guides */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {days.map((day) => {
                      const isToday = isSameDay(day, new Date());
                      return (
                        <div
                          key={day.toISOString()}
                          className={`w-14 shrink-0 border-r border-slate-100 h-full ${
                            isToday ? 'bg-blue-50/20' : ''
                          }`}
                        />
                      );
                    })}
                  </div>

                  {/* Duration Bar */}
                  {startDiff < daysToShow && startDiff + durationDays > 0 && (
                    <div
                      onClick={() => setSelectedTicketId(t._id)}
                      title={`${t.ticketNumber}: ${t.title} (${t.status})`}
                      style={{
                        left: `${leftPx}px`,
                        width: `${Math.max(48, widthPx)}px`,
                      }}
                      className={`absolute h-7 rounded-lg border shadow-xs px-2.5 flex items-center justify-between text-[11px] font-bold cursor-pointer transition-transform hover:scale-[1.01] z-10 ${barColor}`}
                    >
                      <span className="truncate">{t.ticketNumber}</span>
                      <span className="text-[10px] opacity-90 truncate ml-1">{t.status}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Slide-over Ticket Drawer */}
      {selectedTicketId && (
        <TicketDrawer
          ticketId={selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
          onTicketUpdated={fetchData}
        />
      )}
    </div>
  );
};
