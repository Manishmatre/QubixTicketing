import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { apiClient } from '../../api/client';
import { NotificationItem } from '../../types';
import { Avatar } from '../ui/Avatar';
import {
  Bell,
  Search,
  Plus,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TopHeaderProps {
  onOpenCreateTicket: () => void;
  onSearchChange?: (val: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenCreateTicket,
  onSearchChange,
}) => {
  const { user, organization } = useAuth();
  const { socket } = useSocket();
  const location = useLocation();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifMenu, setShowNotifMenu] = useState<boolean>(false);
  const [searchVal, setSearchVal] = useState<string>('');

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Real-time socket notification listener
  useEffect(() => {
    if (!socket) return;

    const handleNewNotif = (notif: NotificationItem) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((c) => c + 1);
    };

    socket.on('notification:new', handleNewNotif);
    return () => {
      socket.off('notification:new', handleNewNotif);
    };
  }, [socket]);

  const markAllRead = async () => {
    try {
      await apiClient.post('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      // ignore
    }
  };

  const markOneRead = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      // ignore
    }
  };

  // Determine dynamic section title from current pathname
  const getPageTitle = () => {
    const p = location.pathname;
    if (p.includes('/workspace/kanban')) return 'Kanban Board';
    if (p.includes('/workspace/tickets/')) return 'Ticket Details';
    if (p.includes('/workspace/tickets')) return 'All Tickets';
    if (p.includes('/workspace/my-tickets')) return 'Assigned to Me';
    if (p.includes('/workspace/dashboard')) return 'Overview Dashboard';
    if (p.includes('/workspace/projects/')) return 'Project Details';
    if (p.includes('/workspace/projects')) return 'Projects Directory';
    if (p.includes('/workspace/teams')) return 'Team Members';
    if (p.includes('/workspace/reports')) return 'Analytics & Reports';
    if (p.includes('/workspace/workflows')) return 'Workflow Automations';
    if (p.includes('/workspace/billing')) return 'Subscription & Billing';
    if (p.includes('/workspace/settings')) return 'Workspace Settings';
    if (p.includes('/workspace/profile')) return 'My Profile';
    return 'Workspace';
  };

  return (
    <header className="h-14 bg-white border-b border-[#EAECF0] px-6 flex items-center justify-between sticky top-0 z-20 shrink-0 font-sans">
      {/* Left: Clean Minimal Page Title */}
      <div className="flex items-center gap-2">
        <h1 className="text-sm font-bold text-slate-900 tracking-tight">
          {getPageTitle()}
        </h1>
      </div>

      {/* Middle: Clean Minimalist Search Input */}
      <div className="hidden sm:flex w-72 relative items-center">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          placeholder="Search tickets, IDs, or keywords..."
          value={searchVal}
          onChange={(e) => {
            setSearchVal(e.target.value);
            if (onSearchChange) onSearchChange(e.target.value);
          }}
          className="w-full bg-[#F8FAFC] hover:bg-slate-100/70 focus:bg-white border border-[#EAECF0] rounded-lg pl-8 pr-8 py-1.5 text-xs text-slate-900 transition-all outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
        />
        <span className="absolute right-2.5 text-[10px] text-slate-400 font-mono pointer-events-none">
          ⌘K
        </span>
      </div>

      {/* Right: Actions, Notifications & Avatar */}
      <div className="flex items-center gap-3">
        {/* + New Ticket in QubixDesk Theme Blue */}
        <button
          onClick={onOpenCreateTicket}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm shadow-blue-500/20 transition-all active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New ticket</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-[#EAECF0] py-2 z-50">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-blue-600 hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => markOneRead(n._id)}
                      className={`p-3 text-xs transition-colors cursor-pointer hover:bg-slate-50 flex gap-2.5 ${
                        !n.isRead ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="mt-0.5">
                        {!n.isRead ? (
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-1" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate text-[11px]">{n.title}</p>
                        <p className="text-slate-600 mt-0.5 line-clamp-2 leading-relaxed text-[11px]">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Link */}
        <Link
          to="/workspace/profile"
          className="flex items-center rounded-full hover:ring-2 hover:ring-blue-500/20 transition-all cursor-pointer"
          title="View My Profile"
        >
          <Avatar name={user?.name} src={user?.avatarUrl} size="sm" />
        </Link>
      </div>
    </header>
  );
};
