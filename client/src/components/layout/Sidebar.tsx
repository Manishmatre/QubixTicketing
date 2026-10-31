import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import {
  Search,
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
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, organization, memberships, switchOrganization, logout } = useAuth();
  const navigate = useNavigate();

  const [viewsOpen, setViewsOpen] = useState(true);
  const [queuesOpen, setQueuesOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Sample teammates for the "Views" section as shown in reference UI
  const teamMembers = [
    { name: 'Sarah Jenkins', dot: 'bg-amber-500', count: 4 },
    { name: 'Alex Rivera', dot: 'bg-blue-500', count: 6 },
    { name: 'Emma Watson', dot: 'bg-purple-500', count: 2 },
    { name: 'Michael Chang', dot: 'bg-emerald-500', count: 3 },
    { name: 'Kevin Coleman', dot: 'bg-rose-500', count: 1 },
  ];

  // Sample Queues with colored action icons as shown in reference UI
  const queues = [
    { name: 'Knowledge', icon: BookOpen, color: 'text-amber-500 bg-amber-50' },
    { name: 'Usability', icon: Link2, color: 'text-blue-500 bg-blue-50' },
    { name: 'Features', icon: Sparkles, color: 'text-purple-500 bg-purple-50' },
    { name: 'Design', icon: Layers, color: 'text-pink-500 bg-pink-50' },
    { name: 'AI-Stack', icon: Zap, color: 'text-emerald-500 bg-emerald-50' },
    { name: 'Slack Sync', icon: Hash, color: 'text-slate-600 bg-slate-100' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#EAECF0] flex flex-col shrink-0 select-none h-screen sticky top-0 z-30 font-sans text-slate-800">
      {/* Top Workspace Header matching reference */}
      <div className="p-3 border-b border-[#EAECF0]">
        <div className="flex items-center justify-between px-1.5 py-1 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Dark Square Workspace Initial */}
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
              {organization?.name ? organization.name.charAt(0).toUpperCase() : 'Q'}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xs font-bold text-slate-900 truncate leading-tight flex items-center gap-1">
                {organization?.name || 'QubixDesk'}
              </h2>
              <p className="text-[10px] text-slate-400 capitalize truncate font-medium">
                {organization?.subscriptionPlan || 'Enterprise'} Plan
              </p>
            </div>
          </div>
          <div className="text-slate-400 group-hover:text-slate-700 transition-colors">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Quick Search with ⌘K badge */}
        <div className="mt-2.5 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#EAECF0] rounded-lg pl-8 pr-8 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 bg-white border border-slate-200 px-1 py-0.2 rounded font-mono">
            ⌘K
          </span>
        </div>
      </div>

      {/* Primary Navigation */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 text-xs">
        {/* Core Items */}
        <div className="space-y-0.5">
          <NavLink
            to="/workspace/kanban"
            className={({ isActive }) =>
              `flex items-center justify-between px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <div className="flex items-center gap-2.5">
              <TicketIcon className="w-4 h-4 text-slate-500" />
              <span>Tickets</span>
            </div>
            {/* Colorful red action badge like in screenshot */}
            <span className="bg-[#EF4444] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              17
            </span>
          </NavLink>

          <NavLink
            to="/workspace/reports"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <BarChart3 className="w-4 h-4 text-slate-500" />
            <span>Analytics</span>
          </NavLink>

          <NavLink
            to="/workspace/projects"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-slate-100 text-slate-900 font-semibold'
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
              `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <Users className="w-4 h-4 text-slate-500" />
            <span>Members</span>
          </NavLink>

          <NavLink
            to="/workspace/workflows"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <Zap className="w-4 h-4 text-slate-500" />
            <span>Automations</span>
          </NavLink>
        </div>

        {/* Collapsible Views (Team Member filters) */}
        <div>
          <div
            onClick={() => setViewsOpen(!viewsOpen)}
            className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              {viewsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <span>Views</span>
            </div>
            <Plus className="w-3 h-3 opacity-60 hover:opacity-100" />
          </div>

          {viewsOpen && (
            <div className="mt-1 space-y-0.5 pl-2">
              {teamMembers.map((member) => (
                <div
                  key={member.name}
                  onClick={() => navigate('/workspace/kanban')}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${member.dot}`} />
                    <span className="text-xs truncate">{member.name.split(' ')[0]}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{member.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Collapsible Queues with colored action icons */}
        <div>
          <div
            onClick={() => setQueuesOpen(!queuesOpen)}
            className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              {queuesOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <span>Queues</span>
            </div>
            <Plus className="w-3 h-3 opacity-60 hover:opacity-100" />
          </div>

          {queuesOpen && (
            <div className="mt-1 space-y-0.5 pl-2">
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

        {/* Super Admin Console Shortcut */}
        {user?.isSuperAdmin && (
          <div className="pt-2 border-t border-[#EAECF0]">
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-purple-50 text-purple-700 font-semibold'
                    : 'text-purple-600 hover:bg-purple-50/60'
                }`
              }
            >
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Super Admin</span>
            </NavLink>
          </div>
        )}
      </div>

      {/* Bottom Pinned Footer matching reference */}
      <div className="p-3 border-t border-[#EAECF0] space-y-1 text-xs text-slate-600">
        <button
          onClick={() => navigate('/workspace/settings')}
          className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
        >
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>Support & Docs</span>
        </button>

        <button
          onClick={() => navigate('/workspace/teams')}
          className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
        >
          <UserPlus className="w-3.5 h-3.5 text-slate-400" />
          <span>Invite teammates</span>
        </button>

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
