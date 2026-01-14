/**
 * TasksTab Component
 * Displays linked tasks for the check using the centralized RelatedTasksSection
 */

'use client';

import React from 'react';
import { RelatedTasksSection } from '@/components/shared/RelatedTasksSection';

interface TasksTabProps {
  checkId: string;
}

export function TasksTab({ checkId }: TasksTabProps) {
  return <RelatedTasksSection entityId={checkId} sourceType="CHECKS" sourceEntityType="CHECK" />;
}
