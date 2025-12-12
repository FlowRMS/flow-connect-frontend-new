import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import ChecksContent from '@/components/commissions/ChecksContent';

export default function ChecksPage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <ChecksContent />
      </div>
    </div>
  );
}
