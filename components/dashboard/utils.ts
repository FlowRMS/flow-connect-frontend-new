/**
 * Dashboard Utility Functions
 */

import { AVATAR_COLORS } from './constants';
import type { Activity, ActivityType, ActivityStatus } from './types';

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('');
}

/**
 * Get avatar color based on name
 */
export function getAvatarColor(name: string): string {
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
 * Sort activities by date (newest first)
 */
export function sortActivitiesByDate(activities: Activity[]): Activity[] {
  return [...activities].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
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
 * Capitalize first letter of a string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
