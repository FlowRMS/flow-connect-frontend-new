'use client';

import RoutingPanel from '@/components/routing/routing-panel';

export default function ManufacturerRoutingPage() {
  return (
    <RoutingPanel
      role="manufacturer"
      title="Routing"
      description="Configure how POS data is routed to the correct rep firms"
    />
  );
}
