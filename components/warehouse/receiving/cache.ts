import type { DeliveryApi } from '@/components/warehouse/api/warehouseDeliveriesApi';
import type { RecurringShipment } from '@/lib/types/warehouse';
import type { DeliveryCacheLookup, DeliveryCacheRecord } from './types';

export const readCachedDelivery = (shipmentId: string): DeliveryApi | null => {
  try {
    const raw = sessionStorage.getItem('warehouseDeliveriesCache');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DeliveryCacheRecord;
    return parsed.deliveries?.find((delivery) => delivery.id === shipmentId) || null;
  } catch {
    return null;
  }
};

export const readCachedLookups = (): DeliveryCacheLookup => {
  try {
    const warehousesRaw = sessionStorage.getItem('warehouseLookupCache');
    const carriersRaw = sessionStorage.getItem('warehouseCarriersCache');
    const vendorsRaw = sessionStorage.getItem('warehouseVendorsCache');
    const recurringRaw = sessionStorage.getItem('warehouseRecurringCache');
    const deliveriesRaw = sessionStorage.getItem('warehouseDeliveriesCache');
    const warehouses = warehousesRaw
      ? (JSON.parse(warehousesRaw).warehouses as Array<{ id: string; name: string }> | undefined)
      : undefined;
    const carriers = carriersRaw
      ? (JSON.parse(carriersRaw).carriers as Array<{ id: string; name: string; trackingUrlTemplate?: string | null }> | undefined)
      : undefined;
    const deliveries = deliveriesRaw
      ? (JSON.parse(deliveriesRaw).deliveries as DeliveryApi[] | undefined)
      : undefined;
    const cachedVendors = vendorsRaw
      ? (JSON.parse(vendorsRaw).vendors as Array<{ id: string; title: string; email?: string | null }> | undefined)
      : undefined;
    const vendors = cachedVendors || (deliveries ? deliveries.map((delivery) => delivery.vendor).filter(Boolean) : undefined);
    const recurring = recurringRaw
      ? (JSON.parse(recurringRaw).recurring as Array<{ id: string; name: string; vendorId: string; warehouseId: string; status: string }> | undefined)
      : undefined;
    return { warehouses, carriers, vendors, recurring };
  } catch {
    return { warehouses: undefined, carriers: undefined, vendors: undefined, recurring: undefined };
  }
};

export const readCachedDeliveryDetail = (shipmentId: string): DeliveryApi | null => {
  try {
    const raw = sessionStorage.getItem('warehouseDeliveryDetailCache');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { deliveries?: Record<string, DeliveryApi> };
    return parsed.deliveries?.[shipmentId] || null;
  } catch {
    return null;
  }
};

export const writeCachedDeliveryDetail = (delivery: DeliveryApi) => {
  try {
    const raw = sessionStorage.getItem('warehouseDeliveryDetailCache');
    const parsed = raw ? (JSON.parse(raw) as { deliveries?: Record<string, DeliveryApi> }) : {};
    const deliveries = parsed.deliveries || {};
    deliveries[delivery.id] = delivery;
    sessionStorage.setItem('warehouseDeliveryDetailCache', JSON.stringify({ deliveries }));
  } catch {
    // Ignore cache write failures (private mode / quota).
  }
};

export const updateCachedDeliveriesList = (delivery: DeliveryApi) => {
  try {
    const raw = sessionStorage.getItem('warehouseDeliveriesCache');
    if (!raw) return;
    const parsed = JSON.parse(raw) as { warehouseId?: string; deliveries?: DeliveryApi[] };
    if (!Array.isArray(parsed.deliveries)) return;
    const deliveries = parsed.deliveries.map((item) => (item.id === delivery.id ? delivery : item));
    sessionStorage.setItem('warehouseDeliveriesCache', JSON.stringify({ ...parsed, deliveries }));
  } catch {
    // Ignore cache update failures.
  }
};

export const invalidateDeliveryCaches = () => {
  try {
    sessionStorage.removeItem('warehouseDeliveriesCache');
    sessionStorage.removeItem('warehouseDeliveryDetailCache');
    sessionStorage.removeItem('warehouseDeliveryIssuesCache');
  } catch {
    // Ignore cache clear failures.
  }
};

export const invalidateRecurringCache = () => {
  try {
    sessionStorage.removeItem('warehouseRecurringCache');
  } catch {
    // Ignore cache clear failures.
  }
};

export const patchRecurringCache = (
  patch: Partial<RecurringShipment> & { id: string },
  warehouseId?: string | null
) => {
  try {
    const raw = sessionStorage.getItem('warehouseRecurringCache');
    if (!raw) return;
    const parsed = JSON.parse(raw) as { warehouseId?: string | null; recurring?: RecurringShipment[] };
    if (warehouseId && parsed.warehouseId && parsed.warehouseId !== warehouseId) return;
    if (!Array.isArray(parsed.recurring)) return;
    const recurring = parsed.recurring.map((item) => (item.id === patch.id ? { ...item, ...patch } : item));
    sessionStorage.setItem('warehouseRecurringCache', JSON.stringify({ ...parsed, recurring }));
  } catch {
    // Ignore cache update failures.
  }
};

export const patchDeliveryCaches = (patch: Partial<DeliveryApi> & { id: string }) => {
  const cachedDetail = readCachedDeliveryDetail(patch.id);
  if (cachedDetail) {
    writeCachedDeliveryDetail({ ...cachedDetail, ...patch });
  }

  const cachedList = readCachedDelivery(patch.id);
  if (cachedList) {
    updateCachedDeliveriesList({ ...cachedList, ...patch });
  }
};
