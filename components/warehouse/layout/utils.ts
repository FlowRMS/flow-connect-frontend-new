// Warehouse Layout Utilities

import type { WarehouseLocation, VisualElement } from './types';
import {
  mockSections,
  mockAisles,
  mockShelves,
  mockBays,
  mockRows,
  mockBins,
  mockInventoryItems,
} from '@/lib/data/warehouse-mock';

/**
 * Build the initial location tree from mock data
 */
export function buildLocationTree(warehouseId: string): WarehouseLocation[] {
  return mockSections
    .filter((s) => s.warehouseId === warehouseId)
    .map((section) => ({
      id: section.id,
      name: section.name,
      type: 'section' as const,
      description: section.description,
      isActive: section.isActive,
      products: [],
      children: mockAisles
        .filter((a) => a.sectionId === section.id)
        .map((aisle) => ({
          id: aisle.id,
          name: aisle.name,
          type: 'aisle' as const,
          parentId: section.id,
          isActive: aisle.isActive,
          products: [],
          children: mockShelves
            .filter((s) => s.aisleId === aisle.id)
            .map((shelf) => ({
              id: shelf.id,
              name: shelf.name,
              type: 'shelf' as const,
              parentId: aisle.id,
              isActive: shelf.isActive,
              products: [],
              children: mockBays
                .filter((b) => b.shelfId === shelf.id)
                .map((bay) => ({
                  id: bay.id,
                  name: bay.code,
                  type: 'bay' as const,
                  parentId: shelf.id,
                  isActive: bay.isActive,
                  products: [],
                  children: mockRows
                    .filter((r) => r.bayId === bay.id)
                    .map((row) => ({
                      id: row.id,
                      name: `Row ${row.rowNumber}`,
                      type: 'row' as const,
                      parentId: bay.id,
                      isActive: row.isActive,
                      products: [],
                      children: mockBins
                        .filter((b) => b.rowId === row.id)
                        .map((bin) => ({
                          id: bin.id,
                          name: `Bin ${bin.letterCode}`,
                          type: 'bin' as const,
                          parentId: row.id,
                          isActive: bin.isActive,
                          products: mockInventoryItems
                            .filter((i) => i.binId === bin.id)
                            .map((i) => ({
                              id: i.id,
                              productId: i.inventoryId,
                              productName: i.binLocation || 'Product',
                              partNumber: i.barcode || '',
                              quantity: i.quantity,
                            })),
                        })),
                    })),
                })),
            })),
        })),
    }));
}

/**
 * Build visual elements from location tree for canvas rendering
 */
export function buildVisualElements(locations: WarehouseLocation[]): VisualElement[] {
  let xOffset = 50;
  let yOffset = 50;

  return locations.map((location, index) => {
    const element: VisualElement = {
      id: location.id,
      locationId: location.id,
      x: location.x ?? xOffset + (index % 3) * 350,
      y: location.y ?? yOffset + Math.floor(index / 3) * 250,
      width: location.width ?? 300,
      height: location.height ?? 200,
      rotation: location.rotation ?? 0,
      type: location.type,
      name: location.name,
      parentId: location.parentId,
      children: location.children ? buildChildVisualElements(location.children, location.id) : [],
    };
    return element;
  });
}

/**
 * Build child visual elements recursively
 */
function buildChildVisualElements(children: WarehouseLocation[], parentId: string): VisualElement[] {
  return children.map((child, index) => ({
    id: child.id,
    locationId: child.id,
    x: child.x ?? 10 + (index % 4) * 70,
    y: child.y ?? 30 + Math.floor(index / 4) * 35,
    width: child.width ?? 60,
    height: child.height ?? 30,
    rotation: child.rotation ?? 0,
    type: child.type,
    name: child.name,
    parentId: parentId,
    children: child.children ? buildChildVisualElements(child.children, child.id) : [],
  }));
}

/**
 * Filter locations by search query (recursive)
 */
