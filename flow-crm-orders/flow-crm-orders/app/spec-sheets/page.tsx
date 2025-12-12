'use client';

import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

const SpecSheetsContent = dynamic(
  () => import('../../components/submittals/SpecSheetsContent'),
  {
    ssr: false,
    loading: () => <div className="flex-1 flex items-center justify-center"><div className="text-[var(--muted-foreground)]">Loading...</div></div>
  }
);

export default function SpecSheetsPage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <SpecSheetsContent />
      </div>
    </div>
  );
}
