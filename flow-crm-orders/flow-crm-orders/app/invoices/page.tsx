import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import InvoicesContent from '@/components/invoices/InvoicesContent';

export default function InvoicesPage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <InvoicesContent />
      </div>
    </div>
  );
}
