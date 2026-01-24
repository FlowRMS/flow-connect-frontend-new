/**
 * LinkedObjectsTab Component
 * Displays related entities connected to the order using the centralized ConnectedEntitiesSection
 */

'use client';

import React from 'react';
import { ConnectedEntitiesSection } from '@/components/shared/ConnectedEntitiesSection';

interface LinkedObjectsTabProps {
  orderId: string;
}

export function LinkedObjectsTab({ orderId }: LinkedObjectsTabProps) {
  return (
    <div className="h-full overflow-auto">
      <div className="p-4">
        <ConnectedEntitiesSection
          entityId={orderId}
          sourceEntityType="ORDER"
          title="Linked Objects"
          showAddLinkButton={true}
          enabledCategories={['contacts', 'companies', 'customers', 'pre-opportunities', 'quotes', 'orders', 'invoices', 'checks', 'jobs', 'files']}
        />
      </div>
    </div>
  );
}
