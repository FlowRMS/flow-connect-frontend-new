export type WarehouseLookup = {
  id: string;
  name: string;
  status?: string | null;
  isActive?: boolean | null;
  city?: string | null;
  state?: string | null;
  addressLine1?: string | null;
};

export type ShippingCarrierLookup = {
  id: string;
  name: string;
  trackingUrlTemplate?: string | null;
  code?: string | null;
  isActive?: boolean | null;
};

export type FactoryLookup = {
  id: string;
  title: string;
  email?: string | null;
};

export type DeliveryItemApi = {
  id: string;
  productId: string;
  product?: {
    id: string;
    factoryPartNumber: string;
    description?: string | null;
    unitPrice?: string | null;
  } | null;
  expectedQuantity: number;
  receivedQuantity: number;
  damagedQuantity: number;
  status: string;
  discrepancyNotes?: string | null;
};

export type DeliveryIssueApi = {
  id: string;
  deliveryId: string;
  deliveryItemId: string;
  receiptId?: string | null;
  issueType: string;
  customIssueType?: string | null;
  quantity: number;
  status: string;
  description?: string | null;
  notes?: string | null;
  communicatedAt?: string | null;
  createdAt: string;
  createdById?: string | null;
};

export type DeliveryAssigneeApi = {
  id: string;
  userId: string;
  role: string;
};

export type DeliveryDocumentApi = {
  id: string;
  name: string;
  docType: string;
  fileId: string;
  fileUrl: string;
  mimeType: string;
  fileSize?: number | null;
  uploadedById?: string | null;
  uploadedAt: string;
  notes?: string | null;
};

export type WarehouseLocationApi = {
  id: string;
  warehouseId: string;
  parentId?: string | null;
  level: string;
  name: string;
  code?: string | null;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type DeliveryApi = {
  id: string;
  poNumber: string;
  warehouseId: string;
  vendorId: string;
  vendor?: FactoryLookup | null;
  carrierId?: string | null;
  carrier?: ShippingCarrierLookup | null;
  trackingNumber?: string | null;
  status: string;
  expectedDate?: string | null;
  arrivedAt?: string | null;
  receivingStartedAt?: string | null;
  receivedAt?: string | null;
  originAddressId?: string | null;
  destinationAddressId?: string | null;
  recurringShipmentId?: string | null;
  vendorContactName?: string | null;
  vendorContactEmail?: string | null;
  notes?: string | null;
  createdAt: string;
  createdById?: string | null;
  updatedById?: string | null;
  updatedAt?: string | null;
  items: DeliveryItemApi[];
  issues?: DeliveryIssueApi[];
  documents?: DeliveryDocumentApi[];
  assignees?: DeliveryAssigneeApi[];
};

export type RecurringShipmentApi = {
  id: string;
  name: string;
  vendorId: string;
  vendorContactName?: string | null;
  vendorContactEmail?: string | null;
  warehouseId: string;
  carrier?: string | null;
  notes?: string | null;
  recurrencePattern: Record<string, unknown>;
  startDate: string;
  endDate?: string | null;
  status: string;
  lastGeneratedDate?: string | null;
  nextExpectedDate?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  createdById?: string | null;
  updatedById?: string | null;
};

export type WarehouseMemberApi = {
  id: string;
  warehouseId: string;
  userId: string;
  role: string | number;
  createdAt: string;
};