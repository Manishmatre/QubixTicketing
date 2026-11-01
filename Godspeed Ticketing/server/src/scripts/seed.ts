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
import { Workflow } from '../models/Workflow.js';
import { hashPassword } from '../utils/password.js';

export const seedDatabase = async (): Promise<void> => {
  try {
    console.log('[Seeder] Initializing Godspeed Dedicated Operations & Ticketing Portal...');

    // 1. Ensure dedicated Enterprise plan exists
    let enterprisePlan = await Plan.findOne({ code: 'enterprise' });
    if (!enterprisePlan) {
      enterprisePlan = await Plan.create({
        name: 'Enterprise Dedicated',
        code: 'enterprise',
        description: 'Dedicated single-tenant ticketing desk for Godspeed operations.',
        priceMonthly: 0,
        priceYearly: 0,
        maxUsers: 1000,
        maxProjects: 1000,
        maxStorageMB: 1000000,
        features: [
          'Unlimited team members',
          'Unlimited projects',
          'Full Kanban & Gantt timeline',
          'Automated SLA engine',
          'Dedicated single-tenant infrastructure',
        ],
      });
    }

    // 2. Ensure Godspeed Primary Admin exists
    const adminEmail = 'admin@godspeed.com';
    let godspeedAdmin = await User.findOne({ email: adminEmail });
    if (!godspeedAdmin) {
      console.log('[Seeder] Creating Godspeed Administrator account (admin@godspeed.com)...');
      const pass = await hashPassword('Password123!');
      godspeedAdmin = await User.create({
        name: 'Godspeed Administrator',
        email: adminEmail,
        passwordHash: pass,
        isSuperAdmin: false,
        isVerified: true,
        phone: '+1 (555) 234-5678',
        designation: 'Operations Director',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      });
    }

    // 3. Ensure Godspeed Dedicated Organization exists
    const godspeedSlug = 'godspeed';
    let org = await Organization.findOne({ slug: godspeedSlug });
    if (!org) {
      console.log('[Seeder] Creating dedicated organization: GodSpeed Home Sales...');
      org = await Organization.create({
        name: 'GodSpeed Home Sales',
        slug: godspeedSlug,
        website: 'https://godspeedhomesales.com',
        industry: 'Real Estate, Operations & Media',
        size: '10-50',
        status: 'active',
        ownerId: godspeedAdmin._id,
        subscriptionPlan: 'enterprise',
        subscriptionStatus: 'active',
        settings: {
          ticketPrefix: 'GSD',
          timezone: 'America/New_York',
          allowExternalReporters: true,
        },
      });
    }

    // Link admin active org
    if (!godspeedAdmin.activeOrganizationId || String(godspeedAdmin.activeOrganizationId) !== String(org._id)) {
      godspeedAdmin.activeOrganizationId = org._id as any;
      await godspeedAdmin.save();
    }

    // Ensure Membership
    const existingMembership = await OrganizationMembership.findOne({
      organizationId: org._id,
      userId: godspeedAdmin._id,
    });
    if (!existingMembership) {
      await OrganizationMembership.create({
        organizationId: org._id,
        userId: godspeedAdmin._id,
        role: 'owner',
        jobTitle: 'Operations Director',
        department: 'Executive Operations',
      });
    }

    // Ensure Subscription
    const existingSub = await Subscription.findOne({ organizationId: org._id });
    if (!existingSub) {
      await Subscription.create({
        organizationId: org._id,
        planId: enterprisePlan._id,
        planCode: 'enterprise',
        billingInterval: 'yearly',
        status: 'active',
        amountPaid: 0,
      });
    }

    // 4. Ensure Default Projects exist
    let opsProject = await Project.findOne({ organizationId: org._id, key: 'OPS' });
    if (!opsProject) {
      console.log('[Seeder] Creating OPS project...');
      opsProject = await Project.create({
        organizationId: org._id,
        name: 'Operations & Client Fulfillment',
        key: 'OPS',
        description: 'Tracking property transactions, client closings, and field inspection tasks.',
        category: 'Operations',
        priority: 'high',
        status: 'active',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        projectManagerId: godspeedAdmin._id,
        members: [{ userId: godspeedAdmin._id, role: 'lead', assignedAt: new Date() }],
      });
    }

    let mediaProject = await Project.findOne({ organizationId: org._id, key: 'MEDIA' });
    if (!mediaProject) {
      console.log('[Seeder] Creating MEDIA project...');
      mediaProject = await Project.create({
        organizationId: org._id,
        name: 'Digital Marketing & Media Assets',
        key: 'MEDIA',
        description: 'Property listings, architectural photography, social campaigns, and virtual tours.',
        category: 'Marketing',
        priority: 'normal',
        status: 'active',
        startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        targetDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        projectManagerId: godspeedAdmin._id,
        members: [{ userId: godspeedAdmin._id, role: 'lead', assignedAt: new Date() }],
      });
    }

    let techProject = await Project.findOne({ organizationId: org._id, key: 'TECH' });
    if (!techProject) {
      console.log('[Seeder] Creating TECH project...');
      techProject = await Project.create({
        organizationId: org._id,
        name: 'Technical Infrastructure & Tooling',
        key: 'TECH',
        description: 'CRM data sync, lead routing automations, and operational dashboard tools.',
        category: 'Engineering',
        priority: 'normal',
        status: 'active',
        startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        projectManagerId: godspeedAdmin._id,
        members: [{ userId: godspeedAdmin._id, role: 'lead', assignedAt: new Date() }],
      });
    }

    // 5. Ensure Initial Operational Tickets exist
    const ticketCount = await Ticket.countDocuments({ organizationId: org._id });
    if (ticketCount < 5) {
      console.log('[Seeder] Seeding rich Real Estate operational tickets for Godspeed Home Sales...');
      await Ticket.deleteMany({ organizationId: org._id });
      await TicketComment.deleteMany({ organizationId: org._id });
      await TicketActivity.deleteMany({ organizationId: org._id });

      const ticketsData = [
        {
          project: opsProject,
          seq: 1,
          num: 'GSD-000101',
          title: 'Finalize escrow documentation checklist for residential portfolio closings',
          desc: 'Audit title deed transfers, confirm insurance policy riders, and compile buyer verification certificates for upcoming portfolio settlement.',
          category: 'Operations' as const,
          priority: 'High' as const,
          status: 'In Progress' as const,
          assignee: godspeedAdmin,
          reporter: godspeedAdmin,
          tags: ['escrow', 'documentation', 'closing'],
          dueDays: 2,
          subtasks: [
            { id: 'st-1', title: 'Confirm title commitment & lien clearance', done: true, num: 'GSD-000101-1' },
            { id: 'st-2', title: 'Verify earnest money wire transfer deposit', done: true, num: 'GSD-000101-2' },
            { id: 'st-3', title: 'Obtain final signed closing disclosure (CD)', done: false, num: 'GSD-000101-3' },
          ],
        },
        {
          project: mediaProject,
          seq: 2,
          num: 'GSD-000102',
          title: 'Launch luxury waterfront property interactive 3D virtual tour',
          desc: 'Render drone imagery, finalize matterport 3D walkthrough, and syndicate media to MLS and portal listings for 88 Ocean Drive.',
          category: 'Feature' as const,
          priority: 'Normal' as const,
          status: 'To Do' as const,
          assignee: godspeedAdmin,
          reporter: godspeedAdmin,
          tags: ['media', 'virtual-tour', 'listings'],
          dueDays: 5,
          subtasks: [
            { id: 'st-4', title: 'Complete Matterport 3D scanner floor capture', done: true, num: 'GSD-000102-1' },
            { id: 'st-5', title: 'Color-grade 4K aerial drone highlight reel', done: false, num: 'GSD-000102-2' },
            { id: 'st-6', title: 'Embed interactive tour link on MLS listing', done: false, num: 'GSD-000102-3' },
          ],
        },
        {
          project: techProject,
          seq: 3,
          num: 'GSD-000103',
          title: 'Automate inbound buyer lead distribution to senior sales agents',
          desc: 'Configure automated round-robin lead allocation webhook from portal inquiry forms directly into agent mobile dispatch.',
          category: 'Improvement' as const,
          priority: 'Urgent' as const,
          status: 'Resolved' as const,
          assignee: godspeedAdmin,
          reporter: godspeedAdmin,
          tags: ['automation', 'crm', 'leads'],
          dueDays: -1,
          subtasks: [
            { id: 'st-7', title: 'Setup incoming webhook parser for portal leads', done: true, num: 'GSD-000103-1' },
            { id: 'st-8', title: 'Test round-robin distribution to team dispatch', done: true, num: 'GSD-000103-2' },
          ],
        },
        {
          project: opsProject,
          seq: 4,
          num: 'GSD-000104',
          title: 'Coordinate certified structural & radon inspection for 452 Elm Street',
          desc: 'Schedule licensed inspector on-site, audit foundation report, and draft seller repair request addendum.',
          category: 'Operations' as const,
          priority: 'Critical' as const,
          status: 'In Progress' as const,
          assignee: godspeedAdmin,
          reporter: godspeedAdmin,
          tags: ['inspection', 'repairs', 'addendum'],
          dueDays: 1,
          subtasks: [
            { id: 'st-9', title: 'Schedule certified home & roof inspector', done: true, num: 'GSD-000104-1' },
            { id: 'st-10', title: 'Review structural inspection findings with buyer', done: false, num: 'GSD-000104-2' },
            { id: 'st-11', title: 'Submit credit / repair addendum to seller agent', done: false, num: 'GSD-000104-3' },
          ],
        },
        {
          project: mediaProject,
          seq: 5,
          num: 'GSD-000105',
          title: 'Produce 4K drone cinematography & twilight exterior staging package',
          desc: 'Capture dusk twilight photography for hilltop estate listing. Coordinate with professional staging team.',
          category: 'Task' as const,
          priority: 'Normal' as const,
          status: 'Under Review' as const,
          assignee: godspeedAdmin,
          reporter: godspeedAdmin,
          tags: ['photography', 'drone', 'staging'],
          dueDays: 3,
          subtasks: [
            { id: 'st-12', title: 'Exterior twilight lighting staging', done: true, num: 'GSD-000105-1' },
            { id: 'st-13', title: 'Edit high-res HDR architectural images', done: true, num: 'GSD-000105-2' },
            { id: 'st-14', title: 'Client marketing director review', done: false, num: 'GSD-000105-3' },
          ],
        },
        {
          project: opsProject,
          seq: 6,
          num: 'GSD-000106',
          title: 'HOA disclosure packet & bylaws compliance audit for buyer closing',
          desc: 'Request HOA reserve study, verify transfer fees, and confirm architectural guidelines review for pending purchase.',
          category: 'Client Request' as const,
          priority: 'Urgent' as const,
          status: 'To Do' as const,
          assignee: godspeedAdmin,
          reporter: godspeedAdmin,
          tags: ['hoa', 'compliance', 'bylaws'],
          dueDays: 4,
          subtasks: [
            { id: 'st-15', title: 'Obtain HOA financial reserve report', done: false, num: 'GSD-000106-1' },
            { id: 'st-16', title: 'Confirm absence of pending special assessments', done: false, num: 'GSD-000106-2' },
          ],
        },
        {
          project: mediaProject,
          seq: 7,
          num: 'GSD-000107',
          title: 'Syndicate verified MLS listing #88392 across Realtor.com and Zillow Pro',
          desc: 'Verify property description copy, tax record data, room dimensions, and lockbox showing instructions.',
          category: 'Task' as const,
          priority: 'Normal' as const,
          status: 'Resolved' as const,
          assignee: godspeedAdmin,
          reporter: godspeedAdmin,
          tags: ['mls', 'syndication', 'realtor'],
          dueDays: -2,
          subtasks: [
            { id: 'st-17', title: 'Input listing specifications into Regional MLS', done: true, num: 'GSD-000107-1' },
            { id: 'st-18', title: 'Verify syndication feeds to Zillow & Trulia', done: true, num: 'GSD-000107-2' },
          ],
        },
        {
          project: techProject,
          seq: 8,
          num: 'GSD-000108',
          title: 'Configure automated SMS dispatch for scheduled weekend open houses',
          desc: 'Deploy twilio SMS confirmation workflow for prospective buyers RSVPing for open house tours.',
          category: 'Improvement' as const,
          priority: 'Normal' as const,
          status: 'In Progress' as const,
          assignee: godspeedAdmin,
          reporter: godspeedAdmin,
          tags: ['sms', 'open-house', 'automation'],
          dueDays: 4,
          subtasks: [
            { id: 'st-19', title: 'Configure SMS gateway template', done: true, num: 'GSD-000108-1' },
            { id: 'st-20', title: 'Connect landing page RSVP webhook', done: false, num: 'GSD-000108-2' },
          ],
        },
        {
          project: opsProject,
          seq: 9,
          num: 'GSD-000109',
          title: 'Title commitment review and preliminary settlement statement reconciliation',
          desc: 'Examine Schedule B requirements, verify property survey boundaries, and approve closing attorney settlement statement.',
          category: 'Operations' as const,
          priority: 'High' as const,
          status: 'To Do' as const,
          assignee: godspeedAdmin,
          reporter: godspeedAdmin,
          tags: ['title', 'settlement', 'closing'],
          dueDays: 6,
          subtasks: [
            { id: 'st-21', title: 'Clear Schedule B title exceptions', done: false, num: 'GSD-000109-1' },
            { id: 'st-22', title: 'Reconcile buyer/seller prorated property tax credits', done: false, num: 'GSD-000109-2' },
          ],
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
          assignedUserIds: [t.assignee._id],
          subtasks: t.subtasks,
          tags: t.tags,
          dueDate: new Date(Date.now() + t.dueDays * 24 * 60 * 60 * 1000),
          order: t.seq * 1000,
          resolvedAt: t.status === 'Resolved' ? new Date(Date.now() - 6 * 60 * 60 * 1000) : undefined,
        });

        await TicketComment.create({
          organizationId: org._id,
          ticketId: createdTicket._id,
          authorId: t.reporter._id,
          content: 'Ticket created in Godspeed Operations Desk. Task initialized and tracked.',
          isInternal: false,
        });

        await TicketActivity.create({
          organizationId: org._id,
          ticketId: createdTicket._id,
          projectId: t.project._id,
          userId: t.reporter._id,
          action: 'created',
          description: `Created ticket ${createdTicket.ticketNumber}`,
        });
      }
      console.log('[Seeder] All 9 Real Estate operational tickets successfully created.');
    } else {
      console.log(`[Seeder] ${ticketCount} ticket(s) already exist for Godspeed.`);
    }

    // 6. Ensure Workflow Rule exists
    const workflowCount = await Workflow.countDocuments({ organizationId: org._id });
    if (workflowCount === 0) {
      await Workflow.create({
        organizationId: org._id,
        name: 'Urgent Priority Lead Alert',
        description: 'Auto-tag and alert operations team when an urgent task is created.',
        triggerEvent: 'priority_urgent',
        conditions: [{ field: 'priority', operator: 'equals', value: 'Urgent' }],
        actions: [
          { type: 'add_tag', params: { tag: 'urgent-response' } },
          {
            type: 'send_notification',
            params: {
              title: 'Urgent Godspeed Task Created',
              message: 'Immediate operational review needed for high priority task.',
            },
          },
        ],
        isActive: true,
        createdBy: godspeedAdmin._id,
      });
    }

    console.log('[Seeder] Godspeed Operations Ticketing Desk successfully initialized and ready!');
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
