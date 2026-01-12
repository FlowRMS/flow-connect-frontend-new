'use client';

import { Suspense, lazy } from 'react';
import Sidebar, { MobileSidebarProvider } from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { SidebarConfigProvider } from '@/contexts/SidebarConfigContext';
import { useWelcomeAnimation } from '@/components/hooks/useWelcomeAnimation';

// Lazy load the welcome animation for better performance
const WelcomeAnimation = lazy(() => import('@/components/WelcomeAnimation'));

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { showWelcome, isReady, completeWelcome } = useWelcomeAnimation();

  // Show a blank screen matching the background until we know if we need the animation
  // This prevents any flash of the dashboard before the welcome animation
  if (!isReady) {
    return (
      <div
        className="fixed inset-0 z-[9999]"
        style={{ backgroundColor: 'var(--background, #ffffff)' }}
      />
    );
  }

  return (
    <SidebarConfigProvider>
      <MobileSidebarProvider>
        {/* Welcome Animation Overlay */}
        {showWelcome && (
          <Suspense fallback={
            <div
              className="fixed inset-0 z-[9999]"
              style={{ backgroundColor: 'var(--background, #ffffff)' }}
            />
          }>
            <WelcomeAnimation onComplete={completeWelcome} />
          </Suspense>
        )}

        <div className="flex h-screen bg-[var(--background)]">
          {/* Shared Sidebar - only rendered once, persists across navigation */}
          <Sidebar />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Shared TopBar - only rendered once, persists across navigation */}
            <TopBar />
            {/* Only this children area changes on navigation - scrollable */}
            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </div>
        </div>
      </MobileSidebarProvider>
    </SidebarConfigProvider>
  );
}
