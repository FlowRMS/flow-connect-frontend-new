import type { Warehouse, WarehouseLocationLevelConfig } from '@/lib/types/warehouse';

// Mock warehouse workers data
export interface WarehouseWorker {
  id: string;
  name: string;
  email: string;
  role: 'worker' | 'manager';
  avatar?: string;
}

// Shipping carrier interface with comprehensive warehouse fields
export interface ShippingCarrier {
  id: string;
  name: string;
  code?: string; // SCAC code or carrier abbreviation
  isActive: boolean;
  // Account & Billing
  accountNumber?: string;
  billingAddress?: string;
  paymentTerms?: string;
  // API Integration
  apiKey?: string;
  apiEndpoint?: string;
  trackingUrlTemplate?: string; // e.g., https://www.fedex.com/track?trknbr={tracking_number}
  // Contact Information
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  // Service Configuration
  serviceTypes?: string[]; // e.g., ['Ground', 'Express', '2-Day', 'Overnight']
  defaultServiceType?: string;
  // Shipping Settings
  maxWeight?: number; // in lbs
  maxDimensions?: string; // e.g., "108x108x108"
  residentialSurcharge?: number;
  fuelSurchargePercent?: number;
  // Pickup Settings
  pickupSchedule?: string; // e.g., "Daily at 3:00 PM"
  pickupLocation?: string;
  // Notes
  remarks?: string;
  internalNotes?: string;
}

export interface WarehouseWorkerAssignment {
  workerId: string;
  role: 'worker' | 'manager';
}

export interface WarehouseSettingsState {
  locationLevels: WarehouseLocationLevelConfig[];
  workers: WarehouseWorkerAssignment[];
}

export interface WarehouseWithSettings extends Warehouse {
  settings: WarehouseSettingsState;
}

// Container type interface
export interface ContainerType {
  id: string;
  name: string;
  length: number; // in inches
  width: number; // in inches
  height: number; // in inches
  weight: number; // tare weight in lbs
  order: number; // order in dropdown
}

export type SettingsTab = 'warehouses' | 'shipping-carriers' | 'containers' | 'manufacturer-profiles';
