import { Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import BuySellContent from '@/components/financial/BuySellContent';

export default function BuySellPage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading...</div>}>
          <BuySellContent />
        </Suspense>
      </div>
    </div>
  );
}
