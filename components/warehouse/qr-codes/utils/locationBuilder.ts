// Location hierarchy builder utilities

import type { LocationWithPath } from '../types';
import type { WarehouseLocation as ApiWarehouseLocation } from '../../settings/api/warehouseLocationsApi';

/** Map API level to local type */
const API_LEVEL_TO_TYPE: Record<string, string> = {
  SECTION: 'section',
  AISLE: 'aisle',
  SHELF: 'shelf',
  BAY: 'bay',
  ROW: 'row',
  BIN: 'bin',
};

/**
 * Build flat list of all locations with their full paths from API data
 */
export function buildLocationListFromApi(
  apiLocations: ApiWarehouseLocation[],
  enabledLevels: string[]
): LocationWithPath[] {
  const locations: LocationWithPath[] = [];

  function processLocation(
    location: ApiWarehouseLocation,
    parentPath: string[],
    parentPathString: string
  ) {
    const locationType = API_LEVEL_TO_TYPE[location.level] || location.level.toLowerCase();
    const currentPath = [...parentPath, location.name];
    const currentPathString = parentPathString ? `${parentPathString} > ${location.name}` : location.name;

    // Only include if this level is enabled
    if (enabledLevels.includes(locationType)) {
      locations.push({
        id: location.id,
        name: location.name,
        type: locationType,
        path: currentPathString,
        fullPath: currentPath,
      });
    }

    // Process children recursively
    if (location.children && location.children.length > 0) {
      for (const child of location.children) {
        processLocation(child, currentPath, currentPathString);
      }
    }
  }

  // Process all root locations (sections)
  for (const location of apiLocations) {
    processLocation(location, [], '');
  }

  return locations;
}

/**
 * Build an empty location list (for when no data is available)
 */
export function buildEmptyLocationList(): LocationWithPath[] {
  return [];
}
