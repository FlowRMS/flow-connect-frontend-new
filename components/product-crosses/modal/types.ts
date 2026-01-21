/**
 * Product Cross Results Modal Types
 */

import type { ProductCross } from '../ProductCrossesContent';

export interface CrossResult {
  id: string;
  productName: string;
  manufacturer: string;
  partNumber: string;
  description: string;
  crossType: 'direct' | 'upgrade' | 'value';
  source: 'known' | 'ai';
  reasoning?: string;
  isSelected: boolean;
  specifications?: Record<string, string>;
}

export interface ProductCrossResultsModalProps {
  isOpen: boolean;
  cross: ProductCross;
  onClose: () => void;
  onSave: (cross: ProductCross) => void;
  onDelete?: (id: string) => void;
  onRefresh?: () => void;
  isSaving?: boolean;
}

export interface OriginalProduct {
  name: string;
  manufacturer: string;
  partNumber: string;
  description: string;
  specifications: Record<string, string>;
}
