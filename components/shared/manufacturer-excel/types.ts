/**
 * Manufacturer Excel Types
 * Template metadata for manufacturer-specific Excel downloads
 */

import type { PDFEntityType } from '@/components/lib/graphql/pdf-entities';

export type ManufacturerTemplateId = 'ammo-international-quote';

export interface ManufacturerTemplate {
  id: ManufacturerTemplateId;
  name: string;
  description: string;
  factoryName: string;
  entityTypes: PDFEntityType[];
}
