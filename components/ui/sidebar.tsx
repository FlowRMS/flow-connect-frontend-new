import React, { createContext, useContext, useState } from 'react';

type SidebarState = 'open' | 'collapsed';

interface SidebarContextValue {
  state: SidebarState;
  toggleSidebar: () => void;
  setState: (s: SidebarState) => void;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

export function SidebarProvider({ children, defaultOpen = true }: { children: React.ReactNode; defaultOpen?: boolean }) {
  const [state, setStateRaw] = useState<SidebarState>(defaultOpen ? 'open' : 'open');

  const setState = (s: SidebarState) => setStateRaw(s);
  const toggleSidebar = () => setStateRaw((s) => (s === 'collapsed' ? 'open' : 'collapsed'));

  return (
    <SidebarContext.Provider value={{ state, toggleSidebar, setState }}>{children}</SidebarContext.Provider>
  );
}

export function SidebarTrigger({ children }: { children: React.ReactNode }) {
  const ctx = useContext(SidebarContext);
  if (!ctx) return <>{children}</>;
  return (
    <button type="button" onClick={ctx.toggleSidebar} aria-expanded={ctx.state !== 'collapsed'}>
      {children}
    </button>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}

export default SidebarProvider;
