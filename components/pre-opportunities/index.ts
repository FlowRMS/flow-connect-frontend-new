/**
 * Pre-Opportunities Module
 * Barrel export for the pre-opportunities feature
 */

// Components
export { ViewModeToggle, LoadingState, ErrorState } from './components';
export {
  BoardIcon,
  ListIcon,
  PlusCircleIcon,
  PlusIcon,
  CloseIcon,
  DragIndicator,
} from './components';

// Views
export { KanbanView } from './views/KanbanView';
export { ListView } from './views/ListView';

// Modals
export { CreatePreOpportunityModal } from './modals/CreatePreOpportunityModal';

// Hooks
export { usePreOppsState } from './hooks/usePreOppsState';

// Config
export { getPreOppFilterOptions, getPreOppSortOptions } from './config/filterConfig';

// Types
export type {
  PreOpportunity,
  PreOpportunityLandingPage,
  PreOpportunityStatus,
  PreOppStage,
  ViewMode,
  CreatePreOpportunityInput,
  UpdatePreOpportunityInput,
} from './types';

// Constants
export { STATUS_CONFIG, DEFAULT_STAGES, STAGE_COLORS, FILTER_COLUMN_MAP } from './constants';

// Utils
export {
  formatCurrency,
  formatDate,
  getStatusLabel,
  getStageColor,
  getPreOppsByStatus,
  sortPreOpps,
  getUniqueValues,
  normalizeStatus,
  normalizePreOpportunityStatus,
  normalizePreOpportunitiesStatus,
} from './utils';
