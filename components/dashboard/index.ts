/**
 * Dashboard Module Exports
 * Centralized exports for the dashboard module
 */

// Main component
export { default } from './DashboardContent';
export { default as DashboardContent } from './DashboardContent';

// Types
export type { Activity, ActivityType, ActivityStatus, ActivityFilters } from './types';

// Utils
export { getInitials, getAvatarColor, filterActivities, sortActivitiesByDate, getStatusBadgeClass, capitalize } from './utils';

// Constants
export { AVATAR_COLORS, ACTIVITY_TYPE_LABELS, ALL_ACTIVITY_TYPES } from './constants';

// Hooks
export { useDashboardFilters } from './hooks/useDashboardFilters';

// Components
export { ActivityCard } from './components/ActivityCard';
export { ActivityFilterButtons } from './components/ActivityFilterButtons';
export { StatusFilterButtons } from './components/StatusFilterButtons';
export { DashboardActionButtons } from './components/DashboardActionButtons';

// Config
export { getActivityFilterOptions, getActivitySortOptions } from './config/filterConfig';

// Mock Data
export { mockActivities } from './mockData';
