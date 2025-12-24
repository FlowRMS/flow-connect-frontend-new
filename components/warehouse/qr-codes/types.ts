// Type definitions for QR Codes Modal

import { WarehouseLocationLevelConfig } from '@/lib/types/warehouse';

export interface LocationWithPath {
  id: string;
  name: string;
  type: string;
  path: string;
  fullPath: string[];
}

export type PrintFormat = 'sheet-small' | 'sheet-medium' | 'sheet-large' | 'labels-30' | 'labels-80';

export interface PrintFormatConfig {
  id: PrintFormat;
  name: string;
  description: string;
  perPage: number;
}

export interface WarehouseQRCodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseId: string;
  warehouseName: string;
  locationLevels: WarehouseLocationLevelConfig[];
}
