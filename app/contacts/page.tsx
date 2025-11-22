import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import ContactsContent from '@/components/ContactsContent';
import PendingActions from '@/components/PendingActions';

export default function ContactsPage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <ContactsContent />
      </div>

      {/* Right Sidebar - Pending Actions */}
      <PendingActions />
    </div>
  );
}
