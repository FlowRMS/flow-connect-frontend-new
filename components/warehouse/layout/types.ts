// Warehouse Layout Types

import { WarehouseLocationLevelConfig, WarehouseLocationLevel } from '@/lib/types/warehouse';

/**
 * Warehouse location node in the hierarchical tree
 */
export interface WarehouseLocation {
  id: string;
  name: string;
  type: 'section' | 'aisle' | 'shelf' | 'bay' | 'row' | 'bin';
  parentId?: string;
  children?: WarehouseLocation[];
  // Visual canvas properties (optional)
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  description?: string;
  isActive: boolean;
  products?: ProductAssignment[];
}

/**
 * Visual element for canvas rendering
 */
export interface VisualElement {
  id: string;
  locationId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  type: 'section' | 'aisle' | 'shelf' | 'bay' | 'row' | 'bin';
  name: string;
  parentId?: string;
  children?: VisualElement[];
}

/**
 * Product assignment to a bin location
 */
export interface ProductAssignment {
  id: string;
  productId: string;
  productName: string;
  partNumber: string;
  quantity: number;
}

/**
 * Available product for assignment
 */
export interface AvailableProduct {
  id: string;
  name: string;
  partNumber: string;
  factoryName?: string;
}

/**
 * View mode for the layout modal
 */
export type ViewMode = 'tree' | 'visual';

/**
 * Warehouse dimensions in feet
 */
export interface WarehouseDimensions {
  width: number;
  height: number;
}

/**
 * Canvas viewport state
 */
export interface CanvasViewport {
  zoom: number;
  panOffset: { x: number; y: number };
}

/**
 * Main modal props interface
 */
export interface WarehouseLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationLevels: WarehouseLocationLevelConfig[];
  onSave: (levels: WarehouseLocationLevelConfig[]) => void;
  warehouseName: string;
  warehouseId?: string;
}

/**
 * Re-export from warehouse types
 */
export type { WarehouseLocationLevelConfig, WarehouseLocationLevel };
