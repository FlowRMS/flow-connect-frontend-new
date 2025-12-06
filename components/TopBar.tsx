import React from 'react';

export default function TopBar() {
  const loginUrl = process.env.NEXT_PUBLIC_LOGIN_URL || 'https://app2.flowrms.com';

  return (
    <div className="bg-[var(--card)] border-b border-[var(--border)] px-6 py-3 flex items-center justify-end">
      {/* Right: Back to FlowRMS & Notifications */}
      <div className="flex items-center gap-3">
        <a
          href={loginUrl}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[var(--primary)] border border-[var(--primary)] rounded-lg hover:bg-[var(--primary)] hover:text-white transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 16l-6-6 6-6M4 10h12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to FlowRMS
        </a>
        <button className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors relative">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 5a3 3 0 013 3v3l1.5 3h-9L7 11V8a3 3 0 013-3zM8.5 16a1.5 1.5 0 003 0" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
