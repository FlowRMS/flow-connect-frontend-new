/**
 * NotesTab Component
 * Displays linked notes for the invoice using the centralized RelatedNotesSection
 */

'use client';

import React from 'react';
import { RelatedNotesSection } from '@/components/shared/RelatedNotesSection';

interface NotesTabProps {
  invoiceId: string;
}

export function NotesTab({ invoiceId }: NotesTabProps) {
  return <RelatedNotesSection entityId={invoiceId} sourceType="INVOICES" sourceEntityType="INVOICE" />;
}
