import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import ContactsContent from '@/components/ContactsContent';

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
    </div>
  );
}
