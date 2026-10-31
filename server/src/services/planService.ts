import mongoose from 'mongoose';
import { Organization } from '../models/Organization.js';
import { OrganizationMembership } from '../models/OrganizationMembership.js';
import { Project } from '../models/Project.js';
import { Ticket } from '../models/Ticket.js';

export interface EffectivePlanLimits {
  isTrial: boolean;
  isTrialExpired: boolean;
  daysLeftInTrial: number;
  planCode: string;
  planName: string;
  maxUsers: number;
  maxProjects: number;
  maxTickets: number;
  canUseWorkflows: boolean;
  canUseCustomSla: boolean;
  canExportReports: boolean;
  features: string[];
}

export const getEffectivePlanLimits = async (
  organizationId: string | mongoose.Types.ObjectId
): Promise<EffectivePlanLimits> => {
  const org = await Organization.findById(organizationId);

  // Default fallback for Free Tier
  const freeTier: EffectivePlanLimits = {
    isTrial: false,
    isTrialExpired: true,
    daysLeftInTrial: 0,
    planCode: 'free',
    planName: 'Free Tier',
    maxUsers: 3,
    maxProjects: 2,
    maxTickets: 50,
    canUseWorkflows: false,
    canUseCustomSla: false,
    canExportReports: false,
    features: [
      'Up to 3 team members',
      '2 active projects',
      'Up to 50 tickets',
      'Standard Kanban & List views',
      'Community support',
    ],
  };

  if (!org) {
    return freeTier;
  }

  const now = Date.now();
  const trialEnd = org.trialEndsAt ? new Date(org.trialEndsAt).getTime() : 0;
  const isTrial = org.subscriptionStatus === 'trialing';
  const isTrialExpired = isTrial && trialEnd <= now;
  const daysLeftInTrial = isTrial && !isTrialExpired
    ? Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)))
    : 0;

  // 1. ACTIVE 14-DAY TRIAL: FULL ACCESS UNLOCKED
  if (isTrial && !isTrialExpired) {
    return {
      isTrial: true,
      isTrialExpired: false,
      daysLeftInTrial,
      planCode: 'trial',
      planName: '14-Day Free Trial (Full Access)',
      maxUsers: 50,
      maxProjects: 25,
      maxTickets: 10000,
      canUseWorkflows: true,
      canUseCustomSla: true,
      canExportReports: true,
      features: [
        'Full platform access',
        'Up to 50 team members',
        '25 active projects',
        '10,000 tickets',
        'Automated workflow rules & escalations',
        'Custom SLA policies & telemetry',
        '1-Click PDF and CSV reporting',
        'Live Socket.io notifications',
      ],
    };
  }

  // 2. TRIAL EXPIRED (and no paid active subscription): AUTOMATICALLY FALLBACK TO FREE PLAN
  if (isTrialExpired || org.subscriptionStatus === 'canceled' || org.subscriptionStatus === 'past_due' || org.subscriptionPlan === 'free') {
    return {
      isTrial: true,
      isTrialExpired: true,
      daysLeftInTrial: 0,
      planCode: 'free',
      planName: 'Free Tier (Trial Expired)',
      maxUsers: 3,
      maxProjects: 2,
      maxTickets: 50,
      canUseWorkflows: false,
      canUseCustomSla: false,
      canExportReports: false,
      features: freeTier.features,
    };
  }

  // 3. PAID ACTIVE SUBSCRIPTIONS
  switch (org.subscriptionPlan) {
    case 'starter':
      return {
        isTrial: false,
        isTrialExpired: false,
        daysLeftInTrial: 0,
        planCode: 'starter',
        planName: 'Starter Plan',
        maxUsers: 5,
        maxProjects: 5,
        maxTickets: 500,
        canUseWorkflows: true,
        canUseCustomSla: false,
        canExportReports: true,
        features: [
          'Up to 5 team members',
          '5 active projects',
          '500 tickets',
          'Standard workflow triggers',
          'Email support',
        ],
      };

    case 'professional':
      return {
        isTrial: false,
        isTrialExpired: false,
        daysLeftInTrial: 0,
        planCode: 'professional',
        planName: 'Professional Plan',
        maxUsers: 25,
        maxProjects: 20,
        maxTickets: 5000,
        canUseWorkflows: true,
        canUseCustomSla: true,
        canExportReports: true,
        features: [
          'Up to 25 team members',
          '20 active projects',
          '5,000 tickets',
          'Advanced automated workflows',
          'Custom SLA configurations',
          'Priority email & chat support',
        ],
      };

    case 'business':
      return {
        isTrial: false,
        isTrialExpired: false,
        daysLeftInTrial: 0,
        planCode: 'business',
        planName: 'Business Plan',
        maxUsers: 100,
        maxProjects: 100,
        maxTickets: 50000,
        canUseWorkflows: true,
        canUseCustomSla: true,
        canExportReports: true,
        features: [
          'Up to 100 team members',
          '100 active projects',
          '50,000 tickets',
          'Unlimited workflow rules',
          'Complete audit logs',
          '99.9% uptime SLA',
        ],
      };

    case 'enterprise':
      return {
        isTrial: false,
        isTrialExpired: false,
        daysLeftInTrial: 0,
        planCode: 'enterprise',
        planName: 'Enterprise Plan',
        maxUsers: 10000,
        maxProjects: 10000,
        maxTickets: 1000000,
        canUseWorkflows: true,
        canUseCustomSla: true,
        canExportReports: true,
        features: [
          'Unlimited team members',
          'Unlimited projects & tickets',
          'Custom governance & 2FA enforcement',
          'Dedicated account manager',
          'Custom webhooks & integrations',
        ],
      };

    default:
      return freeTier;
  }
};

