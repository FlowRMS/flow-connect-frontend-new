import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import CreditsContent from '@/components/credits/CreditsContent';

export default function CreditsPage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <CreditsContent />
      </div>
    </div>
  );
}
