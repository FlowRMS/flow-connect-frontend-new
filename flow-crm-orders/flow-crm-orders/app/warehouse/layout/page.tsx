import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import WarehouseLayoutContent from '@/components/warehouse/WarehouseLayoutContent';

export default function WarehouseLayoutPage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <WarehouseLayoutContent />
      </div>
    </div>
  );
}
