import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import QuotesContent from '@/components/QuotesContent';

export default function QuotesPage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <QuotesContent />
      </div>
    </div>
  );
}
