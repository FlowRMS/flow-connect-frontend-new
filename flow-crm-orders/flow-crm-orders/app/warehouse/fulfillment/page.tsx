import { Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import WarehouseFulfillmentContent from '@/components/warehouse/WarehouseFulfillmentContent';

export default function WarehouseFulfillmentPage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading...</div>}>
          <WarehouseFulfillmentContent />
        </Suspense>
      </div>
    </div>
  );
}
