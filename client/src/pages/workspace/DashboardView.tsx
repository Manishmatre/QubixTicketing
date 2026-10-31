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

      {/* Top 4 Metrics Widgets - Distinct Border Accents & High Contrast */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 border-t-2 border-t-blue-500 rounded-xl p-4 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2.5">
            <span className="text-xs font-semibold text-slate-600">
              Total tickets
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <FolderKanban className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">{metrics.totalTickets}</span>
            <span className="text-[11px] text-emerald-600 font-bold flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> Active
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            <span>{metrics.openTickets} open</span>
            <span>•</span>
            <span>{metrics.inProgressTickets} in progress</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 border-t-2 border-t-emerald-500 rounded-xl p-4 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2.5">
            <span className="text-xs font-semibold text-slate-600">
              Resolved tickets
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">{metrics.resolvedTickets}</span>
            <span className="text-[11px] text-emerald-600 font-bold">Completed</span>
          </div>
          <div className="mt-2.5 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            {metrics.totalTickets > 0
              ? `${Math.round((metrics.resolvedTickets / metrics.totalTickets) * 100)}% resolution rate`
              : '0% resolution rate'}
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 border-t-2 border-t-rose-500 rounded-xl p-4 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2.5">
            <span className="text-xs font-semibold text-slate-600">
              Urgent & critical
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-rose-600">{metrics.urgentTickets}</span>
            <span className="text-[11px] text-rose-600 font-bold">Immediate priority</span>
          </div>
          <div className="mt-2.5 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            Prioritized by SLA rules
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 border-t-2 border-t-purple-500 rounded-xl p-4 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2.5">
            <span className="text-xs font-semibold text-slate-600">
              Assigned to me
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">{metrics.myAssignedTickets}</span>
            <span className="text-[11px] text-purple-600 font-bold">Active queue</span>
          </div>
          <div className="mt-2.5 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            {metrics.overdueTickets > 0 ? (
              <span className="text-rose-600 font-bold">{metrics.overdueTickets} overdue</span>
            ) : (
              <span className="text-emerald-600 font-medium">Zero overdue items</span>
            )}
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

