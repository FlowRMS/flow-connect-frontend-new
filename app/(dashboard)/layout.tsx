'use client';

import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      {/* Shared Sidebar - only rendered once, persists across navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Shared TopBar - only rendered once, persists across navigation */}
        <TopBar />
        {/* Only this children area changes on navigation */}
        {children}
      </div>
    </div>
  );
}
