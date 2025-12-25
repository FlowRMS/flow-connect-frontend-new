/**
 * Dashboard Utility Functions
 */

import { AVATAR_COLORS, STATUS_COLORS, PRIORITY_COLORS } from './constants';
import type { Activity, ActivityType, ActivityStatus, ActivityMetadata } from './types';
import type {
  JobLandingPage,
  CompanyLandingPage,
  ContactLandingPage,
  PreOpportunityLandingPage,
  NoteLandingPage,
  TaskLandingPage,
  CustomerLandingPage,
  FactoryLandingPage,
} from '../lib/crm-graphql';
import type { ActivityFeedData } from './hooks/useActivityFeed';

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

/**
 * Get avatar color based on name
 */
export function getAvatarColor(name: string): string {
  if (!name) return AVATAR_COLORS[0];
  const index = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

/**
 * Filter activities by type and status
 */
export function filterActivities(
  activities: Activity[],
  typeFilters: ActivityType[],
  statusFilters: ActivityStatus[]
): Activity[] {
  return activities.filter((activity) => {
    const matchesType = typeFilters.length === 0 || typeFilters.includes(activity.type);
    const matchesStatus = statusFilters.length === 0 || statusFilters.includes(activity.activityStatus);
    return matchesType && matchesStatus;
  });
}

/**
 * Sort activities by createdAt date (newest first)
 */
export function sortActivitiesByDate(activities: Activity[]): Activity[] {
  return [...activities].sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return dateB.getTime() - dateA.getTime();
  });
}

/**
 * Get status badge classes
 */
export function getStatusBadgeClass(status: ActivityStatus): string {
  return status === 'completed'
    ? 'bg-green-100 text-green-700'
    : 'bg-blue-100 text-blue-700';
}

/**
 * Get status color for entity status
 */
export function getEntityStatusColor(status: string): string {
  return STATUS_COLORS[status] || STATUS_COLORS.default;
}

/**
 * Get priority color for tasks
 */
export function getPriorityColor(priority: string): string {
  return PRIORITY_COLORS[priority] || PRIORITY_COLORS.LOW;
}

/**
 * Capitalize first letter of a string
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Format relative time from date string
 */
export function formatRelativeTime(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return formatDate(dateString);
}

/**
 * Format date to readable string
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Parse tags from string or array
 */
export function parseTags(tags: string | string[] | null | undefined): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.filter(Boolean);
  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return tags.split(',').map(t => t.trim()).filter(Boolean);
    }
  }
  return [];
}

/**
 * Determine activity status based on dates and status
 */
function determineActivityStatus(
  status?: string,
  dueDate?: string,
  endDate?: string
): ActivityStatus {
  const completedStatuses = ['COMPLETED', 'APPROVED', 'CONVERTED', 'CANCELLED'];
  
  if (status && completedStatuses.includes(status.toUpperCase())) {
    return 'completed';
  }
  
  const checkDate = dueDate || endDate;
  if (checkDate) {
    const date = new Date(checkDate);
    const now = new Date();
    return date < now ? 'completed' : 'upcoming';
  }
  
  return 'upcoming';
}

/**
 * Transform Job to Activity
 */
function transformJob(job: JobLandingPage): Activity {
  const tags = parseTags(null);
  
  return {
    id: job.id,
    type: 'job',
    title: `Job: ${job.jobName}`,
    time: formatRelativeTime(job.createdAt || ''),
    date: formatDate(job.createdAt || ''),
    createdAt: job.createdAt || '',
    description: job.description || 'No description available',
    entity: job.jobName,
    entityType: 'Job',
    tags: job.jobType ? [job.jobType, ...tags] : tags,
    assignedTo: job.jobOwner || job.createdBy || 'Unassigned',
    mentions: job.requester ? [`@${job.requester}`] : [],
    status: job.statusName || '',
    activityStatus: determineActivityStatus(job.statusName, undefined, job.endDate),
    link: `/jobs?id=${job.id}`,
    metadata: {
      jobType: job.jobType,
      jobOwner: job.jobOwner,
      requester: job.requester,
      startDate: job.startDate,
      endDate: job.endDate,
      statusName: job.statusName,
    },
  };
}

/**
 * Transform Company to Activity
 */
