import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
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
  Plus,
  Trash2,
  Edit2,
  KeyRound,
  RotateCcw,
  Sliders,
  Radio,
  ExternalLink,
  Cpu,
  HardDrive,
  RefreshCw,
  BellRing,
} from 'lucide-react';
import { format } from 'date-fns';

export const SuperAdminView: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [platformSettings, setPlatformSettings] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'orgs' | 'users' | 'plans' | 'settings' | 'audit'>('overview');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Search & Filters
  const [orgSearch, setOrgSearch] = useState<string>('');
  const [orgFilterStatus, setOrgFilterStatus] = useState<string>('all');
  const [userSearch, setUserSearch] = useState<string>('');
  const [userFilterRole, setUserFilterRole] = useState<string>('all');

  // Modals state
  const [orgModalOpen, setOrgModalOpen] = useState<boolean>(false);
  const [editingOrg, setEditingOrg] = useState<any | null>(null);
  const [deleteOrgModalOpen, setDeleteOrgModalOpen] = useState<boolean>(false);
  const [orgToDelete, setOrgToDelete] = useState<any | null>(null);

  const [userModalOpen, setUserModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState<boolean>(false);
  const [userToReset, setUserToReset] = useState<any | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [deleteUserModalOpen, setDeleteUserModalOpen] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);

  const [planModalOpen, setPlanModalOpen] = useState<boolean>(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);

  // Form states for Org
  const [orgForm, setOrgForm] = useState({
    name: '',
    slug: '',
    ownerEmail: '',
    subscriptionPlan: 'free',
    industry: 'Technology',
    size: '1-10',
    status: 'active',
  });

  // Form states for User
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    isSuperAdmin: false,
    isVerified: true,
  });

  // Form states for Plan
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    priceMonthly: 0,
    priceYearly: 0,
    maxUsers: 5,
    maxProjects: 3,
    maxStorageMB: 500,
    isActive: true,
  });

  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setActionError(msg);
      setTimeout(() => setActionError(null), 4000);
    } else {
      setActionSuccess(msg);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [sRes, oRes, uRes, pRes, setRes, aRes] = await Promise.all([
        apiClient.get('/admin/stats'),
        apiClient.get('/admin/organizations'),
        apiClient.get('/admin/users'),
        apiClient.get('/admin/plans'),
        apiClient.get('/admin/settings'),
        apiClient.get('/admin/audit-logs'),
      ]);

      if (sRes.data.success) setStats(sRes.data.data);
      if (oRes.data.success) setOrganizations(oRes.data.data);
      if (uRes.data.success) setUsers(uRes.data.data);
      if (pRes.data.success) setPlans(pRes.data.data);
      if (setRes.data.success) setPlatformSettings(setRes.data.data);
      if (aRes.data.success) setAuditLogs(aRes.data.data);
    } catch (err: any) {
      console.error('Fetch super admin data error:', err);
      showToast(err.response?.data?.error?.message || 'Failed to load platform data', true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // --- Organization CRUD Handlers ---
  const handleOpenCreateOrg = () => {
    setEditingOrg(null);
    setOrgForm({
      name: '',
      slug: '',
      ownerEmail: '',
      subscriptionPlan: 'free',
      industry: 'Technology',
      size: '1-10',
      status: 'active',
    });
    setOrgModalOpen(true);
  };

  const handleOpenEditOrg = (org: any) => {
    setEditingOrg(org);
    setOrgForm({
      name: org.name,
      slug: org.slug,
      ownerEmail: org.owner?.email || '',
      subscriptionPlan: org.subscriptionPlan || 'free',
      industry: org.industry || 'Technology',
      size: org.size || '1-10',
      status: org.status || 'active',
    });
    setOrgModalOpen(true);
  };

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOrg) {
        const res = await apiClient.put(`/admin/organizations/${editingOrg.id}`, {
          name: orgForm.name,
          slug: orgForm.slug,
          status: orgForm.status,
          subscriptionPlan: orgForm.subscriptionPlan,
          industry: orgForm.industry,
          size: orgForm.size,
        });
        if (res.data.success) {
          showToast(`Organization "${orgForm.name}" updated successfully.`);
          setOrgModalOpen(false);
          fetchAdminData();
        }
      } else {
        const res = await apiClient.post('/admin/organizations', orgForm);
        if (res.data.success) {
          showToast(`Organization "${orgForm.name}" created successfully.`);
          setOrgModalOpen(false);
          fetchAdminData();
        }
      }
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Error saving organization', true);
    }
  };

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
        showToast(`Organization status changed to ${nextStatus}.`);
      }
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Error updating status', true);
    }
  };

  const handleDeleteOrg = async () => {
    if (!orgToDelete) return;
    try {
      const res = await apiClient.delete(`/admin/organizations/${orgToDelete.id}`);
      if (res.data.success) {
        showToast(`Organization "${orgToDelete.name}" permanently deleted.`);
        setDeleteOrgModalOpen(false);
        setOrgToDelete(null);
        fetchAdminData();
      }
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Error deleting organization', true);
    }
  };

  // --- User CRUD Handlers ---
  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setUserForm({
      name: '',
      email: '',
      password: '',
      phoneNumber: '',
      isSuperAdmin: false,
      isVerified: true,
    });
    setUserModalOpen(true);
  };

  const handleOpenEditUser = (user: any) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      password: '',
      phoneNumber: user.phoneNumber || '',
      isSuperAdmin: user.isSuperAdmin,
      isVerified: user.isVerified,
    });
    setUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const res = await apiClient.put(`/admin/users/${editingUser.id}`, {
          name: userForm.name,
          email: userForm.email,
          phoneNumber: userForm.phoneNumber,
          isSuperAdmin: userForm.isSuperAdmin,
          isVerified: userForm.isVerified,
        });
        if (res.data.success) {
          showToast(`User "${userForm.name}" updated successfully.`);
          setUserModalOpen(false);
          fetchAdminData();
        }
      } else {
        const res = await apiClient.post('/admin/users', userForm);
        if (res.data.success) {
          showToast(`User "${userForm.name}" created successfully.`);
          setUserModalOpen(false);
          fetchAdminData();
        }
      }
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Error saving user', true);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToReset || !newPasswordInput) return;
    try {
      const res = await apiClient.post(`/admin/users/${userToReset.id}/reset-password`, {
        newPassword: newPasswordInput,
      });
      if (res.data.success) {
        showToast(`Password successfully reset for ${userToReset.email}.`);
        setResetPasswordModalOpen(false);
        setUserToReset(null);
        setNewPasswordInput('');
      }
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Error resetting password', true);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      const res = await apiClient.delete(`/admin/users/${userToDelete.id}`);
      if (res.data.success) {
        showToast(`User "${userToDelete.email}" deleted successfully.`);
        setDeleteUserModalOpen(false);
        setUserToDelete(null);
        fetchAdminData();
      }
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Error deleting user', true);
    }
  };

  // --- Plan CRUD Handlers ---
  const handleOpenEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      description: plan.description,
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly,
      maxUsers: plan.maxUsers,
      maxProjects: plan.maxProjects,
      maxStorageMB: plan.maxStorageMB,
      isActive: plan.isActive,
    });
    setPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    try {
      const res = await apiClient.put(`/admin/plans/${editingPlan._id}`, planForm);
      if (res.data.success) {
        showToast(`Plan "${planForm.name}" updated successfully.`);
        setPlanModalOpen(false);
        fetchAdminData();
      }
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Error updating plan', true);
    }
  };

  // --- Platform Settings Handlers ---
  const handleSavePlatformSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.put('/admin/settings', platformSettings);
      if (res.data.success) {
        setPlatformSettings(res.data.data);
        showToast('Global platform settings updated successfully.');
      }
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Error updating platform settings', true);
    }
  };

  // Filtered Lists
  const filteredOrgs = organizations.filter((org) => {
    const matchesSearch =
      org.name?.toLowerCase().includes(orgSearch.toLowerCase()) ||
      org.slug?.toLowerCase().includes(orgSearch.toLowerCase()) ||
      org.owner?.email?.toLowerCase().includes(orgSearch.toLowerCase());
    const matchesStatus = orgFilterStatus === 'all' || org.status === orgFilterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phoneNumber?.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole =
      userFilterRole === 'all' ||
      (userFilterRole === 'superadmin' ? u.isSuperAdmin : !u.isSuperAdmin);
    return matchesSearch && matchesRole;
  });

  if (isLoading || !stats) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white space-y-3">
        <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-purple-500" />
        <span className="text-xs font-mono text-slate-400">Loading Platform Control Plane...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      {/* Toast notifications */}
      {actionSuccess && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="fixed top-5 right-5 z-50 bg-red-600 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="bg-slate-950 text-white px-6 sm:px-8 py-3.5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center font-bold shadow-md shadow-purple-600/30">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold tracking-tight">Godspeed Desk Platform Owner</h1>
              <span className="bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-mono px-2 py-0.2 rounded-full font-bold">
                ROOT SUPER ADMIN
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Multi-Tenant Infrastructure Control Plane</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={fetchAdminData}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>

          <span className="hidden sm:flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-full text-emerald-400 font-mono text-[11px] border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Port 4050 Active ({stats.systemHealth?.uptimeSeconds}s uptime)
          </span>

          <a
            href="/workspace/dashboard"
            className="flex items-center gap-1 text-slate-300 hover:text-white font-semibold underline text-xs"
          >
            <span>Tenant Workspace</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Admin Tab Nav */}
      <div className="bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center gap-6 text-xs font-bold overflow-x-auto">
        {[
          { id: 'overview', label: 'Platform Telemetry' },
          { id: 'orgs', label: `Organizations (${organizations.length})` },
          { id: 'users', label: `Global Users (${users.length})` },
          { id: 'plans', label: `Plans & Pricing (${plans.length})` },
          { id: 'settings', label: 'Platform Settings' },
          { id: 'audit', label: `Audit Logs (${auditLogs.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-3.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-purple-600 text-purple-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Body View */}
      <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* TAB 1: TELEMETRY OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 4 Super Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-1">
                <span className="text-xs font-semibold text-slate-500 block">
                  Total Organizations
                </span>
                <span className="text-3xl font-black text-slate-900">{stats.totalOrgs}</span>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-emerald-600 font-semibold">{stats.activeOrgs} active</span>
                  <span className="text-slate-400">{stats.suspendedOrgs} suspended</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-1">
                <span className="text-xs font-semibold text-slate-500 block">
                  Global Users
                </span>
                <span className="text-3xl font-black text-slate-900">{stats.totalUsers}</span>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-blue-600 font-semibold">{stats.verifiedUsers} verified</span>
                  <span className="text-purple-600 font-semibold">{stats.superAdmins} superadmins</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-1">
                <span className="text-xs font-semibold text-slate-500 block">
                  Recurring Revenue (MRR)
                </span>
                <span className="text-3xl font-black text-purple-600">${stats.mrr}</span>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500 font-medium">ARR: ${stats.arr}</span>
                  <span className="text-emerald-600 font-bold">{stats.activeSubs} paid subs</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-1">
                <span className="text-xs font-semibold text-slate-500 block">
                  Total Tasks & Projects
                </span>
                <span className="text-3xl font-black text-blue-600">{stats.totalTickets}</span>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-amber-600 font-semibold">{stats.openTickets} open</span>
                  <span className="text-emerald-600 font-semibold">{stats.resolvedTickets} resolved</span>
                </div>
              </div>
            </div>

            {/* Infrastructure Node & Server Health */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-600" />
                <span>Node.js Daemon & VPS Infrastructure Telemetry</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block mb-0.5">Node Engine</span>
                  <span className="font-mono font-bold text-slate-800">{stats.systemHealth?.nodeVersion}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block mb-0.5">Process Memory RSS</span>
                  <span className="font-mono font-bold text-slate-800">{stats.systemHealth?.memoryUsageMB} MB</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block mb-0.5">Heap Used</span>
                  <span className="font-mono font-bold text-slate-800">{stats.systemHealth?.heapUsedMB} MB</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block mb-0.5">OS CPU Cores</span>
                  <span className="font-mono font-bold text-slate-800">{stats.systemHealth?.cpuCores} Cores</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block mb-0.5">System Free RAM</span>
                  <span className="font-mono font-bold text-slate-800">{stats.systemHealth?.freeSystemMemoryGB} / {stats.systemHealth?.totalSystemMemoryGB} GB</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block mb-0.5">Cluster Isolation</span>
                  <span className="font-mono font-bold text-emerald-600">Strict Scoped</span>
                </div>
              </div>
            </div>

            {/* Recent Workspaces Table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900">Recently Created Tenant Workspaces</h4>
                <Button size="sm" variant="secondary" onClick={() => setActiveTab('orgs')}>
                  View All Organizations →
                </Button>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold text-xs">
                  <tr>
                    <th className="py-2.5 px-5">Workspace</th>
                    <th className="py-2.5 px-5">Plan</th>
                    <th className="py-2.5 px-5">Status</th>
                    <th className="py-2.5 px-5">Owner Email</th>
                    <th className="py-2.5 px-5">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.recentOrgs?.map((org: any) => (
                    <tr key={org._id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-5 font-bold text-slate-900">{org.name}</td>
                      <td className="py-3 px-5 capitalize font-semibold text-slate-700">{org.subscriptionPlan}</td>
                      <td className="py-3 px-5">
                        <Badge variant={org.status === 'active' ? 'success' : 'danger'} size="sm">
                          {org.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-5 text-slate-600">{org.ownerId?.email || 'N/A'}</td>
                      <td className="py-3 px-5 text-slate-400">
                        {format(new Date(org.createdAt), 'MMM d, yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ORGANIZATIONS CRUD */}
        {activeTab === 'orgs' && (
          <div className="space-y-4">
            {/* Header + Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3 flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={orgSearch}
                    onChange={(e) => setOrgSearch(e.target.value)}
                    placeholder="Search by name, slug, or owner email..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none focus:border-purple-500"
                  />
                </div>
                <select
                  value={orgFilterStatus}
                  onChange={(e) => setOrgFilterStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-purple-500 font-medium"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20"
                onClick={handleOpenCreateOrg}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Create Workspace
              </Button>
            </div>

            {/* Organizations Table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                    <tr>
                      <th className="py-3 px-4">Organization</th>
                      <th className="py-3 px-4">Slug URL</th>
                      <th className="py-3 px-4">Owner Email</th>
                      <th className="py-3 px-4">Plan & Status</th>
                      <th className="py-3 px-4">Counts</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrgs.map((org) => (
                      <tr key={org.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {org.name}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {org.industry} • {org.size} employees
                          </span>
                        </td>
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
                        <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                          {org.projectCount} proj • {org.ticketCount} tix • {org.memberCount} users
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant={org.status === 'active' ? 'danger' : 'secondary'}
                              onClick={() => handleToggleOrgStatus(org.id, org.status)}
                            >
                              {org.status === 'active' ? 'Suspend' : 'Reactivate'}
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleOpenEditOrg(org)}
                              leftIcon={<Edit2 className="w-3 h-3" />}
                            >
                              Edit
                            </Button>
                            <button
                              onClick={() => {
                                setOrgToDelete(org);
                                setDeleteOrgModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                              title="Delete Organization"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredOrgs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No organizations match the filter criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GLOBAL USERS CRUD */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Header + Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3 flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by name, email, or phone..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none focus:border-purple-500"
                  />
                </div>
                <select
                  value={userFilterRole}
                  onChange={(e) => setUserFilterRole(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-purple-500 font-medium"
                >
                  <option value="all">All Roles</option>
                  <option value="superadmin">Super Admin Only</option>
                  <option value="standard">Standard Users</option>
                </select>
              </div>

              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20"
                onClick={handleOpenCreateUser}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Create Global User
              </Button>
            </div>

            {/* Users Table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Email & Phone</th>
                      <th className="py-3 px-4">Role Privileges</th>
                      <th className="py-3 px-4">Tenant Memberships</th>
                      <th className="py-3 px-4">Registered Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{u.name}</td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <div>{u.email}</div>
                          {u.phoneNumber && <div className="text-[10px] text-slate-400">{u.phoneNumber}</div>}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            {u.isSuperAdmin ? (
                              <Badge variant="purple" size="sm">Super Admin</Badge>
                            ) : (
                              <span className="text-slate-400 font-medium">Standard User</span>
                            )}
                            {u.isVerified && (
                              <span className="text-emerald-600 text-[10px] font-bold">✓ Verified</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {u.organizations?.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {u.organizations.map((org: any) => (
                                <span
                                  key={org.id}
                                  className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-700"
                                >
                                  {org.name} ({org.role})
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px]">No workspaces</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {format(new Date(u.createdAt), 'MMM d, yyyy')}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setUserToReset(u);
                                setNewPasswordInput('');
                                setResetPasswordModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-600 rounded-md hover:bg-amber-50 transition-colors"
                              title="Reset Password"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1.5 text-slate-400 hover:text-purple-600 rounded-md hover:bg-purple-50 transition-colors"
                              title="Edit User"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setUserToDelete(u);
                                setDeleteUserModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No users found matching query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PLANS & PRICING MANAGEMENT */}
        {activeTab === 'plans' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">SaaS Subscription Tiers & Feature Limits</h3>
                <p className="text-xs text-slate-500">Configure monthly/yearly pricing, member limits, and storage quotas.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {plans.map((p) => (
                <div key={p._id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{p.name}</h4>
                      <span className="font-mono text-[11px] text-purple-600 uppercase font-bold">{p.code}</span>
                    </div>
                    <Badge variant={p.isActive ? 'success' : 'slate'} size="sm">
                      {p.isActive ? 'Active Plan' : 'Archived'}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed min-h-[36px]">{p.description}</p>

                  <div className="p-3 bg-slate-50 rounded-lg space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Monthly Price:</span>
                      <strong className="text-slate-900">${p.priceMonthly}/mo</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Yearly Price:</span>
                      <strong className="text-slate-900">${p.priceYearly}/yr</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Member Limit:</span>
                      <strong className="text-slate-900">{p.maxUsers} users</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Project Limit:</span>
                      <strong className="text-slate-900">{p.maxProjects} projects</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Storage Quota:</span>
                      <strong className="text-slate-900">{Math.round(p.maxStorageMB / 1000)} GB</strong>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <span className="text-xs font-semibold text-slate-500 block">Features:</span>
                    <div className="flex flex-wrap gap-1">
                      {p.features?.map((f: string, i: number) => (
                        <span key={i} className="bg-purple-50 text-purple-700 text-[10px] px-2 py-0.5 rounded font-medium">
                          ✓ {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    onClick={() => handleOpenEditPlan(p)}
                    leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                  >
                    Edit Pricing & Quotas
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: PLATFORM SETTINGS & MAINTENANCE */}
        {activeTab === 'settings' && platformSettings && (
          <div className="max-w-3xl space-y-6">
            <form onSubmit={handleSavePlatformSettings} className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Global SaaS Maintenance & Operations</h3>
                <p className="text-xs text-slate-500">Configure global platform-wide controls, banners, and registrations.</p>
              </div>

              {/* Maintenance Mode Toggle */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex items-center justify-between">
                <div className="space-y-1 pr-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    <span className="font-bold text-slate-900 text-xs">Platform Maintenance Mode</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    When active, public workspace routes display a graceful maintenance message. Super admin console remains operational.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={platformSettings.maintenanceMode}
                  onChange={(e) =>
                    setPlatformSettings({ ...platformSettings, maintenanceMode: e.target.checked })
                  }
                  className="w-5 h-5 accent-purple-600 cursor-pointer"
                />
              </div>

              {/* Announcement Banner */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <BellRing className="w-4 h-4 text-purple-600" />
                    <span>Global Workspace Broadcast Banner</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={platformSettings.announcementBanner?.enabled}
                      onChange={(e) =>
                        setPlatformSettings({
                          ...platformSettings,
                          announcementBanner: {
                            ...platformSettings.announcementBanner,
                            enabled: e.target.checked,
                          },
                        })
                      }
                      className="accent-purple-600"
                    />
                    <span>Enable Banner</span>
                  </label>
                </div>

                <input
                  type="text"
                  value={platformSettings.announcementBanner?.message || ''}
                  onChange={(e) =>
                    setPlatformSettings({
                      ...platformSettings,
                      announcementBanner: {
                        ...platformSettings.announcementBanner,
                        message: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g. Scheduled maintenance this Sunday at 02:00 UTC."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-purple-500"
                />

                <div className="flex items-center gap-4 text-xs">
                  <span className="text-slate-500 font-semibold">Banner Color:</span>
                  {(['info', 'warning', 'alert', 'success'] as const).map((type) => (
                    <label key={type} className="flex items-center gap-1.5 cursor-pointer capitalize">
                      <input
                        type="radio"
                        name="bannerType"
                        value={type}
                        checked={platformSettings.announcementBanner?.type === type}
                        onChange={(e) =>
                          setPlatformSettings({
                            ...platformSettings,
                            announcementBanner: {
                              ...platformSettings.announcementBanner,
                              type: e.target.value,
                            },
                          })
                        }
                        className="accent-purple-600"
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Public Registration & Support Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">Allow Public Signups</label>
                  <select
                    value={platformSettings.allowRegistrations ? 'true' : 'false'}
                    onChange={(e) =>
                      setPlatformSettings({
                        ...platformSettings,
                        allowRegistrations: e.target.value === 'true',
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-purple-500"
                  >
                    <option value="true">Open (Anyone can register)</option>
                    <option value="false">Closed (Invite & Admin only)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">Support Contact Email</label>
                  <input
                    type="email"
                    value={platformSettings.supportEmail || ''}
                    onChange={(e) =>
                      setPlatformSettings({
                        ...platformSettings,
                        supportEmail: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-6 py-2 shadow-md shadow-purple-600/20"
                >
                  Save Platform Settings
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 6: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Platform-Wide Security Audit Trail</h4>
                <p className="text-[11px] text-slate-400">Immutable record of all tenant modifications, admin actions, and logins.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                  <tr>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Entity</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-purple-700">{log.action}</td>
                      <td className="py-3 px-4 text-slate-700">{log.entity}</td>
                      <td className="py-3 px-4 text-slate-600">{log.userId?.email || 'System'}</td>
                      <td className="py-3 px-4 text-slate-400">
                        {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                      </td>
                      <td className="py-3 px-4 text-slate-500 truncate max-w-xs text-[10px]">
                        {JSON.stringify(log.details || {})}
                      </td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">
                        No audit records captured yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL 1: CREATE / EDIT ORGANIZATION --- */}
      <Modal
        isOpen={orgModalOpen}
        onClose={() => setOrgModalOpen(false)}
        title={editingOrg ? `Edit Organization: ${editingOrg.name}` : 'Create New Tenant Workspace'}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveOrg} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Organization Name</label>
            <input
              type="text"
              required
              value={orgForm.name}
              onChange={(e) => {
                const name = e.target.value;
                setOrgForm({
                  ...orgForm,
                  name,
                  slug: editingOrg ? orgForm.slug : name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                });
              }}
              placeholder="e.g. Acme Cloud Inc."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Slug URL Identifier</label>
            <div className="flex items-center">
              <span className="bg-slate-100 border border-r-0 border-slate-200 px-3 py-2 rounded-l-lg text-slate-500 font-mono">
                /
              </span>
              <input
                type="text"
                required
                value={orgForm.slug}
                onChange={(e) => setOrgForm({ ...orgForm, slug: e.target.value })}
                placeholder="acme-cloud"
                className="w-full bg-slate-50 border border-slate-200 rounded-r-lg px-3 py-2 outline-none focus:border-purple-500 font-mono"
              />
            </div>
          </div>

          {!editingOrg && (
            <div>
              <label className="block text-slate-700 font-bold mb-1">Owner Email</label>
              <input
                type="email"
                required
                value={orgForm.ownerEmail}
                onChange={(e) => setOrgForm({ ...orgForm, ownerEmail: e.target.value })}
                placeholder="admin@acmecloud.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                If the user does not exist, an account will be automatically created with default credentials.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Subscription Plan</label>
              <select
                value={orgForm.subscriptionPlan}
                onChange={(e) => setOrgForm({ ...orgForm, subscriptionPlan: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500 capitalize"
              >
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="business">Business</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Status</label>
              <select
                value={orgForm.status}
                onChange={(e) => setOrgForm({ ...orgForm, status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500 capitalize"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Industry</label>
              <input
                type="text"
                value={orgForm.industry}
                onChange={(e) => setOrgForm({ ...orgForm, industry: e.target.value })}
                placeholder="e.g. Technology"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Company Size</label>
              <select
                value={orgForm.size}
                onChange={(e) => setOrgForm({ ...orgForm, size: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500"
              >
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="500+">500+ employees</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button size="sm" variant="secondary" type="button" onClick={() => setOrgModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold">
              {editingOrg ? 'Save Changes' : 'Create Organization'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* --- MODAL 2: CONFIRM DELETE ORGANIZATION --- */}
      <Modal
        isOpen={deleteOrgModalOpen}
        onClose={() => setDeleteOrgModalOpen(false)}
        title="Permanently Delete Workspace?"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Are you sure you want to delete <strong className="text-slate-900">{orgToDelete?.name}</strong> (/{orgToDelete?.slug})?
          </p>
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 space-y-1">
            <p className="font-bold">⚠️ Warning: Irreversible Action</p>
            <p>
              This will permanently delete all projects, tickets, attachments, workflows, and memberships associated with this organization.
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => setDeleteOrgModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="danger" onClick={handleDeleteOrg}>
              Yes, Delete Workspace
            </Button>
          </div>
        </div>
      </Modal>

      {/* --- MODAL 3: CREATE / EDIT USER --- */}
      <Modal
        isOpen={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        title={editingUser ? `Edit User: ${editingUser.name}` : 'Create Global User'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Full Name</label>
            <input
              type="text"
              required
              value={userForm.name}
              onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
              placeholder="e.g. Alex Rivera"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Email Address</label>
            <input
              type="email"
              required
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              placeholder="alex@example.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500"
            />
          </div>

          {!editingUser && (
            <div>
              <label className="block text-slate-700 font-bold mb-1">Initial Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500 font-mono"
              />
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-bold mb-1">Phone Number (Optional)</label>
            <input
              type="tel"
              value={userForm.phoneNumber}
              onChange={(e) => setUserForm({ ...userForm, phoneNumber: e.target.value })}
              placeholder="+1 (555) 000-0000"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
              <input
                type="checkbox"
                checked={userForm.isSuperAdmin}
                onChange={(e) => setUserForm({ ...userForm, isSuperAdmin: e.target.checked })}
                className="w-4 h-4 accent-purple-600"
              />
              <span>Grant Super Admin Platform Privileges</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
              <input
                type="checkbox"
                checked={userForm.isVerified}
                onChange={(e) => setUserForm({ ...userForm, isVerified: e.target.checked })}
                className="w-4 h-4 accent-purple-600"
              />
              <span>Mark Account Email as Verified</span>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button size="sm" variant="secondary" type="button" onClick={() => setUserModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold">
              {editingUser ? 'Save Changes' : 'Create User'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* --- MODAL 4: RESET PASSWORD --- */}
      <Modal
        isOpen={resetPasswordModalOpen}
        onClose={() => setResetPasswordModalOpen(false)}
        title="Admin Password Reset"
        maxWidth="sm"
      >
        <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
          <p className="text-slate-600">
            Set a new password for <strong className="text-slate-900">{userToReset?.email}</strong>:
          </p>
          <div>
            <label className="block text-slate-700 font-bold mb-1">New Password (min 6 chars)</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPasswordInput}
              onChange={(e) => setNewPasswordInput(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500 font-mono"
            />
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button size="sm" variant="secondary" type="button" onClick={() => setResetPasswordModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
              Update Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* --- MODAL 5: CONFIRM DELETE USER --- */}
      <Modal
        isOpen={deleteUserModalOpen}
        onClose={() => setDeleteUserModalOpen(false)}
        title="Delete User Account?"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Are you sure you want to delete user <strong className="text-slate-900">{userToDelete?.email}</strong>?
          </p>
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => setDeleteUserModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="danger" onClick={handleDeleteUser}>
              Yes, Delete User
            </Button>
          </div>
        </div>
      </Modal>

      {/* --- MODAL 6: EDIT PLAN --- */}
      <Modal
        isOpen={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        title={`Edit Plan: ${editingPlan?.name}`}
        maxWidth="md"
      >
        <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Plan Display Name</label>
            <input
              type="text"
              required
              value={planForm.name}
              onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Description</label>
            <textarea
              rows={2}
              value={planForm.description}
              onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Monthly Price ($)</label>
              <input
                type="number"
                required
                min={0}
                value={planForm.priceMonthly}
                onChange={(e) => setPlanForm({ ...planForm, priceMonthly: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Yearly Price ($)</label>
              <input
                type="number"
                required
                min={0}
                value={planForm.priceYearly}
                onChange={(e) => setPlanForm({ ...planForm, priceYearly: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Max Users</label>
              <input
                type="number"
                required
                min={1}
                value={planForm.maxUsers}
                onChange={(e) => setPlanForm({ ...planForm, maxUsers: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Max Projects</label>
              <input
                type="number"
                required
                min={1}
                value={planForm.maxProjects}
                onChange={(e) => setPlanForm({ ...planForm, maxProjects: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Storage (MB)</label>
              <input
                type="number"
                required
                min={100}
                value={planForm.maxStorageMB}
                onChange={(e) => setPlanForm({ ...planForm, maxStorageMB: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
              <input
                type="checkbox"
                checked={planForm.isActive}
                onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })}
                className="w-4 h-4 accent-purple-600"
              />
              <span>Plan is Active and Selectable</span>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button size="sm" variant="secondary" type="button" onClick={() => setPlanModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold">
              Save Plan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
