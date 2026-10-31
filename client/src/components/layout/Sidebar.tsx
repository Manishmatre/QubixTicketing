import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import {
  Ticket as TicketIcon,
  BarChart3,
  BookOpen,
  FolderKanban,
  Users,
  Layers,
  ChevronDown,
  ChevronRight,
  Plus,
  HelpCircle,
  MessageSquare,
  UserPlus,
  LogOut,
  ShieldCheck,
  Zap,
  CreditCard,
  Settings,
  Hash,
  Globe,
  Smartphone,
  Sparkles,
  Link2,
  CheckCircle2,
  SlidersHorizontal,
  Building2,
  LayoutDashboard,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, organization, memberships, switchOrganization, logout } = useAuth();
  const navigate = useNavigate();

  // Role-Based Access Control inside current organization
  const userRole = organization?.role || 'employee';
  const isOrgAdmin = userRole === 'owner' || userRole === 'admin';

  return (
    <aside className="w-64 bg-white border-r border-[#EAECF0] flex flex-col shrink-0 select-none h-screen sticky top-0 z-30 font-sans text-slate-800">
      {/* 1. Organization Workspace Selector (Clean Minimalist Top, matching reference UI) */}
      <div className="h-14 px-3 border-b border-[#EAECF0] bg-white flex items-center">
        <div className="w-full bg-[#F8FAFC] border border-[#EAECF0] rounded-lg px-2.5 py-1.5 flex items-center justify-between relative group hover:border-slate-300 transition-colors">
          <div className="min-w-0 flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
              {organization?.name ? organization.name.charAt(0).toUpperCase() : 'W'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                {organization?.name || 'Workspace'}
              </p>
              <p className="text-[10px] text-blue-600 font-semibold capitalize truncate">
                {organization?.subscriptionPlan || 'Free'} Plan
              </p>
            </div>
          </div>

          <div className="flex items-center text-slate-400 group-hover:text-slate-600 shrink-0 ml-1">
            <ChevronDown className="w-3.5 h-3.5" />
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

      {/* 2. Primary Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 text-xs">
        <div className="space-y-0.5">
          <NavLink
            to="/workspace/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4 text-slate-500" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/workspace/kanban"
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <div className="flex items-center gap-2.5">
              <TicketIcon className="w-4 h-4 text-slate-500" />
              <span>Kanban Board</span>
            </div>
            <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow-2xs">
              Live
            </span>
          </NavLink>

          <NavLink
            to="/workspace/tickets"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <Layers className="w-4 h-4 text-slate-500" />
            <span>All Tickets</span>
          </NavLink>

          <NavLink
            to="/workspace/my-tickets"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <CheckCircle2 className="w-4 h-4 text-slate-500" />
            <span>My Tickets</span>
          </NavLink>

          <NavLink
            to="/workspace/projects"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <FolderKanban className="w-4 h-4 text-slate-500" />
            <span>Projects</span>
          </NavLink>

          <NavLink
            to="/workspace/teams"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <Users className="w-4 h-4 text-slate-500" />
            <span>Teams</span>
          </NavLink>

          <NavLink
            to="/workspace/reports"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <BarChart3 className="w-4 h-4 text-slate-500" />
            <span>Analytics & SLA</span>
          </NavLink>

          {/* Administrative Automations - visible to Owner and Admins */}
          {isOrgAdmin && (
            <NavLink
              to="/workspace/workflows"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Zap className="w-4 h-4 text-slate-500" />
              <span>Automations</span>
            </NavLink>
          )}
        </div>
      </div>

      {/* 3. Pinned Bottom Footer */}
      <div className="p-3 border-t border-[#EAECF0] space-y-1 text-xs text-slate-600 bg-white">
        {/* Organization Admin Level Actions: Billing & Settings */}
        {isOrgAdmin && (
          <>
            <NavLink
              to="/workspace/billing"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors ${
                  isActive ? 'text-blue-700 font-semibold' : 'text-slate-600'
                }`
              }
            >
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              <span>Billing & Plan</span>
            </NavLink>

            <NavLink
              to="/workspace/settings"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors ${
                  isActive ? 'text-blue-700 font-semibold' : 'text-slate-600'
                }`
              }
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>Settings</span>
            </NavLink>
          </>
        )}

        {/* User Card */}
        <div className="pt-2 mt-1 border-t border-[#EAECF0] flex items-center justify-between px-1">
          <Link
            to="/workspace/profile"
            className="flex items-center gap-2.5 min-w-0 hover:opacity-85 transition-opacity"
            title="View User Profile"
          >
            <Avatar name={user?.name} src={user?.avatarUrl} size="sm" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                {user?.name || 'User'}
              </p>
              <p className="text-[10px] text-slate-400 truncate font-mono">
                {user?.email || 'user@example.com'}
              </p>
            </div>
          </Link>
          <button
            onClick={() => logout()}
            title="Log Out"
            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
