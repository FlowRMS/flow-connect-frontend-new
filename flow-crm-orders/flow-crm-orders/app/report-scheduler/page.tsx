import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import ReportSchedulerContent from '@/components/ReportSchedulerContent';

export default function ReportSchedulerPage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <ReportSchedulerContent />
      </div>
    </div>
  );
}
