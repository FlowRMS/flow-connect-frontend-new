/**
 * TasksTab Component
 * Displays linked tasks for the invoice using the centralized RelatedTasksSection
 */

'use client';

import React from 'react';
import { RelatedTasksSection } from '@/components/shared/RelatedTasksSection';

interface TasksTabProps {
  invoiceId: string;
}

export function TasksTab({ invoiceId }: TasksTabProps) {
  return <RelatedTasksSection entityId={invoiceId} sourceType="INVOICES" sourceEntityType="INVOICE" />;
}
