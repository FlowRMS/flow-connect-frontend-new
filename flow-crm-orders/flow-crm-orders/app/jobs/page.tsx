import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import JobsContent from '@/components/JobsContent';

export default function JobsPage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <JobsContent />
      </div>
    </div>
  );
}
