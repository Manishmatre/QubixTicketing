import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Project, Ticket } from '../../types';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';
import {
  ArrowLeft,
  FolderKanban,
  Calendar,
  Clock,
  User as UserIcon,
  Users,
  CheckCircle2,
  Circle,
  Plus,
  Search,
  Filter,
  Layers,
  Flag,
  Share2,
  Settings,
  Trash2,
  Edit2,
  Save,
  CheckSquare,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  UserPlus,
  Milestone,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export const ProjectDetailsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user, organization } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTab, setActiveTab] = useState<'tickets' | 'milestones' | 'team' | 'settings'>('tickets');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters for tickets tab
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState<boolean>(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState<boolean>(false);
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState<boolean>(false);

  // New Milestone Form
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDesc, setMilestoneDesc] = useState('');
  const [milestoneDueDate, setMilestoneDueDate] = useState('');
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);

  // New Member Form
  const [orgMembers, setOrgMembers] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'lead' | 'member' | 'viewer'>('member');
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Quick Ticket Form
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketPriority, setTicketPriority] = useState('Normal');
  const [ticketCategory, setTicketCategory] = useState('Bug');
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  // Edit Project Settings Form
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState('Engineering');
  const [editPriority, setEditPriority] = useState('normal');
  const [editStatus, setEditStatus] = useState('active');
  const [editTargetDate, setEditTargetDate] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const fetchProjectData = async (id: string) => {
    setIsLoading(true);
    try {
      const [projRes, ticketsRes] = await Promise.all([
        apiClient.get(`/projects/${id}`),
        apiClient.get(`/tickets?projectId=${id}&limit=100`),
      ]);

      if (projRes.data.success) {
        setProject(projRes.data.data);
        setEditName(projRes.data.data.name);
        setEditDesc(projRes.data.data.description || '');
        setEditCategory(projRes.data.data.category || 'Engineering');
        setEditPriority(projRes.data.data.priority || 'normal');
        setEditStatus(projRes.data.data.status || 'active');
        if (projRes.data.data.targetDate) {
          setEditTargetDate(format(new Date(projRes.data.data.targetDate), 'yyyy-MM-dd'));
        }
      }
      if (ticketsRes.data.success) {
        setTickets(ticketsRes.data.data);
      }
    } catch (err) {
      console.error('Fetch project error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProjectData(projectId);
    }
  }, [projectId]);

  // Fetch org members for adding members modal
  const fetchOrgMembers = async () => {
    try {
      const res = await apiClient.get('/organizations/members');
      if (res.data.success) {
        setOrgMembers(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedMemberId(res.data.data[0].user?.id || res.data.data[0].id);
        }
      }
    } catch (err) {
      // ignore
    }
  };

  const handleOpenMemberModal = () => {
    fetchOrgMembers();
    setIsMemberModalOpen(true);
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !milestoneTitle.trim() || !milestoneDueDate) return;
    setIsAddingMilestone(true);
    try {
      const res = await apiClient.post(`/projects/${project._id}/milestones`, {
        title: milestoneTitle.trim(),
        description: milestoneDesc.trim(),
        dueDate: milestoneDueDate,
      });
      if (res.data.success) {
        setProject((prev) => (prev ? { ...prev, milestones: res.data.data } : prev));
        setIsMilestoneModalOpen(false);
        setMilestoneTitle('');
        setMilestoneDesc('');
        setMilestoneDueDate('');
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to add milestone');
    } finally {
      setIsAddingMilestone(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !selectedMemberId) return;
    setIsAddingMember(true);
    try {
      const res = await apiClient.post(`/projects/${project._id}/members`, {
        userId: selectedMemberId,
        role: selectedRole,
      });
      if (res.data.success) {
        setProject(res.data.data);
        setIsMemberModalOpen(false);
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to add project member');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !ticketTitle.trim()) return;
    setIsCreatingTicket(true);
    try {
      const res = await apiClient.post('/tickets', {
        title: ticketTitle.trim(),
        projectId: project._id,
        priority: ticketPriority,
        category: ticketCategory,
      });
      if (res.data.success) {
        setTickets((prev) => [res.data.data, ...prev]);
        setIsCreateTicketOpen(false);
        setTicketTitle('');
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create ticket');
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setIsSavingSettings(true);
    try {
      const res = await apiClient.patch(`/projects/${project._id}`, {
        name: editName.trim(),
        description: editDesc.trim(),
        category: editCategory,
        priority: editPriority,
        status: editStatus,
        targetDate: editTargetDate ? new Date(editTargetDate).toISOString() : undefined,
      });
      if (res.data.success) {
        setProject(res.data.data);
        alert('Project settings updated successfully!');
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to save project settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    if (!confirm(`Are you sure you want to permanently delete project "${project.name}" and all of its tickets?`)) {
      return;
    }
    try {
      const res = await apiClient.delete(`/projects/${project._id}`);
      if (res.data.success) {
        navigate('/workspace/projects');
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to delete project');
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.ticketNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalTickets = tickets.length;
  const resolvedTickets = tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length;
  const progressPercent = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-3.5rem)] bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] bg-white p-6">
        <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
        <h3 className="text-base font-bold text-slate-800">Project Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">The requested project workspace may have been removed.</p>
        <Link to="/workspace/projects">
          <Button size="sm">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white font-sans text-slate-800 p-6 space-y-4">
      {/* 1. Header & Navigation Row */}
      <div className="flex items-center justify-between pb-1">
        <button
          onClick={() => navigate('/workspace/projects')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Projects</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Project link copied to clipboard!');
            }}
            title="Share project"
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <Button
            size="sm"
            onClick={() => setIsCreateTicketOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            New Ticket
          </Button>
        </div>
      </div>

      {/* 2. Project Hero Card - Sleek Minimalist Padding */}
      <div className="bg-[#F8FAFC] border border-[#EAECF0] rounded-xl p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                [{project.key}]
              </span>
              <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
                {project.name}
              </h1>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize">
                {project.status || 'Active'}
              </span>
              <span className="bg-slate-100 text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded-full">
                {project.category || 'Engineering'}
              </span>
            </div>

            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              {project.description || 'No project description provided.'}
            </p>
          </div>

          <div className="flex items-center gap-5 shrink-0 text-xs text-slate-500">
            <div className="text-right">
              <span className="text-xs font-medium text-slate-400 block">Lead</span>
              <div className="flex items-center gap-1.5 mt-0.5 font-semibold text-slate-800">
                <Avatar name={project.projectManagerId?.name || 'Lead'} src={project.projectManagerId?.avatarUrl} size="xs" />
                <span>{project.projectManagerId?.name || 'Project Lead'}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-medium text-slate-400 block">Target date</span>
              <div className="flex items-center gap-1 mt-0.5 font-semibold text-slate-800">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{project.targetDate ? format(new Date(project.targetDate), 'MMM d, yyyy') : 'No target'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar & Telemetry Stats - Refined Sentence Case */}
        <div className="pt-3 border-t border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-700">Project delivery velocity</span>
            <span className="text-blue-600">{progressPercent}% completed</span>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="bg-white border border-[#EAECF0] rounded-xl px-3 py-2 text-center shadow-2xs">
              <span className="block text-base font-bold text-slate-900">{totalTickets}</span>
              <span className="text-xs font-medium text-slate-500">Total tickets</span>
            </div>
            <div className="bg-white border border-[#EAECF0] rounded-xl px-3 py-2 text-center shadow-2xs">
              <span className="block text-base font-bold text-amber-600">
                {tickets.filter((t) => t.status === 'In Progress').length}
              </span>
              <span className="text-xs font-medium text-slate-500">In progress</span>
            </div>
            <div className="bg-white border border-[#EAECF0] rounded-xl px-3 py-2 text-center shadow-2xs">
              <span className="block text-base font-bold text-emerald-600">{resolvedTickets}</span>
              <span className="text-xs font-medium text-slate-500">Resolved</span>
            </div>
            <div className="bg-white border border-[#EAECF0] rounded-xl px-3 py-2 text-center shadow-2xs">
              <span className="block text-base font-bold text-blue-600">{project.members?.length || 1}</span>
              <span className="text-xs font-medium text-slate-500">Engineers</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Tab Navigation */}
      <div className="flex items-center gap-4 border-b border-[#EAECF0] text-xs font-bold">
        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-all ${
            activeTab === 'tickets'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Tickets & Issues ({tickets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('milestones')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-all ${
            activeTab === 'milestones'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Milestone className="w-4 h-4" />
          <span>Roadmap & Milestones ({project.milestones?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-all ${
            activeTab === 'team'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team & Roles ({project.members?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-all ${
            activeTab === 'settings'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Project Settings</span>
        </button>
      </div>

      {/* 4. Tab Contents */}

      {/* TAB 1: Project Tickets */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-64 relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter tickets in project..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#EAECF0] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#F8FAFC] border border-[#EAECF0] rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="To Do">Open / To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Under Review">Customer in Review</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <Button size="sm" onClick={() => setIsCreateTicketOpen(true)} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Create Ticket
            </Button>
          </div>

          {filteredTickets.length === 0 ? (
            <div className="p-12 text-center bg-[#F8FAFC] border border-[#EAECF0] rounded-xl text-xs text-slate-400">
              <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-600">No tickets found in this project</p>
              <p className="mt-1">Add your first ticket to start tracking tasks and bugs.</p>
            </div>
          ) : (
            <div className="bg-white border border-[#EAECF0] rounded-xl shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[750px] border-collapse">
                  <thead className="bg-[#F8FAFC] border-b border-[#EAECF0] text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4 w-28">ID</th>
                      <th className="py-3 px-4">Title</th>
                      <th className="py-3 px-4 w-32">Status</th>
                      <th className="py-3 px-4 w-28">Priority</th>
                      <th className="py-3 px-4 w-36">Assignee</th>
                      <th className="py-3 px-4 w-28">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAECF0]">
                    {filteredTickets.map((t) => (
                      <tr
                        key={t._id}
                        onClick={() => navigate(`/workspace/tickets/${t._id}`)}
                        className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-blue-600">
                          {t.ticketNumber}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                            {t.title}
                          </p>
                          <p className="text-[11px] text-slate-400">{t.category || 'General'}</p>
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={t.status} size="sm" />
                        </td>
                        <td className="py-3 px-4">
                          <PriorityBadge priority={t.priority} size="sm" />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Avatar name={t.assigneeId?.name || 'User'} src={t.assigneeId?.avatarUrl} size="xs" />
                            <span className="font-medium text-slate-700">{t.assigneeId?.name || 'Unassigned'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Milestones */}
      {activeTab === 'milestones' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Release Milestones</h3>
              <p className="text-xs text-slate-500">Track major delivery phases and deadlines.</p>
            </div>
            <Button size="sm" onClick={() => setIsMilestoneModalOpen(true)} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Add Milestone
            </Button>
          </div>

          {!project.milestones || project.milestones.length === 0 ? (
            <div className="p-12 text-center bg-[#F8FAFC] border border-[#EAECF0] rounded-xl text-xs text-slate-400">
              <Milestone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-600">No milestones configured yet</p>
              <p className="mt-1">Add release goals or sprint milestones for this project.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {project.milestones.map((m, idx) => (
                <div
                  key={m._id || idx}
                  className="bg-white border border-[#EAECF0] rounded-xl p-4 flex items-center justify-between gap-4 shadow-2xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Flag className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{m.title}</h4>
                      {m.description && <p className="text-xs text-slate-500 mt-0.5">{m.description}</p>}
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 font-medium">
                        <Calendar className="w-3 h-3" />
                        <span>Due {format(new Date(m.dueDate), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>

                  <span className="bg-blue-50 text-blue-700 border border-blue-200/80 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Active Target
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Team */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Project Members</h3>
              <p className="text-xs text-slate-500">Engineers and contributors assigned to this workspace.</p>
            </div>
            <Button size="sm" onClick={handleOpenMemberModal} leftIcon={<UserPlus className="w-3.5 h-3.5" />}>
              Add Member
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.members?.map((m: any, idx: number) => {
              const u = m.userId;
              return (
                <div
                  key={m._id || idx}
                  className="bg-white border border-[#EAECF0] rounded-xl p-4 flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={u?.name || 'Member'} src={u?.avatarUrl} size="sm" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{u?.name || 'Engineer'}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">{u?.email}</p>
                    </div>
                  </div>
                  <span className="bg-slate-100 text-slate-700 font-bold text-[10px] px-2 py-0.5 rounded-full capitalize">
                    {m.role || 'Member'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: Project Settings */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveSettings} className="bg-white border border-[#EAECF0] rounded-xl p-6 shadow-2xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-600" />
              <span>Project Details & Configuration</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <Input
                label="Project Name *"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 text-xs">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full bg-white border border-[#EAECF0] rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Product">Product Roadmap</option>
                  <option value="Design">UI/UX Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Client Project">Client Project</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 text-xs">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-white border border-[#EAECF0] rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 text-xs">Target Delivery Date</label>
                <input
                  type="date"
                  value={editTargetDate}
                  onChange={(e) => setEditTargetDate(e.target.value)}
                  className="w-full bg-white border border-[#EAECF0] rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1.5 text-xs">Project Description</label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-white border border-[#EAECF0] rounded-lg p-3 text-xs text-slate-800 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button type="submit" variant="primary" isLoading={isSavingSettings} leftIcon={<Save className="w-3.5 h-3.5" />}>
                Save Project Changes
              </Button>
            </div>
          </form>

          {/* Danger Zone */}
          <div className="bg-red-50/50 border border-red-200 rounded-xl p-6 shadow-2xs space-y-3">
            <h4 className="text-sm font-bold text-red-900">Danger Zone</h4>
            <p className="text-xs text-red-700">
              Permanently delete this project along with all associated tickets, sub-tickets, comments, and milestones.
            </p>
            <Button size="sm" variant="danger" onClick={handleDeleteProject} leftIcon={<Trash2 className="w-3.5 h-3.5" />}>
              Delete Project
            </Button>
          </div>
        </div>
      )}

      {/* Modal: New Milestone */}
      <Modal isOpen={isMilestoneModalOpen} onClose={() => setIsMilestoneModalOpen(false)} title="Add Project Milestone">
        <form onSubmit={handleAddMilestone} className="space-y-4 text-xs">
          <Input
            label="Milestone Title *"
            value={milestoneTitle}
            onChange={(e) => setMilestoneTitle(e.target.value)}
            placeholder="e.g. Beta MVP Release"
            required
          />

          <Input
            label="Target Date *"
            type="date"
            value={milestoneDueDate}
            onChange={(e) => setMilestoneDueDate(e.target.value)}
            required
          />

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Description (Optional)</label>
            <textarea
              rows={2}
              value={milestoneDesc}
              onChange={(e) => setMilestoneDesc(e.target.value)}
              placeholder="What deliverables are expected..."
              className="w-full border border-slate-300 rounded-lg p-2 text-xs outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsMilestoneModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isAddingMilestone}>Add Milestone</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Member */}
      <Modal isOpen={isMemberModalOpen} onClose={() => setIsMemberModalOpen(false)} title="Add Team Member to Project">
        <form onSubmit={handleAddMember} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Select Organization Member *</label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs outline-none focus:border-blue-500"
            >
              {orgMembers.map((m: any) => (
                <option key={m.id || m._id} value={m.user?.id || m.userId?._id || m.id}>
                  {m.user?.name || m.name || m.user?.email || 'Member'} ({m.user?.email || m.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Project Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as any)}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs outline-none focus:border-blue-500"
            >
              <option value="member">Member</option>
              <option value="lead">Lead</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsMemberModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isAddingMember}>Add to Project</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Quick Ticket */}
      <Modal isOpen={isCreateTicketOpen} onClose={() => setIsCreateTicketOpen(false)} title={`Create Ticket in ${project.name}`}>
        <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
          <Input
            label="Ticket Title *"
            value={ticketTitle}
            onChange={(e) => setTicketTitle(e.target.value)}
            placeholder="e.g. Implement Webhook retry backoff"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Priority</label>
              <select
                value={ticketPriority}
                onChange={(e) => setTicketPriority(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs outline-none focus:border-blue-500"
              >
                <option value="Critical">Critical</option>
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Normal">Normal</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Category</label>
              <select
                value={ticketCategory}
                onChange={(e) => setTicketCategory(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs outline-none focus:border-blue-500"
              >
                <option value="Bug">Bug</option>
                <option value="UI/UX Issue">UI/UX Issue</option>
                <option value="Feature Request">Feature Request</option>
                <option value="Security Issue">Security Issue</option>
                <option value="Performance Issue">Performance Issue</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsCreateTicketOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isCreatingTicket}>Create Ticket</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

