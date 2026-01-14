/**
 * NotesTab Component
 * Displays linked notes for the order using the centralized RelatedNotesSection
 */

'use client';

import React from 'react';
import { RelatedNotesSection } from '@/components/shared/RelatedNotesSection';

interface NotesTabProps {
  orderId: string;
}

export function NotesTab({ orderId }: NotesTabProps) {
  return <RelatedNotesSection entityId={orderId} sourceType="ORDERS" sourceEntityType="ORDER" />;
}
