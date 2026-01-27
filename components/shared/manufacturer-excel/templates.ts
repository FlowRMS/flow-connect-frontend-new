/**
 * Manufacturer Excel Templates
 * Define available manufacturer-specific templates and entity filters
 */

import type { PDFEntityType } from '@/components/lib/graphql/pdf-entities';
import type { ManufacturerTemplate } from './types';

export const MANUFACTURER_TEMPLATES: ManufacturerTemplate[] = [
  {
    id: 'ammo-international-quote',
    name: 'Ammo International (Quote)',
    description: 'Quote export formatted for Ammo International.',
    factoryName: 'Ammo International',
    entityTypes: ['QUOTES'],
  },
];

export function getTemplatesForEntity(entityType: PDFEntityType): ManufacturerTemplate[] {
  return MANUFACTURER_TEMPLATES.filter((template) =>
    template.entityTypes.includes(entityType)
  );
}
