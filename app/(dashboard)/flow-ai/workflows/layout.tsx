'use client';

import { WorkflowTenantProvider } from '@/lib/flow-ai/workflow-tenant-context';

export default function WorkflowsLayout({ children }: { children: React.ReactNode }) {
  return <WorkflowTenantProvider>{children}</WorkflowTenantProvider>;
}

