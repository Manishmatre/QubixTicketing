import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  ShieldCheck,
  Building,
  Users,
  CreditCard,
  Activity,
  Server,
  AlertTriangle,
  CheckCircle,
  FileText,
  Search,
} from 'lucide-react';
import { format } from 'date-fns';

export const SuperAdminView: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'orgs' | 'users' | 'audit'>('overview');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [sRes, oRes, uRes, aRes] = await Promise.all([
        apiClient.get('/admin/stats'),
        apiClient.get('/admin/organizations'),
        apiClient.get('/admin/users'),
        apiClient.get('/admin/audit-logs'),
      ]);

      if (sRes.data.success) setStats(sRes.data.data);
      if (oRes.data.success) setOrganizations(oRes.data.data);
      if (uRes.data.success) setUsers(uRes.data.data);
      if (aRes.data.success) setAuditLogs(aRes.data.data);
    } catch (err) {
      console.error('Fetch super admin data error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleOrgStatus = async (orgId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await apiClient.patch(`/admin/organizations/${orgId}`, {
        status: nextStatus,
      });
      if (res.data.success) {
        setOrganizations((prev) =>
          prev.map((o) => (o.id === orgId ? { ...o, status: nextStatus } : o))
        );
      }
    } catch (err) {
      console.error('Update org status error:', err);
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      {/* Top Bar */}
      <div className="bg-slate-900 text-white px-8 py-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight">QUBIX Platform Super Admin</h1>
            <p className="text-[11px] text-purple-400 font-semibold">Global SaaS Control Plane</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-full text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            System Status: Healthy ({stats.systemHealth?.uptimeSeconds}s uptime)
          </span>

          <a
            href="/workspace/dashboard"
            className="text-slate-300 hover:text-white font-semibold underline"
          >
            Back to Workspace
          </a>
        </div>
      </div>

      {/* Admin Tab Nav */}
      <div className="bg-white border-b border-slate-200 px-8 flex items-center gap-6 text-xs font-bold">
        {[
          { id: 'overview', label: 'Platform Telemetry' },
          { id: 'orgs', label: `Organizations (${organizations.length})` },
          { id: 'users', label: `Global Users (${users.length})` },
          { id: 'audit', label: `Platform Audit Logs (${auditLogs.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-4 border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 4 Super Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-subtle">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Total Organizations
                </span>
                <span className="text-3xl font-extrabold text-slate-900">{stats.totalOrgs}</span>
                <p className="text-xs text-emerald-600 mt-2 font-medium">
                  {stats.activeOrgs} active workspaces
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-subtle">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Global Registered Users
                </span>
                <span className="text-3xl font-extrabold text-slate-900">{stats.totalUsers}</span>
                <p className="text-xs text-slate-500 mt-2">Across all tenant workspaces</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-subtle">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Monthly Recurring Revenue (MRR)
                </span>
                <span className="text-3xl font-extrabold text-purple-600">${stats.mrr}</span>
                <p className="text-xs text-slate-500 mt-2">{stats.activeSubs} active paid plans</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-subtle">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Total Issues Managed
                </span>
                <span className="text-3xl font-extrabold text-blue-600">{stats.totalTickets}</span>
                <p className="text-xs text-slate-500 mt-2">{stats.totalProjects} active projects</p>
              </div>
            </div>

            {/* System Health Specs */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-subtle">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-600" /> Infrastructure Node Environment
              </h3>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block mb-1">Node Engine</span>
                  <span className="font-mono font-bold text-slate-800">{stats.systemHealth?.nodeVersion}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block mb-1">Server Memory RSS</span>
                  <span className="font-mono font-bold text-slate-800">{stats.systemHealth?.memoryUsageMB} MB</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block mb-1">Storage & Isolation</span>
                  <span className="font-mono font-bold text-emerald-600">Active Tenant Scopes</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Organizations Table */}
        {activeTab === 'orgs' && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-subtle overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase">
                <tr>
                  <th className="py-3 px-4">Organization</th>
                  <th className="py-3 px-4">Slug URL</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4">Plan & Status</th>
                  <th className="py-3 px-4">Projects / Tickets</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{org.name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">/{org.slug}</td>
                    <td className="py-3.5 px-4 text-slate-700">{org.owner?.email || 'N/A'}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="capitalize font-semibold text-slate-800">{org.subscriptionPlan}</span>
                        <Badge variant={org.status === 'active' ? 'success' : 'danger'} size="sm">
                          {org.status}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {org.projectCount} proj • {org.ticketCount} tix
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant={org.status === 'active' ? 'danger' : 'primary'}
                        onClick={() => handleToggleOrgStatus(org.id, org.status)}
                      >
                        {org.status === 'active' ? 'Suspend' : 'Reactivate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Users Table */}
        {activeTab === 'users' && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-subtle overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Super Admin</th>
                  <th className="py-3 px-4">Registered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id}>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{u.name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{u.email}</td>
                    <td className="py-3.5 px-4">
                      {u.isSuperAdmin ? (
                        <Badge variant="purple" size="sm">Super Admin</Badge>
                      ) : (
                        <span className="text-slate-400">Standard User</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {format(new Date(u.createdAt), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Audit Logs Table */}
        {activeTab === 'audit' && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-subtle overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase">
                <tr>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {auditLogs.map((log) => (
                  <tr key={log._id}>
                    <td className="py-3 px-4 font-bold text-purple-700">{log.action}</td>
                    <td className="py-3 px-4 text-slate-600">{log.entity}</td>
                    <td className="py-3 px-4 text-slate-700">{log.userId?.email || 'System'}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

