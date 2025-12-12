import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import CommissionsContent from '@/components/commissions/CommissionsContent';

export default function CommissionsPage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <CommissionsContent />
      </div>
    </div>
  );
}
