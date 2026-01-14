import type { DeliveryApi } from '@/components/warehouse/api/warehouseDeliveriesApi';
import type { AssignedUserRole, ShipmentStatus } from '@/lib/types/warehouse';

export type WarehouseUser = {
  id: string;
  name: string;
  email: string;
  role: AssignedUserRole;
  warehouseIds: string[];
  isActive: boolean;
};

export type ConditionType = 'good' | 'damaged' | 'missing' | 'overage';

export interface BinAssignment {
  id: string;
  binId: string;
  quantity: number;
  isPrimary: boolean;
}

export interface LineItemReceive {
  id: string;
  productId: string;
  productName: string;
  partNumber: string;
  expectedQty: number;
  receivedQty: number;
  damagedQty: number;
  binId: string;
  primaryBinId: string;
  binAssignments: BinAssignment[];
  showAlternateLocations: boolean;
  condition: ConditionType;
  notes: string;
  lotNumber: string;
  expirationDate: string;
  verified: boolean;
  putAway: boolean;
  packingSlipId?: string;
}

export interface ScannedPackingSlip {
  id: string;
  name: string;
  scannedAt: string;
  imageUrl: string;
  lineItemIds: string[];
}

export interface PackingSlipLineItem {
  id: string;
  partNumber: string;
  description: string;
  quantity: number;
  matched: boolean;
  matchedLineItemId?: string;
}

export type DeliveryDiscrepancy = {
  id: string;
  lineItemId: string;
  type: 'shortage' | 'overage' | 'damage' | 'wrong_item' | 'other';
  quantity: number;
  description: string;
  customType?: string;
  photo?: string;
};

export type PackingSlipDiscrepancy = {
  field: string;
  expected: string;
  actual: string;
  resolved: boolean;
};

export const receivingSteps: ShipmentStatus[] = [
  'DRAFT',
  'PENDING',
  'ARRIVED',
  'RECEIVING',
  'RECEIVED',
];

export const stepInfo: Record<
  ShipmentStatus,
  { label: string; icon: string; description: string }
> = {
  DRAFT: { label: 'Draft', icon: 'edit', description: 'Not released yet' },
  PENDING: { label: 'Expected', icon: 'clock', description: 'Delivery expected' },
  CONFIRMED: { label: 'Expected', icon: 'clock', description: 'Delivery expected' },
  ARRIVED: { label: 'Arrived', icon: 'package', description: 'Delivery at dock' },
  RECEIVING: { label: 'Receiving', icon: 'clipboard', description: 'Validating & counting' },
  RECEIVED: { label: 'Received', icon: 'check', description: 'Put away complete' },
  CANCELLED: { label: 'Cancelled', icon: 'x', description: 'Cancelled' },
};

export type DeliveryCacheLookup = {
  warehouses?: Array<{ id: string; name: string }>;
  carriers?: Array<{ id: string; name: string; trackingUrlTemplate?: string | null }>;
  vendors?: Array<{ id: string; title: string; email?: string | null }>;
  recurring?: Array<{ id: string; name: string; vendorId: string; warehouseId: string; status: string }>;
};

export type DeliveryCacheRecord = {
  deliveries?: DeliveryApi[];
};
