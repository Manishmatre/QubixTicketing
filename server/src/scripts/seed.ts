import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { OrganizationMembership } from '../models/OrganizationMembership.js';
import { Plan } from '../models/Plan.js';
import { Subscription } from '../models/Subscription.js';
import { Project } from '../models/Project.js';
import { Ticket } from '../models/Ticket.js';
import { TicketComment } from '../models/TicketComment.js';
import { TicketActivity } from '../models/TicketActivity.js';
import { Notification } from '../models/Notification.js';
import { Workflow } from '../models/Workflow.js';
import { hashPassword } from '../utils/password.js';

export const seedDatabase = async (): Promise<void> => {
  try {
    console.log('[Seeder] Checking database state for QubixDesk platform...');

    // 1. Seed Subscription Plans if missing
    const planCount = await Plan.countDocuments();
    let freePlan, starterPlan, proPlan, businessPlan, enterprisePlan;

    if (planCount === 0) {
      console.log('[Seeder] Creating standard subscription plans...');
      freePlan = await Plan.create({
        name: 'Free Plan',
        code: 'free',
        description: 'Basic issue tracking for micro-teams and individuals.',
        priceMonthly: 0,
        priceYearly: 0,
        maxUsers: 3,
        maxProjects: 2,
        maxStorageMB: 1000,
        features: ['Up to 3 team members', '2 active projects', 'Up to 50 tickets', 'Standard Kanban & List views', 'Community support'],
      });

      starterPlan = await Plan.create({
        name: 'Starter',
        code: 'starter',
        description: 'For agile small teams and startups launching their issue tracking.',
        priceMonthly: 19,
        priceYearly: 190,
        maxUsers: 5,
        maxProjects: 5,
        maxStorageMB: 5000,
        features: ['Up to 5 team members', '5 active projects', '500 tickets', 'Kanban & List views', 'Standard ticket workflows', 'Community support'],
      });

      proPlan = await Plan.create({
        name: 'Professional',
        code: 'professional',
        description: 'For growing engineering and product organizations requiring robust workflow tools.',
        priceMonthly: 49,
        priceYearly: 490,
        maxUsers: 25,
        maxProjects: 20,
        maxStorageMB: 50000,
        features: ['Up to 25 team members', '20 active projects', 'Timeline & Gantt views', 'Automated workflow rules', 'Custom ticket fields', 'Email notifications', 'Priority support'],
      });

      businessPlan = await Plan.create({
        name: 'Business',
        code: 'business',
        description: 'High-velocity companies scaling projects, teams, and internal IT departments.',
        priceMonthly: 129,
        priceYearly: 1290,
        maxUsers: 100,
        maxProjects: 100,
        maxStorageMB: 250000,
        features: ['Up to 100 team members', 'Unlimited projects', 'Advanced analytics & export', 'Complete audit logs', 'Custom RBAC permissions', 'Webhook integrations', '99.9% uptime SLA'],
      });

      enterprisePlan = await Plan.create({
        name: 'Enterprise',
        code: 'enterprise',
        description: 'Large enterprises with custom governance, security, and dedicated infrastructure.',
        priceMonthly: 399,
        priceYearly: 3990,
        maxUsers: 1000,
        maxProjects: 1000,
        maxStorageMB: 1000000,
        features: ['Unlimited team members', 'Unlimited storage', 'Dedicated account manager', 'Custom security integrations', 'SSO & SAML', 'Custom data retention policies'],
      });
    } else {
      proPlan = await Plan.findOne({ code: 'professional' });
    }

    // 2. Seed Super Admin
    const adminEmail = 'admin@qubix.io';
    let superAdmin = await User.findOne({ email: adminEmail });
    if (!superAdmin) {
      console.log('[Seeder] Creating Platform Super Admin (admin@qubix.io)...');
      const pass = await hashPassword('Password123!');
      superAdmin = await User.create({
        name: 'QubixDesk Platform Admin',
        email: adminEmail,
        passwordHash: pass,
        isSuperAdmin: true,
        isVerified: true,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      });
    }

    // 3. Seed Demo Organization
    const demoSlug = 'acme-corp';
    let org = await Organization.findOne({ slug: demoSlug });

    if (!org) {
      console.log('[Seeder] Seeding comprehensive demo organization (Acme Technologies)...');
      const ownerPass = await hashPassword('Password123!');

      // Org Owner
      const owner = await User.create({
        name: 'Sarah Jenkins',
        email: 'sarah.jenkins@acme.com',
        passwordHash: ownerPass,
        isSuperAdmin: false,
        isVerified: true,
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      });

      // Org Team Members
      const devLead = await User.create({
        name: 'Alex Rivera',
        email: 'alex.rivera@acme.com',
        passwordHash: ownerPass,
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      });

      const designer = await User.create({
        name: 'Emma Watson',
        email: 'emma.watson@acme.com',
        passwordHash: ownerPass,
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      });

      const developer = await User.create({
        name: 'Michael Chang',
        email: 'michael.chang@acme.com',
        passwordHash: ownerPass,
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      });

      org = await Organization.create({
        name: 'Acme Technologies Inc.',
        slug: demoSlug,
        website: 'https://acmetechnologies.example.com',
        industry: 'Software & Cloud Infrastructure',
        size: '50-100',
        status: 'active',
        ownerId: owner._id,
        subscriptionPlan: 'professional',
        subscriptionStatus: 'active',
        settings: {
          ticketPrefix: 'QUB',
          timezone: 'America/New_York',
          allowExternalReporters: true,
        },
      });

      owner.activeOrganizationId = org._id as any;
      await owner.save();
      devLead.activeOrganizationId = org._id as any;
      await devLead.save();
      designer.activeOrganizationId = org._id as any;
      await designer.save();
      developer.activeOrganizationId = org._id as any;
      await developer.save();

      // Memberships
      await OrganizationMembership.create([
        { organizationId: org._id, userId: owner._id, role: 'owner', jobTitle: 'VP of Engineering', department: 'Executive' },
        { organizationId: org._id, userId: devLead._id, role: 'team_lead', jobTitle: 'Lead Backend Architect', department: 'Engineering' },
        { organizationId: org._id, userId: designer._id, role: 'employee', jobTitle: 'Senior Product Designer', department: 'Product Design' },
        { organizationId: org._id, userId: developer._id, role: 'employee', jobTitle: 'Fullstack Engineer', department: 'Engineering' },
      ]);

      // Subscription Record
      await Subscription.create({
        organizationId: org._id,
        planId: proPlan?._id || new mongoose.Types.ObjectId(),
        planCode: 'professional',
        billingInterval: 'monthly',
        status: 'active',
        amountPaid: 49,
        invoices: [
          { invoiceId: 'INV-2026-001', amount: 49, status: 'paid', date: new Date() },
        ],
      });

      // Projects
      const project1 = await Project.create({
        organizationId: org._id,
        name: 'Enterprise Cloud Portal',
        key: 'ECP',
        description: 'Next-generation cloud management platform and multi-tenant telemetry hub.',
        category: 'Backend & Cloud',
        priority: 'high',
        status: 'active',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        projectManagerId: owner._id,
        members: [
          { userId: owner._id, role: 'lead', assignedAt: new Date() },
          { userId: devLead._id, role: 'member', assignedAt: new Date() },
          { userId: developer._id, role: 'member', assignedAt: new Date() },
        ],
      });

      const project2 = await Project.create({
        organizationId: org._id,
        name: 'Mobile App Redesign v2',
        key: 'MAR',
        description: 'iOS and Android client overhaul with offline-first sync and biometric auth.',
        category: 'Mobile Applications',
        priority: 'normal',
        status: 'active',
        startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        targetDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        projectManagerId: devLead._id,
        members: [
          { userId: devLead._id, role: 'lead', assignedAt: new Date() },
          { userId: designer._id, role: 'member', assignedAt: new Date() },
          { userId: developer._id, role: 'member', assignedAt: new Date() },
        ],
      });

      // Create Realistic Tickets
      const ticketsData = [
        {
          project: project1,
          seq: 1,
          num: 'QUB-000101',
          title: 'High latency on MongoDB replica queries during peak reporting loads',
          desc: 'Aggregation pipelines across cross-tenant indices are taking >1200ms when generating monthly trend reports. Add compound index { organizationId: 1, createdAt: -1 } and optimize query hints.',
          category: 'Performance Issue' as const,
          priority: 'Critical' as const,
          status: 'In Progress' as const,
          assignee: devLead,
          reporter: owner,
          tags: ['database', 'performance', 'indexing'],
          dueDays: 2,
        },
        {
          project: project1,
          seq: 2,
          num: 'QUB-000102',
          title: 'Implement OAuth2 and GitHub SSO Integration for Developer Onboarding',
          desc: 'Allow developers and enterprise team members to log in with GitHub credentials with automatic organization role mapping.',
          category: 'Feature Request' as const,
          priority: 'High' as const,
          status: 'To Do' as const,
          assignee: developer,
          reporter: owner,
          tags: ['auth', 'security', 'oauth'],
          dueDays: 7,
        },
        {
          project: project1,
          seq: 3,
          num: 'QUB-000103',
          title: 'Rotate stale JWT refresh tokens on credential change',
          desc: 'Security review identified that password changes should immediately revoke existing refresh token sessions across all devices.',
          category: 'Security Issue' as const,
          priority: 'Urgent' as const,
          status: 'Resolved' as const,
          assignee: devLead,
          reporter: owner,
          tags: ['security', 'jwt', 'audit'],
          dueDays: -1,
        },
        {
          project: project1,
          seq: 4,
          num: 'QUB-000104',
          title: 'Optimize client bundle size with dynamic route chunking',
          desc: 'Client main chunk is currently 680KB. Split PDF and chart libraries into async vendor chunks to achieve <200KB initial payload.',
          category: 'Frontend Issue' as const,
          priority: 'Normal' as const,
          status: 'To Do' as const,
          assignee: developer,
          reporter: devLead,
          tags: ['frontend', 'performance', 'vite'],
          dueDays: 10,
        },
        {
          project: project2,
          seq: 5,
          num: 'QUB-000105',
          title: 'Fix responsive spacing on mobile ticket drawer on viewport resize',
          desc: 'Right drawer padding overlaps on small screens (<640px). Ensure drawer header adheres to safe-area-inset and touch friendly buttons.',
          category: 'UI/UX Issue' as const,
          priority: 'Urgent' as const,
          status: 'To Do' as const,
          assignee: designer,
          reporter: owner,
          tags: ['ui', 'mobile', 'drawer'],
          dueDays: 3,
        },
        {
          project: project2,
          seq: 6,
          num: 'QUB-000106',
          title: 'Kanban drag shadow glitching during rapid status drag-and-drop',
          desc: 'When dragging multiple cards rapidly across columns, ghost shadow does not release properly until mouse leaves container.',
          category: 'UI/UX Issue' as const,
          priority: 'High' as const,
          status: 'Resolved' as const,
          assignee: designer,
          reporter: developer,
          tags: ['kanban', 'drag-drop', 'animation'],
          dueDays: -3,
        },
        {
          project: project2,
          seq: 7,
          num: 'QUB-000107',
          title: 'Implement Dark Mode contrast ratio adjustments on status badges',
          desc: 'Verify WCAG AAA contrast compliance on all badge color combinations when dark theme is activated.',
          category: 'UI/UX Issue' as const,
          priority: 'Low' as const,
          status: 'To Do' as const,
          assignee: designer,
          reporter: owner,
          tags: ['accessibility', 'badges', 'dark-mode'],
          dueDays: 14,
        },
        {
          project: project2,
          seq: 8,
          num: 'QUB-000108',
          title: 'Automated workflow engine trigger on Urgent priority ticket',
          desc: 'Configure automated rule: When priority becomes Urgent or Critical, immediately send team notification to dev lead.',
          category: 'Backend Issue' as const,
          priority: 'Normal' as const,
          status: 'In Progress' as const,
          assignee: devLead,
          reporter: owner,
          tags: ['automation', 'workflows'],
          dueDays: 5,
        },
      ];

      for (const t of ticketsData) {
        const createdTicket = await Ticket.create({
          organizationId: org._id,
          projectId: t.project._id,
          sequenceNumber: t.seq,
          ticketNumber: t.num,
          title: t.title,
          description: t.desc,
          category: t.category,
          priority: t.priority,
          status: t.status,
          reporterId: t.reporter._id,
          assigneeId: t.assignee._id,
          tags: t.tags,
          dueDate: new Date(Date.now() + t.dueDays * 24 * 60 * 60 * 1000),
          order: t.seq * 1000,
          resolvedAt: t.status === 'Resolved' ? new Date(Date.now() - 12 * 60 * 60 * 1000) : undefined,
        });

        // Add initial comment & activity
        await TicketComment.create({
          organizationId: org._id,
          ticketId: createdTicket._id,
          authorId: t.reporter._id,
          content: `Initialized ticket specification. Please review the criteria above and ping if any questions.`,
          isInternal: false,
        });

        if (t.status === 'In Progress') {
          await TicketComment.create({
            organizationId: org._id,
            ticketId: createdTicket._id,
            authorId: t.assignee._id,
            content: `Investigating root cause in staging environment now. Logs indicate query planner was missing proper sorting key.`,
            isInternal: false,
          });

          await TicketComment.create({
            organizationId: org._id,
            ticketId: createdTicket._id,
            authorId: devLead._id,
            content: `INTERNAL NOTE: Ensure database replica index is built in background mode to avoid connection spikes.`,
            isInternal: true,
          });
        }

        await TicketActivity.create({
          organizationId: org._id,
          ticketId: createdTicket._id,
          projectId: t.project._id,
          userId: t.reporter._id,
          action: 'created',
          description: `Created ticket ${createdTicket.ticketNumber}`,
        });
      }

      // Create Automated Workflow Rule
      await Workflow.create({
        organizationId: org._id,
        name: 'Urgent Ticket Lead Escalation',
        description: 'Auto-assign and notify lead when Critical ticket is reported.',
        triggerEvent: 'priority_urgent',
        conditions: [
          { field: 'priority', operator: 'equals', value: 'Critical' },
        ],
        actions: [
          { type: 'add_tag', params: { tag: 'escalated' } },
          {
            type: 'send_notification',
            params: {
              title: 'Critical Ticket Escalation',
              message: 'A critical ticket requires immediate response from engineering leads.',
            },
          },
        ],
        isActive: true,
        createdBy: owner._id,
      });

      // Sample notification for owner
      await Notification.create({
        organizationId: org._id,
        recipientId: owner._id,
        senderId: devLead._id,
        type: 'ticket_comment',
        title: 'New update on QUB-000101',
        message: 'Alex Rivera updated ticket status to In Progress',
        link: '/workspace/tickets',
        isRead: false,
      });

      console.log('[Seeder] Successfully seeded Acme Technologies demo organization with projects, tickets, and team!');
    } else {
      console.log('[Seeder] Database already contains initialized data.');
    }
  } catch (err: any) {
    console.error('[Seeder] Seeding error:', err);
  }
};

// If run directly via CLI
if (process.argv[1]?.includes('seed.ts')) {
  (async () => {
    await connectDB();
    await seedDatabase();
    await disconnectDB();
    process.exit(0);
  })();
}

