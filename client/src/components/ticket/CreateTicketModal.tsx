import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { apiClient } from '../../api/client';
import { Project, Ticket } from '../../types';

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
  const [category, setCategory] = useState<string>('Bug');
  const [priority, setPriority] = useState<string>('Normal');
  const [status, setStatus] = useState<string>('To Do');
  const [assigneeId, setAssigneeId] = useState<string>('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !title.trim()) {
      alert('Please select a project and enter a ticket title.');
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
        assigneeId: assigneeId || undefined,
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
        onClose();
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Ticket"
      description="Report an issue, request a feature, or track a new task."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Project Selector */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1.5">Project *</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            required
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                [{p.key}] {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <Input
          label="Ticket Title *"
          placeholder="e.g. Critical database connection pool exhaustion on replica"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Category & Priority Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="Bug">Bug</option>
              <option value="UI/UX Issue">UI/UX Issue</option>
              <option value="Feature Request">Feature Request</option>
              <option value="Technical Support">Technical Support</option>
              <option value="Backend Issue">Backend Issue</option>
              <option value="Frontend Issue">Frontend Issue</option>
              <option value="Security Issue">Security Issue</option>
              <option value="Performance Issue">Performance Issue</option>
              <option value="General Request">General Request</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="Critical">Critical</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Assignee & Due Date Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Assignee</label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.user?.id} value={m.user?.id}>
                  {m.user?.name} ({m.role})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1.5">Description</label>
          <textarea
            rows={4}
            placeholder="Detailed description of the bug, reproduction steps, expected vs actual behavior..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 resize-none"
          />
        </div>

        {/* Tags */}
        <Input
          label="Tags (comma-separated)"
          placeholder="frontend, performance, safari"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
        />

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Create Ticket
          </Button>
        </div>
      </form>
    </Modal>
  );
};

