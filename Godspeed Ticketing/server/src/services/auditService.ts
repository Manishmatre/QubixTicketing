import mongoose from 'mongoose';
import { AuditLog } from '../models/AuditLog.js';
import { Request } from 'express';

export interface CreateAuditLogParams {
  organizationId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  action: string;
  entity: string;
  entityId?: string;
  req?: Request;
  details?: Record<string, any>;
}

export const logAuditEvent = async (params: CreateAuditLogParams): Promise<void> => {
  try {
    const ipAddress = params.req ? (params.req.headers['x-forwarded-for'] as string) || params.req.socket.remoteAddress : undefined;
    const userAgent = params.req ? params.req.headers['user-agent'] : undefined;

    await AuditLog.create({
      organizationId: params.organizationId,
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      ipAddress,
      userAgent,
      details: params.details,
    });
  } catch (err: any) {
    console.error(`[AuditService] Failed to record audit log: ${err.message}`);
  }
};

