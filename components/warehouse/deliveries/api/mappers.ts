import type {
  DeliveryIssue,
  DeliveryIssueItem,
  IncomingShipment,
  IncomingShipmentIssue,
  RecurringShipment,
  ShipmentLineItem,
  ExpectedItem,
} from '@/lib/types/warehouse';
import type {
  DeliveryApi,
  DeliveryItemApi,
  DeliveryIssueApi,
  RecurringShipmentApi,
  WarehouseLookup,
  FactoryLookup,
  ShippingCarrierLookup,
} from './types';

export function mapDeliveryToShipment(
  delivery: DeliveryApi,
  warehouseMap: Map<string, WarehouseLookup>,
  factoryMap: Map<string, FactoryLookup>,
  carrierMap: Map<string, ShippingCarrierLookup>
): IncomingShipment {
  const warehouse = warehouseMap.get(delivery.warehouseId);
  const vendor = delivery.vendor || factoryMap.get(delivery.vendorId);
  const carrier = delivery.carrier || (delivery.carrierId ? carrierMap.get(delivery.carrierId) : undefined);
  const assignees = delivery.assignees || [];
  const documents = delivery.documents || [];
  const issues: IncomingShipmentIssue[] = (delivery.issues || []).map((issue) => ({
    id: issue.id,
    deliveryItemId: issue.deliveryItemId,
    issueType: issue.issueType as IncomingShipmentIssue['issueType'],
    customIssueType: issue.customIssueType || undefined,
    qty: issue.quantity,
    description: issue.description || undefined,
  }));

  const getProductName = (item: DeliveryItemApi) => {
    if (item.product?.description) return item.product.description;
    if (item.product?.factoryPartNumber) return item.product.factoryPartNumber;
    return item.productId;
  };

  const getPartNumber = (item: DeliveryItemApi) => {
    return item.product?.factoryPartNumber || item.productId;
  };

  const items: ShipmentLineItem[] = delivery.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: getProductName(item),
    partNumber: getPartNumber(item),
    expectedQuantity: item.expectedQuantity,
    receivedQuantity: item.receivedQuantity,
    damagedQuantity: item.damagedQuantity,
  }));

  const expectedItems: ExpectedItem[] = delivery.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: getProductName(item),
    partNumber: getPartNumber(item),
    expectedQuantity: item.expectedQuantity,
    receivedQuantity: item.receivedQuantity,
    discrepancyNotes: item.discrepancyNotes || undefined,
    status: item.status.toLowerCase() as ExpectedItem['status'],
  }));

  return {
    id: delivery.id,
    poNumber: delivery.poNumber,
    vendorId: delivery.vendorId,
    vendorName: vendor?.title || delivery.vendorId,
    vendorContact: delivery.vendorContactName || undefined,
    vendorEmail: delivery.vendorContactEmail || vendor?.email || undefined,
    warehouseId: delivery.warehouseId,
    warehouseName: warehouse?.name || delivery.warehouseId,
    eta: delivery.expectedDate || delivery.createdAt,
    status: delivery.status as IncomingShipment['status'],
    expectedItems,
    items,
    itemCount: items.length,
    expectedQuantity: items.reduce((sum, item) => {
      const qty = Number(item.expectedQuantity);
      return sum + (Number.isFinite(qty) ? qty : 0);
    }, 0),
    trackingNumber: delivery.trackingNumber || undefined,
    carrier: carrier?.name || undefined,
    carrierId: delivery.carrierId || undefined,
    expectedDate: delivery.expectedDate || undefined,
    arrivedAt: delivery.arrivedAt || undefined,
    receivingStartedAt: delivery.receivingStartedAt || undefined,
    receivedAt: delivery.receivedAt || undefined,
    notes: delivery.notes || undefined,
    recurringShipmentId: delivery.recurringShipmentId || undefined,
    assignedManagers: assignees
      .filter((assignee) => {
        if (typeof assignee.role === 'number') return assignee.role === 2;
        if (assignee.role === '2') return true;
        return assignee.role === 'MANAGER';
      })
      .map((assignee) => ({
        id: assignee.id,
        userId: assignee.userId,
        userName: assignee.userId,
        role: 'manager',
        assignedAt: delivery.createdAt,
      })),
    assignedWorkers: assignees
      .filter((assignee) => {
        if (typeof assignee.role === 'number') return assignee.role === 1;
        if (assignee.role === '1') return true;
        return assignee.role === 'WORKER';
      })
      .map((assignee) => ({
        id: assignee.id,
        userId: assignee.userId,
        userName: assignee.userId,
        role: 'worker',
        assignedAt: delivery.createdAt,
      })),
    documents: documents.map((doc) => ({
      id: doc.id,
      name: doc.name,
      type: doc.docType as string,
      fileId: doc.fileId,
      fileUrl: doc.fileUrl,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize || undefined,
      uploadedAt: doc.uploadedAt,
      uploadedBy: doc.uploadedById || '',
      notes: doc.notes || undefined,
    })),
    issues,
    createdAt: delivery.createdAt,
    updatedAt: delivery.updatedAt || delivery.createdAt,
  };
}

