import React, { useState, useEffect } from 'react';
import { Ticket } from '../../types';
import { apiClient } from '../../api/client';
import { PriorityBadge, StatusBadge } from '../../components/ui/Badge';
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

  useEffect(() => {
    fetchTickets();
  }, [page, statusFilter, priorityFilter, search, myTicketsOnly]);

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

  const handleExportCSV = async () => {
    try {
      const res = await apiClient.get('/reports/export-csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'qubixdesk-tickets-export.csv');
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
    doc.text('QubixDesk Issue Tracking Report', 14, 18);
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

    doc.save('qubixdesk-tickets-report.pdf');
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-white font-sans text-slate-800">
      {/* Top Filter & Toolbar */}
      <div className="px-6 py-2.5 bg-white border-b border-[#EAECF0] flex flex-wrap items-center justify-between gap-4">
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

          <Button size="sm" onClick={onOpenCreateTicket} leftIcon={<Plus className="w-4 h-4" />}>
            New Ticket
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="bg-white border border-slate-200 rounded-xl shadow-subtle overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === tickets.length && tickets.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2" />
                    <p>Loading tickets...</p>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    No tickets found matching the criteria.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr
                    key={t._id}
                    onClick={() => onSelectTicket(t._id)}
                    className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                  >
                    <td className="p-4 text-center" onClick={(e) => handleSelectOne(t._id, e)}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(t._id)}
                        onChange={() => {}}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                      {t.ticketNumber}
                    </td>
                    <td className="py-3.5 px-4 max-w-md">
                      <p className="font-semibold text-slate-900 group-hover:text-blue-600 truncate transition-colors">
                        {t.title}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{t.category}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                      {t.projectId?.name}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={t.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <PriorityBadge priority={t.priority} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Avatar
                          name={t.assigneeId?.name || 'Unassigned'}
                          src={t.assigneeId?.avatarUrl}
                          size="xs"
                        />
                        <span className="text-slate-700 font-medium">
                          {t.assigneeId?.name || 'Unassigned'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {t.dueDate ? format(new Date(t.dueDate), 'MMM d, yyyy') : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {format(new Date(t.createdAt), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

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

