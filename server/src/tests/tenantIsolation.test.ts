import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { OrganizationMembership } from '../models/OrganizationMembership.js';
import { Project } from '../models/Project.js';
import { Ticket } from '../models/Ticket.js';
import { generateAccessToken } from '../utils/jwt.js';

describe('QUBIX Multi-Tenant Isolation & Security Tests', () => {
  let app: any;
  let userA: any;
  let userB: any;
  let tokenA: string;
  let tokenB: string;
  let orgA: any;
  let orgB: any;
  let projectA: any;
  let projectB: any;
  let ticketA: any;

  beforeAll(async () => {
    await connectDB();
    app = createApp();

    // Create Tenant A
    userA = await User.create({
      name: 'Tenant A Owner',
      email: 'owner@tenanta.com',
      passwordHash: 'dummyhash',
      isSuperAdmin: false,
    });
    orgA = await Organization.create({
      name: 'Tenant A Org',
      slug: 'tenant-a',
      ownerId: userA._id,
    });
    await OrganizationMembership.create({
      organizationId: orgA._id,
      userId: userA._id,
      role: 'owner',
    });
    tokenA = generateAccessToken({
      userId: userA._id.toString(),
      email: userA.email,
      isSuperAdmin: false,
      activeOrganizationId: orgA._id.toString(),
    });

    projectA = await Project.create({
      organizationId: orgA._id,
      name: 'Project A',
      key: 'PRJA',
      members: [{ userId: userA._id, role: 'lead', assignedAt: new Date() }],
    });

    ticketA = await Ticket.create({
      organizationId: orgA._id,
      projectId: projectA._id,
      sequenceNumber: 1,
      ticketNumber: 'QUB-000001',
      title: 'Secret Bug in Tenant A',
      category: 'Bug',
      priority: 'High',
      status: 'To Do',
      reporterId: userA._id,
    });

    // Create Tenant B
    userB = await User.create({
      name: 'Tenant B Owner',
      email: 'owner@tenantb.com',
      passwordHash: 'dummyhash',
      isSuperAdmin: false,
    });
    orgB = await Organization.create({
      name: 'Tenant B Org',
      slug: 'tenant-b',
      ownerId: userB._id,
    });
    await OrganizationMembership.create({
      organizationId: orgB._id,
      userId: userB._id,
      role: 'owner',
    });
    tokenB = generateAccessToken({
      userId: userB._id.toString(),
      email: userB.email,
      isSuperAdmin: false,
      activeOrganizationId: orgB._id.toString(),
    });

    projectB = await Project.create({
      organizationId: orgB._id,
      name: 'Project B',
      key: 'PRJB',
      members: [{ userId: userB._id, role: 'lead', assignedAt: new Date() }],
    });
  });

  afterAll(async () => {
    await disconnectDB();
  });

  it('Tenant A should be able to view their own tickets', async () => {
    const res = await request(app)
      .get('/api/v1/tickets')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-organization-id', orgA._id.toString());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].title).toBe('Secret Bug in Tenant A');
  });

  it('Tenant B should NOT see Tenant A tickets (cross-tenant leak prevention)', async () => {
    const res = await request(app)
      .get('/api/v1/tickets')
      .set('Authorization', `Bearer ${tokenB}`)
      .set('x-organization-id', orgB._id.toString());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(0);
  });

  it('Tenant B should be rejected if attempting to impersonate Tenant A with x-organization-id', async () => {
    const res = await request(app)
      .get('/api/v1/tickets')
      .set('Authorization', `Bearer ${tokenB}`)
      .set('x-organization-id', orgA._id.toString()); // malicious cross-tenant header

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CROSS_TENANT_ACCESS_DENIED');
  });

  it('Tenant B should be rejected when directly attempting to access or edit Tenant A ticket', async () => {
    const res = await request(app)
      .patch(`/api/v1/tickets/${ticketA._id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .set('x-organization-id', orgB._id.toString())
      .send({ title: 'Tampered by Tenant B' });

    expect(res.status).toBe(404);
  });
});

