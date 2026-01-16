/**
 * Product Cross Results Modal Utilities
 */

import type { ProductCrossTypeEnum } from '../../lib/graphql/product-crosses';

// Fixed specification rows to always display
export const SPEC_ROWS = [
  'Voltage',
  'Wattage',
  'Protocol',
  'Zones',
  'Color Temperature',
  'Dimming Range',
  'Max Load',
  'Operating Temperature',
  'Certifications',
  'Additional Features',
];

// Map UI cross types to API enum values
export function mapCrossTypeToApi(uiType: string): ProductCrossTypeEnum {
  switch (uiType) {
    case 'direct': return 'SIMPLE';
    case 'upgrade': return 'UPGRADE';
    case 'value': return 'VALUE';
    default: return 'SIMPLE';
  }
}

// Map API cross types to UI values
export function mapCrossTypeFromApi(apiType: ProductCrossTypeEnum): 'direct' | 'upgrade' | 'value' {
  switch (apiType) {
    case 'SIMPLE': return 'direct';
    case 'UPGRADE': return 'upgrade';
    case 'VALUE': return 'value';
    default: return 'direct';
  }
}

// Extract part number from product name
export function extractPartNumber(name: string): string {
  const match = name.match(/[A-Z0-9]+-?[A-Z0-9]+/i);
  return match ? match[0] : name.split(' ')[0] || name;
}

// Parse specifications from description
export function parseSpecifications(description: string): Record<string, string> {
  const specs: Record<string, string> = {};

  if (!description) return specs;

  const patterns = [
    { key: 'Voltage', pattern: /(\d+V?\s*(?:AC|DC)?)/i },
    { key: 'Wattage', pattern: /(\d+W(?:\s*per\s*zone)?)/i },
    { key: 'Protocol', pattern: /(DALI|0-10V|DMX|PWM|Bluetooth|WiFi|Zigbee|RS-485|Modbus)/i },
    { key: 'Zones', pattern: /(\d+)\s*zones?/i },
    { key: 'Color Temperature', pattern: /(\d+K(?:\s*\([^)]+\))?)/i },
    { key: 'Dimming Range', pattern: /(?:dimming\s*(?:range)?:?\s*)?(0?-?\d+%?\s*(?:to|-)\s*100%?)/i },
    { key: 'Max Load', pattern: /(?:max\s*load:?\s*)?(\d+(?:\.\d+)?\s*(?:A|W|VA))/i },
    { key: 'Operating Temperature', pattern: /(?:operating\s*temp(?:erature)?:?\s*)?(-?\d+°?[CF]?\s*(?:to|-)\s*-?\d+°?[CF]?)/i },
    { key: 'Certifications', pattern: /(UL|ETL|CE|FCC|RoHS|Energy\s*Star|DLC|Title\s*24|JA8)/gi },
    { key: 'Additional Features', pattern: /(?:features?:?\s*)(.+)/i },
  ];

  for (const { key, pattern } of patterns) {
    if (key === 'Certifications') {
      const matches = description.match(pattern);
      if (matches && matches.length > 0) {
        specs[key] = [...new Set(matches.map(m => m.toUpperCase()))].join(', ');
      }
    } else {
      const match = description.match(pattern);
      if (match) {
        specs[key] = match[1];
      }
    }
  }

  if (Object.keys(specs).length === 0) {
    specs['Description'] = description;
  }

  return specs;
}
