import { Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import FlowmailContent from '@/components/FlowmailContent';

export default function FlowmailPage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="text-[var(--muted-foreground)]">Loading...</div></div>}>
          <FlowmailContent />
        </Suspense>
      </div>
    </div>
  );
}
