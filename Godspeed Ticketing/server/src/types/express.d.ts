import { IUser } from '../models/User.js';
import { IOrganizationMembership, OrgRole } from '../models/OrganizationMembership.js';
import mongoose from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      organizationId?: mongoose.Types.ObjectId;
      membership?: IOrganizationMembership;
      membershipRole?: OrgRole;
    }
  }
}

