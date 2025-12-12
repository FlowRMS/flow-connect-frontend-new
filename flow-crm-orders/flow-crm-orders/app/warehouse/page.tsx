import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import WarehouseOverviewContent from '@/components/warehouse/WarehouseOverviewContent';

export default function WarehousePage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <WarehouseOverviewContent />
      </div>
    </div>
  );
}
