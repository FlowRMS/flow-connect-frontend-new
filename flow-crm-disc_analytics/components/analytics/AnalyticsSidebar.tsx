'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavSection = {
  title: string;
  items: NavItem[];
};

type NavItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
};

export default function AnalyticsSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['Dashboards', 'Pipeline', 'Manufacturer', 'Warehouse', 'Data Tables', 'Pivot Tables']);

  const navSections: NavSection[] = [
    {
      title: 'Dashboards',
      items: [
        {
          name: 'Business Performance',
          href: '/analytics',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20V10"/>
              <path d="M18 20V4"/>
              <path d="M6 20v-4"/>
            </svg>
          )
        },
        {
          name: 'Sales Activity',
          href: '/analytics/tasks-dashboard',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          )
        },
      ]
    },
    {
      title: 'Pipeline',
      items: [
        {
          name: 'Pre-Quote Pipeline',
          href: '/analytics/pre-quotes',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          )
        },
        {
          name: 'Quote Pipeline',
          href: '/analytics/pipeline',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <path d="M14 2v6h6"/>
              <path d="M16 13H8"/>
              <path d="M16 17H8"/>
              <path d="M10 9H8"/>
            </svg>
          )
        },
      ]
    },
    {
      title: 'Manufacturer',
      items: [
        {
          name: 'Manufacturer Dashboard',
          href: '/analytics/manufacturer',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 20h20"/>
              <path d="M5 20V8l7-5 7 5v12"/>
              <path d="M9 20v-6h6v6"/>
              <path d="M9 12h6"/>
            </svg>
          )
        },
      ]
    },
    {
      title: 'Warehouse',
      items: [
        {
          name: 'Warehouse Dashboard',
          href: '/analytics/warehouse',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 8.35V20a2 2 0 01-2 2H4a2 2 0 01-2-2V8.35A2 2 0 013.26 6.5l8-3.2a2 2 0 011.48 0l8 3.2A2 2 0 0122 8.35z"/>
              <path d="M6 18h12"/>
              <path d="M6 14h12"/>
              <path d="M6 10h12"/>
            </svg>
          )
        },
      ]
    },
    {
      title: 'Data Tables',
      items: [
        {
          name: 'Jobs',
          href: '/analytics/jobs',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2"/>
              <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
            </svg>
          )
        },
        {
          name: 'Pre-Quotes',
          href: '/analytics/pre-quotes-table',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          )
        },
        {
          name: 'Inventory',
          href: '/analytics/inventory',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
              <path d="M3.27 6.96L12 12.01l8.73-5.05"/>
              <path d="M12 22.08V12"/>
            </svg>
          )
        },
        {
          name: 'Tasks',
          href: '/analytics/tasks',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
          )
        },
        {
          name: 'Notes',
          href: '/analytics/notes',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
            </svg>
          )
        },
      ]
    },
    {
      title: 'Pivot Tables',
      items: [
        {
          name: 'Jobs Pivot',
          href: '/analytics/pivot/jobs',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 3v18"/>
            </svg>
          )
        },
        {
          name: 'Tasks Pivot',
          href: '/analytics/pivot/tasks',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 3v18"/>
            </svg>
          )
        },
        {
          name: 'Pre-Quotes Pivot',
          href: '/analytics/pivot/pre-quotes',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 3v18"/>
            </svg>
          )
        },
        {
          name: 'Inventory Pivot',
          href: '/analytics/pivot/inventory',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 3v18"/>
            </svg>
          )
        },
      ]
    },
  ];

  const toggleSection = (title: string) => {
    setExpandedSections(prev =>
      prev.includes(title)
        ? prev.filter(s => s !== title)
        : [...prev, title]
    );
  };

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-[var(--card)] border-r border-[var(--border)] flex flex-col transition-all duration-300`}>
      {/* Logo & Toggle */}
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center flex-shrink-0">
            <div className="w-4 h-4 rounded-full border-2 border-white"></div>
          </div>
          {!isCollapsed && <span className="text-lg font-semibold text-[var(--foreground)]">Analytics</span>}
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] rounded-md transition-all flex-shrink-0"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
          >
            <path d="M13 6l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto p-3">
        {navSections.map((section) => {
          const isExpanded = expandedSections.includes(section.title);

          return (
            <div key={section.title} className="mb-4">
              {/* Section Header */}
              {!isCollapsed && (
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider hover:text-[var(--foreground)] transition-colors"
                >
                  <span>{section.title}</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  >
                    <path d="M3 4.5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}

              {/* Section Items */}
              {(isCollapsed || isExpanded) && (
                <div className={isCollapsed ? '' : 'mt-1'}>
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        title={isCollapsed ? item.name : undefined}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-1 ${
                          isActive
                            ? 'bg-[var(--primary)] text-white'
                            : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                        } ${isCollapsed ? 'justify-center' : ''}`}
                      >
                        {item.icon}
                        {!isCollapsed && <span>{item.name}</span>}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
