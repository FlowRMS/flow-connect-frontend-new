import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import NotesContent from '@/components/NotesContent';
import PendingActions from '@/components/PendingActions';

export default function NotesPage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <NotesContent />
      </div>

      {/* Right Sidebar - Pending Actions */}
      <PendingActions />
    </div>
  );
}
