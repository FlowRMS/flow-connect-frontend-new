import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import WarehouseReturnsContent from '@/components/warehouse/WarehouseReturnsContent';

export default function WarehouseReturnsPage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <WarehouseReturnsContent />
      </div>
    </div>
  );
}
