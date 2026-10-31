import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  ChevronDown,
  Plus,
  Users,
  Check,
} from 'lucide-react';

interface WorkspaceDropdownProps {
  variant?: 'sidebar' | 'header';
  isCollapsed?: boolean;
}

export const WorkspaceDropdown: React.FC<WorkspaceDropdownProps> = ({
  variant = 'sidebar',
  isCollapsed = false,
}) => {
  const navigate = useNavigate();
  const { user, organization, memberships, switchOrganization } = useAuth();
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSwitching, setIsSwitching] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark' || theme === 'combo';

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectOrg = async (targetOrgId: string) => {
    if (!targetOrgId || targetOrgId === (organization?.id || (organization as any)?._id)) {
      setIsOpen(false);
      return;
    }

    setIsSwitching(true);
    try {
      await switchOrganization(targetOrgId);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to switch workspace:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return (
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
              isDark
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            Owner
          </span>
        );
      case 'admin':
        return (
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
              isDark
                ? 'bg-blue-950/70 text-blue-300 border-blue-800'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}
          >
            Admin
          </span>
        );
      case 'project_manager':
        return (
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
              isDark
                ? 'bg-purple-950/70 text-purple-300 border-purple-800'
                : 'bg-purple-50 text-purple-700 border-purple-200'
            }`}
          >
            Project Manager
          </span>
        );
      case 'team_lead':
        return (
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
              isDark
                ? 'bg-amber-950/70 text-amber-300 border-amber-800'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            Team Lead
          </span>
        );
      default:
        return (
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded-md border capitalize ${
              isDark
                ? 'bg-slate-800 text-slate-300 border-slate-700'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {(role || 'Member').replace(/_/g, ' ')}
          </span>
        );
    }
  };

  // Color generator for organization initials
  const getOrgColor = (name: string) => {
    const colors = [
      'bg-blue-600',
      'bg-indigo-600',
      'bg-violet-600',
      'bg-emerald-600',
      'bg-teal-600',
      'bg-sky-600',
    ];
    const code = (name || 'W').charCodeAt(0) || 0;
    return colors[code % colors.length];
  };

  const currentOrgId = organization?.id || (organization as any)?._id;
  const currentOrgName = organization?.name || 'Workspace';
  const currentRole = organization?.role || 'employee';

  return (
    <div className="relative inline-block text-left w-full" ref={dropdownRef}>
      {/* TRIGGER BUTTON */}
      {variant === 'header' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all text-xs cursor-pointer group shadow-2xs ${
            isDark
              ? 'bg-[#0F172A] hover:bg-slate-800 border-slate-700 text-slate-100'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
          }`}
          title="Switch Workspace"
        >
          <div
            className={`w-5 h-5 rounded-md ${getOrgColor(
              currentOrgName
            )} text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs`}
          >
            {currentOrgName.charAt(0).toUpperCase()}
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`font-bold truncate max-w-[140px] leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {currentOrgName}
            </span>
            <div className="hidden sm:inline-block scale-90 origin-left">
              {getRoleBadge(currentRole)}
            </div>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${
              isDark ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-400 group-hover:text-slate-600'
            } ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      ) : isCollapsed ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-10 h-10 rounded-xl ${getOrgColor(
            currentOrgName
          )} text-white font-black text-sm flex items-center justify-center mx-auto shadow-sm hover:ring-2 hover:ring-blue-400 transition-all cursor-pointer`}
          title={`${currentOrgName} - Click to switch workspace`}
        >
          {currentOrgName.charAt(0).toUpperCase()}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full border rounded-lg px-2.5 py-2 flex items-center justify-between transition-all cursor-pointer group text-left shadow-2xs ${
            isDark
              ? 'bg-[#0F172A] hover:bg-slate-800/80 border-slate-700/80'
              : 'bg-white hover:bg-slate-50 border-slate-200/90'
          }`}
        >
          <div className="min-w-0 flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-md ${getOrgColor(
                currentOrgName
              )} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs`}
            >
              {currentOrgName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p
                className={`text-xs font-bold truncate leading-tight transition-colors ${
                  isDark ? 'text-white group-hover:text-blue-400' : 'text-slate-900 group-hover:text-blue-600'
                }`}
              >
                {currentOrgName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[10px] capitalize ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {currentRole.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] text-blue-500 font-semibold capitalize">
                  • {organization?.subscriptionPlan || 'Free'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center text-slate-400 group-hover:text-slate-600 shrink-0 ml-1.5">
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>
      )}

      {/* DROPDOWN MENU POPUP */}
      {isOpen && (
        <div
          className={`absolute z-50 mt-1.5 w-76 rounded-xl shadow-2xl border overflow-hidden animate-fadeIn text-xs ${
            isDark
              ? 'bg-[#0F172A] border-slate-800 text-slate-200 shadow-slate-950/80'
              : 'bg-white border-slate-200 text-slate-800 shadow-xl'
          } ${
            variant === 'header'
              ? 'left-0'
              : isCollapsed
              ? 'left-14 top-0'
              : 'left-0 right-0'
          }`}
        >
          {/* Header */}
          <div
            className={`px-3.5 py-2.5 border-b flex items-center justify-between ${
              isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-slate-50 border-slate-100'
            }`}
          >
            <div>
              <p className={`text-[10px] font-semibold tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Workspaces & Organizations
              </p>
              <p className={`text-[11px] font-medium truncate max-w-[200px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {user?.email}
              </p>
            </div>
            {isSwitching && (
              <span className="text-[10px] text-blue-500 font-semibold animate-pulse">
                Switching...
              </span>
            )}
          </div>

          {/* List of Workspaces */}
          <div className={`max-h-64 overflow-y-auto py-1 divide-y ${isDark ? 'divide-slate-800/80' : 'divide-slate-50'}`}>
            {memberships && memberships.length > 0 ? (
              memberships.map((m: any) => {
                const org = m.organization;
                if (!org) return null;
                const orgId = org.id || org._id;
                const isActive = orgId === currentOrgId;
                const orgName = org.name || 'Workspace';

                return (
                  <button
                    key={orgId}
                    type="button"
                    onClick={() => handleSelectOrg(orgId)}
                    disabled={isSwitching}
                    className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left transition-colors cursor-pointer group ${
                      isActive
                        ? isDark
                          ? 'bg-blue-600/20 text-white font-semibold border-l-2 border-blue-500'
                          : 'bg-blue-50/80 text-blue-900 font-semibold border-l-2 border-blue-600'
                        : isDark
                        ? 'hover:bg-slate-800/60 text-slate-300'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-md ${getOrgColor(
                          orgName
                        )} text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-2xs`}
                      >
                        {orgName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`text-xs truncate ${
                            isActive
                              ? isDark
                                ? 'text-white font-bold'
                                : 'text-blue-900 font-bold'
                              : isDark
                              ? 'text-slate-200 font-medium group-hover:text-white'
                              : 'text-slate-800 font-medium group-hover:text-slate-900'
                          }`}
                        >
                          {orgName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {getRoleBadge(m.role)}
                          {org.subscriptionPlan && (
                            <span className="text-[10px] text-slate-400 capitalize">
                              • {org.subscriptionPlan}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 ml-2">
                      {isActive ? (
                        <span
                          className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                            isDark
                              ? 'text-emerald-300 bg-emerald-950/70 border-emerald-800'
                              : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          }`}
                        >
                          <Check className="w-3 h-3 stroke-[2.5]" />
                          Active
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                          Switch &rarr;
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="px-3.5 py-2.5 text-left">
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>{currentOrgName}</p>
                <div className="mt-1">{getRoleBadge(currentRole)}</div>
              </div>
            )}
          </div>

          {/* Actions Footer */}
          <div className={`p-1.5 border-t space-y-1 ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/onboarding');
              }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-transparent ${
                isDark
                  ? 'text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-700'
                  : 'text-slate-700 hover:text-blue-700 hover:bg-white hover:border-slate-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-blue-500" />
              <span>Create New Workspace</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/workspace/teams');
              }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Manage Team & Invitations</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
