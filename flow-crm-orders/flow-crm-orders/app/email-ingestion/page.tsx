import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import EmailIngestionContent from '@/components/EmailIngestionContent';

export default function EmailIngestionPage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <EmailIngestionContent />
      </div>
    </div>
  );
}
