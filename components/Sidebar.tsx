'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebarConfig } from '@/contexts/SidebarConfigContext';
import { useNavigationMorph, isMorphableItem } from '@/contexts/NavigationMorphContext';
import { useUnsavedChangesContext } from '@/contexts/UnsavedChangesContext';

const SCROLL_STORAGE_KEY = 'sidebar-scroll-position';

// Smooth spring config for the sliding pill
const pillSpring = {
  type: 'spring' as const,
  stiffness: 350,
  damping: 30,
  mass: 0.8,
};

// Custom hook to detect mobile screen size
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

// Export mobile sidebar context for use in layout
export const MobileSidebarContext = React.createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isMobile: boolean;
}>({
  isOpen: false,
  setIsOpen: () => {},
  isMobile: false,
});

export function MobileSidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  // Close sidebar when switching from mobile to desktop
  useEffect(() => {
    if (!isMobile) setIsOpen(false);
  }, [isMobile]);

  return (
    <MobileSidebarContext.Provider value={{ isOpen, setIsOpen, isMobile }}>
      {children}
    </MobileSidebarContext.Provider>
  );
}

// Icon mapping for each nav item
const iconMap: Record<string, React.ReactNode> = {
  // FlowAI icons
  'flow-ai-scan': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <path d="M14 2v6h6"/>
      <path d="M16 13H8"/>
      <path d="M16 17H8"/>
      <path d="M10 9H8"/>
    </svg>
  ),
  'flow-ai-queue': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  ),
  'flow-ai-upload': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  'flow-ai-templates': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18"/>
      <path d="M9 21V9"/>
    </svg>
  ),
  'flow-ai-workflows': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="6" height="6" rx="1"/>
      <rect x="15" y="3" width="6" height="6" rx="1"/>
      <rect x="9" y="15" width="6" height="6" rx="1"/>
      <path d="M6 9v3a2 2 0 002 2h2"/>
      <path d="M18 9v3a2 2 0 01-2 2h-2"/>
    </svg>
  ),
  'flow-ai-chat': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      <circle cx="9" cy="10" r="1" fill="currentColor"/>
      <circle cx="12" cy="10" r="1" fill="currentColor"/>
      <circle cx="15" cy="10" r="1" fill="currentColor"/>
    </svg>
  ),
  'activity-feed': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  'tasks': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 11l3 3L22 4"/>
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
    </svg>
  ),
  'notes': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
    </svg>
  ),
  'jobs': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
    </svg>
  ),
  'pre-quotes': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  ),
  'flowmail': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M22 7l-10 7L2 7"/>
      <circle cx="18" cy="6" r="4" fill="var(--primary)" stroke="var(--primary)"/>
    </svg>
  ),
  'calendar': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>
    </svg>
  ),
  'campaigns-rules': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M22 7l-10 7L2 7"/>
    </svg>
  ),
  'email-ingestion': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M22 7l-10 7L2 7"/>
      <path d="M12 14v6" strokeLinecap="round"/>
      <path d="M9 17l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  'email-templates': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M22 7l-10 7L2 7"/>
      <path d="M6 12h4M6 15h8"/>
    </svg>
  ),
  'take-offs': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <path d="M14 2v6h6"/>
      <path d="M12 18v-6M9 15l3-3 3 3"/>
    </svg>
  ),
  'product-crosses': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 7h10M7 12h10M7 17h10" strokeLinecap="round"/>
      <path d="M3 7l4-4m0 8l-4-4m4 10l-4-4m18 4l-4-4m0-8l4-4m-4 8l4-4" strokeLinecap="round"/>
    </svg>
  ),
  'quotes': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <path d="M14 2v6h6"/>
      <path d="M8 13h8M8 17h8M8 9h2"/>
    </svg>
  ),
  'orders': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
      <path d="M3 6h18"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
  ),
  'adjustments': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      <circle cx="12" cy="12" r="4"/>
    </svg>
  ),
  'credits': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M8 12h8"/>
    </svg>
  ),
  'acknowledgements': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 12l2 2 4-4"/>
      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ),
  'invoices': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <path d="M14 2v6h6"/>
      <path d="M8 12h8M8 16h4"/>
      <circle cx="16" cy="16" r="2"/>
    </svg>
  ),
  'statements': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/>
      <path d="M9 12h6M9 16h4"/>
      <path d="M15 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  'commissions': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
    </svg>
  ),
  'buysell': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3h18v18H3z"/>
      <path d="M3 9h18"/>
      <path d="M9 21V9"/>
      <path d="M6 13l2 2 2-2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18 15l-2-2-2 2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  'contacts': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  'companies': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <path d="M9 6h6M9 10h6M9 14h6M9 18h6"/>
    </svg>
  ),
  'products': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
      <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/>
    </svg>
  ),
  'spec-sheets': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <path d="M14 2v6h6"/>
      <path d="M8 13h8M8 17h5"/>
    </svg>
  ),
  'customers': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/>
      <path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  'files': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
    </svg>
  ),
  'settings': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round"/>
    </svg>
  ),
  'integrations': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M22 7l-10 7L2 7"/>
    </svg>
  ),
  'email-integrations': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M22 7l-10 7L2 7"/>
    </svg>
  ),
  'data-integrations': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      <circle cx="12" cy="12" r="4"/>
    </svg>
  ),
  'manufacturer-integrations': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 20h20M4 20V10l8-6 8 6v10"/>
      <path d="M9 20v-6h6v6"/>
      <path d="M9 10h.01M15 10h.01"/>
    </svg>
  ),
  'manufacturers': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 20h20M4 20V10l8-6 8 6v10"/>
      <path d="M9 20v-6h6v6"/>
      <path d="M9 10h.01M15 10h.01"/>
    </svg>
  ),
  'pdf-templates': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <path d="M14 2v6h6"/>
      <path d="M9 13h6M9 17h6"/>
    </svg>
  ),
  'report-scheduler': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>
    </svg>
  ),
  // Warehouse icons
  'warehouse-overview': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  'warehouse-inventory': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  'warehouse-fulfillment': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="3" width="15" height="13"/>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  'warehouse-deliveries': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 16v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h8a2 2 0 012 2v2"/>
      <path d="M12 12l4-4m0 0l4 4m-4-4v12"/>
    </svg>
  ),
  'warehouse-layout': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18M9 21V9"/>
    </svg>
  ),
  'warehouse-returns': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
    </svg>
  ),
  'warehouse-reports': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  'warehouse-settings': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
  'warehouse-manufacturer-profiles': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21h18"/>
      <path d="M5 21V7l8-4v18"/>
      <path d="M19 21V11l-6-4"/>
      <path d="M9 9v.01"/>
      <path d="M9 12v.01"/>
      <path d="M9 15v.01"/>
      <path d="M9 18v.01"/>
    </svg>
  ),
  'warehouse-cycle-counts': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/>
      <path d="M9 14l2 2 4-4"/>
    </svg>
  ),
  // Analytics icons
  'analytics-order-dashboard': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  'analytics-product-dashboard': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
      <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/>
    </svg>
  ),
  'analytics-product-pricing': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
    </svg>
  ),
  'analytics-commission-gap': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3v18h18"/>
      <path d="M18 17V9"/>
      <path d="M13 17V5"/>
      <path d="M8 17v-3"/>
    </svg>
  ),
  'analytics-orders-report': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <path d="M14 2v6h6"/>
      <path d="M16 13H8M16 17H8M10 9H8"/>
    </svg>
  ),
  'analytics-check-detail': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 11l3 3L22 4"/>
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
    </svg>
  ),
  'analytics-quote-detail': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <path d="M14 2v6h6"/>
      <path d="M8 13h8M8 17h8M8 9h2"/>
    </svg>
  ),
  'analytics-order-split-rate': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  ),
  'analytics-orders-pivot': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18M9 3v18"/>
    </svg>
  ),
  'analytics-check-pivot': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18M9 3v18"/>
    </svg>
  ),
  'analytics-quote-pivot': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18M9 3v18"/>
    </svg>
  ),
  'analytics-commission-state-pivot': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18M9 3v18"/>
    </svg>
  ),
  'analytics-pre-opportunity-detail': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <path d="M14 2v6h6"/>
      <path d="M8 13h8M8 17h8M8 9h2"/>
    </svg>
  ),
  'analytics-pre-opportunity-pivot': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18M9 3v18"/>
    </svg>
  ),
  'analytics-job-pivot': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18M9 3v18"/>
    </svg>
  ),
  // Preview section
  'flow-agents': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4"/>
      <path d="M12 12v4"/>
      <path d="M8 20h8"/>
      <path d="M9 16l-2 4"/>
      <path d="M15 16l2 4"/>
      <circle cx="12" cy="8" r="1" fill="currentColor"/>
    </svg>
  ),
};

