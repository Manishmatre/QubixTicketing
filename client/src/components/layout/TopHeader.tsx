import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { apiClient } from '../../api/client';
import { NotificationItem } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import {
  Bell,
  Search,
  Plus,
  Check,
  ExternalLink,
  CheckCircle2,
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
  const { user } = useAuth();
  const { socket } = useSocket();
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

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Global Search Bar */}
      <div className="w-80 relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          placeholder="Search tickets, IDs, or projects..."
          value={searchVal}
          onChange={(e) => {
            setSearchVal(e.target.value);
            if (onSearchChange) onSearchChange(e.target.value);
          }}
          className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-900 transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Action Buttons & Notifications */}
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={onOpenCreateTicket}
        >
          New Ticket
        </Button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg relative transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
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
                    No notifications yet
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
                        <p className="font-semibold text-slate-900 truncate">{n.title}</p>
                        <p className="text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
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

        {/* User Avatar */}
        <Avatar name={user?.name} src={user?.avatarUrl} size="sm" />
      </div>
    </header>
  );
};

