'use client';

import { use } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import CheckDetailContent from '@/components/checks/CheckDetailContent';

export default function CheckDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);

  return (
    <div className="flex h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <CheckDetailContent checkId={resolvedParams.id} />
      </div>
    </div>
  );
}
