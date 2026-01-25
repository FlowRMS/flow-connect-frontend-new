import type { WarehouseLocationLevel, WarehouseLocation } from '../types';

/**
 * Naming convention types
 */
export type NamingType = 'letters' | 'numbers' | 'custom';

/**
 * Naming configuration for a single level
 */
export interface LevelNaming {
  prefix: string;
  type: NamingType;
  continueAfterMax: boolean;
  customValues?: string[];
}

/**
 * Overall naming configuration
 */
export interface NamingConfig {
  levels: Partial<Record<WarehouseLocationLevel, LevelNaming>>;
  includeParentName: boolean;
}

/**
 * Structure configuration (counts per level)
 */
export interface StructureConfig {
  counts: Partial<Record<WarehouseLocationLevel, number>>;
}

/**
 * Wizard step type
 */
export type WizardStep = 'structure' | 'naming' | 'preview';

/**
 * Props for the main wizard
 */
export interface TemplateWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (locations: WarehouseLocation[]) => void;
  enabledLevels: WarehouseLocationLevel[];
}

/**
 * Props for the structure step
 */
export interface TemplateStructureStepProps {
  enabledLevels: WarehouseLocationLevel[];
  config: StructureConfig;
  onChange: (config: StructureConfig) => void;
}

/**
 * Props for the naming step
 */
export interface TemplateNamingStepProps {
  enabledLevels: WarehouseLocationLevel[];
  config: NamingConfig;
  onChange: (config: NamingConfig) => void;
}

/**
 * Props for the preview step
 */
export interface TemplatePreviewStepProps {
  locations: WarehouseLocation[];
  enabledLevels: WarehouseLocationLevel[];
}
