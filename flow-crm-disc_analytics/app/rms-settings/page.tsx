import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import RMSSettingsContent from '@/components/rms-settings/RMSSettingsContent';

export default function RMSSettingsPage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <RMSSettingsContent />
      </div>
    </div>
  );
}