export function mapRecurringShipment(
  recurring: RecurringShipmentApi,
  warehouseMap: Map<string, WarehouseLookup>,
  factoryMap: Map<string, FactoryLookup>
): RecurringShipment {
  const warehouse = warehouseMap.get(recurring.warehouseId);
  const vendor = factoryMap.get(recurring.vendorId);
  const rawPattern = recurring.recurrencePattern;
  const parsedPattern =
    typeof rawPattern === 'string'
      ? (() => {
          try {
            return JSON.parse(rawPattern) as Record<string, unknown>;
          } catch {
            return {} as Record<string, unknown>;
          }
        })()
      : rawPattern;
  const pattern = parsedPattern as RecurringShipment['recurrencePattern'];
  const expectedItems = (pattern?.expectedItems || (parsedPattern as Record<string, unknown>)?.expected_items || []) as ExpectedItem[];

  return {
    id: recurring.id,
    name: recurring.name,
    vendorId: recurring.vendorId,
    vendorName: vendor?.title || recurring.vendorId,
    vendorContact: recurring.vendorContactName || undefined,
    vendorEmail: recurring.vendorContactEmail || vendor?.email || undefined,
    warehouseId: recurring.warehouseId,
    warehouseName: warehouse?.name || recurring.warehouseId,
    carrier: recurring.carrier || undefined,
    expectedItems,
    notes: recurring.notes || undefined,
    recurrencePattern: pattern,
    startDate: recurring.startDate,
    endDate: recurring.endDate || undefined,
    status: recurring.status as RecurringShipment['status'],
    lastGeneratedDate: recurring.lastGeneratedDate || undefined,
    nextExpectedDate: recurring.nextExpectedDate || undefined,
    generatedShipmentIds: [],
    createdAt: recurring.createdAt,
    updatedAt: recurring.updatedAt || recurring.createdAt,
    createdBy: recurring.createdById || undefined,
  };
}

export function mapIssueFromDelivery(
  issue: DeliveryIssueApi,
  delivery: DeliveryApi,
  warehouseMap: Map<string, WarehouseLookup>,
  factoryMap: Map<string, FactoryLookup>
): DeliveryIssue {
  const warehouse = warehouseMap.get(delivery.warehouseId);
  const vendor = delivery.vendor || factoryMap.get(delivery.vendorId);
  const deliveryItem = delivery.items.find((item) => item.id === issue.deliveryItemId);

  const issueItem: DeliveryIssueItem = {
    id: issue.deliveryItemId,
    productId: deliveryItem?.productId || '',
    productName:
      deliveryItem?.product?.description ||
      deliveryItem?.product?.factoryPartNumber ||
      deliveryItem?.productId ||
      '',
    partNumber:
      deliveryItem?.product?.factoryPartNumber ||
      deliveryItem?.productId ||
      '',
    issueType: issue.issueType as DeliveryIssueItem['issueType'],
    customIssueType: issue.customIssueType || undefined,
    quantity: issue.quantity,
    description: issue.description || undefined,
    notes: issue.notes || undefined,
  };

  return {
    id: issue.id,
    issueNumber: `DI-${issue.id.slice(0, 8).toUpperCase()}`,
    shipmentId: delivery.id,
    poNumber: delivery.poNumber,
    vendorId: delivery.vendorId,
    vendorName: vendor?.title || delivery.vendorId,
    vendorEmail: delivery.vendorContactEmail || vendor?.email || undefined,
    vendorContact: delivery.vendorContactName || undefined,
    warehouseId: delivery.warehouseId,
    warehouseName: warehouse?.name || delivery.warehouseId,
    status: issue.status as DeliveryIssue['status'],
    items: [issueItem],
    totalAffectedQuantity: issue.quantity,
    communicatedAt: issue.communicatedAt || undefined,
    communicatedBy: undefined,
    communicationMethod: undefined,
    communicationNotes: undefined,
    resolvedAt: undefined,
    resolvedBy: undefined,
    resolutionType: undefined,
    resolutionNotes: undefined,
    creditAmount: undefined,
    replacementShipmentId: undefined,
    notes: issue.notes || undefined,
    reportedAt: issue.createdAt,
    reportedBy: issue.createdById || '',
    createdAt: issue.createdAt,
    updatedAt: issue.createdAt,
    activities: [],
  };
}