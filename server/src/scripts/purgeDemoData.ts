import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { OrganizationMembership } from '../models/OrganizationMembership.js';
import { Project } from '../models/Project.js';
import { Ticket } from '../models/Ticket.js';
import { TicketComment } from '../models/TicketComment.js';
import { TicketAttachment } from '../models/TicketAttachment.js';
import { TicketActivity } from '../models/TicketActivity.js';
import { Notification } from '../models/Notification.js';
import { Workflow } from '../models/Workflow.js';
import { Subscription } from '../models/Subscription.js';
import { Plan } from '../models/Plan.js';
import { hashPassword } from '../utils/password.js';

export const purgeDemoData = async (): Promise<void> => {
  try {
    console.log('[Purge] Connecting to database...');
    await connectDB();

    console.log('[Purge] Searching for demo organizations and sample data...');

    // 1. Find demo organizations (e.g. slug: 'acme-corp' or containing 'demo' / 'acme')
    const demoOrgs = await Organization.find({
      $or: [
        { slug: 'acme-corp' },
        { name: /Acme Technologies/i },
        { website: /example\.com/i },
      ],
    });

    const demoOrgIds = demoOrgs.map((o) => o._id);
    console.log(`[Purge] Found ${demoOrgs.length} demo organization(s) to remove:`, demoOrgs.map((o) => `${o.name} (${o.slug})`));

    if (demoOrgIds.length > 0) {
      // 2. Delete all related records for demo orgs
      const ticketsDeleted = await Ticket.deleteMany({ organizationId: { $in: demoOrgIds } });
      const commentsDeleted = await TicketComment.deleteMany({
        $or: [
          { organizationId: { $in: demoOrgIds } },
          { content: /demo@/i },
        ],
      });
      const attachmentsDeleted = await TicketAttachment.deleteMany({ organizationId: { $in: demoOrgIds } });
      const activitiesDeleted = await TicketActivity.deleteMany({ organizationId: { $in: demoOrgIds } });
      const notificationsDeleted = await Notification.deleteMany({ organizationId: { $in: demoOrgIds } });
      const workflowsDeleted = await Workflow.deleteMany({ organizationId: { $in: demoOrgIds } });
      const subscriptionsDeleted = await Subscription.deleteMany({ organizationId: { $in: demoOrgIds } });
      const projectsDeleted = await Project.deleteMany({ organizationId: { $in: demoOrgIds } });
      const membershipsDeleted = await OrganizationMembership.deleteMany({ organizationId: { $in: demoOrgIds } });

      console.log(`[Purge] Removed:
        - ${ticketsDeleted.deletedCount} demo tickets
        - ${commentsDeleted.deletedCount} demo comments
        - ${attachmentsDeleted.deletedCount} demo attachments
        - ${activitiesDeleted.deletedCount} demo activities
        - ${notificationsDeleted.deletedCount} demo notifications
        - ${workflowsDeleted.deletedCount} demo workflows
        - ${subscriptionsDeleted.deletedCount} demo subscriptions
        - ${projectsDeleted.deletedCount} demo projects
        - ${membershipsDeleted.deletedCount} demo memberships`);

      // 3. Delete demo organization records
      await Organization.deleteMany({ _id: { $in: demoOrgIds } });
      console.log(`[Purge] Demo organizations removed successfully.`);
    }

    // 4. Delete demo sample users (e.g. emails ending with @acme.com)
    const demoUsersDeleted = await User.deleteMany({
      $or: [
        { email: /@acme\.com$/i },
        { email: /demo@/i },
      ],
    });
    console.log(`[Purge] Removed ${demoUsersDeleted.deletedCount} demo user account(s).`);

    // 5. Ensure System Subscription Plans are intact
    const planCount = await Plan.countDocuments();
    if (planCount === 0) {
      console.log('[Purge] Initializing standard subscription plans...');
      await Plan.create([
        {
          name: 'Free Plan',
          code: 'free',
          description: 'Basic issue tracking for micro-teams and individuals.',
          priceMonthly: 0,
          priceYearly: 0,
          maxUsers: 3,
          maxProjects: 2,
          maxStorageMB: 1000,
          features: ['Up to 3 team members', '2 active projects', 'Up to 50 tickets', 'Standard Kanban & List views', 'Community support'],
        },
        {
          name: 'Starter',
          code: 'starter',
          description: 'For agile small teams and startups launching their issue tracking.',
          priceMonthly: 19,
          priceYearly: 190,
          maxUsers: 5,
          maxProjects: 5,
          maxStorageMB: 5000,
          features: ['Up to 5 team members', '5 active projects', '500 tickets', 'Kanban & List views', 'Standard ticket workflows', 'Community support'],
        },
        {
          name: 'Professional',
          code: 'professional',
          description: 'For growing engineering and product organizations requiring robust workflow tools.',
          priceMonthly: 49,
          priceYearly: 490,
          maxUsers: 25,
          maxProjects: 20,
          maxStorageMB: 50000,
          features: ['Up to 25 team members', '20 active projects', 'Timeline & Gantt views', 'Automated workflow rules', 'Custom ticket fields', 'Email notifications', 'Priority support'],
        },
        {
          name: 'Business',
          code: 'business',
          description: 'High-velocity companies scaling projects, teams, and internal IT departments.',
          priceMonthly: 129,
          priceYearly: 1290,
          maxUsers: 100,
          maxProjects: 100,
          maxStorageMB: 250000,
          features: ['Up to 100 team members', 'Unlimited projects', 'Advanced analytics & export', 'Complete audit logs', 'Custom RBAC permissions', 'Webhook integrations', '99.9% uptime SLA'],
        },
        {
          name: 'Enterprise',
          code: 'enterprise',
          description: 'Large enterprises with custom governance, security, and dedicated infrastructure.',
          priceMonthly: 399,
          priceYearly: 3990,
          maxUsers: 1000,
          maxProjects: 1000,
          maxStorageMB: 1000000,
          features: ['Unlimited team members', 'Unlimited storage', 'Dedicated account manager', 'Custom security integrations', 'SSO & SAML', 'Custom data retention policies'],
        },
      ]);
      console.log('[Purge] Standard subscription plans created.');
    } else {
      console.log(`[Purge] ${planCount} standard subscription plan(s) exist.`);
    }

    // 6. Ensure Platform Super Admin exists
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@qubix.io';
    const existingAdmin = await User.findOne({ isSuperAdmin: true });
    if (!existingAdmin) {
      console.log(`[Purge] Creating Platform Super Admin (${superAdminEmail})...`);
      const pass = await hashPassword(process.env.SUPER_ADMIN_PASSWORD || 'Password123!');
      await User.create({
        name: 'QubixDesk Platform Admin',
        email: superAdminEmail,
        passwordHash: pass,
        isSuperAdmin: true,
        isVerified: true,
      });
      console.log(`[Purge] Platform Super Admin created.`);
    } else {
      console.log(`[Purge] Super Admin account active: ${existingAdmin.email}`);
    }

    // 7. Verify clean state
    const remainingUsers = await User.countDocuments();
    const remainingOrgs = await Organization.countDocuments();
    const remainingTickets = await Ticket.countDocuments();
    console.log(`\n======================================================`);
    console.log(`✨ DATABASE IS NOW 100% PRODUCTION CLEAN:`);
    console.log(`   - Organizations: ${remainingOrgs}`);
    console.log(`   - Users: ${remainingUsers}`);
    console.log(`   - Tickets: ${remainingTickets}`);
    console.log(`======================================================\n`);
  } catch (err: any) {
    console.error('[Purge] Error purging demo data:', err);
  } finally {
    await disconnectDB();
  }
};

if (process.argv[1]?.includes('purgeDemoData')) {
  purgeDemoData().then(() => process.exit(0));
}

