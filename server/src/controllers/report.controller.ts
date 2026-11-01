import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Ticket } from '../models/Ticket.js';
import { Project } from '../models/Project.js';
import { TicketActivity } from '../models/TicketActivity.js';
import { OrganizationMembership } from '../models/OrganizationMembership.js';
import { tenantScope } from '../middleware/tenantIsolation.js';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { timeRange } = req.query; // 'today' | 'week' | 'month' | 'all'
    const orgId = req.organizationId!;
    const userId = req.user!._id;

    let dateFilter: any = {};
    const now = new Date();

    if (timeRange === 'today') {
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      dateFilter = { createdAt: { $gte: startOfDay } };
    } else if (timeRange === 'week') {
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: startOfWeek } };
    } else if (timeRange === 'month') {
      const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: startOfMonth } };
    }

    const ticketBaseQuery = { organizationId: orgId, ...dateFilter };

    const [
      totalProjects,
      activeProjects,
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      urgentTickets,
      myAssignedTickets,
      overdueTickets,
      recentActivities,
    ] = await Promise.all([
      Project.countDocuments({ organizationId: orgId }),
      Project.countDocuments({ organizationId: orgId, status: 'active' }),
      Ticket.countDocuments(ticketBaseQuery),
      Ticket.countDocuments({ ...ticketBaseQuery, status: { $in: ['Open', 'To Do'] } }),
      Ticket.countDocuments({ ...ticketBaseQuery, status: { $in: ['In Progress', 'Under Review'] } }),
      Ticket.countDocuments({ ...ticketBaseQuery, status: { $in: ['Resolved', 'Closed'] } }),
      Ticket.countDocuments({ ...ticketBaseQuery, priority: { $in: ['Urgent', 'Critical'] }, status: { $nin: ['Resolved', 'Closed'] } }),
      Ticket.countDocuments({ organizationId: orgId, $or: [{ assigneeId: userId }, { assigneeIds: userId }], status: { $nin: ['Resolved', 'Closed'] } }),
      Ticket.countDocuments({
        organizationId: orgId,
        status: { $nin: ['Resolved', 'Closed'] },
        dueDate: { $lt: new Date() },
      }),
      TicketActivity.find({ organizationId: orgId })
        .populate('userId', 'name email avatarUrl')
        .populate('ticketId', 'ticketNumber title')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    // Priority Distribution
    const priorityAgg = await Ticket.aggregate([
      { $match: ticketBaseQuery },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    const priorityDistribution: Record<string, number> = {
      Critical: 0,
      Urgent: 0,
      High: 0,
      Normal: 0,
      Low: 0,
    };
    priorityAgg.forEach((p) => {
      if (p._id) priorityDistribution[p._id] = p.count;
    });

    // Category Distribution
    const categoryAgg = await Ticket.aggregate([
      { $match: ticketBaseQuery },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const categoryDistribution = categoryAgg.map((c) => ({
      category: c._id || 'Other',
      count: c.count,
    }));

    // Team Workload
    const members = await OrganizationMembership.find({ organizationId: orgId, status: 'active' })
      .populate('userId', 'name email avatarUrl')
      .limit(10);

    const workloadList = await Promise.all(
      members.map(async (m: any) => {
        const count = await Ticket.countDocuments({
          organizationId: orgId,
          $or: [{ assigneeId: m.userId?._id }, { assigneeIds: m.userId?._id }],
          status: { $nin: ['Resolved', 'Closed'] },
        });
        return {
          user: m.userId ? { id: m.userId._id, name: m.userId.name, email: m.userId.email, avatarUrl: m.userId.avatarUrl } : null,
          role: m.role,
          activeTickets: count,
        };
      })
    );

    // Resolution trend: Last 7 days resolution vs creation
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const trendCreated = await Ticket.aggregate([
      { $match: { organizationId: orgId, createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          created: { $sum: 1 },
        },
      },
    ]);

    const trendResolved = await Ticket.aggregate([
      { $match: { organizationId: orgId, resolvedAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$resolvedAt' } },
          resolved: { $sum: 1 },
        },
      },
    ]);

    const trendMap: Record<string, { date: string; created: number; resolved: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const str = d.toISOString().split('T')[0];
      trendMap[str] = { date: str, created: 0, resolved: 0 };
    }

    trendCreated.forEach((t) => {
      if (trendMap[t._id]) trendMap[t._id].created = t.created;
    });
    trendResolved.forEach((t) => {
      if (trendMap[t._id]) trendMap[t._id].resolved = t.resolved;
    });

    const resolutionTrend = Object.values(trendMap);

    res.json({
      success: true,
      data: {
        metrics: {
          totalProjects,
          activeProjects,
          totalTickets,
          openTickets,
          inProgressTickets,
          resolvedTickets,
          urgentTickets,
          myAssignedTickets,
          overdueTickets,
        },
        priorityDistribution,
        categoryDistribution,
        teamWorkload: workloadList.filter((w) => w.user !== null),
        resolutionTrend,
        recentActivities,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const exportTicketsCSV = async (req: Request, res: Response): Promise<void> => {
  try {
    const tickets = await Ticket.find(tenantScope(req, {}))
      .populate('projectId', 'name key')
      .populate('assigneeId', 'name email')
      .populate('reporterId', 'name email')
      .sort({ createdAt: -1 });

    const headers = [
      'Ticket ID',
      'Title',
      'Project',
      'Status',
      'Priority',
      'Category',
      'Assignee',
      'Reporter',
      'Due Date',
      'Created At',
    ];

    const rows = tickets.map((t: any) => [
      `"${t.ticketNumber}"`,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${t.projectId?.name || ''}"`,
      `"${t.status}"`,
      `"${t.priority}"`,
      `"${t.category}"`,
      `"${t.assigneeId?.name || 'Unassigned'}"`,
      `"${t.reporterId?.name || ''}"`,
      `"${t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : ''}"`,
      `"${new Date(t.createdAt).toISOString().split('T')[0]}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="qubix-tickets-export.csv"');
    res.status(200).send(csvContent);
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

