'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileSidebarContext } from './Sidebar';
import UniversalSearch from './UniversalSearch';
import { useUser } from './providers/user-provider';
import { useOrgName } from './hooks/useOrgName';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { handleSignOut } from '@/lib/actions';
import UserGuideModal from './UserGuideModal';
import { getAvatarColors, getInitials } from '@/lib/utils/avatar';

// Key used by useWelcomeAnimation hook
const WELCOME_SHOWN_KEY = 'flowcrm_welcome_animation_shown';

// Map route paths to document types for AI Uploader pre-selection
const getDocumentTypeFromPath = (pathname: string): string | null => {
  if (pathname.startsWith('/orders')) return 'orders';
  if (pathname.startsWith('/quotes')) return 'quotes';
  if (pathname.startsWith('/invoices')) return 'invoices';
  if (pathname.startsWith('/checks') || pathname.startsWith('/commissions')) return 'checks';
  if (pathname.startsWith('/products')) return 'products';
  if (pathname.startsWith('/customers')) return 'customers';
  if (pathname.startsWith('/manufacturers') || pathname.startsWith('/factories')) return 'factories';
  return null;
};

export default function TopBar() {
  const user = useUser();
  const pathname = usePathname();
  const { orgName, isLoading: orgLoading } = useOrgName();
  const { logoUrl } = useOrganizationContext();
  const { setIsOpen, isMobile } = React.useContext(MobileSidebarContext);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Close account menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get user display name and avatar colors
  const userName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.firstName || user?.email?.split('@')[0] || 'User';
  const avatarColors = getAvatarColors(userName);
  const initials = getInitials(userName);

  // Get the document type for AI Uploader based on current page
  const documentType = getDocumentTypeFromPath(pathname);
  const aiUploaderHref = documentType
    ? `/flow-ai/upload?type=${documentType}`
    : '/flow-ai/upload';

  return (
    <div className="relative">
      {/* Main TopBar Content */}
      <div
        className={`bg-[var(--card)] border-b border-[var(--border)] px-3 sm:px-6 py-3 flex items-center justify-between transition-all duration-300 ease-in-out ${
          isCollapsed ? 'h-0 py-0 overflow-hidden opacity-0' : 'h-auto opacity-100'
        }`}
      >
      {/* Left: Collapse button, Mobile hamburger, logo & Org Name */}
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
        
        {/* Organization Name - Clean Premium Design */}
        {!orgLoading && orgName && (
          <div className="hidden md:flex items-center ml-4">
            <div className="group relative cursor-default flex items-center gap-3">

              {/* Organization Logo or Premium icon with gentle pulse */}
              <div className="relative flex-shrink-0">
                {logoUrl ? (
                  <div className="w-9 h-9 rounded-xl overflow-hidden bg-white flex items-center justify-center shadow-md">
                    <img
                      src={logoUrl}
                      alt={`${orgName} logo`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div
                    className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-blue-500/25"
                    style={{ animation: 'gentlePulse 3s ease-in-out infinite' }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-white"
                    >
                      <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.95"/>
                      <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
                {/* Soft ambient glow */}
                <div
                  className="absolute inset-0 rounded-xl bg-blue-400/20 blur-lg -z-10"
                  style={{ animation: 'gentleGlow 3s ease-in-out infinite' }}
                ></div>
              </div>
              
              {/* Org Name - premium gradient text with glow */}
              <div className="relative">
                <span 
                  className="relative text-xl font-black uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400"
                  style={{ 
                    fontFamily: '"Inter", "SF Pro Display", system-ui, -apple-system, sans-serif', 
                    letterSpacing: '0.18em',
                    textShadow: '0 0 30px rgba(99, 102, 241, 0.3)',
                    WebkitBackgroundClip: 'text',
                    backgroundSize: '200% auto',
                    animation: 'textGradient 4s linear infinite'
                  }}
                >
                  {orgName}
                </span>
                {/* Glowing underline */}
                <div 
                  className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full"
                  style={{ 
                    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899, #8b5cf6, #3b82f6)',
                    backgroundSize: '200% 100%',
                    animation: 'gradientFlow 3s ease-in-out infinite',
                    boxShadow: '0 0 12px rgba(139, 92, 246, 0.5), 0 0 24px rgba(139, 92, 246, 0.3)'
                  }}
                ></div>
                {/* Text shadow glow layer */}
                <span 
                  className="absolute inset-0 text-xl font-black uppercase text-indigo-500/20 dark:text-indigo-400/30 blur-[2px] -z-10"
                  style={{ 
                    fontFamily: '"Inter", "SF Pro Display", system-ui, -apple-system, sans-serif', 
                    letterSpacing: '0.18em'
                  }}
                  aria-hidden="true"
                >
                  {orgName}
                </span>
              </div>
              
              {/* CSS Keyframes */}
              <style jsx>{`
                @keyframes gentlePulse {
                  0%, 100% { transform: scale(1); opacity: 1; }
                  50% { transform: scale(1.03); opacity: 0.95; }
                }
                @keyframes gentleGlow {
                  0%, 100% { opacity: 0.3; transform: scale(1); }
                  50% { opacity: 0.5; transform: scale(1.1); }
                }
                @keyframes gradientFlow {
                  0%, 100% { background-position: 0% 0; }
                  50% { background-position: 100% 0; }
                }
                @keyframes textGradient {
                  0%, 100% { background-position: 0% center; }
                  50% { background-position: 200% center; }
                }
              `}</style>
            </div>
          </div>
        )}
        
        {/* Loading skeleton for org name */}
        {orgLoading && (
          <div className="hidden md:flex items-center ml-4 gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
            <div className="w-16 h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
          </div>
        )}
      </div>

      {/* Center: Universal Search */}
      <div className="hidden md:flex flex-1 justify-center px-4">
        <UniversalSearch />
      </div>

      {/* Right: User Guide, AI Uploader, DISC Analytics, Back to FlowRMS & Notifications */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* User Guide Button */}
        <button
          onClick={() => setShowUserGuide(true)}
          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-lg hover:from-indigo-600 hover:to-blue-700 transition-all shadow-sm"
          title="User Guide"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 17h.01" strokeLinecap="round"/>
          </svg>
          <span className="hidden sm:inline">Guide</span>
        </button>

        {/* AI Uploader Button */}
        <Link
          href={aiUploaderHref}
          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg hover:from-violet-600 hover:to-purple-700 transition-all shadow-sm"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="hidden sm:inline">AI Uploader</span>
          <span className="sm:hidden">AI</span>
        </Link>

        {/* DISC Analytics Button - HIDDEN */}
        {/* <Link
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
        </Link> */}
        
        {/* Notifications */}
        <button className="p-1.5 sm:p-2 hover:bg-[var(--muted)] rounded-lg transition-colors relative">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-5 sm:h-5">
            <path d="M10 5a3 3 0 013 3v3l1.5 3h-9L7 11V8a3 3 0 013-3zM8.5 16a1.5 1.5 0 003 0" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Account Avatar Dropdown */}
        <div className="relative" ref={accountMenuRef}>
          <button
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-[var(--muted)] transition-colors"
            aria-label="Account menu"
          >
            {user?.profilePictureUrl ? (
              <img
                src={user.profilePictureUrl}
                alt={userName}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover ring-2 ring-[var(--border)] hover:ring-[var(--primary)] transition-all"
              />
            ) : (
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full ${avatarColors.bg} ${avatarColors.text} flex items-center justify-center text-sm font-semibold ring-2 ring-[var(--border)] hover:ring-[var(--primary)] transition-all`}
              >
                {initials}
              </div>
            )}
          </button>

          {/* Dropdown Menu with smooth animation */}
          <AnimatePresence>
            {showAccountMenu && (
              <motion.div
                className="absolute right-0 top-full mt-2 w-72 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden z-50"
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 25,
                  mass: 0.8
                }}
                style={{ transformOrigin: 'top right' }}
              >
                {/* User Info Section */}
                <motion.div
                  className="p-4 border-b border-[var(--border)] bg-gradient-to-br from-[var(--muted)]/50 to-transparent"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05, duration: 0.2 }}
                >
                  <div className="flex items-center gap-3">
                    {user?.profilePictureUrl ? (
                      <motion.img
                        src={user.profilePictureUrl}
                        alt={userName}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-[var(--border)]"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 20 }}
                      />
                    ) : (
                      <motion.div
                        className={`w-12 h-12 rounded-full ${avatarColors.bg} ${avatarColors.text} flex items-center justify-center text-lg font-semibold ring-2 ring-[var(--border)]`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 20 }}
                      >
                        {initials}
                      </motion.div>
                    )}
                    <motion.div
                      className="flex-1 min-w-0"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15, duration: 0.2 }}
                    >
                      <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                        {userName}
                      </p>
                      {user?.email && (
                        <p className="text-xs text-[var(--muted-foreground)] truncate">
                          {user.email}
                        </p>
                      )}
                    </motion.div>
                  </div>
                </motion.div>

                {/* Tenant/Organization Section */}
                {!orgLoading && orgName && (
                  <motion.div
                    className="px-4 py-3 border-b border-[var(--border)]"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12, duration: 0.2 }}
                  >
                    <div className="flex items-center gap-2">
                      {logoUrl ? (
                        <div className="w-6 h-6 rounded-md overflow-hidden bg-white flex items-center justify-center">
                          <img
                            src={logoUrl}
                            alt={`${orgName} logo`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-white">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor"/>
                            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-[var(--muted-foreground)]">Organization</p>
                        <p className="text-sm font-medium text-[var(--foreground)]">{orgName}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Menu Items */}
                <div className="py-2">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.18, duration: 0.2 }}
                  >
                    <Link
                      href="/settings"
                      onClick={() => setShowAccountMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Settings</span>
                    </Link>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.22, duration: 0.2 }}
                  >
                    <button
                      onClick={() => {
                        setShowAccountMenu(false);
                        sessionStorage.removeItem(WELCOME_SHOWN_KEY);
                        handleSignOut();
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[var(--destructive)] hover:bg-[var(--destructive)]/10 transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Sign Out</span>
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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

      {/* User Guide Modal */}
      <UserGuideModal isOpen={showUserGuide} onClose={() => setShowUserGuide(false)} />
    </div>
  );
}
