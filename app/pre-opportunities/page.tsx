import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import PreOpportunitiesContent from '@/components/PreOpportunitiesContent';

export default function PreOpportunitiesPage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <PreOpportunitiesContent />
      </div>
    </div>
  );
}
