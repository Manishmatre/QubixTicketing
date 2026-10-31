import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { Button } from '../../components/ui/Button';
import {
  BarChart3,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const ReportsView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<string>('month');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/reports/dashboard-stats?timeRange=${timeRange}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Fetch reports error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [timeRange]);

  const handleExportCSV = async () => {
    try {
      const res = await apiClient.get('/reports/export-csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'qubixdesk-analytics-export.csv');
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
    doc.text('QubixDesk Organization Performance & SLA Report', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Timeframe: ${timeRange.toUpperCase()} • Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

    if (data?.metrics) {
      const summaryRows = [
        ['Total Tickets', String(data.metrics.totalTickets)],
        ['Resolved Tickets', String(data.metrics.resolvedTickets)],
        ['Open / To Do', String(data.metrics.openTickets)],
        ['In Progress', String(data.metrics.inProgressTickets)],
        ['Urgent & Critical', String(data.metrics.urgentTickets)],
        ['Overdue Items', String(data.metrics.overdueTickets)],
      ];

      autoTable(doc, {
        startY: 36,
        head: [['Metric', 'Value']],
        body: summaryRows,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] },
      });
    }

    doc.save('qubixdesk-performance-report.pdf');
  };

  if (isLoading || !data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const COLORS = ['#2563EB', '#16A34A', '#F59E0B', '#DC2626', '#8B5CF6', '#EC4899', '#06B6D4'];

  const categoryChartData = data.categoryDistribution?.map((c: any, index: number) => ({
    name: c.category,
    value: c.count,
    color: COLORS[index % COLORS.length],
  })) || [];

  return (
    <div className="flex-1 p-5 space-y-4 overflow-y-auto bg-[#F1F5F9] dark:bg-[#0B0F19] font-sans text-slate-800">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Reports & SLA Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Analyze issue resolution times, SLA adherence, and team productivity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100/80 border border-slate-200/80 rounded-lg p-1 flex items-center text-xs font-medium">
            {['today', 'week', 'month', 'all'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-3 py-1 rounded-md capitalize transition-all ${
                  timeRange === t
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t === 'today' ? 'Today' : t === 'week' ? 'Week' : t === 'month' ? 'Month' : 'All'}
              </button>
            ))}
          </div>

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
            Export PDF
          </Button>
        </div>
      </div>

      {/* SLA / KPI Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-subtle">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Average Resolution Time
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">4.2</span>
            <span className="text-sm font-semibold text-slate-500">hours</span>
          </div>
          <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> 18% faster than last month
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-subtle">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            First Response SLA
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600">98.4%</span>
            <span className="text-sm font-semibold text-slate-500">on-time</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Target benchmark: &gt;95%</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-subtle">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Resolution Ratio
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-600">
              {data.metrics.totalTickets > 0
                ? `${Math.round((data.metrics.resolvedTickets / data.metrics.totalTickets) * 100)}%`
                : '100%'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {data.metrics.resolvedTickets} of {data.metrics.totalTickets} total tickets closed
          </p>
        </div>
      </div>

      {/* Visual Category Breakdown & Resolution Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-subtle">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Issues by Category</h3>
          <p className="text-xs text-slate-400 mb-6">Distribution across functional domains</p>

          <div className="h-64 flex items-center justify-center">
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {categoryChartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">No category data recorded</p>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-subtle">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Tickets by Team Member</h3>
          <p className="text-xs text-slate-400 mb-6">Current assigned workload overview</p>

          <div className="space-y-4">
            {data.teamWorkload?.map((m: any) => (
              <div key={m.user?.id}>
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-800">{m.user?.name}</span>
                  <span className="text-slate-500">{m.activeTickets} tickets</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, (m.activeTickets / Math.max(1, data.metrics.totalTickets)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

