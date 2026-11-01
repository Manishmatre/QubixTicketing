import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import {
  Ticket as TicketIcon,
  BarChart3,
  FolderKanban,
  Users,
  Layers,
  ChevronDown,
  LogOut,
  Zap,
  CreditCard,
  Settings,
  CheckCircle2,
  LayoutDashboard,
  CalendarRange,
  PanelLeftClose,
  PanelLeft,
  X,
  Building2,
} from 'lucide-react';

interface SidebarProps {
  isMobileDrawer?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileDrawer = false,
  onCloseMobile,
}) => {
  const { user, organization, memberships, switchOrganization, logout } = useAuth();
  const navigate = useNavigate();

  // Collapsible sidebar state (persisted in localStorage)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('godspeed_sidebar_collapsed') === 'true';
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('godspeed_sidebar_collapsed', String(next));
      return next;
    });
  };

  const effectiveCollapsed = isMobileDrawer ? false : isCollapsed;

  // Role-Based Access Control inside current organization
  const userRole = organization?.role || 'employee';
  const isOrgAdmin = userRole === 'owner' || userRole === 'admin';

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center ${
      isCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3'
    } py-2 rounded-lg font-medium transition-all ${
      isActive
        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border-l-2 border-blue-600 shadow-2xs'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
    }`;

  return (
    <aside
      className={`${
        isMobileDrawer
          ? 'w-full h-full'
          : effectiveCollapsed
          ? 'w-16'
          : 'w-64'
      } bg-[#F8FAFC] dark:bg-[#0F172A] border-r border-slate-300 dark:border-slate-800 flex flex-col shrink-0 select-none h-screen sticky top-0 z-30 font-sans text-slate-800 dark:text-slate-200 transition-all duration-300 ease-in-out`}
    >
      {/* 1. Dedicated GodSpeed Operations Brand Banner */}
      <div className={`h-14 px-3 border-b border-slate-300 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-between ${effectiveCollapsed ? 'justify-center' : ''}`}>
        {effectiveCollapsed ? (
          <Link
            to="/workspace/dashboard"
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white font-black text-sm flex items-center justify-center shadow-xs hover:ring-2 hover:ring-blue-400 transition-all cursor-pointer"
            title="GodSpeed Home Sales - Operations Desk"
          >
            G
          </Link>
        ) : (
          <Link
            to="/workspace/dashboard"
            className="flex items-center gap-2.5 min-w-0 group cursor-pointer"
            title="GodSpeed Home Sales Operations Desk"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/25 group-hover:scale-105 transition-transform">
              G
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  GodSpeed Home Sales
                </p>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Active Operations Desk" />
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold tracking-wide">
                  Operations Desk
                </span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500">• Real Estate</span>
              </div>
            </div>
          </Link>
        )}
        {isMobileDrawer && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 ml-1 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. Primary Navigation Links */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 text-xs">
        <div className="space-y-1">
          <NavLink
            to="/workspace/dashboard"
            title="Dashboard"
            className={getNavLinkClass}
          >
            <LayoutDashboard className="w-4 h-4 text-slate-500 shrink-0" />
            {!isCollapsed && <span>Dashboard</span>}
          </NavLink>

          <NavLink
            to="/workspace/kanban"
            title="Kanban Board"
            className={({ isActive }) =>
              `flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-3'} py-2 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border-l-2 border-blue-600 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            <div className="flex items-center gap-2.5">
              <TicketIcon className="w-4 h-4 text-slate-500 shrink-0" />
              {!isCollapsed && <span>Kanban Board</span>}
            </div>
            {!isCollapsed && (
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow-2xs">
                Live
              </span>
            )}
          </NavLink>

          <NavLink
            to="/workspace/timeline"
            title="Timeline (Gantt)"
            className={getNavLinkClass}
          >
            <CalendarRange className="w-4 h-4 text-slate-500 shrink-0" />
            {!isCollapsed && <span>Timeline (Gantt)</span>}
          </NavLink>

          <NavLink
            to="/workspace/tickets"
            title="All Tickets"
            className={getNavLinkClass}
          >
            <Layers className="w-4 h-4 text-slate-500 shrink-0" />
            {!isCollapsed && <span>All Deliverables</span>}
          </NavLink>

          <NavLink
            to="/workspace/my-tickets"
            title="My Tickets"
            className={getNavLinkClass}
          >
            <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0" />
            {!isCollapsed && <span>My Queue</span>}
          </NavLink>

          <NavLink
            to="/workspace/projects"
            title="Projects"
            className={getNavLinkClass}
          >
            <FolderKanban className="w-4 h-4 text-slate-500 shrink-0" />
            {!isCollapsed && <span>Operational Projects</span>}
          </NavLink>

          <NavLink
            to="/workspace/teams"
            title="Teams"
            className={getNavLinkClass}
          >
            <Users className="w-4 h-4 text-slate-500 shrink-0" />
            {!isCollapsed && <span>Teams</span>}
          </NavLink>

          <NavLink
            to="/workspace/analytics"
            title="Analytics & SLA"
            className={getNavLinkClass}
          >
            <BarChart3 className="w-4 h-4 text-slate-500 shrink-0" />
            {!isCollapsed && <span>Analytics & SLA</span>}
          </NavLink>

          {/* Administrative Automations */}
          {isOrgAdmin && (
            <NavLink
              to="/workspace/workflows"
              title="Automations"
              className={getNavLinkClass}
            >
              <Zap className="w-4 h-4 text-slate-500 shrink-0" />
              {!isCollapsed && <span>Automations</span>}
            </NavLink>
          )}
        </div>
      </div>

      {/* 3. Pinned Bottom Footer */}
      <div className="p-2 border-t border-slate-300 dark:border-slate-800 space-y-1 text-xs text-slate-600 dark:text-slate-400 bg-[#F8FAFC] dark:bg-[#0F172A]">
        {/* Organization Admin Level Actions: Settings */}
        {isOrgAdmin && (
          <NavLink
            to="/workspace/settings"
            title="Workspace Settings"
            className={({ isActive }) =>
              `flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-2.5 px-2.5 py-1.5'} rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors ${
                isActive ? 'text-blue-700 dark:text-blue-300 font-bold' : 'text-slate-600 dark:text-slate-400'
              }`
            }
          >
            <Settings className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {!isCollapsed && <span>Settings</span>}
          </NavLink>
        )}

        {/* Collapse / Expand Toggle Button (Desktop Only) */}
        {!isMobileDrawer && (
          <button
            onClick={toggleCollapse}
            title={effectiveCollapsed ? 'Expand sidebar' : 'Collapse to icon-only'}
            className={`w-full flex items-center ${
              effectiveCollapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'
            } rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer text-xs font-medium`}
          >
            <div className="flex items-center gap-2">
              {effectiveCollapsed ? (
                <PanelLeft className="w-4 h-4 text-blue-600" />
              ) : (
                <PanelLeftClose className="w-4 h-4 text-slate-400" />
              )}
              {!effectiveCollapsed && <span>Collapse sidebar</span>}
            </div>
            {!effectiveCollapsed && <span className="text-[10px] text-slate-400 font-mono">⌘B</span>}
          </button>
        )}

        {/* User Card */}
        <div className="pt-2 mt-1 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-1">
          <Link
            to="/workspace/profile"
            onClick={onCloseMobile}
            className={`flex items-center ${effectiveCollapsed ? 'justify-center w-full' : 'gap-2.5 min-w-0'} hover:opacity-85 transition-opacity`}
            title={`View Profile: ${user?.name || 'User'}`}
          >
            <Avatar name={user?.name} src={user?.avatarUrl} size="sm" />
            {!effectiveCollapsed && (
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
                  {user?.name || 'User'}
                </p>
                <p className="text-[10px] text-slate-400 truncate font-mono">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
            )}
          </Link>
          {!effectiveCollapsed && (
            <button
              onClick={() => logout()}
              title="Log Out"
              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
