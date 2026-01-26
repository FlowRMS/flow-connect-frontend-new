import type { WarehouseLocation, WarehouseLocationLevel } from '../types';
import type { StructureConfig, NamingConfig, LevelNaming } from './types';

/**
 * Full hierarchy order
 */
const LEVEL_ORDER: WarehouseLocationLevel[] = ['section', 'aisle', 'shelf', 'bay', 'row', 'bin'];

/**
 * Get enabled levels in correct hierarchical order
 */
export function getEnabledLevelOrder(enabledLevels: WarehouseLocationLevel[]): WarehouseLocationLevel[] {
  return LEVEL_ORDER.filter((level) => enabledLevels.includes(level));
}

/**
 * Convert a 0-based index to a letter sequence (A, B, C... Z, AA, AB...)
 */
export function indexToLetter(index: number, continueAfterMax: boolean): string {
  if (index < 26) {
    return String.fromCharCode(65 + index);
  }
  if (continueAfterMax) {
    const first = Math.floor(index / 26) - 1;
    const second = index % 26;
    if (first < 26) {
      return String.fromCharCode(65 + first) + String.fromCharCode(65 + second);
    }
    // Beyond ZZ, fall back to numbers
    return (index + 1).toString();
  }
  return (index + 1).toString();
}

/**
 * Generate a name for a location at a given index
 */
export function generateSequentialName(
  index: number,
  config: LevelNaming,
  parentName?: string,
  includeParentName?: boolean
): string {
  let suffix: string;

  if (config.type === 'letters') {
    suffix = indexToLetter(index, config.continueAfterMax);
  } else if (config.type === 'numbers') {
    suffix = (index + 1).toString();
  } else if (config.customValues && config.customValues[index]) {
    suffix = config.customValues[index];
  } else {
    suffix = (index + 1).toString();
  }

  const name = config.prefix ? `${config.prefix}${suffix}` : suffix;

  if (includeParentName && parentName) {
    return `${parentName}-${name}`;
  }

  return name;
}

/**
 * Generate a unique temp ID for a location
 */
function generateTempId(type: string): string {
  return `${type.toUpperCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Calculate total number of locations that will be created
 */
export function calculateTotalLocations(
  structure: StructureConfig,
  enabledLevels: WarehouseLocationLevel[]
): { total: number; perLevel: Record<string, number> } {
  const orderedLevels = getEnabledLevelOrder(enabledLevels);
  const perLevel: Record<string, number> = {};
  let cumulativeCount = 1;

  for (const level of orderedLevels) {
    const count = structure.counts[level] || 0;
    if (count === 0 && level !== orderedLevels[0]) break;
    cumulativeCount *= count || 1;
    perLevel[level] = cumulativeCount;
  }

  // For the root level, use its count directly
  if (orderedLevels.length > 0) {
    perLevel[orderedLevels[0]] = structure.counts[orderedLevels[0]] || 0;
  }

  // Recalculate cumulative for children
  let runningProduct = perLevel[orderedLevels[0]] || 0;
  for (let i = 1; i < orderedLevels.length; i++) {
    const level = orderedLevels[i];
    const count = structure.counts[level] || 0;
    if (count === 0) break;
    runningProduct *= count;
    perLevel[level] = runningProduct;
  }

  const total = Object.values(perLevel).reduce((sum, count) => sum + count, 0);
  return { total, perLevel };
}

/**
 * Generate all locations from template configuration
 */
export function generateTemplateLocations(
  structure: StructureConfig,
  naming: NamingConfig,
  enabledLevels: WarehouseLocationLevel[]
): WarehouseLocation[] {
  const orderedLevels = getEnabledLevelOrder(enabledLevels);
  if (orderedLevels.length === 0) return [];

  const rootLevel = orderedLevels[0];
  const rootCount = structure.counts[rootLevel] || 0;
  if (rootCount === 0) return [];

  const rootNaming = naming.levels[rootLevel] || { prefix: '', type: 'numbers' as const, continueAfterMax: false };
  const sections: WarehouseLocation[] = [];

  for (let i = 0; i < rootCount; i++) {
    const name = generateSequentialName(i, rootNaming);
    const section = createLocationWithChildren(
      name,
      rootLevel,
      undefined,
      orderedLevels,
      0,
      structure,
      naming
    );
    sections.push(section);
  }

  return sections;
}

/**
 * Recursively create a location and its children
 */
function createLocationWithChildren(
  name: string,
  level: WarehouseLocationLevel,
  parentId: string | undefined,
  orderedLevels: WarehouseLocationLevel[],
  levelIndex: number,
  structure: StructureConfig,
  naming: NamingConfig
): WarehouseLocation {
  const id = generateTempId(level);

  const location: WarehouseLocation = {
    id,
    name,
    type: level,
    parentId,
    isActive: true,
    children: [],
  };

  // Check if there's a next level
  const nextLevelIndex = levelIndex + 1;
  if (nextLevelIndex < orderedLevels.length) {
    const nextLevel = orderedLevels[nextLevelIndex];
    const childCount = structure.counts[nextLevel] || 0;

    if (childCount > 0) {
      const childNaming = naming.levels[nextLevel] || { prefix: '', type: 'numbers' as const, continueAfterMax: false };
      const children: WarehouseLocation[] = [];

      for (let i = 0; i < childCount; i++) {
        const childName = generateSequentialName(i, childNaming, name, naming.includeParentName);
        const child = createLocationWithChildren(
          childName,
          nextLevel,
          id,
          orderedLevels,
          nextLevelIndex,
          structure,
          naming
        );
        children.push(child);
      }

      location.children = children;
    }
  }

  return location;
}
