'use client';

import { Suspense, lazy, useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar, { MobileSidebarProvider } from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { SidebarConfigProvider } from '@/contexts/SidebarConfigContext';
import { NavigationMorphProvider } from '@/contexts/NavigationMorphContext';
import { useWelcomeAnimation } from '@/components/hooks/useWelcomeAnimation';
import { FlowChatProvider } from '@/contexts/FlowChatContext';
import { FlowChat } from '@/components/flowchat';

// Lazy load the welcome animation for better performance
const WelcomeAnimation = lazy(() => import('@/components/WelcomeAnimation'));

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { showWelcome, isReady, completeWelcome } = useWelcomeAnimation();
  const pathname = usePathname();
  const [transitionState, setTransitionState] = useState<'idle' | 'entering'>('idle');
  const prevPathnameRef = useRef(pathname);
  const isFirstRender = useRef(true);

  // Smooth morph page transition
  // This effect intentionally sets state to trigger page transition animations on route changes
  useEffect(() => {
    // Skip animation on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (prevPathnameRef.current !== pathname) {
      // Start with entering state (content starts scaled down and faded)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: triggering page transition on route change
      setTransitionState('entering');

      // After a brief moment, trigger the smooth entrance animation
      const timer = setTimeout(() => {
        setTransitionState('idle');
      }, 50);

      prevPathnameRef.current = pathname;
      return () => clearTimeout(timer);
    }
  }, [pathname]);

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

  // Animation styles based on state
  // NOTE: We only use opacity animation, NOT transform, because CSS transforms
  // create a new stacking context that breaks fixed-position modals inside children.
  // Modals with "fixed inset-0" would only cover the transformed container, not the viewport.
  const getTransformStyle = () => {
    if (transitionState === 'entering') {
      return {
        opacity: 0,
        transition: 'none',
      };
    }
    return {
      opacity: 1,
      transition: 'opacity 300ms cubic-bezier(0.22, 1, 0.36, 1)',
    };
  };

  return (
    <SidebarConfigProvider>
      <NavigationMorphProvider>
        <MobileSidebarProvider>
          <FlowChatProvider>
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
              {/* Smooth morph transition with scale + fade + slide */}
              <div
                className="flex-1 flex flex-col overflow-hidden"
                style={getTransformStyle()}
              >
                {children}
              </div>
            </div>
          </div>

          {/* FlowChat - Global AI Assistant */}
          <FlowChat />
          </FlowChatProvider>
        </MobileSidebarProvider>
      </NavigationMorphProvider>
    </SidebarConfigProvider>
  );
}
