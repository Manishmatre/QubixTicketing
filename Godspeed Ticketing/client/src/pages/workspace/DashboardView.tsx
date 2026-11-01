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
  Activity,
  Users,
  PlayCircle,
  Building2,
  ChevronRight,
  Plus,
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
import { formatDistanceToNow, format } from 'date-fns';

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
      <div className="flex-1 flex items-center justify-center h-full bg-[#F1F5F9] dark:bg-[#0B0F19]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <p className="text-xs font-semibold text-slate-500">Loading operational telemetry...</p>
        </div>
      </div>
    );
  }

  const {
    metrics,
    recentTickets = [],
    priorityDistribution,
    teamWorkload = [],
    resolutionTrend = [],
    recentActivities = [],
  } = data;

  const priorityChartData = [
    { name: 'Critical', count: priorityDistribution?.Critical || 0, color: '#DC2626' },
    { name: 'Urgent', count: priorityDistribution?.Urgent || 0, color: '#EA580C' },
    { name: 'High', count: priorityDistribution?.High || 0, color: '#F59E0B' },
    { name: 'Normal', count: priorityDistribution?.Normal || 0, color: '#2563EB' },
    { name: 'Low', count: priorityDistribution?.Low || 0, color: '#64748B' },
  ];

  return (
    <div className="flex-1 p-5 space-y-4 overflow-y-auto bg-[#F1F5F9] dark:bg-[#0B0F19] font-sans text-slate-800 dark:text-slate-200">
      {/* 1. Welcome Banner & Operational Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Welcome back, {user?.name?.split(' ')[0]} 👋
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
              <Building2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              GodSpeed Home Sales
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time operations, property deliverables & escrow closing telemetry
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1 flex items-center text-xs font-medium">
            {['today', 'week', 'month', 'all'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-3 py-1 rounded-md capitalize transition-all cursor-pointer ${
                  timeRange === t
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t === 'today' ? 'Today' : t === 'week' ? 'This Week' : t === 'month' ? 'This Month' : 'All Time'}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenCreateTicket}
            className="hidden sm:flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* 2. Key Operational Metrics - Clean Simple White Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Deliverables */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total deliverables</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-900">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {metrics.totalTickets}
            </span>
            <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900">
              {metrics.openTickets} Open
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Active workspace pipeline
          </p>
        </div>

        {/* 2. In Progress */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">In execution</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-900">
              <PlayCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {metrics.inProgressTickets}
            </span>
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Active
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Under active execution & review
          </p>
        </div>

        {/* 3. Urgent & Escalated */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Urgent & critical</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-900">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {metrics.urgentTickets}
            </span>
            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/80 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900">
              High Priority
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Escrow deadlines & contingencies
          </p>
        </div>

        {/* 4. Completed Closings */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Completed items</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-900">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {metrics.resolvedTickets}
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900">
              {metrics.totalTickets > 0 ? `${Math.round((metrics.resolvedTickets / metrics.totalTickets) * 100)}%` : '100%'}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Closed transactions & resolved tasks
          </p>
        </div>
      </div>

      {/* 3. Active Real Estate Operational Deliverables & Tasks Table */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              Active Real Estate Operational Deliverables
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Priority transaction files, inspection contingencies, and listing deliverables
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-md">
            {recentTickets.length} active files
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Ref ID</th>
                <th className="py-3 px-4">Deliverable / Property</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {recentTickets.length > 0 ? (
                recentTickets.map((t: any) => (
                  <tr
                    key={t._id}
                    onClick={() => onSelectTicket(t._id)}
                    className="hover:bg-blue-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {t.ticketNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white max-w-xs truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {t.title}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {t.projectId?.name || 'Godspeed Ops'}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {t.category}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Avatar
                          name={t.assigneeId?.name || 'Unassigned'}
                          src={t.assigneeId?.avatarUrl}
                          size="xs"
                        />
                        <span className="text-slate-700 dark:text-slate-300 truncate max-w-[100px]">
                          {t.assigneeId?.name || 'Unassigned'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                      {t.dueDate ? format(new Date(t.dueDate), 'MMM dd, yyyy') : 'No target'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-flex items-center text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No active deliverables found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Resolution Trend (Line/Area Chart) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Ticket Velocity Trend</h3>
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

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={resolutionTrend}>
                <defs>
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.25} />
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
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Priority Distribution</h3>
          <p className="text-xs text-slate-400 mb-5">Current active workload by severity</p>

          <div className="h-60">
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

      {/* 5. Lower Row: Team Workload & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Team Workload */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" /> Operations Team Workload
            </h3>
            <span className="text-xs text-slate-400">Assigned active deliverables</span>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {teamWorkload.map((member: any) => (
              <div key={member.user?.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <Avatar name={member.user?.name} src={member.user?.avatarUrl} size="sm" />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{member.user?.name}</p>
                    <p className="text-[11px] text-slate-400 capitalize">{member.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-full text-xs">
                    {member.activeTickets} tickets
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" /> Recent Operations Audit
            </h3>
            <span className="text-xs text-slate-400">Real-time workspace activity</span>
          </div>

          <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
            {recentActivities.length > 0 ? (
              recentActivities.map((act: any) => (
                <div key={act._id} className="flex items-start gap-3 text-xs">
                  <Avatar name={act.userId?.name} src={act.userId?.avatarUrl} size="xs" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {act.userId?.name}{' '}
                      <span className="font-normal text-slate-600 dark:text-slate-300">{act.description}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No recent activity logged.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
