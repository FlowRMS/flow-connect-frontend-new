/**
 * Tabs Configuration
 * Configuration for all tabs in check detail
 */

import type { TabType, TabConfig } from '../types';

/**
 * Get all available tabs
 * Count is dynamically calculated based on data
 * isCreateMode disables certain tabs that require the check to exist first
 */
export const getTabsConfig = (
  lineItemsCount: number = 0,
  deductionsCount: number = 0,
  isCreateMode: boolean = false
): TabConfig[] => {
  return [
    {
      id: 'line-items',
      label: 'Line Items',
      count: lineItemsCount,
    },
    {
      id: 'files',
      label: 'Files',
      disabled: isCreateMode,
      disabledReason: 'Save check first',
    },
    {
      id: 'deductions',
      label: 'Adjustments',
      count: deductionsCount > 0 ? deductionsCount : undefined,
      disabled: isCreateMode,
      disabledReason: 'Save check first',
    },
    {
      id: 'notes',
      label: 'Notes',
      disabled: isCreateMode,
      disabledReason: 'Save check first',
    },
    {
      id: 'tasks',
      label: 'Tasks',
      disabled: isCreateMode,
      disabledReason: 'Save check first',
    },
    {
      id: 'activity',
      label: 'Activity',
      comingSoon: true,
      disabled: isCreateMode,
      disabledReason: 'Save check first',
    },
    {
      id: 'linked-objects',
      label: 'Linked Objects',
      disabled: isCreateMode,
      disabledReason: 'Save check first',
    },
    {
      id: 'settings',
      label: 'Settings',
    },
  ];
};

/**
 * Default active tab
 */
export const DEFAULT_ACTIVE_TAB: TabType = 'line-items';

