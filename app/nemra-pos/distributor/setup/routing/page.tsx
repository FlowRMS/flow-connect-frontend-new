'use client';

import RoutingPanel from '@/components/routing/routing-panel';

export default function DistributorRoutingPage() {
  return (
    <RoutingPanel
      role="distributor"
      title="Routing"
      description="Configure how POS data is routed to the correct manufacturers"
    />
  );
}
