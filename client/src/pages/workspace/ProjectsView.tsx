import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project } from '../../types';
import { apiClient } from '../../api/client';
import { Avatar } from '../../components/ui/Avatar';
import { PriorityBadge, Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import {
  FolderKanban,
  Plus,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';

export const ProjectsView: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // New Project Form
  const [name, setName] = useState<string>('');
  const [key, setKey] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('Engineering');
  const [priority, setPriority] = useState<string>('normal');
  const [targetDate, setTargetDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/projects');
      if (res.data.success) {
        setProjects(res.data.data);
      }
    } catch (err) {
      console.error('Fetch projects error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !key) return;
    setIsSubmitting(true);
    try {
      const res = await apiClient.post('/projects', {
        name: name.trim(),
        key: key.toUpperCase().trim(),
        description: description.trim(),
        category,
        priority,
        targetDate: targetDate ? new Date(targetDate).toISOString() : undefined,
      });
      if (res.data.success) {
        setProjects((prev) => [res.data.data, ...prev]);
        setIsModalOpen(false);
        setName('');
        setKey('');
        setDescription('');
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto bg-white font-sans text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#EAECF0]">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Projects</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track roadmaps, milestones, and deliverables across team initiatives.
          </p>
        </div>
        <Button size="sm" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-3.5 h-3.5" />}>
          New Project
        </Button>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-xs text-slate-500">
          <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700 text-sm">No projects created yet</p>
          <p className="mt-1 mb-4">Create your first project workspace to start organizing tickets.</p>
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            Create Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => {
            const stats = proj.ticketStats || { total: 0, resolved: 0, open: 0, inProgress: 0 };
            const progressPct = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;

            return (
              <div
                key={proj._id}
                onClick={() => navigate(`/workspace/projects/${proj._id}`)}
                className="bg-white border border-[#EAECF0] rounded-xl p-5 shadow-2xs hover:shadow-md hover:border-blue-400 transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded">
                        {proj.key}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {proj.category || 'General'}
                      </span>
                    </div>
                    <Badge variant={proj.status === 'active' ? 'success' : 'default'} size="sm">
                      {proj.status}
                    </Badge>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                    {proj.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {proj.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1.5">
                      <span>Progress</span>
                      <span className="font-bold text-slate-900">{progressPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer Meta */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Avatar
                        name={proj.projectManagerId?.name || 'Manager'}
                        src={proj.projectManagerId?.avatarUrl}
                        size="xs"
                      />
                      <span className="truncate max-w-[100px]">
                        {proj.projectManagerId?.name || 'Unassigned'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-400">
                      <span className="flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {stats.resolved}/{stats.total}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Project"
        description="Establish an isolated project stream with custom prefixes and membership."
      >
        <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
          <Input
            label="Project Name *"
            placeholder="e.g. NextGen Web Portal"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!key) {
                setKey(e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase());
              }
            }}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Project Key (Unique) *"
              placeholder="e.g. NWP"
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              maxLength={8}
              required
            />

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
              >
                <option value="Engineering">Engineering</option>
                <option value="Product Design">Product Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Operations">Operations</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Description</label>
            <textarea
              rows={3}
              placeholder="Brief project mission and scope..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm text-slate-900 outline-none focus:border-blue-600 resize-none"
            />
          </div>

          <Input
            label="Target Completion Date"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

