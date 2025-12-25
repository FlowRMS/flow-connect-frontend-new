'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MobileSidebarContext } from './Sidebar';
import AIUploaderModal from './ai-uploader/AIUploaderModal';
import UniversalSearch from './UniversalSearch';
import { useUser } from './providers/user-provider';
import { handleSignOut } from '@/lib/actions';

export default function TopBar() {
  const user = useUser();
  const { setIsOpen, isMobile } = React.useContext(MobileSidebarContext);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="relative">
      {/* Main TopBar Content */}
      <div
        className={`bg-[var(--card)] border-b border-[var(--border)] px-3 sm:px-6 py-3 flex items-center justify-between transition-all duration-300 ease-in-out ${
          isCollapsed ? 'h-0 py-0 overflow-hidden opacity-0' : 'h-auto opacity-100'
        }`}
      >
      {/* Left: Collapse button, Mobile hamburger & logo */}
      <div className="flex items-center gap-3">
        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
          aria-label={isCollapsed ? 'Expand top bar' : 'Collapse top bar'}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
          >
            <path d="M18 15l-6-6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {isMobile && (
          <>
            <button
              onClick={() => setIsOpen(true)}
              className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors md:hidden"
              aria-label="Open menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round"/>
                <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="round"/>
                <line x1="3" y1="18" x2="21" y2="18" strokeLinecap="round"/>
              </svg>
            </button>
            <Image
              src="/flow-logo.png"
              alt="FlowCRM"
              width={28}
              height={28}
              className="md:hidden"
            />
            <span className="text-sm font-semibold text-[var(--foreground)] md:hidden">FlowCRM</span>
          </>
        )}
      </div>

      {/* Center: Universal Search */}
      <div className="hidden md:flex flex-1 justify-center px-4">
        <UniversalSearch />
      </div>

      {/* Right: AI Uploader, DISC Analytics, Back to FlowRMS & Notifications */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* AI Uploader Button */}
        <button
          onClick={() => setIsUploaderOpen(true)}
          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg hover:from-violet-600 hover:to-purple-700 transition-all shadow-sm"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="hidden sm:inline">AI Uploader</span>
          <span className="sm:hidden">AI</span>
        </button>

        {/* DISC Analytics Button */}
        <Link
          href="/disc-analytics"
          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v3M12 19v3"/>
          </svg>
          <span className="hidden sm:inline">DISC Analytics</span>
          <span className="sm:hidden">DISC</span>
        </Link>
        
        {/* User info and Sign Out */}
        {user && (
          <span className="hidden sm:inline text-xs text-[var(--muted-foreground)]">
            {user.email}
          </span>
        )}
        <form action={handleSignOut}>
          <button
            type="submit"
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-[var(--destructive)] border border-[var(--destructive)] rounded-lg hover:bg-[var(--destructive)] hover:text-white transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </form>
        <button className="p-1.5 sm:p-2 hover:bg-[var(--muted)] rounded-lg transition-colors relative">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-5 sm:h-5">
            <path d="M10 5a3 3 0 013 3v3l1.5 3h-9L7 11V8a3 3 0 013-3zM8.5 16a1.5 1.5 0 003 0" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      </div>

      {/* Expand button (visible when collapsed) */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="absolute left-3 top-1 p-1 hover:bg-[var(--muted)] rounded transition-colors z-10"
          aria-label="Expand top bar"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="rotate-180"
          >
            <path d="M18 15l-6-6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* AI Uploader Modal */}
      <AIUploaderModal
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
      />
    </div>
  );
}
