import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  Plus,
  Users,
  Briefcase,
  ShieldCheck,
  Check,
  Layers,
  Sparkles,
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
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSwitching, setIsSwitching] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    const formatted = (role || 'Member').replace(/_/g, ' ');
    switch (role) {
      case 'owner':
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
            Owner
          </span>
        );
      case 'admin':
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase">
            Admin
          </span>
        );
      case 'project_manager':
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 uppercase">
            Project Mgr
          </span>
        );
      case 'team_lead':
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 uppercase">
            Team Lead
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 capitalize">
            {formatted}
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
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-all text-xs cursor-pointer group shadow-2xs"
          title="Switch Organization / Company"
        >
          <div
            className={`w-5 h-5 rounded-md ${getOrgColor(
              currentOrgName
            )} text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs`}
          >
            {currentOrgName.charAt(0).toUpperCase()}
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-bold text-slate-900 truncate max-w-[140px] leading-tight">
              {currentOrgName}
            </span>
            <div className="hidden sm:inline-block scale-90 origin-left">
              {getRoleBadge(currentRole)}
            </div>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      ) : isCollapsed ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-10 h-10 rounded-xl ${getOrgColor(
            currentOrgName
          )} text-white font-black text-sm flex items-center justify-center mx-auto shadow-sm hover:ring-2 hover:ring-blue-400 transition-all cursor-pointer`}
          title={`${currentOrgName} (${currentRole}) - Click to switch company`}
        >
          {currentOrgName.charAt(0).toUpperCase()}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-[#F8FAFC] border border-[#EAECF0] hover:border-slate-300 rounded-lg px-2.5 py-2 flex items-center justify-between transition-all cursor-pointer group text-left shadow-2xs"
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
              <p className="text-xs font-bold text-slate-900 truncate leading-tight group-hover:text-blue-600 transition-colors">
                {currentOrgName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-slate-500 capitalize">
                  {currentRole.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] text-blue-600 font-semibold capitalize">
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

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div
          className={`absolute z-50 mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-fadeIn text-xs ${
            variant === 'header'
              ? 'left-0'
              : isCollapsed
              ? 'left-14 top-0'
              : 'left-0 right-0'
          }`}
        >
          {/* Header */}
          <div className="px-3.5 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Workspaces & Companies
              </p>
              <p className="text-[11px] font-medium text-slate-700 truncate max-w-[200px]">
                {user?.email}
              </p>
            </div>
            {isSwitching && (
              <span className="text-[10px] text-blue-600 font-semibold animate-pulse">
                Switching...
              </span>
            )}
          </div>

          {/* List of Workspaces */}
          <div className="max-h-64 overflow-y-auto py-1 divide-y divide-slate-50">
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
                        ? 'bg-blue-50/60 font-semibold'
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
                              ? 'text-blue-900 font-bold'
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
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                          Active
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                          Switch &rarr;
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="px-3.5 py-2.5 text-left">
                <p className="font-semibold text-slate-800">{currentOrgName}</p>
                <div className="mt-1">{getRoleBadge(currentRole)}</div>
              </div>
            )}
          </div>

          {/* Actions Footer */}
          <div className="p-1.5 bg-slate-50 border-t border-slate-100 space-y-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/onboarding');
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-700 hover:text-blue-700 hover:bg-white text-xs font-semibold transition-colors cursor-pointer border border-transparent hover:border-slate-200"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>Create New Workspace</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/workspace/teams');
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white text-[11px] font-medium transition-colors cursor-pointer"
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
