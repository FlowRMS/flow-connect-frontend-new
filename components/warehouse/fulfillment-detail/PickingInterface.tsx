'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { FulfillmentOrder, InventoryLocation, FulfillmentOrderLineItem } from '@/lib/types/warehouse';
import { getProductLocations, calculatePickingAllocation } from '@/lib/data/warehouse-mock';
import {
  Inventory,
  calculatePickingAllocationFromInventory,
  PickingAllocation,
} from '../api/inventoryApi';

interface LocationPickState {
  locationId: string;
  locationName: string;
  locationType: string;
  expectedQty: number;
  pickedQty: number;
  isFinalized: boolean;
}

interface LineItemPickState {
  lineItemId: string;
  locations: LocationPickState[];
  totalExpected: number;
  totalPicked: number;
  isShort: boolean;
  shortageNotes: string;
}

export interface InventoryDiscrepancy {
  lineItemId: string;
  productId: string;
  productName: string;
  partNumber: string;
  locationId: string;
  locationName: string;
  locationType: string;
  expectedQty: number;
  actualQty: number;
  shortage: number;
}

interface PickingInterfaceProps {
  fulfillmentOrder: FulfillmentOrder;
  pickedItems: Record<string, number>;
  pickingNotes: Record<string, string>;
  expandedNoteId: string | null;
  onMarkAsPicked: (lineItemId: string, qty: number) => void;
  onPickAll: (lineItemId: string, allocatedQty: number) => void;
  onUpdateNote: (lineItemId: string, note: string) => void;
  onExpandNote: (lineItemId: string | null) => void;
  onCompletePicking: () => void;
  onReportInventoryDiscrepancy?: (discrepancy: InventoryDiscrepancy) => void;
  /** Real inventory data from API - when provided, uses real data instead of mocks */
  inventoryData?: Map<string, Inventory>;
}

// Helper function to get allocations - uses real inventory if available, falls back to mock
function getAllocationsForLineItem(
  lineItem: FulfillmentOrderLineItem,
  inventoryData?: Map<string, Inventory>
): { locationId: string; locationName: string; locationType: string; quantity: number }[] {
  // If real inventory data is available, use it
  if (inventoryData) {
    const inventory = inventoryData.get(lineItem.productId);
    if (inventory) {
      const allocations = calculatePickingAllocationFromInventory(inventory, lineItem.allocatedQty);
      return allocations.map((alloc) => ({
        locationId: alloc.locationId,
        locationName: alloc.locationName,
        locationType: alloc.locationType,
        quantity: alloc.quantity,
      }));
    }
    // Product not in inventory - return empty (will show as shortage)
    return [];
  }

  // Fall back to mock data
  return calculatePickingAllocation(lineItem.productId, lineItem.allocatedQty);
}

