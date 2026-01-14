/**
 * NotesTab Component
 * Displays linked notes for the check using the centralized RelatedNotesSection
 */

'use client';

import React from 'react';
import { RelatedNotesSection } from '@/components/shared/RelatedNotesSection';

interface NotesTabProps {
  checkId: string;
}

export function NotesTab({ checkId }: NotesTabProps) {
  return <RelatedNotesSection entityId={checkId} sourceType="CHECKS" sourceEntityType="CHECK" />;
}
