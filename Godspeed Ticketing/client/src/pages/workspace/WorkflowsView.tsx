import React, { useState, useEffect } from 'react';
import { WorkflowRule } from '../../types';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import {
  Zap,
  Plus,
  Play,
  CheckCircle,
  Clock,
  ArrowRight,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Lock,
} from 'lucide-react';

export const WorkflowsView: React.FC = () => {
  const { organization } = useAuth();
  const userRole = organization?.role || 'employee';
  const isOrgAdmin = userRole === 'owner' || userRole === 'admin';

  const [workflows, setWorkflows] = useState<WorkflowRule[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // New Workflow Form
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [triggerEvent, setTriggerEvent] = useState<string>('priority_urgent');
  const [actionType, setActionType] = useState<string>('add_tag');
  const [tagValue, setTagValue] = useState<string>('escalated');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchWorkflows = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/workflows');
      if (res.data.success) {
        setWorkflows(res.data.data);
      }
    } catch (err) {
      console.error('Fetch workflows error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleToggle = async (wf: WorkflowRule) => {
    try {
      const res = await apiClient.patch(`/workflows/${wf._id}`, {
        isActive: !wf.isActive,
      });
      if (res.data.success) {
        setWorkflows((prev) =>
          prev.map((w) => (w._id === wf._id ? { ...w, isActive: !wf.isActive } : w))
        );
      }
    } catch (err) {
      console.error('Toggle workflow error:', err);
    }
  };

  const handleDelete = async (wfId: string) => {
    if (!confirm('Are you sure you want to delete this workflow rule?')) return;
    try {
      await apiClient.delete(`/workflows/${wfId}`);
      setWorkflows((prev) => prev.filter((w) => w._id !== wfId));
    } catch (err) {
      console.error('Delete workflow error:', err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      const actions = [
        {
          type: actionType,
          params: actionType === 'add_tag' ? { tag: tagValue } : { title: name, message: 'Triggered automated action' },
        },
      ];

      const res = await apiClient.post('/workflows', {
        name: name.trim(),
        description: description.trim(),
        triggerEvent,
        actions,
      });

      if (res.data.success) {
        setWorkflows((prev) => [res.data.data, ...prev]);
        setIsModalOpen(false);
        setName('');
        setDescription('');
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create workflow');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOrgAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Administrator Access Required</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
          Automated workflow triggers and incident rules can only be created and managed by workspace owners and administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-5 space-y-4 overflow-y-auto bg-[#F1F5F9] dark:bg-[#0B0F19] font-sans text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Workflow Automation
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automate ticket routing, priority escalations, status transitions, and notification dispatch.
          </p>
        </div>
        <Button size="sm" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-3.5 h-3.5" />}>
          New Workflow
        </Button>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : workflows.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-xs text-slate-500">
            <Zap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700 text-sm">No automated workflows configured</p>
            <p className="mt-1 mb-4">Create rules to auto-escalate urgent issues or notify team leads.</p>
            <Button size="sm" onClick={() => setIsModalOpen(true)}>
              Create First Rule
            </Button>
          </div>
        ) : (
          workflows.map((wf) => (
            <div
              key={wf._id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{wf.name}</h3>
                  <Badge variant={wf.isActive ? 'success' : 'default'} size="sm">
                    {wf.isActive ? 'Active' : 'Disabled'}
                  </Badge>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Triggered {wf.runCount || 0} times
                  </span>
                </div>

                <p className="text-xs text-slate-500">{wf.description || 'Automated ticket routing rule'}</p>

                {/* Trigger -> Action Pill Visual */}
                <div className="flex items-center gap-2 text-xs font-mono pt-1">
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                    WHEN: {wf.triggerEvent.replace('_', ' ').toUpperCase()}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                    THEN: {wf.actions?.map((a) => a.type.replace('_', ' ')).join(', ').toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => handleToggle(wf)}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  {wf.isActive ? (
                    <ToggleRight className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-400" />
                  )}
                  <span>{wf.isActive ? 'Enabled' : 'Paused'}</span>
                </button>

                <button
                  onClick={() => handleDelete(wf._id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Workflow Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Automation Rule"
        description="Trigger real-time actions whenever a ticket event matches specified conditions."
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <Input
            label="Rule Name *"
            placeholder="e.g. Critical Bug Alert Dispatch"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Description"
            placeholder="e.g. Immediately flag Critical tickets with #escalated tag"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">When Event Triggers</label>
            <select
              value={triggerEvent}
              onChange={(e) => setTriggerEvent(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
            >
              <option value="priority_urgent">Ticket Priority becomes Urgent or Critical</option>
              <option value="ticket_created">New Ticket is Created</option>
              <option value="ticket_resolved">Ticket is Marked as Resolved</option>
              <option value="ticket_assigned">Ticket is Assigned to Member</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Action to Perform</label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
            >
              <option value="add_tag">Add Tag to Ticket</option>
              <option value="send_notification">Send Notification Alert</option>
              <option value="change_status">Change Status to Under Review</option>
            </select>
          </div>

          {actionType === 'add_tag' && (
            <Input
              label="Tag to Add"
              value={tagValue}
              onChange={(e) => setTagValue(e.target.value)}
              placeholder="e.g. escalated"
            />
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Automation Rule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

