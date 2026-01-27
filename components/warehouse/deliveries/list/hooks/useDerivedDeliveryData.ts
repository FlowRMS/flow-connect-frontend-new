import { useMemo } from 'react';
import {
  mapDeliveryToShipment,
  mapIssueFromDelivery,
  mapRecurringShipment,
  type DeliveryApi,
} from '../../api';
import type {
  IncomingShipment,
  RecurringShipment,
  DeliveryIssue,
} from '@/lib/types/warehouse';

interface UseDerivedDeliveryDataProps {
  deliveriesData?: DeliveryApi[];
  recurringData?: any[];
  issuesDeliveriesData?: DeliveryApi[];
  warehousesData?: any[];
  carriersData?: any[];
  vendorsData?: any[];
}

export function useDerivedDeliveryData({
  deliveriesData,
  recurringData,
  issuesDeliveriesData,
  warehousesData,
  carriersData,
  vendorsData,
}: UseDerivedDeliveryDataProps) {
  // Lookups - Derived from query data
  const warehouseLookups = useMemo(() => {
    if (!warehousesData) return [];
    return warehousesData.map((warehouse) => ({
      id: warehouse.id,
      name: warehouse.name,
    }));
  }, [warehousesData]);

  const carrierLookups = useMemo(() => {
    if (!carriersData) return [];
    return carriersData.map((carrier) => ({
      id: carrier.id,
      name: carrier.name,
      trackingUrlTemplate: carrier.trackingUrlTemplate,
    }));
  }, [carriersData]);

  const factoryLookups = useMemo(() => {
    if (!vendorsData) return [];

    // Extract unique vendors
    const uniqueVendors = new Map();
    vendorsData.forEach((vendor) => {
      if (!uniqueVendors.has(vendor.id)) {
        uniqueVendors.set(vendor.id, {
          id: vendor.id,
          title: vendor.title,
          email: vendor.email,
        });
      }
    });

    // Also extract vendors from deliveries
    if (deliveriesData) {
      deliveriesData.forEach((delivery) => {
        if (delivery.vendor && !uniqueVendors.has(delivery.vendor.id)) {
          uniqueVendors.set(delivery.vendor.id, {
            id: delivery.vendor.id,
            title: delivery.vendor.title,
            email: delivery.vendor.email,
          });
        }
      });
    }

    return Array.from(uniqueVendors.values());
  }, [vendorsData, deliveriesData]);

  // Create lookup maps for mappers
  const warehouseMap = useMemo(() => {
    const map = new Map();
    warehousesData?.forEach((warehouse) => {
      map.set(warehouse.id, warehouse);
    });
    return map;
  }, [warehousesData]);

  const factoryMap = useMemo(() => {
    const map = new Map();
    factoryLookups.forEach((factory) => {
      map.set(factory.id, factory);
    });
    return map;
  }, [factoryLookups]);

  const carrierMap = useMemo(() => {
    const map = new Map();
    carriersData?.forEach((carrier) => {
      map.set(carrier.id, carrier);
    });
    return map;
  }, [carriersData]);

  // Shipments - Derived from deliveries query
  const shipments = useMemo<IncomingShipment[]>(() => {
    if (!deliveriesData) return [];

    return deliveriesData.map((delivery) =>
      mapDeliveryToShipment(delivery, warehouseMap, factoryMap, carrierMap)
    );
  }, [deliveriesData, warehouseMap, factoryMap, carrierMap]);

  // Recurring Shipments - Derived from recurring query
  const recurringShipments = useMemo<RecurringShipment[]>(() => {
    if (!recurringData) return [];

    return recurringData.map((recurring) =>
      mapRecurringShipment(recurring, warehouseMap, factoryMap)
    );
  }, [recurringData, warehouseMap, factoryMap]);

  // Delivery Issues - Derived from issues query
  const deliveryIssues = useMemo<DeliveryIssue[]>(() => {
    if (!issuesDeliveriesData) return [];

    const issues: DeliveryIssue[] = [];

    issuesDeliveriesData.forEach((delivery) => {
      if (delivery.issues && delivery.issues.length > 0) {
        delivery.issues.forEach((issue) => {
          issues.push(
            mapIssueFromDelivery(issue, delivery, warehouseMap, factoryMap)
          );
        });
      }
    });

    return issues;
  }, [issuesDeliveriesData, warehouseMap, factoryMap]);

  return {
    // Derived data
    shipments,
    recurringShipments,
    deliveryIssues,

    // Lookups
    warehouseLookups,
    carrierLookups,
    factoryLookups,

    // Maps (for external use if needed)
    warehouseMap,
    factoryMap,
    carrierMap,
  };
}