function transformCompany(company: CompanyLandingPage): Activity {
  const sourceTypeLabel = company.companySourceType === 'CUSTOMER' ? 'Customer' : 'Manufacturer';
  const companyTags = parseTags(company.tags);

  return {
    id: company.id,
    type: 'company',
    title: `Company: ${company.name}`,
    time: formatRelativeTime(company.createdAt || ''),
    date: formatDate(company.createdAt || ''),
    createdAt: company.createdAt || '',
    description: `${sourceTypeLabel} company${company.website ? ` - ${company.website}` : ''}`,
    entity: company.name,
    entityType: 'Company',
    tags: [sourceTypeLabel, ...companyTags],
    assignedTo: company.createdBy || 'System',
    mentions: [],
    status: company.companySourceType,
    activityStatus: 'completed',
    link: `/companies?id=${company.id}`,
    metadata: {
      companySourceType: company.companySourceType,
      phone: company.phone,
      website: company.website,
    },
  };
}

/**
 * Transform Contact to Activity
 */
function transformContact(contact: ContactLandingPage): Activity {
  const fullName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
  const companyPart = contact.companyName ? ` at ${contact.companyName}` : '';
  const contactTags = parseTags(contact.tags);

  return {
    id: contact.id,
    type: 'contact',
    title: `Contact: ${fullName}`,
    time: formatRelativeTime(contact.createdAt || ''),
    date: formatDate(contact.createdAt || ''),
    createdAt: contact.createdAt || '',
    description: `${contact.role || 'Contact'}${companyPart}${contact.email ? ` • ${contact.email}` : ''}`,
    entity: fullName,
    entityType: 'Contact',
    tags: contact.role ? [contact.role, ...contactTags] : contactTags,
    assignedTo: contact.createdBy || 'System',
    mentions: contact.companyName ? [`@${contact.companyName}`] : [],
    status: '',
    activityStatus: 'completed',
    link: `/contacts?id=${contact.id}`,
    metadata: {
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      role: contact.role,
      companyName: contact.companyName,
    },
  };
}

/**
 * Transform PreOpportunity to Activity
 */
function transformPreOpportunity(preOpp: PreOpportunityLandingPage): Activity {
  const totalFormatted = preOpp.total 
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(preOpp.total)
    : '';
  
  return {
    id: preOpp.id,
    type: 'pre-opportunity',
    title: `Pre-Opportunity: ${preOpp.entityNumber}`,
    time: formatRelativeTime(preOpp.createdAt || ''),
    date: formatDate(preOpp.createdAt || ''),
    createdAt: preOpp.createdAt || '',
    description: `${capitalize(preOpp.status)} • ${totalFormatted || 'No value'}${preOpp.expDate ? ` • Expires ${formatDate(preOpp.expDate)}` : ''}`,
    entity: preOpp.entityNumber,
    entityType: 'Pre-Opportunity',
    tags: [preOpp.status],
    assignedTo: preOpp.createdBy || 'Unassigned',
    mentions: [],
    status: preOpp.status,
    activityStatus: determineActivityStatus(preOpp.status, preOpp.expDate),
    link: `/pre-opportunities/${preOpp.id}`,
    metadata: {
      entityNumber: preOpp.entityNumber,
      entityDate: preOpp.entityDate,
      expDate: preOpp.expDate,
      total: preOpp.total,
    },
  };
}

/**
 * Transform Note to Activity
 */
function transformNote(note: NoteLandingPage): Activity {
  const tags = parseTags(note.tags);
  const contentPreview = note.content 
    ? (note.content.length > 100 ? note.content.substring(0, 100) + '...' : note.content)
    : 'No content';
  
  // Parse linkedEntities to linkedTitles format
  const linkedEntities = note.linkedEntities
    ? note.linkedEntities.map(entity => ({
        type: entity.entityType?.toUpperCase() || 'UNKNOWN',
        name: entity.title || ''
      })).filter(item => item.name.length > 0)
    : [];
  
  return {
    id: note.id,
    type: 'note',
    title: `Note: ${note.title}`,
    time: formatRelativeTime(note.createdAt || ''),
    date: formatDate(note.createdAt || ''),
    createdAt: note.createdAt || '',
    description: contentPreview,
    entity: note.title,
    entityType: 'Note',
    tags,
    assignedTo: note.createdBy || 'System',
    mentions: [],
    linkedEntities,
    status: '',
    activityStatus: 'completed',
    link: `/notes?id=${note.id}`,
    metadata: {
      content: note.content,
    },
  };
}

/**
 * Transform Task to Activity
 */
