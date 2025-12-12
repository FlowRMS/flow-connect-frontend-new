import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import SettingsContent from '@/components/SettingsContent';

export default function SettingsPage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <SettingsContent />
      </div>
    </div>
  );
}
