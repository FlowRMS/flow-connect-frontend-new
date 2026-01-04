/**
 * LinkedObjectsTab Component
 * Displays related entities connected to the invoice using the centralized ConnectedEntitiesSection
 */

'use client';

import React from 'react';
import { ConnectedEntitiesSection } from '@/components/shared/ConnectedEntitiesSection';

interface LinkedObjectsTabProps {
  invoiceId: string;
}

export function LinkedObjectsTab({ invoiceId }: LinkedObjectsTabProps) {
  return (
    <div className="h-full overflow-auto">
      <div className="p-4">
        <ConnectedEntitiesSection
          entityId={invoiceId}
          sourceEntityType="INVOICE"
          title="Linked Objects"
          showAddLinkButton={true}
        />
      </div>
    </div>
  );
}
