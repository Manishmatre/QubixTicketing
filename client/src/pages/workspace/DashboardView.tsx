import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Avatar } from '../../components/ui/Avatar';
import { PriorityBadge, StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Users,
  Calendar,
  PlayCircle,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';

interface DashboardViewProps {
  onSelectTicket: (ticketId: string) => void;
  onOpenCreateTicket: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectTicket,
  onOpenCreateTicket,
}) => {
  const { user, organization } = useAuth();
  const { socket } = useSocket();
  const [timeRange, setTimeRange] = useState<string>('week');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/reports/dashboard-stats?timeRange=${timeRange}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Fetch dashboard stats error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  // Real-time socket updates for dashboard metrics
  useEffect(() => {
    if (!socket) return;
    const handleRefresh = () => {
      fetchStats();
    };

    socket.on('ticket:created', handleRefresh);
    socket.on('ticket:updated', handleRefresh);
    socket.on('ticket:status_changed', handleRefresh);
    socket.on('ticket:deleted', handleRefresh);

    return () => {
      socket.off('ticket:created', handleRefresh);
      socket.off('ticket:updated', handleRefresh);
      socket.off('ticket:status_changed', handleRefresh);
      socket.off('ticket:deleted', handleRefresh);
    };
  }, [socket, timeRange]);

  if (isLoading || !data) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const { metrics, priorityDistribution, teamWorkload, resolutionTrend, recentActivities } = data;

  const priorityChartData = [
    { name: 'Critical', count: priorityDistribution?.Critical || 0, color: '#DC2626' },
    { name: 'Urgent', count: priorityDistribution?.Urgent || 0, color: '#EA580C' },
    { name: 'High', count: priorityDistribution?.High || 0, color: '#F59E0B' },
    { name: 'Normal', count: priorityDistribution?.Normal || 0, color: '#2563EB' },
    { name: 'Low', count: priorityDistribution?.Low || 0, color: '#64748B' },
  ];

  return (
    <div className="flex-1 p-5 space-y-4 overflow-y-auto bg-[#F1F5F9] dark:bg-[#0B0F19] font-sans text-slate-800">
      {/* Welcome Banner & Time Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border border-slate-200/90 rounded-xl shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time workspace telemetry for <span className="font-semibold text-slate-700">{organization?.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100/80 border border-slate-200/80 rounded-lg p-1 flex items-center text-xs font-medium">
            {['today', 'week', 'month', 'all'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-3 py-1 rounded-md capitalize transition-all ${
                  timeRange === t
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t === 'today' ? 'Today' : t === 'week' ? 'This Week' : t === 'month' ? 'This Month' : 'All Time'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top 5 Metrics Widgets - Richly Colored Based on Status Nature */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Total Workload (Blue / Sky) */}
        <div className="bg-gradient-to-br from-blue-50/90 via-white to-sky-50/40 dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900 border border-blue-200/90 dark:border-blue-900/60 rounded-xl p-4 shadow-2xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-900 dark:text-blue-300">
              Total tasks
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/25">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-blue-950 dark:text-blue-100">{metrics.totalTickets}</span>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-100/80 dark:bg-blue-950/80 px-2 py-0.5 rounded-full">
              {metrics.openTickets} Open
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-blue-700/80 dark:text-blue-300/80 border-t border-blue-100/80 dark:border-blue-900/40 pt-2 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Workspace active volume</span>
          </div>
        </div>

        {/* 2. In Progress (Amber / Orange) */}
        <div className="bg-gradient-to-br from-amber-50/90 via-white to-orange-50/40 dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 border border-amber-200/90 dark:border-amber-900/60 rounded-xl p-4 shadow-2xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
              In progress
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-sm shadow-amber-500/25">
              <PlayCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-amber-950 dark:text-amber-100">{metrics.inProgressTickets}</span>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-100/90 dark:bg-amber-950/80 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Active
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-300/80 border-t border-amber-100/80 dark:border-amber-900/40 pt-2 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Under execution & review</span>
          </div>
        </div>

        {/* 3. Resolved (Emerald / Green) */}
        <div className="bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/40 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 border border-emerald-200/90 dark:border-emerald-900/60 rounded-xl p-4 shadow-2xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
              Resolved tasks
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-500/25">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-emerald-950 dark:text-emerald-100">{metrics.resolvedTickets}</span>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/90 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full">
              Completed
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300/80 border-t border-emerald-100/80 dark:border-emerald-900/40 pt-2 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>
              {metrics.totalTickets > 0
                ? `${Math.round((metrics.resolvedTickets / metrics.totalTickets) * 100)}% resolution rate`
                : '100% rate'}
            </span>
          </div>
        </div>

        {/* 4. Urgent & Critical (Rose / Red) */}
        <div className="bg-gradient-to-br from-rose-50/90 via-white to-red-50/40 dark:from-rose-950/40 dark:via-slate-900 dark:to-slate-900 border border-rose-200/90 dark:border-rose-900/60 rounded-xl p-4 shadow-2xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-900 dark:text-rose-300">
              Urgent & critical
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-sm shadow-rose-500/25">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{metrics.urgentTickets}</span>
            <span className="text-[11px] font-bold text-rose-800 bg-rose-100/90 dark:bg-rose-950/80 px-2 py-0.5 rounded-full">
              SLA Priority
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-rose-700 dark:text-rose-300/80 border-t border-rose-100/80 dark:border-rose-900/40 pt-2 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Highest severity escalation</span>
          </div>
        </div>

        {/* 5. Assigned to Me (Purple / Indigo) */}
        <div className="bg-gradient-to-br from-purple-50/90 via-white to-indigo-50/40 dark:from-purple-950/40 dark:via-slate-900 dark:to-slate-900 border border-purple-200/90 dark:border-purple-900/60 rounded-xl p-4 shadow-2xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-900 dark:text-purple-300">
              Assigned to me
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-sm shadow-purple-500/25">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-purple-950 dark:text-purple-100">{metrics.myAssignedTickets}</span>
            <span className="text-[11px] font-bold text-purple-800 bg-purple-100/90 dark:bg-purple-950/80 px-2 py-0.5 rounded-full">
              My Queue
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-purple-700 dark:text-purple-300/80 border-t border-purple-100/80 dark:border-purple-900/40 pt-2 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span>
              {metrics.overdueTickets > 0 ? (
                <span className="text-rose-600 font-bold">{metrics.overdueTickets} overdue</span>
              ) : (
                <span className="text-emerald-600 font-semibold">Zero overdue items</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Main Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resolution Trend (Line/Area Chart) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-subtle">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Ticket Velocity Trend</h3>
              <p className="text-xs text-slate-400 mt-0.5">Created vs. Resolved tickets over past 7 days</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Created
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Resolved
              </span>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={resolutionTrend}>
                <defs>
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderRadius: '8px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="created" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorCreated)" />
                <Area type="monotone" dataKey="resolved" stroke="#16A34A" strokeWidth={2} fillOpacity={1} fill="url(#colorResolved)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Distribution (Bar Chart) */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-subtle">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Priority Distribution</h3>
          <p className="text-xs text-slate-400 mb-6">Current active workload by severity</p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityChartData}>
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderRadius: '8px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {priorityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lower Row: Team Workload & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Workload */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" /> Team Workload
            </h3>
            <span className="text-xs text-slate-400">Assigned active tickets</span>
          </div>

          <div className="divide-y divide-slate-100">
            {teamWorkload.map((member: any) => (
              <div key={member.user?.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <Avatar name={member.user?.name} src={member.user?.avatarUrl} size="sm" />
                  <div>
                    <p className="font-semibold text-slate-900">{member.user?.name}</p>
                    <p className="text-[11px] text-slate-400 capitalize">{member.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full text-xs">
                    {member.activeTickets} tickets
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" /> Recent Activity Feed
            </h3>
            <span className="text-xs text-slate-400">Real-time audit</span>
          </div>

          <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
            {recentActivities.map((act: any) => (
              <div key={act._id} className="flex items-start gap-3 text-xs">
                <Avatar name={act.userId?.name} src={act.userId?.avatarUrl} size="xs" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900">
                    {act.userId?.name}{' '}
                    <span className="font-normal text-slate-600">{act.description}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