function transformTask(task: TaskLandingPage): Activity {
  const dueDateText = task.dueDate ? `Due: ${formatDate(task.dueDate)}` : '';
  const priorityText = task.priority ? `[${task.priority}]` : '';

  // Parse linkedEntities to linkedTitles format
  const linkedEntities = task.linkedEntities
    ? task.linkedEntities.map(entity => ({
        type: entity.entityType?.toUpperCase() || 'UNKNOWN',
        name: entity.title || ''
      })).filter(item => item.name.length > 0)
    : [];

  return {
    id: task.id,
    type: 'task',
    title: `Task: ${task.title}`,
    time: formatRelativeTime(task.createdAt || ''),
    date: formatDate(task.createdAt || ''),
    createdAt: task.createdAt || '',
    description: task.description || `${priorityText} ${dueDateText}`.trim() || 'No description',
    entity: task.title,
    entityType: 'Task',
    tags: task.priority ? [task.priority] : [],
    assignedTo: task.assignedTo || task.createdBy || 'Unassigned',
    mentions: [],
    linkedEntities,
    status: task.status,
    activityStatus: determineActivityStatus(task.status, task.dueDate),
    link: `/tasks?id=${task.id}`,
    metadata: {
      priority: task.priority,
      dueDate: task.dueDate,
    },
  };
}

/**
 * Transform Customer to Activity
 */
function transformCustomer(customer: CustomerLandingPage): Activity {
  const typeLabel = customer.isParent ? 'Parent Customer' : 'Customer';
  const statusLabel = customer.published ? 'Published' : 'Draft';

  return {
    id: customer.id,
    type: 'customer',
    title: `Customer: ${customer.companyName}`,
    time: formatRelativeTime(customer.createdAt || ''),
    date: formatDate(customer.createdAt || ''),
    createdAt: customer.createdAt || '',
    description: `${typeLabel} • ${statusLabel}${customer.contactEmail ? ` • ${customer.contactEmail}` : ''}`,
    entity: customer.companyName,
    entityType: 'Customer',
    tags: customer.isParent ? ['Parent'] : [],
    assignedTo: customer.createdBy || 'System',
    mentions: [],
    status: statusLabel,
    activityStatus: customer.published ? 'completed' : 'upcoming',
    link: `/customers?id=${customer.id}`,
    metadata: {
      companyName: customer.companyName,
      contactEmail: customer.contactEmail,
      contactNumber: customer.contactNumber,
      isParent: customer.isParent,
      published: customer.published,
      insideReps: customer.insideReps,
      outsideReps: customer.outsideReps,
    },
  };
}

/**
 * Transform Factory to Activity
 */
function transformFactory(factory: FactoryLandingPage): Activity {
  const statusLabel = factory.published ? 'Published' : 'Draft';
  const commissionInfo = factory.baseCommissionRate ? `${factory.baseCommissionRate}% commission` : '';

  return {
    id: factory.id,
    type: 'factory',
    title: `Manufacturer: ${factory.title}`,
    time: formatRelativeTime(factory.createdAt || ''),
    date: formatDate(factory.createdAt || ''),
    createdAt: factory.createdAt || '',
    description: `${statusLabel}${commissionInfo ? ` • ${commissionInfo}` : ''}${factory.email ? ` • ${factory.email}` : ''}`,
    entity: factory.title,
    entityType: 'Manufacturer',
    tags: [],
    assignedTo: factory.createdBy || 'System',
    mentions: [],
    status: statusLabel,
    activityStatus: factory.published ? 'completed' : 'upcoming',
    link: `/warehouse/manufacturer-profiles?id=${factory.id}`,
    metadata: {
      title: factory.title,
      email: factory.email,
      phone: factory.phone,
      accountNumber: factory.accountNumber,
      baseCommissionRate: factory.baseCommissionRate,
      published: factory.published,
    },
  };
}

/**
 * Transform all API data to Activity array
 */
export function transformToActivities(data: ActivityFeedData): Activity[] {
  const activities: Activity[] = [];
  
  // Transform jobs
  data.jobs.forEach(job => {
    activities.push(transformJob(job));
  });
  
  // Transform companies
  data.companies.forEach(company => {
    activities.push(transformCompany(company));
  });
  
  // Transform contacts
  data.contacts.forEach(contact => {
    activities.push(transformContact(contact));
  });
  
  // Transform pre-opportunities
  data.preOpportunities.forEach(preOpp => {
    activities.push(transformPreOpportunity(preOpp));
  });
  
  // Transform notes
  data.notes.forEach(note => {
    activities.push(transformNote(note));
  });
  
  // Transform tasks
  data.tasks.forEach(task => {
    activities.push(transformTask(task));
  });

  // Transform customers
  data.customers.forEach(customer => {
    activities.push(transformCustomer(customer));
  });

  // Transform factories
  data.factories.forEach(factory => {
    activities.push(transformFactory(factory));
  });

  return activities;
}
