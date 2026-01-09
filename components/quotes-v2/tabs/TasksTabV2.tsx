/**
 * TasksTabV2 Component
 * Displays linked tasks for the quote using the centralized RelatedTasksSection
 */

'use client';

import React from 'react';
import { RelatedTasksSection } from '@/components/shared/RelatedTasksSection';

interface TasksTabV2Props {
  quoteId: string;
}

export function TasksTabV2({ quoteId }: TasksTabV2Props) {
  return <RelatedTasksSection entityId={quoteId} sourceType="QUOTES" sourceEntityType="QUOTE" />;
}

export default TasksTabV2;
