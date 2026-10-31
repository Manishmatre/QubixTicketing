import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, TicketComment, TicketAttachment, TicketActivity, OrgRole } from '../../types';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { PriorityBadge, StatusBadge, Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import {
  X,
  Maximize2,
  Calendar,
  Clock,
  User as UserIcon,
  Tag,
  Paperclip,
  Send,
  MessageSquare,
  Activity,
  Lock,
  Upload,
  Download,
  Trash2,
  Smile,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface TicketDrawerProps {
  ticketId: string | null;
  onClose: () => void;
  onTicketUpdated?: (updated: Ticket) => void;
}

export const TicketDrawer: React.FC<TicketDrawerProps> = ({
  ticketId,
  onClose,
  onTicketUpdated,
}) => {
  const { user, organization } = useAuth();
  const { socket } = useSocket();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [activities, setActivities] = useState<TicketActivity[]>([]);
  const [activeTab, setActiveTab] = useState<'comments' | 'internal' | 'attachments' | 'activity'>('comments');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // New Comment State
  const [commentText, setCommentText] = useState<string>('');
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Permissions check for internal notes
  const userRole = (organization?.role || 'employee') as OrgRole;
  const canSeeInternalNotes = ['owner', 'admin', 'project_manager', 'team_lead', 'employee'].includes(userRole) || user?.isSuperAdmin;

  const fetchTicketDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const [tRes, cRes, aRes, actRes] = await Promise.all([
        apiClient.get(`/tickets/${id}`),
        apiClient.get(`/ticket-comments/ticket/${id}`),
        apiClient.get(`/attachments/ticket/${id}`),
        apiClient.get(`/ticket-comments/ticket/${id}/activities`),
      ]);

      if (tRes.data.success) setTicket(tRes.data.data);
      if (cRes.data.success) setComments(cRes.data.data);
      if (aRes.data.success) setAttachments(aRes.data.data);
      if (actRes.data.success) setActivities(actRes.data.data);
    } catch (err) {
      console.error('[TicketDrawer] Failed to fetch ticket:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (ticketId) {
      fetchTicketDetails(ticketId);
      if (socket) {
        socket.emit('join:ticket', ticketId);
      }
    }
    return () => {
      if (ticketId && socket) {
        socket.emit('leave:ticket', ticketId);
      }
    };
  }, [ticketId, socket]);

  // Real-time socket event listeners for this ticket
  useEffect(() => {
    if (!socket || !ticketId) return;

    const handleCommentCreated = (newComment: TicketComment) => {
      setComments((prev) => [...prev, newComment]);
    };

    const handleTicketUpdated = (updated: Ticket) => {
      if (updated._id === ticketId) {
        setTicket(updated);
        if (onTicketUpdated) onTicketUpdated(updated);
      }
    };

    const handleAttachmentCreated = (newAtt: TicketAttachment) => {
      setAttachments((prev) => [newAtt, ...prev]);
    };

    socket.on('comment:created', handleCommentCreated);
    socket.on('ticket:updated', handleTicketUpdated);
    socket.on('ticket:status_changed', handleTicketUpdated);
    socket.on('attachment:created', handleAttachmentCreated);

    return () => {
      socket.off('comment:created', handleCommentCreated);
      socket.off('ticket:updated', handleTicketUpdated);
      socket.off('ticket:status_changed', handleTicketUpdated);
      socket.off('attachment:created', handleAttachmentCreated);
    };
  }, [socket, ticketId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;
    try {
      const res = await apiClient.patch(`/tickets/${ticket._id}/status`, { status: newStatus });
      if (res.data.success) {
        setTicket(res.data.data);
        if (onTicketUpdated) onTicketUpdated(res.data.data);
        // Refresh activities
        const actRes = await apiClient.get(`/ticket-comments/ticket/${ticket._id}/activities`);
        if (actRes.data.success) setActivities(actRes.data.data);
      }
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (!ticket) return;
    try {
      const res = await apiClient.patch(`/tickets/${ticket._id}`, { priority: newPriority });
      if (res.data.success) {
        setTicket(res.data.data);
        if (onTicketUpdated) onTicketUpdated(res.data.data);
      }
    } catch (err) {
      console.error('Update priority error:', err);
    }
  };

  const handleAddComment = async (isInternal: boolean = false) => {
    if (!ticket || !commentText.trim()) return;
    setIsSubmittingComment(true);
    try {
      const res = await apiClient.post(`/ticket-comments/ticket/${ticket._id}`, {
        content: commentText.trim(),
        isInternal,
      });
      if (res.data.success) {
        setCommentText('');
        setComments((prev) => [...prev, res.data.data]);
        const actRes = await apiClient.get(`/ticket-comments/ticket/${ticket._id}/activities`);
        if (actRes.data.success) setActivities(actRes.data.data);
      }
    } catch (err) {
      console.error('Add comment error:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!ticket || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const res = await apiClient.post(`/attachments/ticket/${ticket._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setAttachments((prev) => [res.data.data, ...prev]);
        const actRes = await apiClient.get(`/ticket-comments/ticket/${ticket._id}/activities`);
        if (actRes.data.success) setActivities(actRes.data.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAttachment = async (attId: string) => {
    if (!confirm('Are you sure you want to remove this attachment?')) return;
    try {
      await apiClient.delete(`/attachments/${attId}`);
      setAttachments((prev) => prev.filter((a) => a._id !== attId));
    } catch (err) {
      console.error('Delete attachment error:', err);
    }
  };

  return (
    <AnimatePresence>
      {ticketId && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Right Slide-in Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-white shadow-2xl h-screen flex flex-col z-10 border-l border-slate-200"
          >
            {isLoading || !ticket ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50/50">
                  <div className="space-y-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                        {ticket.ticketNumber}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {ticket.projectId?.name}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 leading-snug">
                      {ticket.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={onClose}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Ticket Meta Toolbar */}
                <div className="grid grid-cols-4 gap-4 px-6 py-3.5 border-b border-slate-100 bg-white text-xs">
                  <div>
                    <span className="text-slate-400 font-medium block mb-1">Status</span>
                    <select
                      value={ticket.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 font-medium text-xs outline-none focus:border-blue-600 cursor-pointer"
                    >
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block mb-1">Priority</span>
                    <select
                      value={ticket.priority}
                      onChange={(e) => handlePriorityChange(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 font-medium text-xs outline-none focus:border-blue-600 cursor-pointer"
                    >
                      <option value="Critical">Critical</option>
                      <option value="Urgent">Urgent</option>
                      <option value="High">High</option>
                      <option value="Normal">Normal</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block mb-1">Assignee</span>
                    <div className="flex items-center gap-1.5 py-1">
                      <Avatar name={ticket.assigneeId?.name || 'Unassigned'} src={ticket.assigneeId?.avatarUrl} size="xs" />
                      <span className="text-slate-800 font-medium truncate">
                        {ticket.assigneeId?.name || 'Unassigned'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block mb-1">Due Date</span>
                    <div className="flex items-center gap-1 text-slate-700 py-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ticket.dueDate ? format(new Date(ticket.dueDate), 'MMM d, yyyy') : 'No date'}</span>
                    </div>
                  </div>
                </div>

                {/* Description Box */}
                <div className="px-6 py-4 border-b border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Description
                  </h4>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {ticket.description || 'No description provided.'}
                  </p>

                  {ticket.tags && ticket.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {ticket.tags.map((tg) => (
                        <span key={tg} className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          <Tag className="w-2.5 h-2.5" />
                          {tg}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Drawer Tab Navigation */}
                <div className="flex items-center px-6 border-b border-slate-200 bg-slate-50/50">
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
                      activeTab === 'comments'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Public Comments ({comments.filter((c) => !c.isInternal).length})
                  </button>

                  {canSeeInternalNotes && (
                    <button
                      onClick={() => setActiveTab('internal')}
                      className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
                        activeTab === 'internal'
                          ? 'border-amber-600 text-amber-700'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Lock className="w-4 h-4" />
                      Internal Notes ({comments.filter((c) => c.isInternal).length})
                    </button>
                  )}

                  <button
                    onClick={() => setActiveTab('attachments')}
                    className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
                      activeTab === 'attachments'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Paperclip className="w-4 h-4" />
                    Attachments ({attachments.length})
                  </button>

                  <button
                    onClick={() => setActiveTab('activity')}
                    className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
                      activeTab === 'activity'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    Activity History
                  </button>
                </div>

                {/* Drawer Body Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {/* Comments / Internal Notes Tab */}
                  {(activeTab === 'comments' || activeTab === 'internal') && (
                    <div className="space-y-4">
                      {activeTab === 'internal' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-center gap-2">
                          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            Internal notes are strictly restricted to team members and never visible to external reporters.
                          </span>
                        </div>
                      )}

                      {comments
                        .filter((c) => (activeTab === 'internal' ? c.isInternal : !c.isInternal))
                        .map((comment) => (
                          <div
                            key={comment._id}
                            className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                              comment.isInternal
                                ? 'bg-amber-50/50 border-amber-200'
                                : 'bg-slate-50/80 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Avatar name={comment.authorId?.name} src={comment.authorId?.avatarUrl} size="xs" />
                                <span className="font-bold text-slate-900">{comment.authorId?.name}</span>
                                {comment.isInternal && (
                                  <Badge variant="warning" size="sm">Internal</Badge>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-slate-700 whitespace-pre-wrap">{comment.content}</p>
                          </div>
                        ))}

                      {comments.filter((c) => (activeTab === 'internal' ? c.isInternal : !c.isInternal)).length === 0 && (
                        <p className="text-center text-xs text-slate-400 py-6">
                          No {activeTab === 'internal' ? 'internal notes' : 'comments'} yet.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Attachments Tab */}
                  {activeTab === 'attachments' && (
                    <div className="space-y-4">
                      {/* Upload Box */}
                      <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-blue-50/20 transition-all">
                        <Upload className="w-6 h-6 text-slate-400 mb-1" />
                        <span className="text-xs font-semibold text-slate-700">
                          {isUploading ? 'Uploading file...' : 'Click or drop file to attach'}
                        </span>
                        <span className="text-[11px] text-slate-400 mt-0.5">
                          PDF, images, spreadsheets up to 15MB
                        </span>
                        <input
                          type="file"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                          className="hidden"
                        />
                      </label>

                      {/* Attachments List */}
                      <div className="space-y-2">
                        {attachments.map((att) => (
                          <div
                            key={att._id}
                            className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg text-xs"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Paperclip className="w-4 h-4 text-blue-600 shrink-0" />
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 truncate">
                                  {att.originalName}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {(att.sizeBytes / 1024).toFixed(1)} KB • Uploaded by {att.uploadedById?.name}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <a
                                href={att.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() => handleDeleteAttachment(att._id)}
                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Activity Tab */}
                  {activeTab === 'activity' && (
                    <div className="relative pl-6 space-y-4 border-l-2 border-slate-200 ml-2">
                      {activities.map((act) => (
                        <div key={act._id} className="relative">
                          <div className="absolute -left-[31px] top-0.5 w-3 h-3 bg-blue-600 rounded-full border-2 border-white ring-2 ring-slate-100" />
                          <div className="text-xs">
                            <p className="font-semibold text-slate-900">
                              {act.userId?.name || 'System'}:{' '}
                              <span className="font-normal text-slate-600">{act.description}</span>
                            </p>
                            <span className="text-[10px] text-slate-400">
                              {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Comment Input Footer */}
                {(activeTab === 'comments' || activeTab === 'internal') && (
                  <div className="p-4 border-t border-slate-200 bg-white">
                    <div className="flex gap-2">
                      <textarea
                        rows={2}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder={
                          activeTab === 'internal'
                            ? 'Add internal note (only visible to team members)...'
                            : 'Add a comment for the team or reporter...'
                        }
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white resize-none"
                      />
                      <Button
                        size="sm"
                        variant={activeTab === 'internal' ? 'danger' : 'primary'}
                        isLoading={isSubmittingComment}
                        onClick={() => handleAddComment(activeTab === 'internal')}
                        className="self-end"
                        rightIcon={<Send className="w-3.5 h-3.5" />}
                      >
                        {activeTab === 'internal' ? 'Post Note' : 'Reply'}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

