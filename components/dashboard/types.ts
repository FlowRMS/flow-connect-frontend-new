/**
 * Dashboard Types and Interfaces
 */

export type ActivityType = 'call' | 'email' | 'note' | 'meeting' | 'task' | 'job' | 'pre-opportunity' | 'contact';
export type ActivityStatus = 'upcoming' | 'completed';

export interface Activity {
  type: ActivityType;
  title: string;
  time: string;
  date: string;
  description: string;
  entity: string;
  entityType: string;
  tags: string[];
  assignedTo: string;
  mentions: string[];
  likes: number;
  comments: number;
  activityStatus: ActivityStatus;
  link: string;
}

export interface ActivityFilters {
  types: ActivityType[];
  statuses: ActivityStatus[];
}
