"use client";

import { useState, createContext, useContext } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { Toaster } from "../ui/toaster";

const SidebarContext = createContext({
  isDesktopCollapsed: false,
  isMobileOpen: false,
  toggleSidebar: () => {},
});

export const useSidebarState = () => useContext(SidebarContext);

export function Layout({ children }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] =
    useState(false);

  const toggleSidebar = () => {
    // On mobile, toggle open/close
    // On desktop, toggle expanded/collapsed
    if (window.innerWidth < 768) {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed);
    }
  };

  return (
    <SidebarContext.Provider
      value={{
        isDesktopCollapsed: isDesktopSidebarCollapsed,
        isMobileOpen: isMobileSidebarOpen,
        toggleSidebar,
      }}
    >
      <Toaster />
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          isDesktopCollapsed={isDesktopSidebarCollapsed}
          onToggle={toggleSidebar}
        />

        <div className="flex flex-col flex-1 min-w-0 w-full min-h-0">
          <Header onToggleSidebar={toggleSidebar} />
          <main className="flex-1 min-h-0 min-w-0 p-6 overflow-y-auto overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
