/**
 * Product Crosses Utilities
 * Helper functions for product crosses module
 */

import type { ParsedProductCross, ProductCrossDisplayItem } from './types';

/**
 * Parse the original field which may come as a JSON string from the API
 */
export function parseOriginal(original: unknown): Record<string, unknown> {
  if (typeof original === 'string') {
    try {
      return JSON.parse(original);
    } catch {
      console.warn('[product-crosses] Failed to parse original:', original);
      return {};
    }
  }
  return (original as Record<string, unknown>) || {};
}

/**
 * Extract a value from an object using multiple possible keys
 */
export function extractValue(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = obj[key];
    if (value && typeof value === 'string') {
      return value;
    }
  }
  return '';
}

/**
 * Extract part number from product name
 */
export function extractPartNumber(name: string): string {
  // Try to extract a part number pattern from the name
  const match = name.match(/[A-Z0-9]+-?[A-Z0-9]+/i);
  return match ? match[0] : name.split(' ')[0] || '';
}

/**
 * Transform API results to display format for the Product Crosses table
 */
export function transformResultsToDisplayItems(
  results: ParsedProductCross[]
): ProductCrossDisplayItem[] {
  const displayItems: ProductCrossDisplayItem[] = [];

  for (const result of results) {
    // Parse the original field - it may come as a JSON string from the API
    const original = parseOriginal(result.original);

    for (const cross of result.crosses) {
      for (const alt of cross.alternatives) {
        displayItems.push({
          id: crypto.randomUUID(),
          // API returns different fields: manufacturer/mark for name, part_number/mark for part, description/type for desc
          competitorManufacturer: extractValue(original, ['manufacturer', 'brand', 'vendor', 'mark', 'name']),
          competitorPartNumber: extractValue(original, ['partNumber', 'part_number', 'model', 'sku', 'mark']),
          competitorDescription: cross.originalProduct || extractValue(original, ['description', 'type']),
          ourManufacturer: alt.source || 'FlowRMS',
          ourPartNumber: extractPartNumber(alt.name),
          ourDescription: alt.description || alt.name,
          timesUsed: 0,
          lastUsed: new Date().toISOString(),
          crossType: alt.crossType,
          confidence: alt.price ? 85 : 70,
          price: alt.price || undefined,
        });
      }
    }
  }

  return displayItems;
}
