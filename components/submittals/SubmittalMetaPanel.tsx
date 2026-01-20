'use client';

import React, { useState, useRef } from 'react';
import type { Submittal } from '../../lib/types/submittals';
import { ContactSearchModal } from './ContactSearchModal';
import type { ContactSearchResult } from '../lib/api/search';

interface SubmittalMetaPanelProps {
  submittal: Submittal;
  stats: {
    total: number;
    ready: number;
    needsHighlight: number;
    missing: number;
  };
  onUpdateArchitect?: (name: string) => void;
  onUpdateEngineer?: (name: string) => void;
  onUpdateBidDate?: (date: string) => void;
}

export function SubmittalMetaPanel({ submittal, stats, onUpdateArchitect, onUpdateEngineer, onUpdateBidDate }: SubmittalMetaPanelProps) {
  const [showArchitectSearch, setShowArchitectSearch] = useState(false);
  const [showEngineerSearch, setShowEngineerSearch] = useState(false);
  const architectInputRef = useRef<HTMLInputElement>(null);
  const engineerInputRef = useRef<HTMLInputElement>(null);

  const handleSelectArchitect = (contact: ContactSearchResult) => {
    const fullName = `${contact.firstName} ${contact.lastName}`.trim();
    if (architectInputRef.current) {
      architectInputRef.current.value = fullName;
    }
    onUpdateArchitect?.(fullName);
  };

  const handleSelectEngineer = (contact: ContactSearchResult) => {
    const fullName = `${contact.firstName} ${contact.lastName}`.trim();
    if (engineerInputRef.current) {
      engineerInputRef.current.value = fullName;
    }
    onUpdateEngineer?.(fullName);
  };

  return (
    <>
      {/* Submittal Meta Information Panel */}
      <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--muted)]/20">
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Submittal Info */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Submittal</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <label className="text-[10px] text-[var(--muted-foreground)]">Project:</label>
                <p className="text-sm font-medium text-[var(--foreground)]">{submittal.jobName}</p>
              </div>
              <div>
                <label className="text-[10px] text-[var(--muted-foreground)]">Location:</label>
                <p className="text-sm text-[var(--foreground)]">{submittal.jobLocation || '-'}</p>
              </div>
              <div>
                <label className="text-[10px] text-[var(--muted-foreground)]">Submitted On:</label>
                <p className="text-sm text-[var(--foreground)]">
                  {submittal.submittalDate ? new Date(submittal.submittalDate).toLocaleDateString() : '-'}
                </p>
              </div>
              <div>
                <label className="text-[10px] text-[var(--muted-foreground)]">Submitted By:</label>
                <p className="text-sm text-[var(--foreground)]">{submittal.createdBy || '-'}</p>
              </div>
            </div>
          </div>

          {/* Middle Column - Letters (Architect/Engineer) */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Letters</div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <label className="text-[10px] text-[var(--muted-foreground)] w-16">Architect:</label>
                <div className="flex-1 flex items-center gap-2">
                  <input
                    ref={architectInputRef}
                    type="text"
                    defaultValue={submittal.architects[0]?.contactName || ''}
                    placeholder="Enter architect..."
                    onBlur={(e) => onUpdateArchitect?.(e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                  />
                  <button
                    onClick={() => setShowArchitectSearch(true)}
                    className="p-1 hover:bg-[var(--muted)] rounded text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
                    title="Browse contacts"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="M21 21l-4.35-4.35"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-[10px] text-[var(--muted-foreground)] w-16">Engineer:</label>
                <div className="flex-1 flex items-center gap-2">
                  <input
                    ref={engineerInputRef}
                    type="text"
                    defaultValue={submittal.engineers[0]?.contactName || ''}
                    placeholder="Enter engineer..."
                    onBlur={(e) => onUpdateEngineer?.(e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                  />
                  <button
                    onClick={() => setShowEngineerSearch(true)}
                    className="p-1 hover:bg-[var(--muted)] rounded text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
                    title="Browse contacts"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="M21 21l-4.35-4.35"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Dates */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Dates</div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <label className="text-[10px] text-[var(--muted-foreground)] w-16">Bid Date:</label>
                <input
                  type="date"
                  defaultValue={submittal.bidDate?.split('T')[0] || ''}
                  onBlur={(e) => onUpdateBidDate?.(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                />
              </div>
              <div className="text-xs text-[var(--muted-foreground)] space-y-1 pt-1">
                <p>Created: {new Date(submittal.createdAt).toLocaleString()} by {submittal.createdBy}</p>
                <p>Updated: {new Date(submittal.updatedAt).toLocaleString()} by {submittal.updatedBy}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-[var(--muted-foreground)]">Completion Progress</span>
              <span className="font-medium text-[var(--foreground)]">
                {Math.round((stats.ready / stats.total) * 100)}% ready
              </span>
            </div>
            <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden flex">
              <div
                className="bg-green-500 transition-all"
                style={{ width: `${(stats.ready / stats.total) * 100}%` }}
              />
              <div
                className="bg-yellow-500 transition-all"
                style={{ width: `${(stats.needsHighlight / stats.total) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
              <span className="text-[var(--muted-foreground)]">{stats.ready} ready</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
              <span className="text-[var(--muted-foreground)]">{stats.needsHighlight} need highlights</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span className="text-[var(--muted-foreground)]">{stats.missing} missing spec sheets</span>
            </span>
          </div>
        </div>
      </div>

      {/* Contact Search Modals */}
      <ContactSearchModal
        isOpen={showArchitectSearch}
        onClose={() => setShowArchitectSearch(false)}
        onSelect={handleSelectArchitect}
        title="Search Architect"
      />

      <ContactSearchModal
        isOpen={showEngineerSearch}
        onClose={() => setShowEngineerSearch(false)}
        onSelect={handleSelectEngineer}
        title="Search Engineer"
      />
    </>
  );
}
