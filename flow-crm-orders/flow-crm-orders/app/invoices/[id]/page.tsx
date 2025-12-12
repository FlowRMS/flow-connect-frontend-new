'use client';

import { use } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import InvoiceDetailContent from '@/components/invoices/InvoiceDetailContent';

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);

  return (
    <div className="flex h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <InvoiceDetailContent invoiceId={resolvedParams.id} />
      </div>
    </div>
  );
}
