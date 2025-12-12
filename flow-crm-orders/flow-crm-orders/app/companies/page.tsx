import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import CompaniesContent from '@/components/CompaniesContent';

export default function CompaniesPage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <CompaniesContent />
      </div>
    </div>
  );
}