export default function PickingInterface({
  fulfillmentOrder,
  pickedItems,
  pickingNotes,
  expandedNoteId,
  onMarkAsPicked,
  onPickAll,
  onUpdateNote,
  onExpandNote,
  onCompletePicking,
  onReportInventoryDiscrepancy,
  inventoryData,
}: PickingInterfaceProps) {
  // Track picked quantities per location per line item
  const [locationPicks, setLocationPicks] = useState<Record<string, LineItemPickState>>(() => {
    const initial: Record<string, LineItemPickState> = {};
    fulfillmentOrder.lineItems.forEach(li => {
      const allocations = getAllocationsForLineItem(li, inventoryData);
      initial[li.id] = {
        lineItemId: li.id,
        locations: allocations.map(loc => ({
          locationId: loc.locationId,
          locationName: loc.locationName,
          locationType: loc.locationType,
          expectedQty: loc.quantity,
          pickedQty: 0,
          isFinalized: false,
        })),
        totalExpected: li.allocatedQty,
        totalPicked: 0,
        isShort: false,
        shortageNotes: '',
      };
    });
    return initial;
  });

  // Update locations when inventory data becomes available (it loads async)
  useEffect(() => {
    if (!inventoryData) return;

    // Reinitialize locations with real inventory data
    setLocationPicks(prev => {
      const updated: Record<string, LineItemPickState> = {};
      fulfillmentOrder.lineItems.forEach(li => {
        const existingState = prev[li.id];
        const allocations = getAllocationsForLineItem(li, inventoryData);

        // Only update if we have new allocations and current state has no locations
        if (allocations.length > 0 && (!existingState || existingState.locations.length === 0)) {
          updated[li.id] = {
            lineItemId: li.id,
            locations: allocations.map(loc => ({
              locationId: loc.locationId,
              locationName: loc.locationName,
              locationType: loc.locationType,
              expectedQty: loc.quantity,
              pickedQty: 0,
              isFinalized: false,
            })),
            totalExpected: li.allocatedQty,
            totalPicked: 0,
            isShort: false,
            shortageNotes: '',
          };
        } else if (existingState) {
          // Keep existing state if it has locations or picking progress
          updated[li.id] = existingState;
        }
      });
      return updated;
    });
  }, [inventoryData, fulfillmentOrder.lineItems]);

  // Track reported discrepancies for visual feedback
  const [reportedDiscrepancies, setReportedDiscrepancies] = useState<Set<string>>(new Set());
  const [hasReportedBackorders, setHasReportedBackorders] = useState(false);

  // Track scanned location for filtering
  const [scannedLocationId, setScannedLocationId] = useState<string | null>(null);

  // QR Scanner modal state
  const [showScanner, setShowScanner] = useState(false);

  // Search filter for line items
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  // Track expanded/collapsed state for each line item
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItemExpanded = useCallback((lineItemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(lineItemId)) {
        next.delete(lineItemId);
      } else {
        next.add(lineItemId);
      }
      return next;
    });
  }, []);

  const totalToPick = fulfillmentOrder.lineItems.reduce((sum, li) => sum + li.allocatedQty, 0);
  const totalPicked = Object.values(locationPicks).reduce((sum, lp) => sum + lp.totalPicked, 0);
  const allItemsPicked = fulfillmentOrder.lineItems.every(li => {
    const state = locationPicks[li.id];
    return state && state.totalPicked >= state.totalExpected;
  });

  // Calculate all shortages across all finalized locations
  const allShortages = useMemo(() => {
    const shortages: { lineItemId: string; locationId: string; locationName: string; locationType: string; expected: number; actual: number; shortage: number }[] = [];

    Object.entries(locationPicks).forEach(([lineItemId, lineState]) => {
      lineState.locations.forEach(loc => {
        if (loc.isFinalized && loc.pickedQty < loc.expectedQty) {
          shortages.push({
            lineItemId,
            locationId: loc.locationId,
            locationName: loc.locationName,
            locationType: loc.locationType,
            expected: loc.expectedQty,
            actual: loc.pickedQty,
            shortage: loc.expectedQty - loc.pickedQty,
          });
        }
      });
    });

    return shortages;
  }, [locationPicks]);

  const totalShortage = allShortages.reduce((sum, s) => sum + s.shortage, 0);
  const hasAnyShortage = allShortages.length > 0;

  // Get all unique locations across all line items
  const allLocations = useMemo(() => {
    const locMap = new Map<string, { id: string; name: string; type: string }>();
    Object.values(locationPicks).forEach(lineState => {
      lineState.locations.forEach(loc => {
        if (!locMap.has(loc.locationId)) {
          locMap.set(loc.locationId, {
            id: loc.locationId,
            name: loc.locationName,
            type: loc.locationType,
          });
        }
      });
    });
    return Array.from(locMap.values());
  }, [locationPicks]);

  // Get items that need to be picked from scanned location
  const itemsAtScannedLocation = useMemo(() => {
    if (!scannedLocationId) return [];

    const items: { lineItemId: string; lineItem: FulfillmentOrderLineItem; location: LocationPickState }[] = [];
    Object.entries(locationPicks).forEach(([lineItemId, lineState]) => {
      const loc = lineState.locations.find(l => l.locationId === scannedLocationId);
      if (loc && !loc.isFinalized) {
        const lineItem = fulfillmentOrder.lineItems.find(li => li.id === lineItemId);
        if (lineItem) {
          items.push({ lineItemId, lineItem, location: loc });
        }
      }
    });
    return items;
  }, [scannedLocationId, locationPicks, fulfillmentOrder.lineItems]);

  // Open the QR scanner modal
  const handleOpenScanner = useCallback(() => {
    setShowScanner(true);
  }, []);

  // Handle a scanned QR code result
  const handleScanResult = useCallback((scannedValue: string) => {
    // In a real app, the QR code would contain a location ID
    // For demo, we'll try to match by location name or ID
    const matchedLocation = allLocations.find(loc =>
      loc.id === scannedValue ||
      loc.name.toLowerCase() === scannedValue.toLowerCase()
    );

    if (matchedLocation) {
      setScannedLocationId(matchedLocation.id);
    }
    setShowScanner(false);
  }, [allLocations]);

  // Simulate a scan for demo purposes (picks a random location)
  const handleSimulateScan = useCallback(() => {
    const locationsWithUnpickedItems = allLocations.filter(loc => {
      return Object.values(locationPicks).some(lineState => {
        const locPick = lineState.locations.find(l => l.locationId === loc.id);
        return locPick && !locPick.isFinalized;
      });
    });

    if (locationsWithUnpickedItems.length === 0) {
      setShowScanner(false);
      return;
    }

    const randomIndex = Math.floor(Math.random() * locationsWithUnpickedItems.length);
    setScannedLocationId(locationsWithUnpickedItems[randomIndex].id);
    setShowScanner(false);
  }, [allLocations, locationPicks]);

  const handleClearScan = useCallback(() => {
    setScannedLocationId(null);
  }, []);

  // Handle location quantity change (just update the value, no cascade yet)
  const handleLocationQtyChange = useCallback((lineItemId: string, locationId: string, newQty: number) => {
    setLocationPicks(prev => {
      const lineState = prev[lineItemId];
      if (!lineState) return prev;

      const locationIndex = lineState.locations.findIndex(l => l.locationId === locationId);
      if (locationIndex === -1) return prev;

      const newLocations = [...lineState.locations];
      const location = newLocations[locationIndex];

      // Allow any non-negative value (will be validated on finalize)
      const clampedQty = Math.max(0, newQty);
      newLocations[locationIndex] = { ...location, pickedQty: clampedQty };

      const newTotalPicked = newLocations.reduce((sum, l) => sum + (l.isFinalized ? l.pickedQty : 0), 0);

      return {
        ...prev,
        [lineItemId]: {
          ...lineState,
          locations: newLocations,
          totalPicked: newTotalPicked,
          isShort: newTotalPicked < lineState.totalExpected && newLocations.every(l => l.isFinalized),
        },
      };
    });
  }, []);

  // Finalize a location - this triggers cascade logic and reports discrepancies
  const handleFinalizeLocation = useCallback((lineItemId: string, locationId: string) => {
    const lineState = locationPicks[lineItemId];
    if (!lineState) return;

    const locationIndex = lineState.locations.findIndex(l => l.locationId === locationId);
    if (locationIndex === -1) return;

    const location = lineState.locations[locationIndex];
    const pickedQty = location.pickedQty;
    const expectedQty = location.expectedQty;

    setLocationPicks(prev => {
      const currentLineState = prev[lineItemId];
      if (!currentLineState) return prev;

      const currentLocationIndex = currentLineState.locations.findIndex(l => l.locationId === locationId);
      if (currentLocationIndex === -1) return prev;

      const newLocations = [...currentLineState.locations];
      const currentLocation = newLocations[currentLocationIndex];

      // Mark this location as finalized
      newLocations[currentLocationIndex] = { ...currentLocation, isFinalized: true };

      // If picked less than expected, cascade the shortage to the next location
      if (pickedQty < expectedQty) {
        const shortage = expectedQty - pickedQty;

        // Find the next non-finalized location to add the shortage
        for (let i = currentLocationIndex + 1; i < newLocations.length; i++) {
          const nextLoc = newLocations[i];
          if (!nextLoc.isFinalized) {
            // Add the shortage to the next location's expected qty
            newLocations[i] = {
              ...nextLoc,
              expectedQty: nextLoc.expectedQty + shortage,
            };
            break;
          }
        }
      }

      const newTotalPicked = newLocations.reduce((sum, l) => sum + (l.isFinalized ? l.pickedQty : 0), 0);
      const allFinalized = newLocations.every(l => l.isFinalized);
      const isShort = allFinalized && newTotalPicked < currentLineState.totalExpected;

      // Sync with parent component
      onMarkAsPicked(lineItemId, newTotalPicked);

      return {
        ...prev,
        [lineItemId]: {
          ...currentLineState,
          locations: newLocations,
          totalPicked: newTotalPicked,
          isShort,
        },
      };
    });
  }, [locationPicks, fulfillmentOrder.lineItems, onMarkAsPicked, onReportInventoryDiscrepancy]);

  // Unfinalize a location - allows editing again and recalculates expected quantities
  const handleUnfinalizeLocation = useCallback((lineItemId: string, locationId: string) => {
    setLocationPicks(prev => {
      const lineState = prev[lineItemId];
      if (!lineState) return prev;

      const locationIndex = lineState.locations.findIndex(l => l.locationId === locationId);
      if (locationIndex === -1) return prev;

      // Get original allocations to restore expected quantities
      const lineItem = fulfillmentOrder.lineItems.find(li => li.id === lineItemId);
      if (!lineItem) return prev;

      const originalAllocations = getAllocationsForLineItem(lineItem, inventoryData);

      // Rebuild locations: restore original expected for this and subsequent locations
      const newLocations = lineState.locations.map((loc, idx) => {
        if (idx < locationIndex) {
          // Keep finalized locations before this one as-is
          return loc;
        } else if (idx === locationIndex) {
          // Unfinalize this location, restore original expected
          const originalLoc = originalAllocations.find(a => a.locationId === loc.locationId);
          return {
            ...loc,
            isFinalized: false,
            expectedQty: originalLoc ? originalLoc.quantity : loc.expectedQty,
          };
        } else {
          // Reset subsequent locations
          const originalLoc = originalAllocations.find(a => a.locationId === loc.locationId);
          return {
            ...loc,
            isFinalized: false,
            pickedQty: 0,
            expectedQty: originalLoc ? originalLoc.quantity : loc.expectedQty,
          };
        }
      });

      // Recalculate cascaded shortages from finalized locations
      let runningShortage = 0;
      for (let i = 0; i < newLocations.length; i++) {
        const loc = newLocations[i];
        if (loc.isFinalized && loc.pickedQty < loc.expectedQty) {
          runningShortage += loc.expectedQty - loc.pickedQty;
        } else if (!loc.isFinalized && runningShortage > 0) {
          // Add accumulated shortage to this location's expected
          newLocations[i] = {
            ...loc,
            expectedQty: loc.expectedQty + runningShortage,
          };
          runningShortage = 0;
        }
      }

      const newTotalPicked = newLocations.reduce((sum, l) => sum + (l.isFinalized ? l.pickedQty : 0), 0);
      const allFinalized = newLocations.every(l => l.isFinalized);
      onMarkAsPicked(lineItemId, newTotalPicked);

      return {
        ...prev,
        [lineItemId]: {
          ...lineState,
          locations: newLocations,
          totalPicked: newTotalPicked,
          isShort: allFinalized && newTotalPicked < lineState.totalExpected,
        },
      };
    });
  }, [onMarkAsPicked, fulfillmentOrder.lineItems]);

  // Pick all from a specific location and finalize it
  const handlePickAllFromLocation = useCallback((lineItemId: string, locationId: string) => {
    setLocationPicks(prev => {
      const lineState = prev[lineItemId];
      if (!lineState) return prev;

      const newLocations = lineState.locations.map(loc =>
        loc.locationId === locationId
          ? { ...loc, pickedQty: loc.expectedQty, isFinalized: true }
          : loc
      );

      const newTotalPicked = newLocations.reduce((sum, l) => sum + (l.isFinalized ? l.pickedQty : 0), 0);
      const allFinalized = newLocations.every(l => l.isFinalized);
      onMarkAsPicked(lineItemId, newTotalPicked);

      return {
        ...prev,
        [lineItemId]: {
          ...lineState,
          locations: newLocations,
          totalPicked: newTotalPicked,
          isShort: allFinalized && newTotalPicked < lineState.totalExpected,
        },
      };
    });
  }, [onMarkAsPicked]);

  // Pick all from all locations for a line item and finalize all
  const handlePickAllForItem = useCallback((lineItemId: string) => {
    setLocationPicks(prev => {
      const lineState = prev[lineItemId];
      if (!lineState) return prev;

      const newLocations = lineState.locations.map(loc => ({
        ...loc,
        pickedQty: loc.expectedQty,
        isFinalized: true,
      }));

      const newTotalPicked = newLocations.reduce((sum, l) => sum + l.pickedQty, 0);
      onMarkAsPicked(lineItemId, newTotalPicked);

      return {
        ...prev,
        [lineItemId]: {
          ...lineState,
          locations: newLocations,
          totalPicked: newTotalPicked,
          isShort: false,
        },
      };
    });
  }, [onMarkAsPicked]);

  // Reset picking for a line item
  const handleResetItem = useCallback((lineItemId: string) => {
    setLocationPicks(prev => {
      const lineState = prev[lineItemId];
      if (!lineState) return prev;

      // Recalculate original allocations
      const lineItem = fulfillmentOrder.lineItems.find(li => li.id === lineItemId);
      if (!lineItem) return prev;

      const allocations = getAllocationsForLineItem(lineItem, inventoryData);
      const newLocations = allocations.map(loc => ({
        locationId: loc.locationId,
        locationName: loc.locationName,
        locationType: loc.locationType,
        expectedQty: loc.quantity,
        pickedQty: 0,
        isFinalized: false,
      }));

      onMarkAsPicked(lineItemId, 0);

      return {
        ...prev,
        [lineItemId]: {
          ...lineState,
          locations: newLocations,
          totalPicked: 0,
          isShort: false,
        },
      };
    });
  }, [onMarkAsPicked, fulfillmentOrder.lineItems, inventoryData]);

  // Report all inventory discrepancies across the order
  const handleReportAllDiscrepancies = useCallback(() => {
    if (!onReportInventoryDiscrepancy || allShortages.length === 0) return;

    // Report each shortage
    allShortages.forEach(shortage => {
      const lineItem = fulfillmentOrder.lineItems.find(li => li.id === shortage.lineItemId);
      if (lineItem) {
        onReportInventoryDiscrepancy({
          lineItemId: shortage.lineItemId,
          productId: lineItem.productId,
          productName: lineItem.productName,
          partNumber: lineItem.partNumber,
          locationId: shortage.locationId,
          locationName: shortage.locationName,
          locationType: shortage.locationType,
          expectedQty: shortage.expected,
          actualQty: shortage.actual,
          shortage: shortage.shortage,
        });
      }
    });

    // Mark all shortages as reported
    const newReported = new Set(reportedDiscrepancies);
    allShortages.forEach(s => {
      newReported.add(`${s.lineItemId}-${s.locationId}`);
    });
    setReportedDiscrepancies(newReported);
    setHasReportedBackorders(true);
  }, [allShortages, fulfillmentOrder.lineItems, onReportInventoryDiscrepancy, reportedDiscrepancies]);

  const getLocationTypeColor = (type: string) => {
    switch (type) {
      case 'OVERFLOW': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'PRIMARY': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'RESERVE': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getLocationTypeLabel = (type: string) => {
    switch (type) {
      case 'OVERFLOW': return 'Overflow';
      case 'PRIMARY': return 'Primary';
      case 'RESERVE': return 'Reserve';
      default: return type;
    }
  };

  return (
    <div className="bg-[var(--card)] rounded-lg border-2 border-yellow-400 overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] bg-yellow-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
              <path d="M9 14l2 2 4-4"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Picking Mode</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              {totalPicked} of {totalToPick} items picked
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* QR Scan Location button */}
          <button
            onClick={handleOpenScanner}
            className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm font-medium hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
            </svg>
            Scan Bin
          </button>
          {allItemsPicked && (
            <button
              onClick={onCompletePicking}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-green-700 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Complete Picking
            </button>
          )}
        </div>
      </div>

      {/* Scanned Location Panel - shows items to pick from scanned bin */}
      {scannedLocationId && (
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span className="font-medium text-blue-800">
                {allLocations.find(l => l.id === scannedLocationId)?.name}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded border ${getLocationTypeColor(allLocations.find(l => l.id === scannedLocationId)?.type || '')}`}>
                {getLocationTypeLabel(allLocations.find(l => l.id === scannedLocationId)?.type || '')}
              </span>
            </div>
            <button
              onClick={handleClearScan}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
              Clear
            </button>
          </div>
          {itemsAtScannedLocation.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-blue-600 mb-2">Pick these items from this location:</p>
              {itemsAtScannedLocation.map(({ lineItemId, lineItem, location }) => (
                <div key={lineItemId} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-blue-200">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm">{lineItem.partNumber}</span>
                    <p className="text-xs text-[var(--muted-foreground)] truncate">{lineItem.productName}</p>
                  </div>
                  <div className="text-sm text-[var(--muted-foreground)]">
                    Pick <span className="font-semibold text-[var(--foreground)]">{location.expectedQty}</span>
                  </div>
                  <button
                    onClick={() => handlePickAllFromLocation(lineItemId, scannedLocationId)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
                  >
                    All Present
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-blue-600">No items to pick from this location (all finalized)</p>
          )}
        </div>
      )}

      {/* Order-level Report Backorder button - shows when there are any shortages */}
      {hasAnyShortage && !hasReportedBackorders && (
        <div className="px-4 py-3 bg-red-50 border-b border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-red-800">
                  Inventory discrepancy detected: {totalShortage} units short across {allShortages.length} location{allShortages.length !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-red-600">
                  Report to notify inside sales of inventory issues
                </p>
              </div>
            </div>
            <button
              onClick={handleReportAllDiscrepancies}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
              Report Backorder
            </button>
          </div>
        </div>
      )}

      {/* Confirmation that backorders were reported */}
      {hasReportedBackorders && (
        <div className="px-4 py-3 bg-orange-50 border-b border-orange-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-600">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-orange-800">
                Inventory discrepancies reported to inside sales
              </p>
              <p className="text-xs text-orange-600">
                {totalShortage} units short across {allShortages.length} location{allShortages.length !== 1 ? 's' : ''} - Inside sales has been notified
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search bar for quick filtering */}
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
        <div className="relative">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
          >
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search by part number or product name..."
            value={itemSearchQuery}
            onChange={(e) => setItemSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          />
          {itemSearchQuery && (
            <button
              onClick={() => setItemSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {fulfillmentOrder.lineItems
          .filter((item) => {
            if (!itemSearchQuery) return true;
            const query = itemSearchQuery.toLowerCase();
            return (
              item.partNumber.toLowerCase().includes(query) ||
              item.productName.toLowerCase().includes(query)
            );
          })
          .map((lineItem) => {
          const lineState = locationPicks[lineItem.id];
          if (!lineState) return null;

          const isPicked = lineState.totalPicked >= lineState.totalExpected;
          const hasNote = !!pickingNotes[lineItem.id];
          const isNoteExpanded = expandedNoteId === lineItem.id;
          const isShort = lineState.totalPicked > 0 && lineState.totalPicked < lineState.totalExpected;
          const isExpanded = expandedItems.has(lineItem.id);

          return (
            <div
              key={lineItem.id}
              className={`transition-colors ${isPicked ? 'bg-green-50' : isShort ? 'bg-amber-50' : ''}`}
            >
              {/* Header row - clickable to expand/collapse */}
              <div
                className="p-4 flex items-start gap-4 cursor-pointer hover:bg-[var(--muted)]/30 transition-colors"
                onClick={() => toggleItemExpanded(lineItem.id)}
              >
                {/* Expand/collapse indicator */}
                <div className="flex items-center justify-center w-6 flex-shrink-0 mt-3">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`text-[var(--muted-foreground)] transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  >
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>

                {/* Status indicator */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isPicked ? 'bg-green-500' : isShort ? 'bg-amber-500' : 'bg-[var(--muted)]'
                }`}>
                  {isPicked ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <span className="text-lg font-bold text-white">{lineState.totalExpected}</span>
                  )}
                </div>

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[var(--foreground)]">{lineItem.partNumber}</span>
                    <span className="text-xs px-2 py-0.5 bg-[var(--muted)] rounded">{lineItem.uom}</span>
                    {hasNote && !isNoteExpanded && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                        </svg>
                        Note
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)] truncate">{lineItem.productName}</p>
                </div>

                {/* Quantity display */}
                <div className="text-right">
                  <div className={`text-2xl font-bold ${isShort ? 'text-amber-600' : 'text-[var(--foreground)]'}`}>
                    {lineState.totalPicked} / {lineState.totalExpected}
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)]">picked</div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => onExpandNote(isNoteExpanded ? null : lineItem.id)}
                    className={`p-2 border rounded-lg transition-colors ${
                      hasNote
                        ? 'border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100'
                        : 'border-[var(--border)] hover:bg-[var(--muted)] text-[var(--muted-foreground)]'
                    }`}
                    title="Add note"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                  </button>
                  {!isPicked && (
                    <button
                      onClick={() => handlePickAllForItem(lineItem.id)}
                      className="px-3 py-2 bg-yellow-500 text-white rounded-lg font-medium text-sm hover:bg-yellow-600 transition-colors flex items-center gap-1"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                      Pick All
                    </button>
                  )}
                  {isPicked && (
                    <button
                      onClick={() => handleResetItem(lineItem.id)}
                      className="px-3 py-2 border border-[var(--border)] rounded-lg font-medium text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
                    >
                      Undo
                    </button>
                  )}
                </div>
              </div>

              {/* Location rows - only show when expanded */}
              {isExpanded && (
              <div className="px-4 pb-4 ml-22 space-y-2">
                {lineState.locations.map((loc, idx) => {
                  const isLocFinalized = loc.isFinalized;
                  const isLocComplete = isLocFinalized && loc.pickedQty >= loc.expectedQty;
                  const isLocShort = isLocFinalized && loc.pickedQty < loc.expectedQty;
                  const hasReportedDiscrepancy = reportedDiscrepancies.has(`${lineItem.id}-${loc.locationId}`);

                  return (
                    <div
                      key={loc.locationId}
                      className={`flex items-center gap-3 p-2 rounded-lg border ${
                        isLocComplete ? 'bg-green-50 border-green-200' :
                        isLocShort ? 'bg-amber-50 border-amber-200' :
                        isLocFinalized ? 'bg-green-50 border-green-200' :
                        'bg-[var(--muted)]/30 border-[var(--border)]'
                      }`}
                    >
                      {/* Priority indicator */}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        isLocFinalized ? 'bg-green-500 text-white' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                      }`}>
                        {isLocFinalized ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : idx + 1}
                      </div>

                      {/* Location type badge */}
                      <span className={`text-xs px-2 py-0.5 rounded border ${getLocationTypeColor(loc.locationType)}`}>
                        {getLocationTypeLabel(loc.locationType)}
                      </span>

                      {/* Location name */}
                      <div className="flex items-center gap-1 flex-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span className="text-sm font-medium">{loc.locationName}</span>
                        {/* Discrepancy reported indicator */}
                        {hasReportedDiscrepancy && (
                          <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200" title="Inventory discrepancy reported to inside sales">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                            </svg>
                            Reported
                          </span>
                        )}
                      </div>

                      {/* Expected qty */}
                      <div className="text-sm text-[var(--muted-foreground)]">
                        of <span className="font-semibold text-[var(--foreground)]">{loc.expectedQty}</span>
                      </div>

                      {/* Editable picked qty - simple input without +/- buttons */}
                      {isLocFinalized ? (
                        <div className={`w-16 h-8 flex items-center justify-center text-sm font-semibold rounded ${
                          loc.pickedQty >= loc.expectedQty ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {loc.pickedQty}
                        </div>
                      ) : (
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={loc.pickedQty}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            handleLocationQtyChange(lineItem.id, loc.locationId, val === '' ? 0 : parseInt(val));
                          }}
                          onFocus={(e) => e.target.select()}
                          className="w-16 h-8 text-center text-sm font-semibold border rounded border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500"
                        />
                      )}

                      {/* All Present and Finalize buttons or Undo button */}
                      {!isLocFinalized ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handlePickAllFromLocation(lineItem.id, loc.locationId)}
                            className="px-2 py-1.5 text-xs font-medium text-green-700 bg-green-100 border border-green-200 rounded hover:bg-green-200 transition-colors"
                          >
                            All Present
                          </button>
                          <button
                            onClick={() => handleFinalizeLocation(lineItem.id, loc.locationId)}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-yellow-500 rounded hover:bg-yellow-600 transition-colors"
                          >
                            Finalize
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleUnfinalizeLocation(lineItem.id, loc.locationId)}
                          className="px-2 py-1 text-xs font-medium text-[var(--muted-foreground)] border border-[var(--border)] rounded hover:bg-[var(--muted)] transition-colors"
                        >
                          Undo
                        </button>
                      )}
                    </div>
                  );
                })}

              </div>
              )}

              {/* Expandable note input */}
              {isNoteExpanded && (
                <div className="px-4 pb-4">
                  <div className="ml-16 flex gap-2">
                    <input
                      type="text"
                      value={pickingNotes[lineItem.id] || ''}
                      onChange={(e) => onUpdateNote(lineItem.id, e.target.value)}
                      placeholder="Add a note for this item..."
                      className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      autoFocus
                    />
                    <button
                      onClick={() => onExpandNote(null)}
                      className="px-3 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="text-lg font-semibold">Scan Bin QR Code</h3>
              <button
                onClick={() => setShowScanner(false)}
                className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Camera viewfinder area */}
            <div className="relative bg-black aspect-square flex items-center justify-center">
              {/* Simulated camera view */}
              <div className="absolute inset-4 border-2 border-white/30 rounded-lg">
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
              </div>

              {/* Scanning line animation */}
              <div className="absolute inset-x-8 h-0.5 bg-yellow-400 animate-pulse" style={{ top: '50%' }} />

              {/* Center icon */}
              <div className="text-white/50">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                </svg>
              </div>

              {/* Instructions */}
              <p className="absolute bottom-4 left-0 right-0 text-center text-white/70 text-sm">
                Point camera at bin QR code
              </p>
            </div>

            {/* Footer with demo buttons */}
            <div className="px-4 py-4 bg-[var(--muted)]/30 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--muted-foreground)] mb-3 text-center">
                Camera access required. For demo, select a bin:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {allLocations
                  .filter(loc => {
                    // Only show locations with unpicked items
                    return Object.values(locationPicks).some(lineState => {
                      const locPick = lineState.locations.find(l => l.locationId === loc.id);
                      return locPick && !locPick.isFinalized;
                    });
                  })
                  .map(loc => (
                    <button
                      key={loc.id}
                      onClick={() => handleScanResult(loc.id)}
                      className="px-3 py-1.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                    >
                      {loc.name}
                    </button>
                  ))}
              </div>
              {allLocations.filter(loc => {
                return Object.values(locationPicks).some(lineState => {
                  const locPick = lineState.locations.find(l => l.locationId === loc.id);
                  return locPick && !locPick.isFinalized;
                });
              }).length === 0 && (
                <p className="text-sm text-center text-[var(--muted-foreground)]">
                  All bins have been picked!
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
