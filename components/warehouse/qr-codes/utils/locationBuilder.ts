// Location hierarchy builder utilities

import type { LocationWithPath } from '../types';
import {
  mockSections,
  mockAisles,
  mockShelves,
  mockBays,
  mockRows,
  mockBins,
} from '@/lib/data/warehouse-mock';

/**
 * Build flat list of all locations with their full paths
 */
export function buildLocationList(warehouseId: string, enabledLevels: string[]): LocationWithPath[] {
  const locations: LocationWithPath[] = [];

  const sections = mockSections.filter((s) => s.warehouseId === warehouseId);

  for (const section of sections) {
    if (enabledLevels.includes('section')) {
      locations.push({
        id: section.id,
        name: section.name,
        type: 'section',
        path: section.name,
        fullPath: [section.name],
      });
    }

    const aisles = mockAisles.filter((a) => a.sectionId === section.id);
    for (const aisle of aisles) {
      if (enabledLevels.includes('aisle')) {
        locations.push({
          id: aisle.id,
          name: aisle.name,
          type: 'aisle',
          path: `${section.name} > ${aisle.name}`,
          fullPath: [section.name, aisle.name],
        });
      }

      const shelves = mockShelves.filter((s) => s.aisleId === aisle.id);
      for (const shelf of shelves) {
        if (enabledLevels.includes('shelf')) {
          locations.push({
            id: shelf.id,
            name: shelf.name,
            type: 'shelf',
            path: `${section.name} > ${aisle.name} > ${shelf.name}`,
            fullPath: [section.name, aisle.name, shelf.name],
          });
        }

        const bays = mockBays.filter((b) => b.shelfId === shelf.id);
        for (const bay of bays) {
          if (enabledLevels.includes('bay')) {
            locations.push({
              id: bay.id,
              name: bay.code,
              type: 'bay',
              path: `${section.name} > ${aisle.name} > ${shelf.name} > ${bay.code}`,
              fullPath: [section.name, aisle.name, shelf.name, bay.code],
            });
          }

          const rows = mockRows.filter((r) => r.bayId === bay.id);
          for (const row of rows) {
            if (enabledLevels.includes('row')) {
              locations.push({
                id: row.id,
                name: `Row ${row.rowNumber}`,
                type: 'row',
                path: `${section.name} > ${aisle.name} > ${shelf.name} > ${bay.code} > Row ${row.rowNumber}`,
                fullPath: [section.name, aisle.name, shelf.name, bay.code, `Row ${row.rowNumber}`],
              });
            }

            const bins = mockBins.filter((b) => b.rowId === row.id);
            for (const bin of bins) {
              if (enabledLevels.includes('bin')) {
                locations.push({
                  id: bin.id,
                  name: `Bin ${bin.letterCode}`,
                  type: 'bin',
                  path: `${section.name} > ${aisle.name} > ${shelf.name} > ${bay.code} > Row ${row.rowNumber} > Bin ${bin.letterCode}`,
                  fullPath: [section.name, aisle.name, shelf.name, bay.code, `Row ${row.rowNumber}`, `Bin ${bin.letterCode}`],
                });
              }
            }
          }
        }
      }
    }
  }

  return locations;
}
