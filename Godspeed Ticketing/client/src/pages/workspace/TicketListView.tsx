import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Ticket } from '../../types';
import { apiClient } from '../../api/client';
import { PriorityBadge, StatusBadge, CategoryBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  Download,
  Filter,
  Search,
  Plus,
  Trash2,
  CheckSquare,
  FileSpreadsheet,
  FileText,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TicketListViewProps {
  onSelectTicket: (ticketId: string) => void;
  onOpenCreateTicket: () => void;
  myTicketsOnly?: boolean;
}

export const TicketListView: React.FC<TicketListViewProps> = ({
  onSelectTicket,
  onOpenCreateTicket,
  myTicketsOnly = false,
}) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page,
        limit: 25,
        search,
      };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (myTicketsOnly) {
        // Handled via backend assignee filter or current user
      }

      const res = await apiClient.get('/tickets', { params });
      if (res.data.success) {
        setTickets(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
        setTotalCount(res.data.pagination.total);
      }
    } catch (err) {
      console.error('Fetch ticket list error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const { socket } = useSocket();

  useEffect(() => {
    fetchTickets();
  }, [page, statusFilter, priorityFilter, search, myTicketsOnly]);

  // Real-time socket sync
  useEffect(() => {
    if (!socket) return;

    const handleCreated = (newTicket: Ticket) => {
      setTickets((prev) => [newTicket, ...prev.filter((t) => t._id !== newTicket._id)]);
      setTotalCount((c) => c + 1);
    };

    const handleUpdated = (updatedTicket: Ticket) => {
      setTickets((prev) =>
        prev.map((t) => (t._id === updatedTicket._id ? updatedTicket : t))
      );
    };

    const handleDeleted = (data: { ticketId: string }) => {
      setTickets((prev) => prev.filter((t) => t._id !== data.ticketId));
      setTotalCount((c) => Math.max(0, c - 1));
    };

    socket.on('ticket:created', handleCreated);
    socket.on('ticket:updated', handleUpdated);
    socket.on('ticket:status_changed', handleUpdated);
    socket.on('ticket:deleted', handleDeleted);

    return () => {
      socket.off('ticket:created', handleCreated);
      socket.off('ticket:updated', handleUpdated);
      socket.off('ticket:status_changed', handleUpdated);
      socket.off('ticket:deleted', handleDeleted);
    };
  }, [socket]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(tickets.map((t) => t._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkStatus = async (status: string) => {
    if (selectedIds.length === 0) return;
    try {
      await apiClient.post('/tickets/bulk', { ticketIds: selectedIds, status });
      setSelectedIds([]);
      fetchTickets();
    } catch (err) {
      console.error('Bulk update error:', err);
    }
  };

  const handleDeleteTicket = async (e: React.MouseEvent, tId: string, tNum: string) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to permanently delete task "${tNum}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await apiClient.delete(`/tickets/${tId}`);
      if (res.data.success) {
        setTickets((prev) => prev.filter((t) => t._id !== tId));
        setTotalCount((c) => Math.max(0, c - 1));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await apiClient.get('/reports/export-csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'godspeed-tickets-export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export CSV error:', err);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Godspeed Desk Operations Tracking Report', 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleDateString()} • Total Tickets: ${tickets.length}`, 14, 25);

    const tableData = tickets.map((t) => [
      t.ticketNumber,
      t.title,
      t.projectId?.name || '',
      t.status,
      t.priority,
      t.assigneeId?.name || 'Unassigned',
      t.dueDate ? format(new Date(t.dueDate), 'MMM d, yyyy') : '-',
    ]);

    autoTable(doc, {
      startY: 32,
      head: [['ID', 'Title', 'Project', 'Status', 'Priority', 'Assignee', 'Due Date']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontSize: 9 },
      styles: { fontSize: 8 },
    });

    doc.save('godspeed-tickets-report.pdf');
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-[#F1F5F9] dark:bg-[#0B0F19] font-sans text-slate-800">
      {/* Top Filter & Toolbar */}
      <div className="px-5 py-2.5 bg-white border-b border-slate-200/90 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-64">
            <Input
              placeholder="Filter by title, ID, or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-3.5 h-3.5" />}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Under Review">Under Review</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Normal">Normal</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* Bulk Action Bar */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg text-xs">
              <span className="font-bold text-blue-700">{selectedIds.length} selected</span>
              <button
                onClick={() => handleBulkStatus('Resolved')}
                className="text-xs text-blue-700 font-semibold hover:underline"
              >
                Mark Resolved
              </button>
              <span>•</span>
              <button
                onClick={() => handleBulkStatus('In Progress')}
                className="text-xs text-blue-700 font-semibold hover:underline"
              >
                Move to In Progress
              </button>
            </div>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
          >
            Export CSV
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportPDF}
            leftIcon={<FileText className="w-4 h-4 text-red-600" />}
          >
            PDF Report
          </Button>
        </div>
      </div>

      {/* Main Table with Guaranteed Horizontal Scrolling and Clean Light Borders */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[1040px] border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs">
                <tr>
                  <th className="p-3.5 w-12 text-center border-r border-[#EAECF0]/60">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === tickets.length && tickets.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4 w-28 border-r border-[#EAECF0]/60">Ticket ID</th>
                  <th className="py-3 px-4 min-w-[260px] border-r border-[#EAECF0]/60">Title & Category</th>
                  <th className="py-3 px-4 w-40 border-r border-[#EAECF0]/60">Project</th>
                  <th className="py-3 px-4 w-32 border-r border-[#EAECF0]/60">Status</th>
                  <th className="py-3 px-4 w-28 border-r border-[#EAECF0]/60">Priority</th>
                  <th className="py-3 px-4 w-40 border-r border-[#EAECF0]/60">Assignee</th>
                  <th className="py-3 px-4 w-32 border-r border-[#EAECF0]/60">Due Date</th>
                  <th className="py-3 px-4 w-32 border-r border-[#EAECF0]/60">Created</th>
                  <th className="py-3 px-3 w-16 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAECF0] bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-16 text-slate-400">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2" />
                      <p className="font-medium text-xs">Loading tickets...</p>
                    </td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-16 text-slate-400">
                      <p className="font-semibold text-slate-600 text-sm">No tickets found</p>
                      <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or create a new ticket.</p>
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => (
                    <tr
                      key={t._id}
                      onClick={() => onSelectTicket(t._id)}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                    >
                      <td className="p-3.5 text-center border-r border-[#EAECF0]/40" onClick={(e) => handleSelectOne(t._id, e)}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(t._id)}
                          onChange={() => {}}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 border-r border-[#EAECF0]/40 whitespace-nowrap">
                        <span className="bg-blue-50/80 px-2 py-0.5 rounded border border-blue-200/50">
                          {t.ticketNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-md border-r border-[#EAECF0]/40">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900 group-hover:text-blue-600 truncate transition-colors text-xs">
                            {t.title}
                          </p>
                          <CategoryBadge category={t.category || 'Task'} size="sm" />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap border-r border-[#EAECF0]/40">
                        {t.projectId?.name || 'General Project'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap border-r border-[#EAECF0]/40">
                        <StatusBadge status={t.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap border-r border-[#EAECF0]/40">
                        <PriorityBadge priority={t.priority} size="sm" />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap border-r border-[#EAECF0]/40">
                        <div className="flex items-center gap-2">
                          {t.assigneeIds && t.assigneeIds.length > 0 ? (
                            <div className="flex items-center -space-x-1.5 overflow-hidden">
                              {t.assigneeIds.slice(0, 3).map((a, idx) => (
                                <Avatar
                                  key={a.id || (a as any)._id || idx}
                                  name={a.name || 'Member'}
                                  src={a.avatarUrl}
                                  size="xs"
                                />
                              ))}
                              {t.assigneeIds.length > 3 && (
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-full px-1">
                                  +{t.assigneeIds.length - 3}
                                </span>
                              )}
                            </div>
                          ) : (
                            <Avatar
                              name={t.assigneeId?.name || 'Unassigned'}
                              src={t.assigneeId?.avatarUrl}
                              size="xs"
                            />
                          )}
                          <span className="text-slate-700 dark:text-slate-300 font-medium text-xs">
                            {t.assigneeIds && t.assigneeIds.length > 1
                              ? `${t.assigneeIds.length} assignees`
                              : (t.assigneeId?.name || t.assigneeIds?.[0]?.name || 'Unassigned')}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap border-r border-[#EAECF0]/40">
                        {t.dueDate ? format(new Date(t.dueDate), 'MMM d, yyyy') : '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px] border-r border-[#EAECF0]/40">
                        {format(new Date(t.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => handleDeleteTicket(e, t._id, t.ticketNumber)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              Showing {tickets.length} of {totalCount} tickets
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Previous
              </Button>
              <span className="font-semibold">
                Page {page} of {totalPages || 1}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

