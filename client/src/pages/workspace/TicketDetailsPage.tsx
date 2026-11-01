import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Ticket, TicketComment, TicketAttachment, TicketActivity, OrgRole } from '../../types';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { PriorityBadge, StatusBadge, CategoryBadge } from '../../components/ui/Badge';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User as UserIcon,
  UserPlus,
  X,
  Flame,
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
  List,
  Code,
  Edit2,
  Info,
  Check,
  Signal,
  SignalHigh,
  SignalMedium,
  SignalLow,
  Shield,
  FileText,
  Share2,
  AtSign,
  Globe,
  Video,
  Layers,
  BookOpen,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export const TicketDetailsPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { user, organization } = useAuth();
  const { socket } = useSocket();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [activities, setActivities] = useState<TicketActivity[]>([]);
  const [activeTab, setActiveTab] = useState<'comments' | 'internal' | 'attachments' | 'activity'>('comments');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Edit title & description
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState('');

  // Comment State
  const [commentText, setCommentText] = useState<string>('');
  const [isInternalNote, setIsInternalNote] = useState<boolean>(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Sub-tickets state
  const [subTickets, setSubTickets] = useState<
    Array<{ id: string; title: string; done: boolean; num: string }>
  >([]);
  const [newSubTicketText, setNewSubTicketText] = useState('');
  const [showAddSubTicket, setShowAddSubTicket] = useState(false);

  // Links State
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkType, setNewLinkType] = useState('web');
  const [isAddingLink, setIsAddingLink] = useState(false);

  // Mentions & Team Members State
  const [teamMembers, setTeamMembers] = useState<
    Array<{ id: string; user: { id: string; name: string; email: string; avatarUrl?: string }; role: string }>
  >([]);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionCursorIndex, setMentionCursorIndex] = useState(0);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Permissions check for internal notes & task editing
  const userRole = (organization?.role || 'employee') as OrgRole;
  const isManager = ['owner', 'admin', 'project_manager'].includes(userRole) || user?.isSuperAdmin;
  const canSeeInternalNotes = ['owner', 'admin', 'project_manager', 'team_lead', 'employee'].includes(userRole) || user?.isSuperAdmin;

  const currentUserId = user?.id;
  const isAssigned =
    (ticket?.assigneeId && (ticket.assigneeId.id === currentUserId || (ticket.assigneeId as any)._id === currentUserId)) ||
    (ticket?.assigneeIds && ticket.assigneeIds.some((a) => a.id === currentUserId || (a as any)._id === currentUserId)) ||
    ticket?.reporterId?.id === currentUserId ||
    (ticket?.reporterId as any)?._id === currentUserId;

  const canUpdateTask = isManager || !!isAssigned;

  const fetchTicketDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const [tRes, cRes, aRes, actRes] = await Promise.all([
        apiClient.get(`/tickets/${id}`),
        apiClient.get(`/ticket-comments/ticket/${id}`),
        apiClient.get(`/attachments/ticket/${id}`),
        apiClient.get(`/ticket-comments/ticket/${id}/activities`),
      ]);

      if (tRes.data.success) {
        setTicket(tRes.data.data);
        setTitleValue(tRes.data.data.title);
        setDescValue(tRes.data.data.description || '');
      }
      if (cRes.data.success) setComments(cRes.data.data);
      if (aRes.data.success) setAttachments(aRes.data.data);
      if (actRes.data.success) setActivities(actRes.data.data);
    } catch (err) {
      console.error('[TicketDetailsPage] Failed to fetch ticket:', err);
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

  // Real-time socket event listeners
  useEffect(() => {
    if (!socket || !ticketId) return;

    const handleCommentCreated = (newComment: TicketComment) => {
      setComments((prev) => [...prev, newComment]);
    };

    const handleTicketUpdated = (updated: Ticket) => {
      if (updated._id === ticketId) {
        setTicket(updated);
        setTitleValue(updated.title);
        setDescValue(updated.description || '');
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
    if (!canUpdateTask) {
      alert('You can only update status on tasks assigned to you.');
      return;
    }
    try {
      const res = await apiClient.patch(`/tickets/${ticket._id}/status`, { status: newStatus });
      if (res.data.success) {
        setTicket(res.data.data);
        const actRes = await apiClient.get(`/ticket-comments/ticket/${ticket._id}/activities`);
        if (actRes.data.success) setActivities(actRes.data.data);
      }
    } catch (err: any) {
      console.error('Update status error:', err);
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (!ticket) return;
    if (!canUpdateTask) {
      alert('You can only update priority on tasks assigned to you.');
      return;
    }
    try {
      const res = await apiClient.patch(`/tickets/${ticket._id}`, { priority: newPriority });
      if (res.data.success) {
        setTicket(res.data.data);
      }
    } catch (err: any) {
      console.error('Update priority error:', err);
      alert(err.response?.data?.message || 'Failed to update priority');
    }
  };

  const handleSaveTitle = async () => {
    if (!ticket || !titleValue.trim()) return;
    if (!canUpdateTask) {
      alert('You can only edit tasks assigned to you.');
      return;
    }
    try {
      const res = await apiClient.patch(`/tickets/${ticket._id}`, { title: titleValue.trim() });
      if (res.data.success) {
        setTicket(res.data.data);
        setIsEditingTitle(false);
      }
    } catch (err: any) {
      console.error('Save title error:', err);
      alert(err.response?.data?.message || 'Failed to update title');
    }
  };

  const handleSaveDesc = async () => {
    if (!ticket) return;
    if (!canUpdateTask) {
      alert('You can only edit tasks assigned to you.');
      return;
    }
    try {
      const res = await apiClient.patch(`/tickets/${ticket._id}`, { description: descValue.trim() });
      if (res.data.success) {
        setTicket(res.data.data);
        setIsEditingDesc(false);
      }
    } catch (err: any) {
      console.error('Save desc error:', err);
      alert(err.response?.data?.message || 'Failed to update description');
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

  const toggleSubTicket = (id: string) => {
    if (!canUpdateTask) {
      alert('You can only update checklist items on tasks assigned to you.');
      return;
    }
    setSubTickets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s))
    );
  };

  const handleAddSubTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubTicketText.trim()) return;
    setSubTickets((prev) => [
      ...prev,
      {
        id: `sub-${Date.now()}`,
        title: newSubTicketText.trim(),
        done: false,
        num: `QUB-${String(prev.length + 1).padStart(2, '0')}`,
      },
    ]);
    setNewSubTicketText('');
    setShowAddSubTicket(false);
  };

  const completedSubTicketsCount = subTickets.filter((s) => s.done).length;

  const getStatusSelectStyling = (status: string) => {
    switch (status) {
      case 'Resolved':
        return {
          pill: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300',
          dot: 'text-emerald-600 dark:text-emerald-400 fill-emerald-600 dark:fill-emerald-400',
          chevron: 'text-emerald-600 dark:text-emerald-400',
        };
      case 'In Progress':
        return {
          pill: 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300',
          dot: 'text-amber-600 dark:text-amber-400 fill-amber-600 dark:fill-amber-400 animate-pulse',
          chevron: 'text-amber-600 dark:text-amber-400',
        };
      case 'Under Review':
        return {
          pill: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300',
          dot: 'text-indigo-600 dark:text-indigo-400 fill-indigo-600 dark:fill-indigo-400',
          chevron: 'text-indigo-600 dark:text-indigo-400',
        };
      case 'Closed':
        return {
          pill: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300',
          dot: 'text-slate-500 fill-slate-500',
          chevron: 'text-slate-500',
        };
      case 'Open':
      case 'To Do':
      default:
        return {
          pill: 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800 text-sky-800 dark:text-sky-300',
          dot: 'text-sky-600 dark:text-sky-400 fill-sky-600 dark:fill-sky-400',
          chevron: 'text-sky-600 dark:text-sky-400',
        };
    }
  };

  const getPrioritySelectClasses = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 font-bold';
      case 'Urgent':
        return 'bg-orange-50 dark:bg-orange-950/60 border-orange-300 dark:border-orange-800 text-orange-800 dark:text-orange-300 font-bold';
      case 'High':
        return 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold';
      case 'Normal':
        return 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800 text-sky-800 dark:text-sky-300 font-bold';
      case 'Low':
      default:
        return 'bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-300 font-bold';
    }
  };

  const statusStyling = getStatusSelectStyling(ticket?.status || 'To Do');

  // Assignee Management State & Handlers
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [isUpdatingAssignees, setIsUpdatingAssignees] = useState(false);

  const getCurrentAssigneeIds = (): string[] => {
    if (!ticket) return [];
    if (ticket.assigneeIds && ticket.assigneeIds.length > 0) {
      return ticket.assigneeIds.map((a: any) => a.id || a._id).filter(Boolean);
    }
    if (ticket.assigneeId) {
      const id = (ticket.assigneeId as any).id || (ticket.assigneeId as any)._id;
      return id ? [id] : [];
    }
    return [];
  };

  const allAssignees = ticket ? ((ticket.assigneeIds && ticket.assigneeIds.length > 0)
    ? ticket.assigneeIds
    : (ticket.assigneeId ? [ticket.assigneeId] : [])) : [];
  const allAssigneeIds = getCurrentAssigneeIds();

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const res = await apiClient.get('/organizations/members');
        if (res.data.success) {
          setTeamMembers(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load team members:', err);
      }
    };
    fetchTeamMembers();
  }, []);

  const handleAddAssignee = async (memberUserId: string) => {
    if (!ticket) return;
    if (!canUpdateTask) {
      alert('You do not have permission to assign teammates to this task.');
      return;
    }
    const currentIds = getCurrentAssigneeIds();
    if (currentIds.includes(memberUserId)) return;
    const updatedIds = [...currentIds, memberUserId];

    setIsUpdatingAssignees(true);
    try {
      const res = await apiClient.patch(`/tickets/${ticket._id}`, {
        assigneeIds: updatedIds,
        assigneeId: updatedIds[0],
      });
      if (res.data.success) {
        setTicket(res.data.data);
        setShowAssignDropdown(false);
        const actRes = await apiClient.get(`/ticket-comments/ticket/${ticket._id}/activities`);
        if (actRes.data.success) setActivities(actRes.data.data);
      }
    } catch (err: any) {
      console.error('Failed to assign teammate:', err);
      alert(err.response?.data?.message || 'Failed to assign teammate');
    } finally {
      setIsUpdatingAssignees(false);
    }
  };

  const handleRemoveAssignee = async (memberUserId: string) => {
    if (!ticket) return;
    if (!canUpdateTask) {
      alert('You do not have permission to modify teammates on this task.');
      return;
    }
    const currentIds = getCurrentAssigneeIds();
    const updatedIds = currentIds.filter((id) => id !== memberUserId);

    setIsUpdatingAssignees(true);
    try {
      const res = await apiClient.patch(`/tickets/${ticket._id}`, {
        assigneeIds: updatedIds,
        assigneeId: updatedIds[0] || null,
      });
      if (res.data.success) {
        setTicket(res.data.data);
        const actRes = await apiClient.get(`/ticket-comments/ticket/${ticket._id}/activities`);
        if (actRes.data.success) setActivities(actRes.data.data);
      }
    } catch (err: any) {
      console.error('Failed to remove assignee:', err);
      alert(err.response?.data?.message || 'Failed to remove assignee');
    } finally {
      setIsUpdatingAssignees(false);
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !newLinkUrl.trim()) return;
    setIsAddingLink(true);
    try {
      const res = await apiClient.post(`/tickets/${ticket._id}/links`, {
        title: newLinkTitle.trim() || newLinkUrl.trim(),
        url: newLinkUrl.trim(),
        type: newLinkType,
      });
      if (res.data.success) {
        setTicket((prev) => (prev ? { ...prev, links: res.data.data } : null));
        setNewLinkTitle('');
        setNewLinkUrl('');
        setShowAddLink(false);
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to add link');
    } finally {
      setIsAddingLink(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!ticket) return;
    if (!confirm('Are you sure you want to remove this link?')) return;
    try {
      const res = await apiClient.delete(`/tickets/${ticket._id}/links/${linkId}`);
      if (res.data.success) {
        setTicket((prev) => (prev ? { ...prev, links: res.data.data } : null));
      }
    } catch (err) {
      console.error('Delete link error:', err);
    }
  };

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

  const handleToolbarMentionClick = () => {
    const pos = commentInputRef.current?.selectionStart || commentText.length;
    const before = commentText.slice(0, pos);
    const after = commentText.slice(pos);
    setCommentText(`${before}@${after}`);
    setMentionQuery('');
    setMentionCursorIndex(pos);
    setShowMentionMenu(true);
    setTimeout(() => {
      if (commentInputRef.current) {
        commentInputRef.current.focus();
        commentInputRef.current.setSelectionRange(pos + 1, pos + 1);
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

  const getLinkIcon = (url: string, title?: string) => {
    const lower = `${url} ${title || ''}`.toLowerCase();
    if (lower.includes('github.com') || lower.includes('git')) {
      return <Code className="w-4 h-4 text-slate-800" />;
    }
    if (lower.includes('figma.com')) {
      return <Layers className="w-4 h-4 text-purple-600" />;
    }
    if (lower.includes('loom.com') || lower.includes('youtube.com') || lower.includes('video')) {
      return <Video className="w-4 h-4 text-indigo-600" />;
    }
    if (lower.includes('apple.com') || lower.includes('phosphor') || lower.includes('icon')) {
      return <Sparkles className="w-4 h-4 text-emerald-600" />;
    }
    if (lower.includes('docs') || lower.includes('notion') || lower.includes('wiki')) {
      return <BookOpen className="w-4 h-4 text-blue-600" />;
    }
    return <Globe className="w-4 h-4 text-blue-600" />;
  };

  const getDocTypeBadge = (fileName: string) => {
    const ext = (fileName.split('.').pop() || '').toLowerCase();
    if (['pdf'].includes(ext)) {
      return { label: 'PDF', bg: 'bg-red-50 text-red-700 border-red-200' };
    }
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return { label: ext.toUpperCase(), bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (['doc', 'docx'].includes(ext)) {
      return { label: 'DOC', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return { label: 'ZIP', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext)) {
      return { label: 'IMG', bg: 'bg-sky-50 text-sky-700 border-sky-200' };
    }
    if (['ts', 'tsx', 'js', 'json', 'py', 'html', 'css'].includes(ext)) {
      return { label: 'CODE', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
    }
    return { label: 'FILE', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-3.5rem)] bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading ticket details...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] bg-white p-6">
        <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
        <h3 className="text-base font-bold text-slate-800">Ticket Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">The requested ticket may have been moved or removed.</p>
        <Link to="/workspace/kanban">
          <Button size="sm">Back to Kanban Board</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-[#F1F5F9] dark:bg-[#0B0F19] font-sans text-slate-800">
      {/* 2-Column Responsive Body */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Left Main Scroll Area (70%) */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5">
          {/* Minimal Inline Back Navigation */}
          <div className="flex items-center justify-between pb-1">
            <button
              onClick={() => navigate('/workspace/kanban')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Board</span>
            </button>

            <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-md">
              {ticket.ticketNumber}
            </span>
          </div>

          {/* Title Area */}
          <div className="space-y-2">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  className="flex-1 text-xl font-bold text-slate-900 border border-blue-400 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-100"
                  autoFocus
                />
                <Button size="sm" onClick={handleSaveTitle}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingTitle(false)}>Cancel</Button>
              </div>
            ) : (
              <div className="flex items-start justify-between group">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                  {ticket.title}
                </h1>
                {canUpdateTask && (
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="text-slate-400 hover:text-blue-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Edit title"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
              <span className="font-mono font-semibold text-slate-700">{ticket.ticketNumber}</span>
              <span>·</span>
              <span>Created {ticket.createdAt ? formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true }) : 'recently'}</span>
              <span>·</span>
              <span className="text-slate-600">Reported by {ticket.reporterId?.name || 'Team Member'}</span>
            </div>
          </div>

          {/* Description Area */}
          <div className="space-y-2 rounded-xl border border-[#EAECF0] p-4 bg-[#F8FAFC]">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span>Description</span>
              {canUpdateTask && !isEditingDesc && (
                <button
                  onClick={() => setIsEditingDesc(true)}
                  className="text-blue-600 hover:underline font-semibold flex items-center gap-1 text-[11px]"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {isEditingDesc ? (
              <div className="space-y-2 mt-2">
                <textarea
                  rows={4}
                  value={descValue}
                  onChange={(e) => setDescValue(e.target.value)}
                  className="w-full text-xs text-slate-800 bg-white border border-blue-400 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-100 resize-y"
                />
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={handleSaveDesc}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingDesc(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap mt-1">
                {ticket.description || 'No description provided for this ticket.'}
              </p>
            )}
          </div>

          {/* QubixDesk AI Summary Card */}
          {ticket.description ? (
            <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/60 to-indigo-50/40 p-4 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-700">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>QubixDesk AI Summary</span>
                <span className="bg-blue-100 text-blue-700 text-[10px] font-semibold px-2 py-0.2 rounded-full ml-auto">
                  98% Confidence
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {ticket.description.length > 250
                  ? ticket.description.slice(0, 250) + '...'
                  : ticket.description}
              </p>
              <p className="text-[10px] text-slate-400 italic">
                Generated automatically by QubixDesk AI Intelligence based on ticket context.
              </p>
            </div>
          ) : null}

          {/* Sub-Tickets Checklist */}
          <div className="rounded-xl border border-[#EAECF0] p-4 space-y-3 bg-white shadow-2xs">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Sub-Tickets & Checklist</span>
                <span className="text-slate-400 font-normal">
                  ({completedSubTicketsCount}/{subTickets.length} completed)
                </span>
              </div>
              <button
                onClick={() => setShowAddSubTicket(!showAddSubTicket)}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add sub-ticket</span>
              </button>
            </div>

            {/* Checklist progress bar */}
            {subTickets.length > 0 && (
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(completedSubTicketsCount / subTickets.length) * 100}%` }}
                />
              </div>
            )}

            {subTickets.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-1">No checklist items or sub-tickets added yet.</p>
            ) : (
              <div className="space-y-1 pt-1">
                {subTickets.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => toggleSubTicket(st.id)}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer group transition-colors text-xs"
                  >
                    <span className="text-[10px] font-mono text-slate-400">{st.num}</span>
                    {st.done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300 group-hover:text-blue-500 shrink-0" />
                    )}
                    <span className={st.done ? 'text-slate-400 line-through' : 'text-slate-800 font-medium'}>
                      {st.title}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {showAddSubTicket && (
              <form onSubmit={handleAddSubTicket} className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <input
                  type="text"
                  placeholder="Sub-ticket title..."
                  value={newSubTicketText}
                  onChange={(e) => setNewSubTicketText(e.target.value)}
                  className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500"
                  autoFocus
                />
                <Button size="sm" type="submit">Add</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAddSubTicket(false)}>Cancel</Button>
              </form>
            )}
          </div>

          {/* Links Section */}
          <div className="rounded-xl border border-[#EAECF0] p-4 space-y-3 bg-white shadow-2xs">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Link2 className="w-4 h-4 text-blue-600" />
                <span>Links</span>
                <span className="text-slate-400 font-normal">({ticket.links?.length || 0})</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddLink(!showAddLink)}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add link</span>
              </button>
            </div>

            {/* Add link form */}
            {showAddLink && (
              <form onSubmit={handleAddLink} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Title</label>
                    <input
                      type="text"
                      placeholder="e.g. API Guidebook, Phosphor Icons, Loom..."
                      value={newLinkTitle}
                      onChange={(e) => setNewLinkTitle(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">URL *</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs outline-none focus:border-blue-500"
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button size="sm" variant="ghost" type="button" onClick={() => setShowAddLink(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" type="submit" isLoading={isAddingLink}>
                    Save Link
                  </Button>
                </div>
              </form>
            )}

            {/* Links List */}
            {!ticket.links || ticket.links.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No external links attached yet.</p>
            ) : (
              <div className="space-y-2">
                {ticket.links.map((link) => (
                  <div
                    key={link._id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 transition-colors group text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                        {getLinkIcon(link.url, link.title)}
                      </div>
                      <div className="min-w-0">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-slate-800 hover:text-blue-600 flex items-center gap-1.5 truncate text-xs"
                        >
                          <span>{link.title || link.url}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-500 shrink-0" />
                        </a>
                        <p className="text-[11px] text-slate-400 truncate max-w-md font-mono mt-0.5">
                          {link.url}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteLink(link._id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete link"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attachments Section */}
          <div className="rounded-xl border border-[#EAECF0] p-4 space-y-3 bg-white shadow-2xs">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Paperclip className="w-4 h-4 text-blue-600" />
                <span>Attachments & Documents</span>
                <span className="text-slate-400 font-normal">({attachments.length})</span>
              </div>
              <label className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Document</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.rar,.json,.png,.jpg,.jpeg,.svg,.webp"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>

            {isUploading && (
              <div className="text-xs text-blue-600 flex items-center gap-2 bg-blue-50 p-2.5 rounded-lg border border-blue-200">
                <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>Uploading document to secure storage...</span>
              </div>
            )}

            {attachments.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No documents or files attached yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {attachments.map((att) => {
                  const badge = getDocTypeBadge(att.originalName || att.fileName);
                  return (
                    <div
                      key={att._id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-slate-100/90 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-7 h-7 rounded flex items-center justify-center font-bold text-[9px] border shrink-0 ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate text-[11px]">
                            {att.originalName || att.fileName}
                          </p>
                          <p className="text-[10px] text-slate-400">{((att.sizeBytes || 0) / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <a
                          href={att.fileUrl}
                          download={att.originalName || att.fileName}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-slate-500 hover:text-blue-600 rounded transition-colors"
                          title="Download document"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(att._id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                          title="Delete file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Discussion & Comments Area */}
          <div className="rounded-xl border border-[#EAECF0] p-4 space-y-4 bg-white shadow-2xs">
            {/* Discussion Tabs */}
            <div className="flex items-center gap-4 border-b border-slate-200 pb-2 text-xs font-bold">
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex items-center gap-1.5 pb-2 -mb-2.5 border-b-2 transition-colors ${
                  activeTab === 'comments'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Public Comments ({comments.filter((c) => !c.isInternal).length})</span>
              </button>

              {canSeeInternalNotes && (
                <button
                  onClick={() => setActiveTab('internal')}
                  className={`flex items-center gap-1.5 pb-2 -mb-2.5 border-b-2 transition-colors ${
                    activeTab === 'internal'
                      ? 'border-amber-600 text-amber-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span>🔒 Internal Notes ({comments.filter((c) => c.isInternal).length})</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('activity')}
                className={`flex items-center gap-1.5 pb-2 -mb-2.5 border-b-2 transition-colors ${
                  activeTab === 'activity'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Activity History</span>
              </button>
            </div>

            {/* Internal Note Banner */}
            {activeTab === 'internal' && (
              <div className="bg-amber-50 border border-amber-200/80 rounded-lg p-3 text-xs text-amber-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Strict Security:</strong> Internal notes are visible only to team members and permanently hidden from external reporters.
                </span>
              </div>
            )}

            {/* Comment Stream */}
            {activeTab !== 'activity' ? (
              <div className="space-y-3">
                {comments
                  .filter((c) => (activeTab === 'internal' ? c.isInternal : !c.isInternal))
                  .map((comment) => (
                    <div
                      key={comment._id}
                      className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                        comment.isInternal
                          ? 'bg-amber-50/40 border-amber-200/80'
                          : 'bg-[#F8FAFC] border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar name={comment.authorId?.name} src={comment.authorId?.avatarUrl} size="xs" />
                          <span className="font-bold text-slate-900">{comment.authorId?.name}</span>
                          <span className="text-[10px] text-slate-400">
                            {comment.createdAt
                              ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })
                              : 'recently'}
                          </span>
                          {comment.isInternal && (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                              🔒 Internal Only
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {renderContentWithMentions(comment.content)}
                      </p>
                    </div>
                  ))}

                {comments.filter((c) => (activeTab === 'internal' ? c.isInternal : !c.isInternal)).length === 0 && (
                  <p className="text-xs text-slate-400 italic py-2">
                    {activeTab === 'internal' ? 'No internal notes added yet.' : 'No public comments yet.'}
                  </p>
                )}
              </div>
            ) : (
              /* Activity Timeline */
              <div className="space-y-2 text-xs">
                {activities.map((act) => (
                  <div key={act._id} className="flex items-center gap-2 text-slate-600 py-1 border-b border-slate-100">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="font-semibold text-slate-800">{act.userId?.name}</span>
                    <span className="text-slate-500">{act.action}</span>
                    <span className="text-[10px] text-slate-400 ml-auto">
                      {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Comment Composer */}
            {activeTab !== 'activity' && (
              <form onSubmit={handleAddComment} className="relative border border-[#EAECF0] rounded-xl overflow-visible bg-white shadow-2xs">
                {/* Floating Mention Autocomplete Menu */}
                {showMentionMenu && filteredMembers.length > 0 && (
                  <div className="absolute bottom-full left-3 mb-2 w-64 bg-white border border-[#EAECF0] rounded-xl shadow-xl z-30 overflow-hidden py-1">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 border-b border-slate-100 flex items-center justify-between">
                      <span>Mention teammate</span>
                      <span className="font-mono text-[9px] text-blue-600">Click to tag</span>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredMembers.map((member) => (
                        <div
                          key={member.id}
                          onClick={() => handleInsertMention(member.user.name)}
                          className="px-3 py-2 flex items-center gap-2 hover:bg-blue-50 cursor-pointer transition-colors text-xs"
                        >
                          <Avatar name={member.user.name} src={member.user.avatarUrl} size="xs" />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate leading-tight">{member.user.name}</p>
                            <p className="text-[10px] text-slate-400 truncate capitalize">{member.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <textarea
                  ref={commentInputRef}
                  rows={3}
                  value={commentText}
                  onChange={handleCommentTextChange}
                  placeholder={
                    activeTab === 'internal' || isInternalNote
                      ? 'Add an internal note (type @ to tag teammates)...'
                      : 'Leave a reply for team and reporters (type @ to tag teammates)...'
                  }
                  className="w-full p-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none resize-none rounded-t-xl"
                />

                <div className="bg-[#F8FAFC] px-3 py-2 border-t border-[#EAECF0] rounded-b-xl flex items-center justify-between text-slate-500 text-xs">
                  <div className="flex items-center gap-2">
                    <button type="button" className="hover:text-slate-800 p-1"><Bold className="w-3.5 h-3.5" /></button>
                    <button type="button" className="hover:text-slate-800 p-1"><Italic className="w-3.5 h-3.5" /></button>
                    <button type="button" className="hover:text-slate-800 p-1"><Code className="w-3.5 h-3.5" /></button>
                    <button
                      type="button"
                      onClick={handleToolbarMentionClick}
                      title="Mention teammate (@)"
                      className="hover:text-blue-600 hover:bg-blue-50 p-1 rounded flex items-center gap-0.5 text-slate-600 font-semibold"
                    >
                      <AtSign className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-[11px]">Tag</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    {canSeeInternalNotes && activeTab !== 'internal' && (
                      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isInternalNote}
                          onChange={(e) => setIsInternalNote(e.target.checked)}
                          className="rounded border-amber-300 text-amber-600 focus:ring-0 w-3 h-3"
                        />
                        <span>🔒 Mark as Internal</span>
                      </label>
                    )}

                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSubmittingComment || !commentText.trim()}
                      isLoading={isSubmittingComment}
                      rightIcon={<Send className="w-3 h-3" />}
                    >
                      Send Reply
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Details Sidebar (30%) */}
        <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-[#EAECF0] dark:border-slate-800 bg-white dark:bg-[#111827] overflow-y-auto p-6 space-y-6 text-xs text-slate-700 dark:text-slate-300 shrink-0">
          {/* Status & Share Header Bar */}
          <div className="pb-4 border-b border-[#EAECF0] dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Current Status</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Task URL copied to clipboard!');
                }}
                title="Share task link"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 px-2 py-1 rounded-lg transition-colors border border-transparent hover:border-blue-200"
              >
                <Share2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Share</span>
              </button>
            </div>

            {/* Dynamic Status Selector Pill Styled to Status Nature */}
            <div className="relative">
              <select
                value={ticket.status}
                disabled={!canUpdateTask}
                title={!canUpdateTask ? 'Only assigned members can update this task' : undefined}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={`w-full appearance-none border font-bold text-xs rounded-xl pl-8 pr-7 py-2 outline-none transition-all shadow-2xs ${statusStyling.pill} ${
                  !canUpdateTask ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-xs'
                }`}
              >
                <option value="To Do">Open / To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Under Review">Customer in Review</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
              <Circle className={`w-2.5 h-2.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${statusStyling.dot}`} />
              <ChevronDown className={`w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${statusStyling.chevron}`} />
            </div>
            {!canUpdateTask && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                🔒 You can only update tasks assigned to you.
              </p>
            )}
          </div>

          {/* Attributes Card */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Task Attributes</span>
            </h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Priority</span>
                <select
                  value={ticket.priority}
                  disabled={!canUpdateTask}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                  className={`text-xs border rounded-lg px-2.5 py-1 outline-none transition-all cursor-pointer shadow-2xs ${getPrioritySelectClasses(
                    ticket.priority
                  )} ${!canUpdateTask ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-xs'}`}
                >
                  <option value="Critical">Critical</option>
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Normal">Normal</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Category</span>
                <CategoryBadge category={ticket.category || 'Task'} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Due Date</span>
                <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{ticket.dueDate ? format(new Date(ticket.dueDate), 'MMM d, yyyy') : 'No due date'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* People Section: Interactive Teammate Assignment */}
          <div className="pt-4 border-t border-[#EAECF0] dark:border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Assigned Team</span>
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950 px-1.5 py-0.2 rounded-full">
                  {allAssignees.length}
                </span>
              </h4>

              {canUpdateTask && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAssignDropdown(!showAssignDropdown)}
                    disabled={isUpdatingAssignees}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-2xs"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>+ Assign</span>
                  </button>

                  {/* Teammates Picker Dropdown */}
                  {showAssignDropdown && (
                    <div className="absolute right-0 top-full mt-1.5 w-68 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-2 z-50 animate-fadeIn text-xs">
                      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 dark:border-slate-800 px-1">
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Select Teammates</span>
                        <button
                          onClick={() => setShowAssignDropdown(false)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 rounded cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="max-h-52 overflow-y-auto space-y-1">
                        {teamMembers.length === 0 ? (
                          <div className="p-3 text-center text-xs text-slate-400">Loading members...</div>
                        ) : (
                          teamMembers.map((m) => {
                            const mUserId = m.user?.id || (m.user as any)?._id || m.id;
                            const isAssigned = allAssigneeIds.includes(mUserId);

                            return (
                              <button
                                key={mUserId}
                                type="button"
                                disabled={isUpdatingAssignees}
                                onClick={() => {
                                  if (isAssigned) {
                                    handleRemoveAssignee(mUserId);
                                  } else {
                                    handleAddAssignee(mUserId);
                                  }
                                }}
                                className={`w-full p-1.5 rounded-lg flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                                  isAssigned
                                    ? 'bg-blue-50/90 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-900'
                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <Avatar name={m.user?.name || 'User'} src={m.user?.avatarUrl} size="xs" />
                                  <div className="min-w-0">
                                    <p className="font-semibold text-xs truncate leading-tight">{m.user?.name}</p>
                                    <p className="text-[10px] text-slate-400 truncate capitalize">{m.role}</p>
                                  </div>
                                </div>

                                <div className="shrink-0">
                                  {isAssigned ? (
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-900 flex items-center gap-0.5">
                                      <Check className="w-2.5 h-2.5" /> Assigned
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                                      + Add
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                {allAssignees.map((assignee, idx) => {
                  const aId = assignee.id || (assignee as any)._id;

                  return (
                    <div
                      key={aId || idx}
                      className="group flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar name={assignee.name || 'Member'} src={assignee.avatarUrl} size="xs" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate">
                              {assignee.name || 'Member'}
                            </p>
                            {idx === 0 && (
                              <span className="text-[9px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 px-1.5 py-0.1 rounded border border-purple-200 dark:border-purple-900">
                                Lead
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">
                            {assignee.email || assignee.designation || 'Teammate'}
                          </p>
                        </div>
                      </div>

                      {canUpdateTask && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAssignee(aId)}
                          disabled={isUpdatingAssignees}
                          title="Remove teammate from task"
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-all cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {allAssignees.length === 0 && (
                  <div className="text-slate-400 text-xs italic py-2 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                    No team members assigned yet
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Reporter</span>
                <div className="flex items-center gap-2">
                  <Avatar name={ticket.reporterId?.name || 'User'} size="xs" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{ticket.reporterId?.name || 'Reporter'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tags Section */}
          <div className="pt-4 border-t border-[#EAECF0] dark:border-slate-800 space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Tags</span>
            </h4>

            <div className="flex flex-wrap gap-1.5">
              {ticket.tags && ticket.tags.length > 0 ? (
                ticket.tags.map((tg) => (
                  <span
                    key={tg}
                    className="bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900 text-[11px] px-2 py-0.5 rounded-md font-medium"
                  >
                    #{tg}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 text-xs italic">No tags</span>
              )}
            </div>
          </div>

          {/* Meta Info */}
          <div className="pt-4 border-t border-[#EAECF0] dark:border-slate-800 space-y-2 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Created</span>
              <span>{ticket.createdAt ? format(new Date(ticket.createdAt), 'MMM d, yyyy h:mm a') : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span>Last Updated</span>
              <span>{ticket.updatedAt ? formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true }) : '-'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
