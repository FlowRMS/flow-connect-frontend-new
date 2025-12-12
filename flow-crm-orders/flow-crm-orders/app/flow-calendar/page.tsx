import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import FlowCalendarContent from '@/components/FlowCalendarContent';

export default function FlowCalendarPage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <FlowCalendarContent />
      </div>
    </div>
  );
}
