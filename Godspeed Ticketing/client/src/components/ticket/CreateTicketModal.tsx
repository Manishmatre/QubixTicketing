import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { apiClient } from '../../api/client';
import { Project, Ticket } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Users, Check } from 'lucide-react';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTicketCreated?: (ticket: Ticket) => void;
}

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  isOpen,
  onClose,
  onTicketCreated,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State
  const [projectId, setProjectId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('Task');
  const [priority, setPriority] = useState<string>('Normal');
  const [status, setStatus] = useState<string>('To Do');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      // Fetch projects & members
      const loadData = async () => {
        setIsLoading(true);
        try {
          const [pRes, mRes] = await Promise.all([
            apiClient.get('/projects'),
            apiClient.get('/organizations/members'),
          ]);
          if (pRes.data.success) {
            setProjects(pRes.data.data);
            if (pRes.data.data.length > 0 && !projectId) {
              setProjectId(pRes.data.data[0]._id);
            }
          }
          if (mRes.data.success) {
            setMembers(mRes.data.data);
          }
        } catch (err) {
          console.error('Load modal data error:', err);
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    }
  }, [isOpen]);

  const toggleAssignee = (memberUserId: string) => {
    setSelectedAssigneeIds((prev) =>
      prev.includes(memberUserId)
        ? prev.filter((id) => id !== memberUserId)
        : [...prev, memberUserId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !title.trim()) {
      alert('Please select a project and enter a task title.');
      return;
    }

    setIsSubmitting(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await apiClient.post('/tickets', {
        projectId,
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        status,
        assigneeIds: selectedAssigneeIds,
        assigneeId: selectedAssigneeIds[0] || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        tags,
      });

      if (res.data.success) {
        if (onTicketCreated) onTicketCreated(res.data.data);
        // Reset form
        setTitle('');
        setDescription('');
        setTagsInput('');
        setDueDate('');
        setSelectedAssigneeIds([]);
        onClose();
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Task or Deliverable" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
        {/* Project Selector */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1.5">Project Workspace</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            required
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.key})
              </option>
            ))}
          </select>
        </div>

        {/* Task Title */}
        <Input
          label="Task / Deliverable Title"
          placeholder="e.g. Redesign onboarding flows, build CSV export, client audit..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Category & Priority Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Work Type / Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="Task">Task (General Work)</option>
              <option value="Improvement">Improvement / Enhancement</option>
              <option value="Feature">Feature Request</option>
              <option value="Client Request">Client Request</option>
              <option value="Operations">Operations / Internal</option>
              <option value="Bug">Bug / Fix</option>
              <option value="UI/UX Design">UI/UX Design</option>
              <option value="Technical Support">Technical Support</option>
              <option value="General Work">General Work</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="Critical">Critical</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Multiple Assignees Selector */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Assign Team Members ({selectedAssigneeIds.length} selected)</span>
            </label>
            {selectedAssigneeIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedAssigneeIds([])}
                className="text-[11px] text-slate-400 hover:text-rose-600 cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="max-h-36 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {members.length === 0 ? (
              <p className="text-slate-400 text-xs italic col-span-2 py-2 text-center">
                No team members found.
              </p>
            ) : (
              members.map((m) => {
                const memberUserId = m.user?.id || m.user?._id || m.userId;
                if (!memberUserId) return null;
                const isSelected = selectedAssigneeIds.includes(memberUserId);

                return (
                  <button
                    type="button"
                    key={memberUserId}
                    onClick={() => toggleAssignee(memberUserId)}
                    className={`flex items-center justify-between p-2 rounded-lg text-left transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-2xs font-semibold'
                        : 'bg-white border-slate-200/80 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={m.user?.name} src={m.user?.avatarUrl} size="xs" />
                      <div className="min-w-0">
                        <p className="text-xs truncate leading-tight font-medium">
                          {m.user?.name || 'Teammate'}
                        </p>
                        <p className="text-[10px] text-slate-400 capitalize truncate">
                          {m.jobTitle || m.role || 'Member'}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 ml-1">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Due Date & Initial Status */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Initial Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="To Do">Open / To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Under Review">Customer in Review</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1.5">Description & Deliverables</label>
          <textarea
            rows={3}
            placeholder="Detailed notes, deliverables, project scope, specifications, or instructions..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 resize-none"
          />
        </div>

        {/* Tags */}
        <Input
          label="Tags (comma-separated)"
          placeholder="roadmap, marketing, client-facing, q4"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
        />

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
};
