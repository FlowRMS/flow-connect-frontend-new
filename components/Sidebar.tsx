'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const mainNav = [
    { name: 'Dashboard', href: '/' },
    { name: 'Jobs', href: '/jobs' },
    { name: 'Pre-Opportunities', href: '/pre-opportunities' },
    { name: 'Contacts', href: '/contacts' },
    { name: 'Companies', href: '/companies' },
    { name: 'Tasks', href: '/tasks' },
    { name: 'Notes', href: '/notes' },
    { name: 'Email Helper', href: '/email-helper' },
  ];

  return (
    <div className="w-64 bg-[var(--card)] border-r border-[var(--border)] flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center">
          <div className="w-4 h-4 rounded-full border-2 border-white"></div>
        </div>
        <span className="text-lg font-semibold text-[var(--foreground)]">FlowConnect</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        {mainNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-1 ${
                isActive
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
