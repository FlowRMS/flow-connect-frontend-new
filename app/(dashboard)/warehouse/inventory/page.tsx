'use client';

import { Suspense } from 'react';
import { ApolloProvider } from '@apollo/client/react';
import client from '@/lib/analytics/apolloClient';
import WarehouseInventoryContent from '@/components/warehouse/WarehouseInventoryContent';

export default function WarehouseInventoryPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="text-[var(--muted-foreground)]">Loading...</div></div>}>
      <ApolloProvider client={client}>
        <WarehouseInventoryContent />
      </ApolloProvider>
    </Suspense>
  );
}
