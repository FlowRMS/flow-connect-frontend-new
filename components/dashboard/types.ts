/**
 * Dashboard Types and Interfaces
 */

export type ActivityType = 'job' | 'company' | 'contact' | 'pre-opportunity' | 'note' | 'task' | 'customer' | 'factory';
export type ActivityStatus = 'upcoming' | 'completed';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  time: string;
  date: string;
  createdAt: string;
  description: string;
  entity: string;
  entityType: string;
  tags: string[];
  assignedTo: string;
  mentions: string[];
  linkedEntities?: Array<{ type: string; name: string }>;
  status: string;
  activityStatus: ActivityStatus;
  link: string;
  metadata: ActivityMetadata;
}

/**
 * Metadata specific to each activity type
 */
export interface ActivityMetadata {
  // Job-specific
  jobType?: string;
  jobOwner?: string;
  requester?: string;
  startDate?: string;
  endDate?: string;
  statusName?: string;
  
  // Company-specific
  companySourceType?: string;
  phone?: string;
  website?: string;
  
  // Contact-specific
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  companyName?: string;
  
  // Pre-opportunity-specific
  entityNumber?: string;
  entityDate?: string;
  expDate?: string;
  total?: number;
  
  // Task-specific
  priority?: string;
  dueDate?: string;
  reminderDate?: string;
  
  // Note-specific
  content?: string;

  // Customer-specific
  contactEmail?: string;
  contactNumber?: string;
  isParent?: boolean;
  published?: boolean;
  insideReps?: string;
  outsideReps?: string;

  // Factory-specific
  title?: string;
  accountNumber?: string;
  baseCommissionRate?: string;
}

export interface ActivityFilters {
  types: ActivityType[];
  statuses: ActivityStatus[];
}
