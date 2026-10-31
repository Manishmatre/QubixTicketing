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

  const [viewsOpen, setViewsOpen] = useState(true);
  const [queuesOpen, setQueuesOpen] = useState(true);

  // Teammates list with status dots
  const teamMembers = [
    { name: 'Sarah Jenkins', dot: 'bg-emerald-500', count: 4 },
    { name: 'Alex Rivera', dot: 'bg-blue-500', count: 6 },
    { name: 'Emma Watson', dot: 'bg-indigo-500', count: 2 },
    { name: 'Michael Chang', dot: 'bg-sky-500', count: 3 },
  ];

  // Category queues with theme-matched action icons
  const queues = [
    { name: 'Knowledge', icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
    { name: 'Usability', icon: Link2, color: 'text-indigo-600 bg-indigo-50' },
    { name: 'Features', icon: Sparkles, color: 'text-purple-600 bg-purple-50' },
    { name: 'Design Specs', icon: Layers, color: 'text-pink-600 bg-pink-50' },
    { name: 'DevOps & Cloud', icon: Zap, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#EAECF0] flex flex-col shrink-0 select-none h-screen sticky top-0 z-30 font-sans text-slate-800">
      {/* 1. Official QubixDesk Brand Header */}
      <div className="p-4 border-b border-[#EAECF0] bg-white">
        <Link to="/workspace/dashboard" className="block focus:outline-none">
          <img
            src="/logo.png"
            alt="QubixDesk"
            className="h-8 max-w-[190px] object-contain"
          />
        </Link>

        {/* Organization Switcher Card */}
        <div className="mt-3 bg-[#F8FAFC] border border-[#EAECF0] rounded-xl p-2.5 flex items-center justify-between relative group hover:border-slate-300 transition-colors">
          <div className="min-w-0 flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-2xs">
              {organization?.name ? organization.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                {organization?.name || 'Acme Technologies Inc.'}
              </p>
              <p className="text-[10px] text-blue-600 font-semibold capitalize truncate">
                {organization?.subscriptionPlan || 'Professional'} Plan
              </p>
            </div>
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
        </div>

        {/* Collapsible Views: Team Member presence */}
        <div>
          <div
            onClick={() => setViewsOpen(!viewsOpen)}
            className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-400 hover:text-slate-700 cursor-pointer uppercase tracking-wider"
          >
            <div className="flex items-center gap-1.5">
              {viewsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <span>Views</span>
            </div>
            <Plus className="w-3 h-3 opacity-60 hover:opacity-100" />
          </div>

          {viewsOpen && (
            <div className="mt-1 space-y-0.5 pl-1.5">
              {teamMembers.map((member) => (
                <div
                  key={member.name}
                  onClick={() => navigate('/workspace/kanban')}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${member.dot}`} />
                    <span className="text-xs truncate">{member.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{member.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Collapsible Queues with theme colored icons */}
        <div>
          <div
            onClick={() => setQueuesOpen(!queuesOpen)}
            className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-400 hover:text-slate-700 cursor-pointer uppercase tracking-wider"
          >
            <div className="flex items-center gap-1.5">
              {queuesOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <span>Queues</span>
            </div>
            <Plus className="w-3 h-3 opacity-60 hover:opacity-100" />
          </div>

          {queuesOpen && (
            <div className="mt-1 space-y-0.5 pl-1.5">
              {queues.map((queue) => {
                const Icon = queue.icon;
                return (
                  <div
                    key={queue.name}
                    onClick={() => navigate('/workspace/kanban')}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center ${queue.color}`}>
                      <Icon className="w-2.5 h-2.5" />
                    </div>
                    <span className="text-xs truncate">{queue.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Super Admin Console Link (if user has privileges) */}
        {user?.isSuperAdmin && (
          <div className="pt-2 border-t border-[#EAECF0]">
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-purple-50 text-purple-700 font-semibold'
                    : 'text-purple-600 hover:bg-purple-50/60'
                }`
              }
            >
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Platform Super Admin</span>
            </NavLink>
          </div>
        )}
      </div>

      {/* 3. Pinned Bottom Footer */}
      <div className="p-3 border-t border-[#EAECF0] space-y-1 text-xs text-slate-600 bg-white">
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

        {/* User Card */}
        <div className="pt-2 mt-1 border-t border-[#EAECF0] flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar name={user?.name} src={user?.avatarUrl} size="sm" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                {user?.name || 'User'}
              </p>
              <p className="text-[10px] text-slate-400 truncate font-mono">
                {user?.email || 'user@example.com'}
              </p>
            </div>
          </div>
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
