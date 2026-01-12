/**
 * TasksTab Component
 * Displays linked tasks for the order using the centralized RelatedTasksSection
 */

'use client';

import React from 'react';
import { RelatedTasksSection } from '@/components/shared/RelatedTasksSection';

interface TasksTabProps {
  orderId: string;
}

export function TasksTab({ orderId }: TasksTabProps) {
  return <RelatedTasksSection entityId={orderId} sourceType="ORDERS" sourceEntityType="ORDER" />;
}
