import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import WarehouseDeliveriesContent from '@/components/warehouse/WarehouseDeliveriesContent';

export default function WarehouseDeliveriesPage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <WarehouseDeliveriesContent />
      </div>
    </div>
  );
}
