/**
 * Tabs Configuration
 * Configuration for all tabs in order detail
 */

import type { TabType, TabConfig } from '../types';

/**
 * Get all available tabs
 * Count is dynamically calculated based on data
 */
export const getTabsConfig = (lineItemsCount: number = 0): TabConfig[] => {
  return [
    {
      id: 'line-items',
      label: 'Line Items',
      count: lineItemsCount,
    },
    {
      id: 'credits',
      label: 'Credits',
    },
    {
      id: 'acknowledgements',
      label: 'Acknowledgements',
    },
    {
      id: 'notes',
      label: 'Notes',
    },
    {
      id: 'tasks',
      label: 'Tasks',
    },
    {
      id: 'activity',
      label: 'Activity',
      comingSoon: true,
    },
    {
      id: 'linked-objects',
      label: 'Linked Objects',
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
