/**
 * LinkedObjectsTab Component
 * Displays related entities connected to the check using the centralized ConnectedEntitiesSection
 */

'use client';

import React from 'react';
import { ConnectedEntitiesSection } from '@/components/shared/ConnectedEntitiesSection';

interface LinkedObjectsTabProps {
  checkId: string;
}

export function LinkedObjectsTab({ checkId }: LinkedObjectsTabProps) {
  return (
    <div className="h-full overflow-auto">
      <div className="p-4">
        <ConnectedEntitiesSection
          entityId={checkId}
          sourceEntityType="CHECK"
          title="Linked Objects"
          showAddLinkButton={true}
          enabledCategories={['contacts', 'companies', 'pre-opportunities', 'quotes', 'orders', 'invoices', 'checks', 'jobs', 'files']}
        />
      </div>
    </div>
  );
}
