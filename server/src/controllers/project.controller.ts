import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Project } from '../models/Project.js';
import { Ticket } from '../models/Ticket.js';
import { tenantScope } from '../middleware/tenantIsolation.js';
import { logAuditEvent } from '../services/auditService.js';

export const getProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, category, search } = req.query;

    const filter: any = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: String(search), $options: 'i' } },
        { key: { $regex: String(search), $options: 'i' } },
      ];
    }

    const projects = await Project.find(tenantScope(req, filter))
      .populate('projectManagerId', 'name email avatarUrl')
      .populate('members.userId', 'name email avatarUrl')
      .sort({ updatedAt: -1 });

    res.json({ success: true, data: projects });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, key, description, category, priority, startDate, endDate, targetDate, projectManagerId } = req.body;

    if (!name || !key) {
      res.status(400).json({ success: false, error: { message: 'Project name and key are required.' } });
      return;
    }

    const cleanKey = key.toUpperCase().trim().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    const existing = await Project.findOne(tenantScope(req, { key: cleanKey }));
    if (existing) {
      res.status(409).json({ success: false, error: { message: `Project key "${cleanKey}" already exists in this workspace.` } });
      return;
    }

    const managerId = projectManagerId && mongoose.Types.ObjectId.isValid(projectManagerId)
      ? new mongoose.Types.ObjectId(projectManagerId)
      : req.user?._id;

    const project = await Project.create({
      organizationId: req.organizationId,
      name: name.trim(),
      key: cleanKey,
      description: description || '',
      category: category || 'General',
      priority: priority || 'normal',
      status: 'active',
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      projectManagerId: managerId,
      members: [
        {
          userId: req.user?._id,
          role: 'lead',
          assignedAt: new Date(),
        },
      ],
      ticketStats: { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 },
    });

    await logAuditEvent({
      userId: req.user?._id as any,
      organizationId: req.organizationId,
      action: 'PROJECT_CREATED',
      entity: 'Project',
      entityId: project._id.toString(),
      req,
      details: { name: project.name, key: project.key },
    });

    res.status(201).json({ success: true, data: project });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const getProjectById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, error: { message: 'Invalid project ID' } });
      return;
    }

    const project = await Project.findOne(tenantScope(req, { _id: id }))
      .populate('projectManagerId', 'name email avatarUrl')
      .populate('members.userId', 'name email avatarUrl');

    if (!project) {
      res.status(404).json({ success: false, error: { message: 'Project not found' } });
      return;
    }

    // Refresh dynamic ticket count
    const stats = await Ticket.aggregate([
      { $match: { organizationId: req.organizationId, projectId: project._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const ticketMap: {
      total: number;
      open: number;
      inProgress: number;
      resolved: number;
      closed: number;
    } = {
      total: 0,
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
    };

    stats.forEach((s) => {
      ticketMap.total += s.count;
      if (['Open', 'To Do'].includes(s._id)) ticketMap.open += s.count;
      if (['In Progress', 'Under Review'].includes(s._id)) ticketMap.inProgress += s.count;
      if (s._id === 'Resolved') ticketMap.resolved += s.count;
      if (s._id === 'Closed') ticketMap.closed += s.count;
    });

    project.ticketStats = ticketMap;
    await project.save();

    res.json({ success: true, data: project });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const updateProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, category, priority, status, startDate, endDate, targetDate, projectManagerId } = req.body;

    const project = await Project.findOne(tenantScope(req, { _id: id }));
    if (!project) {
      res.status(404).json({ success: false, error: { message: 'Project not found' } });
      return;
    }

    if (name) project.name = name.trim();
    if (description !== undefined) project.description = description;
    if (category) project.category = category;
    if (priority) project.priority = priority;
    if (status) project.status = status;
    if (startDate) project.startDate = new Date(startDate);
    if (endDate) project.endDate = new Date(endDate);
    if (targetDate) project.targetDate = new Date(targetDate);
    if (projectManagerId && mongoose.Types.ObjectId.isValid(projectManagerId)) {
      project.projectManagerId = new mongoose.Types.ObjectId(projectManagerId);
    }

    await project.save();

    res.json({ success: true, data: project });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const project = await Project.findOne(tenantScope(req, { _id: id }));
    if (!project) {
      res.status(404).json({ success: false, error: { message: 'Project not found' } });
      return;
    }

    // Cascade delete project tickets
    await Ticket.deleteMany(tenantScope(req, { projectId: project._id }));
    await Project.deleteOne(tenantScope(req, { _id: project._id }));

    await logAuditEvent({
      userId: req.user?._id as any,
      organizationId: req.organizationId,
      action: 'PROJECT_DELETED',
      entity: 'Project',
      entityId: project._id.toString(),
      req,
      details: { key: project.key, name: project.name },
    });

    res.json({ success: true, message: 'Project and all related tickets deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const addProjectMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId, role } = req.body;

    const project = await Project.findOne(tenantScope(req, { _id: id }));
    if (!project) {
      res.status(404).json({ success: false, error: { message: 'Project not found' } });
      return;
    }

    const memberExists = project.members.some((m) => m.userId.toString() === userId);
    if (memberExists) {
      res.status(409).json({ success: false, error: { message: 'User is already a project member' } });
      return;
    }

    project.members.push({
      userId: new mongoose.Types.ObjectId(userId),
      role: role || 'member',
      assignedAt: new Date(),
    });

    await project.save();
    res.json({ success: true, data: project });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const addProjectMilestone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, dueDate } = req.body;

    const project = await Project.findOne(tenantScope(req, { _id: id }));
    if (!project) {
      res.status(404).json({ success: false, error: { message: 'Project not found' } });
      return;
    }

    project.milestones.push({
      title,
      description,
      dueDate: new Date(dueDate),
      completed: false,
    });

    await project.save();
    res.status(201).json({ success: true, data: project.milestones });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};
