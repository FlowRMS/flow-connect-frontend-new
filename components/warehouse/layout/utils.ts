// Warehouse Layout Utilities

import type { WarehouseLocation, VisualElement, ProductAssignment } from './types';
import type {
  WarehouseLocation as ApiWarehouseLocation,
  LocationLevel,
  BulkWarehouseLocationInput,
} from '../settings/api/warehouseLocationsApi';

/** Map API level to local type */
const API_LEVEL_TO_TYPE: Record<LocationLevel, WarehouseLocation['type']> = {
  SECTION: 'section',
  AISLE: 'aisle',
  SHELF: 'shelf',
  BAY: 'bay',
  ROW: 'row',
  BIN: 'bin',
};

/** Map local type to API level */
const TYPE_TO_API_LEVEL: Record<WarehouseLocation['type'], LocationLevel> = {
  section: 'SECTION',
  aisle: 'AISLE',
  shelf: 'SHELF',
  bay: 'BAY',
  row: 'ROW',
  bin: 'BIN',
};

/**
 * Convert API location to local WarehouseLocation format
 */
function convertApiLocationToLocal(apiLocation: ApiWarehouseLocation): WarehouseLocation {
  const products: ProductAssignment[] = (apiLocation.productAssignments || []).map((assignment) => ({
    id: assignment.id,
    productId: assignment.productId,
    productName: assignment.product?.description || assignment.product?.factoryPartNumber || '',
    partNumber: assignment.product?.factoryPartNumber || '',
    quantity: assignment.quantity,
  }));

  return {
    id: apiLocation.id,
    name: apiLocation.name,
    type: API_LEVEL_TO_TYPE[apiLocation.level],
    parentId: apiLocation.parentId || undefined,
    description: apiLocation.description || undefined,
    isActive: apiLocation.isActive,
    // Ensure numeric values are actual numbers (API may return strings from Decimal)
    x: apiLocation.x != null ? Number(apiLocation.x) : undefined,
    y: apiLocation.y != null ? Number(apiLocation.y) : undefined,
    width: apiLocation.width != null ? Number(apiLocation.width) : undefined,
    height: apiLocation.height != null ? Number(apiLocation.height) : undefined,
    rotation: apiLocation.rotation != null ? Number(apiLocation.rotation) : undefined,
    products,
    children: (apiLocation.children || []).map(convertApiLocationToLocal),
  };
}

/**
 * Build location tree from API response (hierarchical data)
 */
export function buildLocationTreeFromApi(apiLocations: ApiWarehouseLocation[]): WarehouseLocation[] {
  return apiLocations.map(convertApiLocationToLocal);
}

/**
 * Helper to check if an ID is a valid UUID
 */
function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Flatten location tree to array with correct parent references
 */
function flattenLocations(
  locations: WarehouseLocation[],
  parentId: string | null = null
): Array<{ location: WarehouseLocation; parentId: string | null }> {
  const result: Array<{ location: WarehouseLocation; parentId: string | null }> = [];

  for (const location of locations) {
    result.push({ location, parentId });
    if (location.children && location.children.length > 0) {
      result.push(...flattenLocations(location.children, location.id));
    }
  }

  return result;
}

/**
 * Convert local locations to API bulk input format
 *
 * Handles temp IDs for newly created hierarchical locations:
 * - tempId: Sent for new locations so backend can track them
 * - tempParentId: Sent when parent is also new (has temp ID)
 */
export function convertLocationsToApiInput(
  locations: WarehouseLocation[]
): BulkWarehouseLocationInput[] {
  const flattened = flattenLocations(locations);
  let sortOrder = 0;

  return flattened.map(({ location, parentId }) => {
    const isNewLocation = !isValidUUID(location.id);
    const hasNewParent = parentId && !isValidUUID(parentId);

    return {
      id: isValidUUID(location.id) ? location.id : undefined,
      parentId: parentId && isValidUUID(parentId) ? parentId : null,
      // Include temp IDs for new locations so backend can resolve parent relationships
      tempId: isNewLocation ? location.id : undefined,
      tempParentId: hasNewParent ? parentId : undefined,
      level: TYPE_TO_API_LEVEL[location.type],
      name: location.name,
      code: null,
      description: location.description || null,
      isActive: location.isActive,
      sortOrder: sortOrder++,
      // Ensure numeric values are actual numbers, not strings
      x: location.x != null ? Number(location.x) : null,
      y: location.y != null ? Number(location.y) : null,
      width: location.width != null ? Number(location.width) : null,
      height: location.height != null ? Number(location.height) : null,
      rotation: location.rotation != null ? Number(location.rotation) : null,
    };
  });
}

/**
 * Build an empty location tree (for new warehouses with no locations)
 */
export function buildEmptyLocationTree(): WarehouseLocation[] {
  return [];
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
  return children.map((child, index) => {
    // Ensure numeric values (API may return strings from Decimal)
    const x = child.x != null ? Number(child.x) : undefined;
    const y = child.y != null ? Number(child.y) : undefined;
    const width = child.width != null ? Number(child.width) : undefined;
    const height = child.height != null ? Number(child.height) : undefined;
    const rotation = child.rotation != null ? Number(child.rotation) : 0;

    return {
      id: child.id,
      locationId: child.id,
      x: x ?? 10 + (index % 4) * 70,
      y: y ?? 30 + Math.floor(index / 4) * 35,
      width: width ?? 60,
      height: height ?? 30,
      rotation,
      type: child.type,
      name: child.name,
      parentId: parentId,
      children: child.children ? buildChildVisualElements(child.children, child.id) : [],
    };
  });
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
