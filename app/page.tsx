import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import DashboardContent from '@/components/DashboardContent';

export default function Home() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <DashboardContent />
      </div>
    </div>
  );
}
