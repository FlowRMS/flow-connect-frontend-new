import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import EmailHelperContent from '@/components/EmailHelperContent';

export default function EmailHelperPage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <EmailHelperContent />
      </div>
    </div>
  );
}
