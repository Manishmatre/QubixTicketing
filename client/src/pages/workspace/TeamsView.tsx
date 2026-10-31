import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Briefcase,
  Trash2,
  CheckCircle,
} from 'lucide-react';

export const TeamsView: React.FC = () => {
  const { user, organization } = useAuth();
  const { onlineUserIds } = useSocket();
  const userRole = organization?.role || 'employee';
  const isOrgAdmin = userRole === 'owner' || userRole === 'admin';

  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInviteOpen, setIsInviteOpen] = useState<boolean>(false);

  // Invite Form
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<string>('employee');
  const [jobTitle, setJobTitle] = useState<string>('');
  const [department, setDepartment] = useState<string>('Engineering');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/organizations/members');
      if (res.data.success) {
        setMembers(res.data.data);
      }
    } catch (err) {
      console.error('Fetch members error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setIsSubmitting(true);
    try {
      const res = await apiClient.post('/organizations/members/invite', {
        email: inviteEmail.trim(),
        role: inviteRole,
        jobTitle: jobTitle.trim(),
        department,
      });
      if (res.data.success) {
        alert(res.data.message || 'Invitation sent successfully!');
        setIsInviteOpen(false);
        setInviteEmail('');
        setJobTitle('');
        fetchMembers();
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const res = await apiClient.patch(`/organizations/members/${memberId}/role`, {
        role: newRole,
      });
      if (res.data.success) {
        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
        );
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update role');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member from the organization?')) return;
    try {
      await apiClient.delete(`/organizations/members/${memberId}`);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to remove member');
    }
  };

  return (
    <div className="flex-1 p-5 space-y-4 overflow-y-auto bg-white font-sans text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#EAECF0]">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Team Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage organization members, job titles, department assignments, and permissions.
          </p>
        </div>
        {isOrgAdmin && (
          <Button size="sm" onClick={() => setIsInviteOpen(true)} leftIcon={<UserPlus className="w-3.5 h-3.5" />}>
            Invite Member
          </Button>
        )}
      </div>

      {/* Members Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-subtle overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Member</th>
              <th className="py-3 px-4">Job Title & Department</th>
              <th className="py-3 px-4">Role & Permissions</th>
              <th className="py-3 px-4">Active Workload</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2" />
                  <p>Loading team directory...</p>
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar name={m.user?.name} src={m.user?.avatarUrl} size="sm" />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                            onlineUserIds.includes(m.user?.id || m.userId || m.user?._id)
                              ? 'bg-emerald-500 animate-pulse'
                              : 'bg-slate-300'
                          }`}
                          title={onlineUserIds.includes(m.user?.id || m.userId || m.user?._id) ? 'Online now' : 'Offline'}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-slate-900">{m.user?.name}</p>
                          {onlineUserIds.includes(m.user?.id || m.userId || m.user?._id) && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200">
                              LIVE
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">{m.user?.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <p className="font-medium text-slate-800">{m.jobTitle || 'Team Member'}</p>
                    <p className="text-[11px] text-slate-400">{m.department || 'General'}</p>
                  </td>

                  <td className="py-3.5 px-4">
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.id, e.target.value)}
                      disabled={!isOrgAdmin || m.role === 'owner'}
                      className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-800 font-medium text-xs outline-none focus:border-blue-600 cursor-pointer disabled:bg-transparent disabled:border-transparent"
                    >
                      <option value="owner">Owner</option>
                      <option value="admin">Admin</option>
                      <option value="project_manager">Project Manager</option>
                      <option value="team_lead">Team Lead</option>
                      <option value="employee">Employee / Developer</option>
                      <option value="reporter">Reporter / Client</option>
                      <option value="viewer">Viewer (Read-only)</option>
                    </select>
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-mono text-xs">
                      {m.activeTicketCount} active tickets
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge variant={m.status === 'active' ? 'success' : 'default'} size="sm">
                      {m.status}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    {isOrgAdmin && m.role !== 'owner' && (
                      <button
                        onClick={() => handleRemoveMember(m.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Invite Member Modal */}
      <Modal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invite Team Member"
        description="Send an invitation link or add an existing user directly to this workspace."
      >
        <form onSubmit={handleInvite} className="space-y-4 text-xs">
          <Input
            label="Work Email Address *"
            type="email"
            placeholder="colleague@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Workspace Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
              >
                <option value="admin">Admin</option>
                <option value="project_manager">Project Manager</option>
                <option value="team_lead">Team Lead</option>
                <option value="employee">Employee / Developer</option>
                <option value="reporter">Reporter / Client</option>
                <option value="viewer">Viewer (Read-only)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
              >
                <option value="Engineering">Engineering</option>
                <option value="Product Design">Product Design</option>
                <option value="QA & Testing">QA & Testing</option>
                <option value="Customer Support">Customer Support</option>
                <option value="DevOps & Infrastructure">DevOps & Infrastructure</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>
          </div>

          <Input
            label="Job Title"
            placeholder="e.g. Senior Backend Engineer"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

