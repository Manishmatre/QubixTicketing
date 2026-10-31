import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { WorkspaceDropdown } from './WorkspaceDropdown';
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
    return localStorage.getItem('qubix_sidebar_collapsed') === 'true';
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('qubix_sidebar_collapsed', String(next));
      return next;
    });
  };

  const effectiveCollapsed = isMobileDrawer ? false : isCollapsed;

  // Role-Based Access Control inside current organization
  const userRole = organization?.role || 'employee';
  const isOrgAdmin = userRole === 'owner' || userRole === 'admin';

  return (
    <aside
      className={`${
        isMobileDrawer
          ? 'w-full h-full'
          : effectiveCollapsed
          ? 'w-16'
          : 'w-64'
      } bg-[#F8FAFC] border-r border-slate-200/90 flex flex-col shrink-0 select-none h-screen sticky top-0 z-30 font-sans text-slate-800 transition-all duration-300 ease-in-out`}
    >
      {/* 1. Interactive Multi-Workspace Switcher */}
      <div className={`h-14 px-2.5 border-b border-slate-200/80 bg-[#F8FAFC] flex items-center justify-between ${effectiveCollapsed ? 'justify-center' : ''}`}>
        <div className="flex-1 min-w-0">
          <WorkspaceDropdown variant="sidebar" isCollapsed={effectiveCollapsed} />
        </div>
        {isMobileDrawer && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 ml-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
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
            className={({ isActive }) =>
              `flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3'} py-2 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`
            }
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
                  ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
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
            to="/workspace/gantt"
            title="Timeline & Gantt View"
            className={({ isActive }) =>
              `flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3'} py-2 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`
            }
          >
            <CalendarRange className="w-4 h-4 text-slate-500 shrink-0" />
            {!isCollapsed && <span>Timeline (Gantt)</span>}
          </NavLink>

          <NavLink
            to="/workspace/tickets"
            title="All Tickets"
            className={({ isActive }) =>
              `flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3'} py-2 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`
            }
          >
            <Layers className="w-4 h-4 text-slate-500 shrink-0" />
            {!isCollapsed && <span>All Tickets</span>}
          </NavLink>

          <NavLink
            to="/workspace/my-tickets"
            title="My Tickets"
            className={({ isActive }) =>
              `flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3'} py-2 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`
            }
          >
            <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0" />
            {!isCollapsed && <span>My Tickets</span>}
          </NavLink>

          <NavLink
            to="/workspace/projects"
            title="Projects"
            className={({ isActive }) =>
              `flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3'} py-2 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`
            }
          >
            <FolderKanban className="w-4 h-4 text-slate-500 shrink-0" />
            {!isCollapsed && <span>Projects</span>}
          </NavLink>

          <NavLink
            to="/workspace/teams"
            title="Teams & Members"
            className={({ isActive }) =>
              `flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3'} py-2 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`
            }
          >
            <Users className="w-4 h-4 text-slate-500 shrink-0" />
            {!isCollapsed && <span>Teams</span>}
          </NavLink>

          <NavLink
            to="/workspace/reports"
            title="Analytics & SLA"
            className={({ isActive }) =>
              `flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3'} py-2 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`
            }
          >
            <BarChart3 className="w-4 h-4 text-slate-500 shrink-0" />
            {!isCollapsed && <span>Analytics & SLA</span>}
          </NavLink>

          {/* Administrative Automations */}
          {isOrgAdmin && (
            <NavLink
              to="/workspace/workflows"
              title="Automations"
              className={({ isActive }) =>
                `flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3'} py-2 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                }`
              }
            >
              <Zap className="w-4 h-4 text-slate-500 shrink-0" />
              {!isCollapsed && <span>Automations</span>}
            </NavLink>
          )}
        </div>
      </div>

      {/* 3. Pinned Bottom Footer */}
      <div className="p-2 border-t border-slate-200/80 space-y-1 text-xs text-slate-600 bg-[#F8FAFC]">
        {/* Organization Admin Level Actions: Billing & Settings */}
        {isOrgAdmin && (
          <>
            <NavLink
              to="/workspace/billing"
              title="Billing & Plan"
              className={({ isActive }) =>
                `flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-2.5 px-2.5 py-1.5'} rounded-lg hover:bg-slate-200/60 transition-colors ${
                  isActive ? 'text-blue-700 font-bold' : 'text-slate-600'
                }`
              }
            >
              <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {!isCollapsed && <span>Billing & Plan</span>}
            </NavLink>

            <NavLink
              to="/workspace/settings"
              title="Workspace Settings"
              className={({ isActive }) =>
                `flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-2.5 px-2.5 py-1.5'} rounded-lg hover:bg-slate-200/60 transition-colors ${
                  isActive ? 'text-blue-700 font-bold' : 'text-slate-600'
                }`
              }
            >
              <Settings className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {!isCollapsed && <span>Settings</span>}
            </NavLink>
          </>
        )}

        {/* Collapse / Expand Toggle Button (Desktop Only) */}
        {!isMobileDrawer && (
          <button
            onClick={toggleCollapse}
            title={effectiveCollapsed ? 'Expand sidebar' : 'Collapse to icon-only'}
            className={`w-full flex items-center ${
              effectiveCollapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'
            } rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer text-xs font-medium`}
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
        <div className="pt-2 mt-1 border-t border-slate-200/80 flex items-center justify-between px-1">
          <Link
            to="/workspace/profile"
            onClick={onCloseMobile}
            className={`flex items-center ${effectiveCollapsed ? 'justify-center w-full' : 'gap-2.5 min-w-0'} hover:opacity-85 transition-opacity`}
            title={`View Profile: ${user?.name || 'User'}`}
          >
            <Avatar name={user?.name} src={user?.avatarUrl} size="sm" />
            {!effectiveCollapsed && (
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate leading-tight">
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
              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
