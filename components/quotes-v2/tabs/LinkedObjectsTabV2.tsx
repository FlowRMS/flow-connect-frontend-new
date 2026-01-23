/**
 * LinkedObjectsTabV2 Component
 * Displays related entities connected to the quote using the centralized ConnectedEntitiesSection
 */

'use client';

import React from 'react';
import { ConnectedEntitiesSection } from '@/components/shared/ConnectedEntitiesSection';

interface LinkedObjectsTabV2Props {
  quoteId: string;
}

export function LinkedObjectsTabV2({ quoteId }: LinkedObjectsTabV2Props) {
  return (
    <div className="h-full overflow-auto">
      <div className="px-6 py-4">
        <ConnectedEntitiesSection
          entityId={quoteId}
          sourceEntityType="QUOTE"
          title="Linked Objects"
          showAddLinkButton={true}
          enabledCategories={['contacts', 'companies', 'customers', 'pre-opportunities', 'quotes', 'orders', 'invoices', 'checks', 'jobs', 'files']}
        />
      </div>
    </div>
  );
}

export default LinkedObjectsTabV2;
