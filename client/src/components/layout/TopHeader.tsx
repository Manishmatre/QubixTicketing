import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useTheme } from '../../context/ThemeContext';
import { apiClient } from '../../api/client';
import { NotificationItem } from '../../types';
import { Avatar } from '../ui/Avatar';
import { UniversalSearchModal } from './UniversalSearchModal';
import {
  Bell,
  Search,
  Plus,
  CheckCircle2,
  LayoutDashboard,
  FolderKanban,
  Layers,
  Ticket as TicketIcon,
  Users,
  BarChart3,
  Zap,
  CreditCard,
  Settings,
  User,
  CalendarRange,
  Sun,
  Moon,
  Laptop,
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
  const { socket, onlineUserIds } = useSocket();
  const { theme, setTheme, toggleTheme } = useTheme();
  const location = useLocation();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifMenu, setShowNotifMenu] = useState<boolean>(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);

  // Global Ctrl+K / Cmd+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Determine dynamic section title and icon from current pathname
  const getHeaderMeta = () => {
    const p = location.pathname;
    if (p.includes('/workspace/dashboard')) return { title: 'Dashboard', icon: LayoutDashboard };
    if (p.includes('/workspace/kanban')) return { title: 'Kanban Board', icon: TicketIcon };
    if (p.includes('/workspace/gantt')) return { title: 'Timeline (Gantt)', icon: CalendarRange };
    if (p.includes('/workspace/tickets')) return { title: 'All Tickets', icon: Layers };
    if (p.includes('/workspace/my-tickets')) return { title: 'My Tickets', icon: CheckCircle2 };
    if (p.includes('/workspace/projects')) return { title: 'Projects', icon: FolderKanban };
    if (p.includes('/workspace/teams')) return { title: 'Teams', icon: Users };
    if (p.includes('/workspace/reports')) return { title: 'Analytics & SLA', icon: BarChart3 };
    if (p.includes('/workspace/workflows')) return { title: 'Automations', icon: Zap };
    if (p.includes('/workspace/billing')) return { title: 'Billing & Plan', icon: CreditCard };
    if (p.includes('/workspace/settings')) return { title: 'Settings', icon: Settings };
    if (p.includes('/workspace/profile')) return { title: 'User Profile', icon: User };
    return { title: 'Workspace', icon: LayoutDashboard };
  };

  const { title: headerTitle, icon: HeaderIcon } = getHeaderMeta();

  return (
    <>
      <header className="h-14 bg-white border-b border-[#EAECF0] px-5 flex items-center justify-between shrink-0 font-sans z-20">
        {/* Left: Dynamic Breadcrumb */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <HeaderIcon className="w-4 h-4" />
          </div>
          <h1 className="text-sm font-bold text-slate-900 tracking-tight">
            {headerTitle}
          </h1>
        </div>

        {/* Middle: Universal Search Bar Trigger */}
        <div
          onClick={() => setIsSearchModalOpen(true)}
          className="hidden sm:flex w-80 relative items-center cursor-pointer group"
          title="Open Universal Search (⌘K / Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 absolute left-3 pointer-events-none transition-colors" />
          <div className="w-full bg-[#F8FAFC] group-hover:bg-slate-100/80 border border-[#EAECF0] rounded-lg pl-8 pr-10 py-1.5 text-xs text-slate-400 transition-all select-none">
            Search tickets, projects, or pages...
          </div>
          <span className="absolute right-2.5 text-[10px] text-slate-400 font-mono pointer-events-none bg-slate-100 px-1 py-0.5 rounded border border-slate-200/60">
            ⌘K
          </span>
        </div>

        {/* Right: Actions, Live Teammates, Theme Toggle & Profile */}
        <div className="flex items-center gap-2.5">
          {/* Live Online Teammates Indicator */}
          <div
            className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200/80 text-[11px] font-semibold text-emerald-800"
            title={`${Math.max(1, onlineUserIds.length)} teammate(s) currently online with live sync`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{Math.max(1, onlineUserIds.length)} Live</span>
          </div>

          {/* + New Ticket Button */}
          <button
            onClick={onOpenCreateTicket}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold shadow-xs shadow-blue-500/20 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New ticket</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-200 mx-0.5" />

          {/* 3-WAY THEME TOGGLE (Light -> Combo -> Dark) */}
          <button
            onClick={toggleTheme}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg relative transition-colors cursor-pointer"
            title={`Current Theme: ${theme.toUpperCase()} (Click to switch: Light → Combo → Dark)`}
          >
            {theme === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
            {theme === 'combo' && <Laptop className="w-4 h-4 text-blue-500" />}
            {theme === 'dark' && <Moon className="w-4 h-4 text-purple-400" />}
          </button>

          {/* Notifications Popover */}
          <div className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg relative transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-[#EAECF0] py-2 z-50 animate-fadeIn">
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
                      className="text-[11px] text-blue-600 hover:underline font-medium cursor-pointer"
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

          <div className="h-4 w-[1px] bg-slate-200 mx-0.5" />

          {/* User Profile Link */}
          <Link
            to="/workspace/profile"
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors group cursor-pointer"
            title="View My Profile"
          >
            <Avatar name={user?.name} src={user?.avatarUrl} size="sm" />
            <div className="hidden lg:block text-left">
              <span className="block text-xs font-semibold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
                {user?.name?.split(' ')[0]}
              </span>
              <span className="block text-[10px] text-slate-400 capitalize leading-tight">
                {organization?.role || 'Member'}
              </span>
            </div>
          </Link>
        </div>
      </header>

      {/* Universal Search & Command Palette Modal */}
      <UniversalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </>
  );
};
