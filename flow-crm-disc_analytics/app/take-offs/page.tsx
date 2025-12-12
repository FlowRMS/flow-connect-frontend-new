import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import TakeoffsContent from '@/components/TakeoffsContent';

export default function TakeOffsPage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <TakeoffsContent />
      </div>
    </div>
  );
}
