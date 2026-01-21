import type { Warehouse, WarehouseLocationLevelConfig } from '@/lib/types/warehouse';

// Mock warehouse workers data
export interface WarehouseWorker {
  id: string;
  name: string;
  email: string;
  role: 'worker' | 'manager';
  avatar?: string;
}

// Billing address data structure for linked Address entity
export interface BillingAddressData {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  zipCode?: string;
  country: string;
}

// Contact data structure for linked Contact entity
export interface ContactData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role?: string;
  territory?: string;
  notes?: string;
}

// Shipping carrier interface with comprehensive warehouse fields
export interface ShippingCarrier {
  id: string;
  name: string;
  code?: string; // SCAC code or carrier abbreviation
  isActive: boolean;
  // Account & Billing
  accountNumber?: string;
  billingAddress?: string; // Formatted display string
  billingAddressId?: string; // ID of linked Address entity
  billingAddressData?: BillingAddressData; // Structured address data
  paymentTerms?: string;
  // API Integration
  apiKey?: string;
  apiEndpoint?: string;
  trackingUrlTemplate?: string; // e.g., https://www.fedex.com/track?trknbr={tracking_number}
  // Contact Information (linked Contact entity)
  primaryContactId?: string; // ID of linked Contact entity
  contactName?: string; // Formatted display name (firstName + lastName)
  contactPhone?: string;
  contactEmail?: string;
  contactId?: string; // Alias for primaryContactId (legacy)
  contactData?: ContactData; // Structured contact data
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

// Partial settings for tracking modifications - fields are optional
export interface PartialWarehouseSettingsState {
  locationLevels?: WarehouseLocationLevelConfig[];
  workers?: WarehouseWorkerAssignment[];
}

export interface WarehouseWithSettings extends Warehouse {
  settings: WarehouseSettingsState;
  // Address tracking - addressId is set when address exists in backend
  addressId?: string;
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