export function filterLocations(locations: WarehouseLocation[], query: string): WarehouseLocation[] {
  const lowerQuery = query.toLowerCase();
  const filterNode = (node: WarehouseLocation): WarehouseLocation | null => {
    const matchesSelf = node.name.toLowerCase().includes(lowerQuery);
    const filteredChildren = node.children?.map(filterNode).filter((c): c is WarehouseLocation => c !== null);
    if (matchesSelf || (filteredChildren && filteredChildren.length > 0)) {
      return { ...node, children: filteredChildren || [] };
    }
    return null;
  };
  return locations.map(filterNode).filter((loc): loc is WarehouseLocation => loc !== null);
}

/**
 * Count total locations in the tree
 */
export function countLocations(locations: WarehouseLocation[]): number {
  return locations.reduce((count, loc) => count + 1 + (loc.children ? countLocations(loc.children) : 0), 0);
}

/**
 * Find a location by ID in the tree
 */
export function findLocationById(locations: WarehouseLocation[], id: string): WarehouseLocation | null {
  for (const loc of locations) {
    if (loc.id === id) return loc;
    if (loc.children) {
      const found = findLocationById(loc.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Find a visual element by ID
 */
export function findVisualElementById(elements: VisualElement[], id: string): VisualElement | null {
  for (const el of elements) {
    if (el.id === id) return el;
    if (el.children) {
      const found = findVisualElementById(el.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Find the root section that contains a given element ID
 */
export function findRootSectionContaining(
  locations: WarehouseLocation[],
  targetId: string
): WarehouseLocation | null {
  for (const section of locations) {
    if (section.id === targetId) return section;
    if (containsId(section, targetId)) return section;
  }
  return null;
}

/**
 * Check if a location or any of its descendants has the given ID
 */
export function containsId(location: WarehouseLocation, targetId: string): boolean {
  if (location.id === targetId) return true;
  if (location.children) {
    return location.children.some((child) => containsId(child, targetId));
  }
  return false;
}

/**
 * Get the path from root to a specific element
 */
export function getPathToElement(
  locations: WarehouseLocation[],
  targetId: string,
  path: string[] = []
): string[] {
  for (const loc of locations) {
    if (loc.id === targetId) {
      return [...path, loc.id];
    }
    if (loc.children) {
      const childPath = getPathToElement(loc.children, targetId, [...path, loc.id]);
      if (childPath.length > 0) return childPath;
    }
  }
  return [];
}

/**
 * Update a location in the tree by ID
 */
export function updateLocationInTree(
  locations: WarehouseLocation[],
  id: string,
  updates: Partial<WarehouseLocation>
): WarehouseLocation[] {
  return locations.map((loc) => {
    if (loc.id === id) {
      return { ...loc, ...updates };
    }
    if (loc.children) {
      return { ...loc, children: updateLocationInTree(loc.children, id, updates) };
    }
    return loc;
  });
}

/**
 * Remove a location from the tree by ID
 */
export function removeLocationFromTree(locations: WarehouseLocation[], id: string): WarehouseLocation[] {
  return locations
    .filter((loc) => loc.id !== id)
    .map((loc) => ({
      ...loc,
      children: loc.children ? removeLocationFromTree(loc.children, id) : undefined,
    }));
}

/**
 * Add a location to the tree under a specific parent
 */
export function addLocationToTree(
  locations: WarehouseLocation[],
  parentId: string | null,
  newLocation: WarehouseLocation
): WarehouseLocation[] {
  // If no parent, add to root
  if (!parentId) {
    return [...locations, newLocation];
  }

  // Otherwise, find parent and add as child
  return locations.map((loc) => {
    if (loc.id === parentId) {
      return { ...loc, children: [...(loc.children || []), newLocation] };
    }
    if (loc.children) {
      return { ...loc, children: addLocationToTree(loc.children, parentId, newLocation) };
    }
    return loc;
  });
}
