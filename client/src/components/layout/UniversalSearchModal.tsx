import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import {
  Search,
  Ticket as TicketIcon,
  FolderKanban,
  LayoutDashboard,
  Layers,
  Users,
  BarChart3,
  Zap,
  CreditCard,
  Settings,
  User,
  ArrowRight,
  CalendarRange,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';

interface UniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  category: 'Tickets' | 'Projects' | 'Pages' | 'Team';
  title: string;
  subtitle?: string;
  icon: any;
  url: string;
  badge?: string;
  badgeColor?: string;
}

export const UniversalSearchModal: React.FC<UniversalSearchModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Static navigation routes
  const staticPages: SearchItem[] = [
    {
      id: 'page-dashboard',
      category: 'Pages',
      title: 'Dashboard Overview',
      subtitle: 'Real-time metrics, recent tickets, SLA compliance',
      icon: LayoutDashboard,
      url: '/workspace/dashboard',
    },
    {
      id: 'page-kanban',
      category: 'Pages',
      title: 'Sprint Kanban Board',
      subtitle: 'Interactive drag-and-drop workflow columns',
      icon: TicketIcon,
      url: '/workspace/kanban',
      badge: 'Live',
      badgeColor: 'bg-blue-100 text-blue-700',
    },
    {
      id: 'page-gantt',
      category: 'Pages',
      title: 'Timeline & Gantt View',
      subtitle: 'Visual sprint schedules and duration bars',
      icon: CalendarRange,
      url: '/workspace/gantt',
    },
    {
      id: 'page-tickets',
      category: 'Pages',
      title: 'All Tickets List',
      subtitle: 'Comprehensive tabular view with multi-column filters',
      icon: Layers,
      url: '/workspace/tickets',
    },
    {
      id: 'page-my-tickets',
      category: 'Pages',
      title: 'My Assigned Tickets',
      subtitle: 'Tickets assigned directly to you',
      icon: TicketIcon,
      url: '/workspace/my-tickets',
    },
    {
      id: 'page-projects',
      category: 'Pages',
      title: 'Project Workspaces',
      subtitle: 'Manage core product engineering repositories',
      icon: FolderKanban,
      url: '/workspace/projects',
    },
    {
      id: 'page-teams',
      category: 'Pages',
      title: 'Teams & Teammates',
      subtitle: 'Multi-tenant team directory and live presence',
      icon: Users,
      url: '/workspace/teams',
    },
    {
      id: 'page-reports',
      category: 'Pages',
      title: 'Analytics & SLA Telemetry',
      subtitle: 'Velocity metrics, resolution times, CSV reports',
      icon: BarChart3,
      url: '/workspace/reports',
    },
    {
      id: 'page-workflows',
      category: 'Pages',
      title: 'Workflow Automation Engine',
      subtitle: 'Triggers, auto-assignments, and SLA escalations',
      icon: Zap,
      url: '/workspace/workflows',
    },
    {
      id: 'page-billing',
      category: 'Pages',
      title: 'Billing & Team Seats',
      subtitle: 'Per-user seat licensing, upgrades, invoices',
      icon: CreditCard,
      url: '/workspace/billing',
    },
    {
      id: 'page-settings',
      category: 'Pages',
      title: 'Workspace Settings',
      subtitle: 'Prefixes, webhooks, SLA policies, and org profile',
      icon: Settings,
      url: '/workspace/settings',
    },
    {
      id: 'page-profile',
      category: 'Pages',
      title: 'My User Profile',
      subtitle: 'Personal details, designation, avatar, security',
      icon: User,
      url: '/workspace/profile',
    },
  ];

  // Auto-focus on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
      setResults(staticPages);
    }
  }, [isOpen]);

  // Search logic across Tickets, Projects, and Pages
  useEffect(() => {
    if (!isOpen) return;

    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      setResults(staticPages);
      setSelectedIndex(0);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        // Filter static pages
        const matchedPages = staticPages.filter(
          (p) =>
            p.title.toLowerCase().includes(trimmed) ||
            p.subtitle?.toLowerCase().includes(trimmed)
        );

        // Fetch matching tickets
        const ticketsRes = await apiClient.get(`/tickets?limit=8&search=${encodeURIComponent(trimmed)}`).catch(() => null);
        const ticketItems: SearchItem[] = (ticketsRes?.data?.data || []).map((t: any) => ({
          id: `ticket-${t._id}`,
          category: 'Tickets',
          title: `${t.ticketNumber || 'TICKET'}: ${t.title}`,
          subtitle: `Status: ${t.status} • Priority: ${t.priority} • ${t.assigneeId?.name || 'Unassigned'}`,
          icon: TicketIcon,
          url: `/workspace/tickets/${t._id}`,
          badge: t.priority,
          badgeColor:
            t.priority === 'Critical'
              ? 'bg-red-100 text-red-700'
              : t.priority === 'High'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-blue-100 text-blue-700',
        }));

        // Fetch matching projects
        const projectsRes = await apiClient.get('/projects').catch(() => null);
        const projectItems: SearchItem[] = (projectsRes?.data?.data || [])
          .filter((p: any) => p.name.toLowerCase().includes(trimmed) || p.key?.toLowerCase().includes(trimmed))
          .map((p: any) => ({
            id: `project-${p._id}`,
            category: 'Projects',
            title: `${p.name} (${p.key})`,
            subtitle: p.description || 'Project workspace',
            icon: FolderKanban,
            url: `/workspace/projects/${p._id}`,
          }));

        setResults([...ticketItems, ...projectItems, ...matchedPages]);
        setSelectedIndex(0);
      } catch (err) {
        // fallback to pages
        setResults(staticPages.filter((p) => p.title.toLowerCase().includes(trimmed)));
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // Keyboard navigation: ArrowUp, ArrowDown, Enter, Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          navigate(results[selectedIndex].url);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 px-4 animate-fadeIn">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="h-14 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-white dark:bg-[#111827] shrink-0">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tickets, IDs (DEV-...), projects, or pages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200/80 dark:border-slate-700">
            ESC to close
          </span>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Searching workspace...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No results found for "{query}". Try searching by ticket number or page name.
            </div>
          ) : (
            results.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    navigate(item.url);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-blue-900/30 text-blue-900 dark:text-blue-300'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold truncate leading-tight">{item.title}</span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          {item.category}
                        </span>
                        {item.badge && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${item.badgeColor || 'bg-slate-100 text-slate-600'}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.subtitle}</p>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex items-center gap-1 text-[11px] text-blue-600 font-semibold shrink-0 ml-2">
                      <span>Jump</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="h-9 px-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">↑↓</kbd> Navigate</span>
            <span><kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">↵</kbd> Select</span>
          </div>
          <span>QubixDesk Universal Search</span>
        </div>
      </div>
    </div>
  );
};

