import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import {
  LayoutDashboard,
  FolderKanban,
  Kanban,
  CheckCircle2,
  ListOrdered,
  Users,
  BarChart3,
  Zap,
  CreditCard,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Layers,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, organization, memberships, switchOrganization, logout } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/workspace/dashboard', icon: LayoutDashboard },
    { label: 'Kanban Board', path: '/workspace/kanban', icon: Kanban },
    { label: 'All Tickets', path: '/workspace/tickets', icon: ListOrdered },
    { label: 'My Tickets', path: '/workspace/my-tickets', icon: CheckCircle2 },
    { label: 'Projects', path: '/workspace/projects', icon: FolderKanban },
    { label: 'Teams', path: '/workspace/teams', icon: Users },
    { label: 'Reports', path: '/workspace/reports', icon: BarChart3 },
    { label: 'Workflows', path: '/workspace/workflows', icon: Zap },
    { label: 'Billing', path: '/workspace/billing', icon: CreditCard },
    { label: 'Settings', path: '/workspace/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 select-none h-screen sticky top-0 z-30">
      {/* Brand Header & Organization Switcher */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center">
          <NavLink to="/workspace/dashboard" className="block">
            <img
              src="/logo.png"
              alt="QubixDesk"
              className="h-8 max-w-[200px] object-contain"
            />
          </NavLink>
        </div>

        {/* Organization Switcher Dropdown */}
        <div className="mt-3.5 bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">
              {organization?.name || 'My Organization'}
            </p>
            <p className="text-[11px] text-slate-500 capitalize">
              {organization?.subscriptionPlan || 'starter'} plan • {organization?.role || 'member'}
            </p>
          </div>
          {memberships.length > 1 && (
            <select
              className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
              value={organization?.id}
              onChange={(e) => switchOrganization(e.target.value)}
            >
              {memberships.map((m: any) => (
                <option key={m.organization?.id} value={m.organization?.id}>
                  {m.organization?.name} ({m.role})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Nav Links */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
            </NavLink>
          );
        })}

        {/* Super Admin Console Link (if user has privileges) */}
        {user?.isSuperAdmin && (
          <div className="pt-2 mt-2 border-t border-slate-100">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              System Admin
            </p>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-purple-50 text-purple-700 font-semibold'
                    : 'text-purple-600 hover:bg-purple-50/60'
                }`
              }
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="flex-1 truncate">Platform Admin</span>
            </NavLink>
          </div>
        )}
      </nav>

      {/* Footer Profile Area */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <Avatar name={user?.name} src={user?.avatarUrl} size="sm" showStatus statusOnline />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 truncate">{user?.name}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={() => logout()}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

