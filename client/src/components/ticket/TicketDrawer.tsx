import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, TicketComment, TicketAttachment, TicketActivity, OrgRole } from '../../types';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Avatar } from '../ui/Avatar';
import {
  X,
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
  CheckCircle2,
  Circle,
  Star,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Plus,
  Sparkles,
  Link2,
  ExternalLink,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Image,
  Code,
  ArrowLeft,
  Signal,
  SignalHigh,
  SignalMedium,
  SignalLow,
  Edit2,
  Info,
  Check,
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
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // New Comment State & Internal Note toggle
  const [commentText, setCommentText] = useState<string>('');
  const [isInternalNote, setIsInternalNote] = useState<boolean>(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Mentions autocomplete state
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [showMentionMenu, setShowMentionMenu] = useState<boolean>(false);
  const [mentionQuery, setMentionQuery] = useState<string>('');
  const [mentionCursorIndex, setMentionCursorIndex] = useState<number>(0);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Sub-tickets state
  const [subTickets, setSubTickets] = useState<Array<{ id: string; title: string; done: boolean; num: string }>>([]);

  // Links state
  const [links, setLinks] = useState<Array<{ title: string; url: string }>>([]);

  const [subTicketsOpen, setSubTicketsOpen] = useState(true);
  const [linksOpen, setLinksOpen] = useState(true);
  const [activitiesOpen, setActivitiesOpen] = useState(true);

  // Permissions check for internal notes
  const userRole = (organization?.role || 'employee') as OrgRole;
  const canSeeInternalNotes = ['owner', 'admin', 'project_manager', 'team_lead', 'employee'].includes(userRole) || user?.isSuperAdmin;

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await apiClient.get('/organizations/members');
        if (res.data.success) {
          setTeamMembers(res.data.data || []);
        }
      } catch (err) {
        // silent
      }
    };
    fetchMembers();
  }, []);

  const filteredMembers = teamMembers.filter((m) =>
    (m.user?.name || '').toLowerCase().includes(mentionQuery) ||
    (m.user?.email || '').toLowerCase().includes(mentionQuery)
  );

  const handleCommentTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart;
    setCommentText(val);

    const textBeforeCursor = val.slice(0, cursorPos);
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_\s]*)$/);
    if (match && match.index !== undefined) {
      const query = match[1];
      if (!query.includes('\n')) {
        setMentionQuery(query.toLowerCase());
        setMentionCursorIndex(match.index);
        setShowMentionMenu(true);
        return;
      }
    }
    setShowMentionMenu(false);
  };

  const handleInsertMention = (memberName: string) => {
    const before = commentText.slice(0, mentionCursorIndex);
    const after = commentText.slice(commentInputRef.current?.selectionStart || mentionCursorIndex);
    const updated = `${before}@${memberName} ${after}`;
    setCommentText(updated);
    setShowMentionMenu(false);
    setTimeout(() => {
      if (commentInputRef.current) {
        commentInputRef.current.focus();
        const nextPos = before.length + memberName.length + 2;
        commentInputRef.current.setSelectionRange(nextPos, nextPos);
      }
    }, 40);
  };

  const renderContentWithMentions = (content: string) => {
    if (!content) return null;
    const parts = content.split(/(@[a-zA-Z0-9_\s.-]+?)(?=[,;:!?\s]|$)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('@')) {
        const name = part.slice(1);
        return (
          <span
            key={idx}
            className="inline-flex items-center text-blue-700 bg-blue-50 border border-blue-200/80 rounded px-1.5 py-0.5 font-semibold text-[11px] mx-0.5 shadow-2xs"
          >
            <span className="text-blue-500 mr-0.5 font-bold">@</span>
            <span>{name}</span>
          </span>
        );
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  };

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

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !commentText.trim()) return;
    setIsSubmittingComment(true);
    try {
      const res = await apiClient.post(`/ticket-comments/ticket/${ticket._id}`, {
        content: commentText.trim(),
        isInternal: isInternalNote,
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

  const toggleSubTicket = (id: string) => {
    setSubTickets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s))
    );
  };

  const completedSubTicketsCount = subTickets.filter((s) => s.done).length;

  return (
    <AnimatePresence>
      {ticketId && (
        <div className="fixed inset-0 z-50 flex justify-end font-sans">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/25 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Wide Modern Minimalist Details Inspector matching Screenshot 1 */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="relative w-full max-w-5xl bg-white shadow-2xl h-screen flex flex-col z-10 border-l border-[#EAECF0]"
          >
            {isLoading || !ticket ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
              </div>
            ) : (
              <>
                {/* Top Nav & Breadcrumb matching screenshot */}
                <div className="px-6 py-3 border-b border-[#EAECF0] flex items-center justify-between bg-white shrink-0">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <button
                      onClick={onClose}
                      className="p-1 hover:bg-slate-100 rounded text-slate-700 transition-colors mr-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <span className="text-slate-800 font-semibold truncate max-w-[150px]">
                      {ticket.projectId?.name || 'Product Design'}
                    </span>
                    <span>/</span>
                    <span>...</span>
                    <span>/</span>
                    <div className="flex items-center gap-1 text-slate-700">
                      <Avatar name={ticket.assigneeId?.name || 'Kevin'} size="xs" />
                      <span>{ticket.assigneeId?.name?.split(' ')[0] || 'Kevin'}</span>
                    </div>
                    <span>/</span>
                    <span className="font-mono text-slate-800 font-bold">{ticket.ticketNumber}</span>
                  </div>

                  {/* Top Right Actions */}
                  <div className="flex items-center gap-2">
                    {/* Status Pill matching screenshot */}
                    <div className="relative">
                      <select
                        value={ticket.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className="appearance-none bg-blue-50/60 border border-blue-200 text-blue-700 font-semibold text-xs rounded-full pl-6 pr-7 py-1 cursor-pointer outline-none hover:bg-blue-100/60 transition-colors"
                      >
                        <option value="To Do">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                      <Circle className="w-2.5 h-2.5 text-blue-600 fill-blue-600 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <ChevronDown className="w-3 h-3 text-blue-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                      <Star className="w-4 h-4" />
                    </button>

                    <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    <button
                      onClick={onClose}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 2-Column Split: Main Content on Left, Details on Right */}
                <div className="flex-1 overflow-hidden flex">
                  {/* Left Column: Title, AI Summary, Sub-Tickets, Links, Comments */}
                  <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {/* Title & Meta */}
                    <div className="space-y-1.5">
                      <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-snug flex items-center gap-2">
                        <span>{ticket.title}</span>
                        <Edit2 className="w-3.5 h-3.5 text-slate-400 hover:text-slate-700 cursor-pointer" />
                      </h1>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                        <span>{ticket.ticketNumber}</span>
                        <span>·</span>
                        <span>
                          {ticket.createdAt
                            ? formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })
                            : '2 days ago'}
                        </span>
                      </div>
                    </div>

                    {/* Description Text */}
                    <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {ticket.description || "No description provided for this ticket."}
                    </div>

                    {/* AI Summary Box matching screenshot */}
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-700">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Summary</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {ticket.description
                          ? ticket.description.length > 200
                            ? ticket.description.slice(0, 200) + '...'
                            : ticket.description
                          : 'Insight provided by QubixDesk AI based on ticket context.'}
                      </p>
                      <p className="text-[11px] text-slate-400 italic">
                        Insight provided by artificial intelligence.
                      </p>
                    </div>

                    {/* Sub-Tickets Section matching screenshot */}
                    <div className="space-y-2.5 pt-2">
                      <div className="flex items-center justify-between text-xs">
                        <div
                          onClick={() => setSubTicketsOpen(!subTicketsOpen)}
                          className="flex items-center gap-1.5 font-bold text-slate-800 cursor-pointer"
                        >
                          {subTicketsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          <span>Sub-Tickets</span>
                          <span className="text-slate-400 font-medium ml-1">
                            {completedSubTicketsCount}/{subTickets.length}
                          </span>
                        </div>
                        <button className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1">
                          <Plus className="w-3 h-3" />
                          <span>Add sub-ticket</span>
                        </button>
                      </div>

                      {subTicketsOpen && (
                        <div className="space-y-1.5 pl-2 text-xs">
                          {subTickets.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-1">No sub-tickets added yet.</p>
                          ) : (
                            subTickets.map((st) => (
                              <div
                                key={st.id}
                                onClick={() => toggleSubTicket(st.id)}
                                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer group transition-colors"
                              >
                                <span className="text-[10px] font-mono text-slate-400">{st.num}</span>
                                {st.done ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                ) : (
                                  <Circle className="w-4 h-4 text-blue-500 shrink-0" />
                                )}
                                <span
                                  className={`text-xs ${
                                    st.done ? 'text-slate-500 line-through' : 'text-slate-800 font-medium'
                                  }`}
                                >
                                  {st.title}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Links Section matching screenshot */}
                    <div className="space-y-2.5 pt-2">
                      <div className="flex items-center justify-between text-xs">
                        <div
                          onClick={() => setLinksOpen(!linksOpen)}
                          className="flex items-center gap-1.5 font-bold text-slate-800 cursor-pointer"
                        >
                          {linksOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          <span>Links</span>
                          <span className="text-slate-400 font-medium ml-1">{links.length}</span>
                        </div>
                        <button className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1">
                          <Plus className="w-3 h-3" />
                          <span>Add link</span>
                        </button>
                      </div>

                      {linksOpen && (
                        <div className="space-y-2 pl-2">
                          {links.map((link, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2.5 rounded-xl border border-[#EAECF0] hover:border-slate-300 transition-colors bg-white group shadow-2xs"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                                  <Link2 className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs font-semibold text-slate-800 hover:text-blue-600 block truncate"
                                  >
                                    {link.title}
                                  </a>
                                  <p className="text-[10px] text-slate-400 truncate">{link.url}</p>
                                </div>
                              </div>
                              <button className="text-slate-300 group-hover:text-slate-500 p-1">
                                <MoreHorizontal className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Activities & Comments Feed matching screenshot */}
                    <div className="space-y-4 pt-4 border-t border-[#EAECF0]">
                      <div
                        onClick={() => setActivitiesOpen(!activitiesOpen)}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-800 cursor-pointer"
                      >
                        {activitiesOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        <span>Activities</span>
                      </div>

                      {activitiesOpen && (
                        <div className="space-y-3 pl-2">
                          {/* Sample audit entries matching screenshot style */}
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 text-[10px] flex items-center justify-center font-bold">
                              D
                            </span>
                            <span>Dan Bellenbaum created the ticket a day ago. 1 week ago</span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 text-[10px] flex items-center justify-center font-bold">
                              D
                            </span>
                            <span>Dan Bellenbaum opened the ticket a day ago. 4 days ago</span>
                          </div>

                          {/* Dynamic Comments List */}
                          {comments.map((comment) => (
                            <div
                              key={comment._id}
                              className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                                comment.isInternal
                                  ? 'bg-amber-50/50 border-amber-200'
                                  : 'bg-white border-[#EAECF0] shadow-2xs'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Avatar name={comment.authorId?.name} src={comment.authorId?.avatarUrl} size="xs" />
                                  <span className="font-bold text-slate-900">{comment.authorId?.name}</span>
                                  <span className="text-[10px] text-slate-400">
                                    {comment.createdAt
                                      ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })
                                      : '5 hours ago'}
                                  </span>
                                  {comment.isInternal && (
                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                                      🔒 Internal Note
                                    </span>
                                  )}
                                </div>
                              </div>

                              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {renderContentWithMentions(comment.content)}
                              </p>

                              {/* Emoji Reactions Bar */}
                              <div className="flex items-center gap-1.5 pt-1">
                                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer hover:bg-slate-200">
                                  👍 2
                                </span>
                                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer hover:bg-slate-200">
                                  ✅ 1
                                </span>
                                <button className="text-slate-400 hover:text-slate-700 text-xs px-1">
                                  <Smile className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Comment Input Box with Formatting Toolbar & Mentions */}
                      <form onSubmit={handleAddComment} className="mt-4 border border-[#EAECF0] rounded-xl overflow-hidden bg-white shadow-2xs relative">
                        {/* Mention autocomplete dropdown */}
                        {showMentionMenu && filteredMembers.length > 0 && (
                          <div className="absolute bottom-full left-2 mb-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 max-h-48 overflow-y-auto">
                            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                              Mention Team Member
                            </div>
                            {filteredMembers.map((member) => (
                              <button
                                key={member._id || member.user?._id}
                                type="button"
                                onClick={() => handleInsertMention(member.user?.name || '')}
                                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-blue-50 text-left transition-colors"
                              >
                                <Avatar name={member.user?.name} src={member.user?.avatarUrl} size="xs" />
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-slate-900 truncate">{member.user?.name}</p>
                                  <p className="text-[10px] text-slate-400 truncate font-mono">{member.user?.email}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        <textarea
                          ref={commentInputRef}
                          rows={3}
                          value={commentText}
                          onChange={handleCommentTextChange}
                          placeholder="Enter your comment... Type @ to tag a teammate"
                          className="w-full p-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none resize-none"
                        />

                        {/* Formatting bar and action buttons */}
                        <div className="bg-slate-50 px-3 py-2 border-t border-[#EAECF0] flex items-center justify-between text-slate-500 text-xs">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const pos = commentInputRef.current?.selectionStart || commentText.length;
                                const before = commentText.slice(0, pos);
                                const after = commentText.slice(pos);
                                setCommentText(`${before}@${after}`);
                                setMentionQuery('');
                                setMentionCursorIndex(pos);
                                setShowMentionMenu(true);
                                setTimeout(() => {
                                  commentInputRef.current?.focus();
                                  commentInputRef.current?.setSelectionRange(pos + 1, pos + 1);
                                }, 20);
                              }}
                              className="hover:text-blue-600 hover:bg-blue-50 px-1.5 py-0.5 rounded font-bold text-xs text-blue-600 transition-colors"
                              title="Mention teammate (@)"
                            >
                              @
                            </button>
                            <button type="button" className="hover:text-slate-800 p-1"><Bold className="w-3.5 h-3.5" /></button>
                            <button type="button" className="hover:text-slate-800 p-1"><Italic className="w-3.5 h-3.5" /></button>
                            <button type="button" className="hover:text-slate-800 p-1"><Underline className="w-3.5 h-3.5" /></button>
                            <button type="button" className="hover:text-slate-800 p-1"><Link2 className="w-3.5 h-3.5" /></button>
                            <button type="button" className="hover:text-slate-800 p-1"><List className="w-3.5 h-3.5" /></button>
                            <button type="button" className="hover:text-slate-800 p-1"><Code className="w-3.5 h-3.5" /></button>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Internal Note Toggle */}
                            {canSeeInternalNotes && (
                              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isInternalNote}
                                  onChange={(e) => setIsInternalNote(e.target.checked)}
                                  className="rounded border-amber-300 text-amber-600 focus:ring-0 w-3 h-3"
                                />
                                <span>🔒 Internal Note</span>
                              </label>
                            )}

                            <button
                              type="submit"
                              disabled={isSubmittingComment || !commentText.trim()}
                              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40 transition-colors shadow-sm"
                            >
                              <Send className="w-3 h-3" />
                              <span>Send</span>
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Right Column: Details Inspector matching screenshot */}
                  <div className="w-80 border-l border-[#EAECF0] bg-white overflow-y-auto p-5 space-y-6 text-xs text-slate-700 select-none">
                    {/* Details Section */}
                    <div className="space-y-3.5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                        <Info className="w-3.5 h-3.5 text-slate-500" />
                        <span>Details</span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Due date</span>
                          <div className="flex items-center gap-1 text-slate-800 font-medium">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{ticket.dueDate ? format(new Date(ticket.dueDate), 'MMM d, yyyy') : 'Select due date'}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Status</span>
                          <span className="inline-flex items-center gap-1.5 text-blue-700 font-semibold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full text-[11px]">
                            <Circle className="w-2 h-2 text-blue-600 fill-blue-600" />
                            {ticket.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Priority</span>
                          <span className="inline-flex items-center gap-1 text-slate-800 font-medium">
                            <SignalMedium className="w-3 h-3 text-amber-500" />
                            {ticket.priority}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Queue</span>
                          <span className="inline-flex items-center gap-1 text-slate-800 font-medium">
                            <Link2 className="w-3 h-3 text-blue-500" />
                            {ticket.category || 'Usability'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Approvers Section */}
                    <div className="pt-4 border-t border-[#EAECF0] space-y-3">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                        <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                        <span>Approvers</span>
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Approved</span>
                          <span className="text-slate-700 text-[11px]">Jan 22, 2026</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Approvers</span>
                          <div className="flex items-center gap-1.5">
                            <Avatar name="Kevin Coleman" size="xs" />
                            <span className="font-medium text-slate-800">Kevin Coleman</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* People Section */}
                    <div className="pt-4 border-t border-[#EAECF0] space-y-3">
                      <div className="flex items-center justify-between font-bold text-slate-900 text-xs">
                        <div className="flex items-center gap-1.5">
                          <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                          <span>People</span>
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Assignee</span>
                          <div className="flex items-center gap-1.5">
                            <Avatar name={ticket.assigneeId?.name || 'Unassigned'} src={ticket.assigneeId?.avatarUrl} size="xs" />
                            <span className="font-medium text-slate-800">
                              {ticket.assigneeId?.name || 'Unassigned'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Requester</span>
                          <div className="flex items-center gap-1.5">
                            <Avatar name={ticket.reporterId?.name || 'Sarah Jenkins'} size="xs" />
                            <span className="font-medium text-slate-800">
                              {ticket.reporterId?.name || 'Sarah Jenkins'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tags Section */}
                    <div className="pt-4 border-t border-[#EAECF0] space-y-3">
                      <div className="flex items-center justify-between font-bold text-slate-900 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-slate-500" />
                          <span>Tags</span>
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {ticket.tags && ticket.tags.length > 0 ? (
                          ticket.tags.map((tg) => (
                            <span
                              key={tg}
                              className="bg-slate-100 text-slate-700 text-[11px] px-2 py-0.5 rounded-md font-medium"
                            >
                              {tg}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400">Add ticket tags</span>
                        )}
                      </div>
                    </div>

                    {/* Meta Section */}
                    <div className="pt-4 border-t border-[#EAECF0] space-y-3">
                      <div className="flex items-center justify-between font-bold text-slate-900 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Meta</span>
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>

                      <div className="space-y-2 text-[11px]">
                        <div className="flex items-center justify-between text-slate-500">
                          <span>Created</span>
                          <span>
                            {ticket.createdAt
                              ? format(new Date(ticket.createdAt), 'MMM d, yyyy')
                              : 'Jan 21, 2026'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500">
                          <span>Updated</span>
                          <span>
                            {ticket.updatedAt
                              ? formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })
                              : '2 days ago'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
