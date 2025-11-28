'use client';

import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import CRMAuthContent from '@/components/CRMAuthContent';

export default function CRMAuthPage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <CRMAuthContent />
      </div>
    </div>
  );
}
