export type OrgRole =
  | 'owner'
  | 'admin'
  | 'project_manager'
  | 'team_lead'
  | 'employee'
  | 'reporter'
  | 'viewer';

export type TicketCategory =
  | 'Bug'
  | 'UI/UX Issue'
  | 'Feature Request'
  | 'Technical Support'
  | 'Backend Issue'
  | 'Frontend Issue'
  | 'Security Issue'
  | 'Performance Issue'
  | 'General Request'
  | 'Other';

export type TicketPriority = 'Critical' | 'Urgent' | 'High' | 'Normal' | 'Low';

export type TicketStatus =
  | 'Open'
  | 'To Do'
  | 'In Progress'
  | 'Under Review'
  | 'Waiting for Response'
  | 'On Hold'
  | 'Resolved'
  | 'Closed'
  | 'Reopened';

export interface UserDocument {
  _id: string;
  title: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  designation?: string;
  avatarUrl?: string;
  documents?: UserDocument[];
  isSuperAdmin: boolean;
  isVerified?: boolean;
  mustChangePassword?: boolean;
  activeOrganizationId?: string;
  lastLoginAt?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  website?: string;
  industry?: string;
  size?: string;
  status: 'active' | 'suspended';
  subscriptionPlan: 'free' | 'starter' | 'professional' | 'business' | 'enterprise';
  subscriptionStatus: 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';
  trialEndsAt?: string;
  settings?: {
    ticketPrefix: string;
    timezone: string;
    allowExternalReporters: boolean;
    maxAttachmentSizeMB?: number;
  };
  role?: OrgRole;
}

export interface Project {
  _id: string;
  organizationId: string;
  name: string;
  key: string;
  description: string;
  category: string;
  priority: 'low' | 'normal' | 'high' | 'urgent' | 'critical';
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
  startDate?: string;
  endDate?: string;
  targetDate?: string;
  projectManagerId?: User;
  members: Array<{
    userId: User;
    role: 'lead' | 'member' | 'viewer';
    assignedAt: string;
  }>;
  milestones?: Array<{
    _id: string;
    title: string;
    description?: string;
    dueDate: string;
    completed: boolean;
  }>;
  ticketStats?: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TicketLink {
  _id: string;
  title: string;
  url: string;
  type?: string;
  createdAt?: string;
}

export interface Ticket {
  _id: string;
  organizationId: string;
  projectId: Project;
  ticketNumber: string;
  sequenceNumber: number;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  reporterId: User;
  assigneeId?: User;
  watchers: User[];
  tags: string[];
  links?: TicketLink[];
  dueDate?: string;
  relatedTicketIds?: any[];
  order: number;
  commentCount: number;
  attachmentCount: number;
  resolvedAt?: string;
  closedAt?: string;
  resolutionSummary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketComment {
  _id: string;
  ticketId: string;
  authorId: User;
  content: string;
  isInternal: boolean;
  attachments?: string[];
  reactions: Array<{
    emoji: string;
    userIds: User[];
  }>;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
}

export interface TicketAttachment {
  _id: string;
  ticketId: string;
  originalName: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
  uploadedById: User;
  createdAt: string;
}

export interface TicketActivity {
  _id: string;
  ticketId: string;
  userId: User;
  action: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  description: string;
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  recipientId: string;
  senderId?: User;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Plan {
  _id: string;
  name: string;
  code: 'starter' | 'professional' | 'business' | 'enterprise';
  description: string;
  priceMonthly: number;
  priceYearly: number;
  maxUsers: number;
  maxProjects: number;
  maxStorageMB: number;
  features: string[];
}

export interface WorkflowRule {
  _id: string;
  name: string;
  description: string;
  triggerEvent: string;
  conditions: Array<{
    field: string;
    operator: string;
    value: string;
  }>;
  actions: Array<{
    type: string;
    params: Record<string, any>;
  }>;
  isActive: boolean;
  runCount: number;
  lastRunAt?: string;
  createdBy?: User;
}

