// API Hooks
export {
  useTerritory,
  useTerritoriesByType,
  useTerritoryChildren,
  useTerritoryHierarchy,
  useAllTerritories,
  useCreateTerritory,
  useUpdateTerritory,
  useDeleteTerritory,
  useAssignTerritoryManager,
  useRemoveTerritoryManager,
  useTerritoryTree,
  territoryKeys,
  type TerritoryTreeNode,
} from './api/useTerritories';

// Components
export { TerritoryTree, TerritoryTreeHeader } from './components/TerritoryTree';
export { TerritoryTreeItem } from './components/TerritoryTreeItem';
export { TerritoryDetailPanel } from './components/TerritoryDetailPanel';
export { TerritoryBadge, TerritoryStatusBadge } from './components/TerritoryBadge';
export { TerritorySelect } from './components/TerritorySelect';

// Modals
export { TerritoryFormModal } from './modals/TerritoryFormModal';
export { DeleteTerritoryModal } from './modals/DeleteTerritoryModal';

// Re-export types from GraphQL module
export type {
  Territory,
  TerritoryLite,
  TerritoryType,
  TerritoryInput,
  TerritorySplitRate,
  TerritoryManager,
  SplitRateInput,
} from '../lib/graphql/territories';

export {
  getTerritoryTypeLabel,
  getTerritoryTypeColor,
  getChildTerritoryType,
  validateSplitRates,
  generateTerritoryCode,
} from '../lib/graphql/territories';
