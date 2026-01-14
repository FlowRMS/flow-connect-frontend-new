/**
 * NotesTabV2 Component
 * Displays linked notes for the quote using the centralized RelatedNotesSection
 */

'use client';

import React from 'react';
import { RelatedNotesSection } from '@/components/shared/RelatedNotesSection';

interface NotesTabV2Props {
  quoteId: string;
}

export function NotesTabV2({ quoteId }: NotesTabV2Props) {
  return <RelatedNotesSection entityId={quoteId} sourceType="QUOTES" sourceEntityType="QUOTE" />;
}

export default NotesTabV2;
