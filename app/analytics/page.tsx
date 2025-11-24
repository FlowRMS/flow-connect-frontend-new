import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import AnalyticsContent from '@/components/AnalyticsContent';

export default function AnalyticsPage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <AnalyticsContent />
      </div>
    </div>
  );
}