// Export iconMap for use in other components
export { iconMap };

// Simple, smooth click highlight for sidebar items
function ClickHighlight({ isActive }: { isActive: boolean }) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-lg bg-[var(--primary)]/15 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        />
      )}
    </AnimatePresence>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isOpen, setIsOpen, isMobile } = React.useContext(MobileSidebarContext);
  const { config, toggleGroup } = useSidebarConfig();
  const navRef = useRef<HTMLElement>(null);
  const { registerSidebarItem, startMorph, isAnimating, activeItemId } = useNavigationMorph();
  const { requestNavigation, hasUnsavedChanges } = useUnsavedChangesContext();

  // Track which item was just clicked for animation
  const [clickedItemId, setClickedItemId] = useState<string | null>(null);

  // Track visually selected item - updates immediately on click, before page loads
  const [visuallySelectedId, setVisuallySelectedId] = useState<string | null>(null);

  // Store refs to all nav items for pill position calculation
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Track pill position for smooth sliding animation
  const [pillPosition, setPillPosition] = useState<{ top: number; height: number } | null>(null);

  // Update pill position when visual selection changes
  useEffect(() => {
    if (visuallySelectedId && itemRefs.current.has(visuallySelectedId)) {
      const element = itemRefs.current.get(visuallySelectedId);
      const nav = navRef.current;
      if (element && nav) {
        const elementRect = element.getBoundingClientRect();
        const navRect = nav.getBoundingClientRect();
        setPillPosition({
          top: elementRect.top - navRect.top + nav.scrollTop,
          height: elementRect.height,
        });
      }
    }
  }, [visuallySelectedId, isCollapsed]);

  // Also update pill position on scroll
  useEffect(() => {
    const updatePillOnScroll = () => {
      if (visuallySelectedId && itemRefs.current.has(visuallySelectedId)) {
        const element = itemRefs.current.get(visuallySelectedId);
        const nav = navRef.current;
        if (element && nav) {
          const elementRect = element.getBoundingClientRect();
          const navRect = nav.getBoundingClientRect();
          setPillPosition({
            top: elementRect.top - navRect.top + nav.scrollTop,
            height: elementRect.height,
          });
        }
      }
    };

    const nav = navRef.current;
    if (nav) {
      nav.addEventListener('scroll', updatePillOnScroll, { passive: true });
      return () => nav.removeEventListener('scroll', updatePillOnScroll);
    }
  }, [visuallySelectedId]);

  // Sync visual selection with pathname when page actually loads
  useEffect(() => {
    // Find the item that matches the current pathname
    const allItems = config.groups.flatMap(g => g.items.filter(i => i.enabled));
    const matchingItem = allItems.find(item => {
      const isExactMatchOnly = item.href === '/' || item.href === '/flow-ai';
      return isExactMatchOnly
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(item.href + '/');
    });
    if (matchingItem) {
      setVisuallySelectedId(matchingItem.id);
    }
  }, [pathname, config.groups]);

  // Restore scroll position on mount
  useEffect(() => {
    const savedScroll = sessionStorage.getItem(SCROLL_STORAGE_KEY);
    if (savedScroll && navRef.current) {
      navRef.current.scrollTop = parseInt(savedScroll, 10);
    }
  }, []);

  // Save scroll position on scroll
  const handleScroll = () => {
    if (navRef.current) {
      sessionStorage.setItem(SCROLL_STORAGE_KEY, navRef.current.scrollTop.toString());
    }
  };

  // Handle morphable item click - navigation happens immediately, animation is fire-and-forget
  const handleMorphClick = useCallback((
    e: React.MouseEvent,
    itemId: string,
    href: string,
    isActive: boolean
  ) => {
    // Don't animate if already active
    if (isActive) return;

    // Check for unsaved changes before allowing navigation
    if (hasUnsavedChanges) {
      e.preventDefault();
      const canNavigate = requestNavigation(href, 'sidebar');
      if (!canNavigate) {
        return;
      }
    }

    // IMMEDIATELY update visual selection - this makes the pill slide instantly
    setVisuallySelectedId(itemId);

    // Trigger click animation
    setClickedItemId(itemId);
    setTimeout(() => setClickedItemId(null), 600);

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    // Only morph for morphable items - start animation but don't wait for it
    if (isMorphableItem(itemId)) {
      const icon = iconMap[itemId];
      if (icon) {
        // Fire and forget - don't await, let navigation happen immediately
        startMorph(itemId, icon);
      }
    }

    // Navigation happens immediately - no delay
  }, [startMorph, hasUnsavedChanges, requestNavigation]);

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-60'} bg-[var(--card)] border-r border-[var(--border)] flex flex-col transition-all duration-300`}>
      {/* Logo & Toggle */}
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between gap-2">
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Image
                src="/flow-logo.png"
                alt="FlowCRM"
                width={32}
                height={32}
                className="flex-shrink-0"
              />
              <span className="text-lg font-semibold text-[var(--foreground)]">FlowCRM</span>
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] rounded-md transition-all flex-shrink-0"
              title="Collapse sidebar"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M13 6l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] rounded-md transition-all w-full flex items-center justify-center"
            title="Expand sidebar"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="rotate-180"
            >
              <path d="M13 6l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav ref={navRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-3 relative">
        {/* Single sliding pill that animates between items */}
        {pillPosition && (
          <motion.div
            className="absolute left-3 right-3 bg-[var(--primary)] rounded-lg pointer-events-none z-0"
            initial={false}
            animate={{
              top: pillPosition.top,
              height: pillPosition.height,
            }}
            transition={pillSpring}
          />
        )}
        <div className="relative z-10">
        {config.groups.map((group, groupIndex) => {
          const enabledItems = group.items.filter(item => item.enabled);
          if (enabledItems.length === 0) return null;

          return (
            <div key={group.id} className={groupIndex > 0 ? 'mt-3' : ''}>
              {!isCollapsed ? (
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-[var(--foreground)] uppercase tracking-wider hover:bg-[var(--muted)] rounded-md transition-colors"
                >
                  <span>{group.label}</span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`transition-transform duration-200 ${group.collapsed ? '-rotate-90' : ''}`}
                  >
                    <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              ) : (
                groupIndex > 0 && <div className="mx-2 my-2 border-t border-[var(--border)]" />
              )}

              {(isCollapsed || !group.collapsed) && (
                <div className={!isCollapsed ? 'mt-1' : ''}>
                  {enabledItems.map((item) => {
                    // Use visual selection for the sliding pill - updates instantly on click
                    const isVisuallyActive = visuallySelectedId === item.id;

                    const isMorphable = isMorphableItem(item.id);
                    const isThisAnimating = activeItemId === item.id;
                    const isClicked = clickedItemId === item.id;

                    return (
                      <motion.div
                        key={item.id}
                        ref={(el) => {
                          if (el) {
                            itemRefs.current.set(item.id, el);
                            if (isMorphable) {
                              registerSidebarItem(item.id, el);
                            }
                          }
                        }}
                        whileHover={!isVisuallyActive ? { x: 3 } : {}}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      >
                        <Link
                          href={item.href}
                          prefetch={true}
                          onClick={(e) => handleMorphClick(e, item.id, item.href, isVisuallyActive)}
                          title={isCollapsed ? item.name : undefined}
                          className={`
                            relative w-full flex items-center overflow-hidden
                            ${isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'}
                            rounded-lg text-sm font-medium mb-1
                            ${isVisuallyActive
                              ? 'text-white'
                              : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                            }
                          `}
                        >
                          {/* Click highlight */}
                          <ClickHighlight isActive={isClicked && !isVisuallyActive} />

                          {/* Icon with click and morph animation */}
                          <motion.div
                            className="flex items-center justify-center flex-shrink-0 relative z-10"
                            animate={isThisAnimating ? {
                              opacity: 0,
                              scale: 0.5,
                            } : isClicked ? {
                              opacity: 1,
                              scale: [1, 1.2, 1],
                              rotate: [0, -8, 0],
                            } : {
                              opacity: 1,
                              scale: 1,
                              rotate: 0,
                            }}
                            transition={isClicked ? {
                              duration: 0.4,
                              ease: [0.34, 1.56, 0.64, 1],
                            } : {
                              type: 'spring',
                              stiffness: 500,
                              damping: 30,
                            }}
                          >
                            {iconMap[item.id]}
                          </motion.div>

                          {/* Label with click animation */}
                          {!isCollapsed && (
                            <motion.span
                              className="whitespace-nowrap relative z-10"
                              animate={isThisAnimating ? {
                                opacity: 0.5,
                                x: -4,
                              } : isClicked ? {
                                opacity: 1,
                                x: [0, 2, 0],
                                scale: [1, 1.02, 1],
                              } : {
                                opacity: 1,
                                x: 0,
                                scale: 1,
                              }}
                              transition={isClicked ? {
                                duration: 0.35,
                                ease: [0.34, 1.56, 0.64, 1],
                              } : {
                                type: 'spring',
                                stiffness: 500,
                                damping: 30,
                              }}
                            >
                              {item.name}
                            </motion.span>
                          )}
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        </div>
      </nav>
    </div>
  );
}