/**
 * Checks if organization can add a new team member
 */
export const checkUserLimit = async (organizationId: string | mongoose.Types.ObjectId): Promise<{ allowed: boolean; message?: string }> => {
  const limits = await getEffectivePlanLimits(organizationId);
  const currentCount = await OrganizationMembership.countDocuments({
    organizationId,
    status: 'active',
  });

  if (currentCount >= limits.maxUsers) {
    return {
      allowed: false,
      message: `Your ${limits.planName} allows a maximum of ${limits.maxUsers} team members (currently using ${currentCount}). Upgrade your plan to invite more teammates.`,
    };
  }
  return { allowed: true };
};

/**
 * Checks if organization can create another project
 */
export const checkProjectLimit = async (organizationId: string | mongoose.Types.ObjectId): Promise<{ allowed: boolean; message?: string }> => {
  const limits = await getEffectivePlanLimits(organizationId);
  const currentCount = await Project.countDocuments({ organizationId });

  if (currentCount >= limits.maxProjects) {
    return {
      allowed: false,
      message: `Your ${limits.planName} allows a maximum of ${limits.maxProjects} projects (currently using ${currentCount}). Upgrade your subscription to create additional project workspaces.`,
    };
  }
  return { allowed: true };
};

/**
 * Checks if organization can create another ticket
 */
export const checkTicketLimit = async (organizationId: string | mongoose.Types.ObjectId): Promise<{ allowed: boolean; message?: string }> => {
  const limits = await getEffectivePlanLimits(organizationId);
  const currentCount = await Ticket.countDocuments({ organizationId });

  if (currentCount >= limits.maxTickets) {
    return {
      allowed: false,
      message: `Your ${limits.planName} has reached its limit of ${limits.maxTickets} tickets. Upgrade your plan to create more tickets.`,
    };
  }
  return { allowed: true };
};

/**
 * Checks if organization can access automated workflows
 */
export const checkWorkflowAccess = async (organizationId: string | mongoose.Types.ObjectId): Promise<{ allowed: boolean; message?: string }> => {
  const limits = await getEffectivePlanLimits(organizationId);
  if (!limits.canUseWorkflows) {
    return {
      allowed: false,
      message: `Automated workflow rules require an active Free Trial or Professional/Business/Enterprise plan. Your current ${limits.planName} does not include automation.`,
    };
  }
  return { allowed: true };
};

