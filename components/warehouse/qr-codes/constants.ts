// Constants for QR Codes Modal

import type { PrintFormatConfig } from './types';

export const printFormats: PrintFormatConfig[] = [
  { id: 'labels-80', name: 'Small Labels (80/page)', description: 'Avery 5267 - 0.5" x 1.75"', perPage: 80 },
  { id: 'labels-30', name: 'Address Labels (30/page)', description: 'Avery 5160 - 1" x 2.625"', perPage: 30 },
  { id: 'sheet-small', name: 'Small Grid (24/page)', description: '1.5" x 1.5" codes', perPage: 24 },
  { id: 'sheet-medium', name: 'Medium Grid (12/page)', description: '2" x 2" codes with labels', perPage: 12 },
  { id: 'sheet-large', name: 'Large Grid (6/page)', description: '3" x 3" codes with full path', perPage: 6 },
];

export const levelLabels: Record<string, string> = {
  section: 'Section',
  aisle: 'Aisle',
  shelf: 'Rack Face',
  bay: 'Bay',
  row: 'Row',
  bin: 'Bin',
};

export const levelColors: Record<string, string> = {
  section: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  aisle: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  shelf: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  bay: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  row: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  bin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};
