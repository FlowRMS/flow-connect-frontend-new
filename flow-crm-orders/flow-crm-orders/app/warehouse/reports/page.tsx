import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import WarehouseReportsContent from '@/components/warehouse/WarehouseReportsContent';

export default function WarehouseReportsPage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <WarehouseReportsContent />
      </div>
    </div>
  );
}
