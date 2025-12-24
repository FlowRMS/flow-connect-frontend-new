/**
 * Campaigns Module Exports
 */

// Types
export * from './types';

// Constants
export * from './constants';

// Mock Data (only rules - campaigns use real API)
export { rules } from './mockData';

// Utils
export * from './utils';

// Hooks
export { useCampaignState } from './hooks/useCampaignState';
export { useRuleState } from './hooks/useRuleState';

// Components
export { default as ConditionBuilder } from './components/ConditionBuilder';

// Modals
export { default as AIModal } from './modals/AIModal';

// Views
export { default as CampaignsListView } from './views/CampaignsListView';
export { default as RulesListView } from './views/RulesListView';
