import { Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import WarehouseInventoryContent from '@/components/warehouse/WarehouseInventoryContent';

export default function WarehouseInventoryPage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading...</div>}>
          <WarehouseInventoryContent />
        </Suspense>
      </div>
    </div>
  );
}
