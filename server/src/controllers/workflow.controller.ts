import { Request, Response } from 'express';
import { Workflow } from '../models/Workflow.js';
import { tenantScope } from '../middleware/tenantIsolation.js';

export const getWorkflows = async (req: Request, res: Response): Promise<void> => {
  try {
    const workflows = await Workflow.find(tenantScope(req, {}))
      .populate('createdBy', 'name email avatarUrl')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: workflows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const createWorkflow = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, triggerEvent, conditions = [], actions = [] } = req.body;

    if (!name || !triggerEvent || !actions.length) {
      res.status(400).json({
        success: false,
        error: { message: 'Name, triggerEvent, and at least one action are required.' },
      });
      return;
    }

    const workflow = await Workflow.create({
      organizationId: req.organizationId,
      name: name.trim(),
      description: description || '',
      triggerEvent,
      conditions,
      actions,
      isActive: true,
      createdBy: req.user?._id,
    });

    const populated = await Workflow.findById(workflow._id).populate('createdBy', 'name email avatarUrl');

    res.status(201).json({ success: true, data: populated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const updateWorkflow = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, triggerEvent, conditions, actions, isActive } = req.body;

    const workflow = await Workflow.findOne(tenantScope(req, { _id: id }));
    if (!workflow) {
      res.status(404).json({ success: false, error: { message: 'Workflow rule not found' } });
      return;
    }

    if (name) workflow.name = name.trim();
    if (description !== undefined) workflow.description = description;
    if (triggerEvent) workflow.triggerEvent = triggerEvent;
    if (conditions) workflow.conditions = conditions;
    if (actions) workflow.actions = actions;
    if (isActive !== undefined) workflow.isActive = isActive;

    await workflow.save();

    res.json({ success: true, data: workflow });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const deleteWorkflow = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const workflow = await Workflow.findOne(tenantScope(req, { _id: id }));
    if (!workflow) {
      res.status(404).json({ success: false, error: { message: 'Workflow rule not found' } });
      return;
    }

    await Workflow.deleteOne(tenantScope(req, { _id: workflow._id }));
    res.json({ success: true, message: 'Workflow deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

