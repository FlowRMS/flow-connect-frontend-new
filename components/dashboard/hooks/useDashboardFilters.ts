/**
 * Dashboard Custom Hooks
 */

import { useState } from 'react';
import type { ActivityType, ActivityStatus } from '../types';
import { ALL_ACTIVITY_TYPES } from '../constants';

export function useDashboardFilters() {
  const [activeFilters, setActiveFilters] = useState<ActivityType[]>([]);
  const [statusFilters, setStatusFilters] = useState<ActivityStatus[]>([]);

  const toggleFilter = (filter: ActivityType) => {
    setActiveFilters(prev =>
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  };

  const toggleStatusFilter = (status: ActivityStatus) => {
    setStatusFilters(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const selectAll = () => {
    setActiveFilters([...ALL_ACTIVITY_TYPES]);
  };

  const clearAll = () => {
    setActiveFilters([]);
  };

  return {
    activeFilters,
    statusFilters,
    toggleFilter,
    toggleStatusFilter,
    selectAll,
    clearAll,
  };
}
