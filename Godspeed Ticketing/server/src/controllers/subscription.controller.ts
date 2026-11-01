import { Request, Response } from 'express';
import { Plan } from '../models/Plan.js';
import { Subscription } from '../models/Subscription.js';
import { Organization } from '../models/Organization.js';
import { Project } from '../models/Project.js';
import { Ticket } from '../models/Ticket.js';
import { OrganizationMembership } from '../models/OrganizationMembership.js';
import { logAuditEvent } from '../services/auditService.js';
import { getEffectivePlanLimits } from '../services/planService.js';

export const getPlans = async (_req: Request, res: Response): Promise<void> => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ priceMonthly: 1 });
    res.json({ success: true, data: plans });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const getCurrentSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const org = await Organization.findById(req.organizationId);
    if (!org) {
      res.status(404).json({ success: false, error: { message: 'Organization not found' } });
      return;
    }

    let sub = await Subscription.findOne({ organizationId: org._id }).populate('planId');

    const [userCount, projectCount, ticketCount, effectiveLimits] = await Promise.all([
      OrganizationMembership.countDocuments({ organizationId: org._id, status: 'active' }),
      Project.countDocuments({ organizationId: org._id }),
      Ticket.countDocuments({ organizationId: org._id }),
      getEffectivePlanLimits(org._id),
    ]);

    res.json({
      success: true,
      data: {
        planCode: org.subscriptionPlan,
        status: org.subscriptionStatus,
        trialEndsAt: org.trialEndsAt,
        effectiveLimits,
        subscription: sub,
        usage: {
          currentUsers: userCount,
          currentProjects: projectCount,
          currentTickets: ticketCount,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

export const upgradeSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { planCode, billingInterval = 'monthly' } = req.body;

    const plan = await Plan.findOne({ code: planCode });
    if (!plan) {
      res.status(404).json({ success: false, error: { message: 'Invalid plan selected' } });
      return;
    }

    const org = await Organization.findById(req.organizationId);
    if (!org) {
      res.status(404).json({ success: false, error: { message: 'Organization not found' } });
      return;
    }

    org.subscriptionPlan = plan.code;
    org.subscriptionStatus = 'active';
    await org.save();

    const price = billingInterval === 'yearly' ? plan.priceYearly : plan.priceMonthly;

    let sub = await Subscription.findOne({ organizationId: org._id });
    const invoiceItem = {
      invoiceId: `INV-${Date.now().toString().slice(-8)}`,
      amount: price,
      currency: 'USD',
      status: 'paid' as const,
      date: new Date(),
    };

    if (!sub) {
      sub = await Subscription.create({
        organizationId: org._id,
        planId: plan._id,
        planCode: plan.code,
        billingInterval,
        status: 'active',
        amountPaid: price,
        invoices: [invoiceItem],
      });
    } else {
      sub.planId = plan._id as any;
      sub.planCode = plan.code;
      sub.billingInterval = billingInterval;
      sub.status = 'active';
      sub.amountPaid = price;
      sub.invoices.unshift(invoiceItem);
      await sub.save();
    }

    await logAuditEvent({
      userId: req.user?._id as any,
      organizationId: org._id as any,
      action: 'SUBSCRIPTION_UPGRADED',
      entity: 'Subscription',
      entityId: sub._id.toString(),
      req,
      details: { newPlan: plan.code, price, billingInterval },
    });

    res.json({
      success: true,
      message: `Successfully upgraded to ${plan.name} plan!`,
      data: {
        subscription: sub,
        plan,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

