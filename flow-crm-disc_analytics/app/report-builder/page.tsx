import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import ReportBuilderContent from '@/components/ReportBuilderContent';

export default function ReportBuilderPage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <ReportBuilderContent />
      </div>
    </div>
  );
}
