/**
 * Summarize Modal Component
 */

'use client';

import React from 'react';
import { DATE_RANGES, SUMMARY_TYPES, AVAILABLE_TAGS, ENTITY_TYPES } from '../constants';
import { getAllCreators } from '../utils';
import type { Note } from '../types';

interface SummarizeModalProps {
  notes: Note[];
  filteredNotesCount: number;
  onClose: () => void;
}

export function SummarizeModal({ notes, filteredNotesCount, onClose }: SummarizeModalProps) {
  const creators = getAllCreators(notes);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Summarize with FlowChat</h2>
              <p className="text-sm text-white/80">Select filters to generate AI summary</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2">
              <path d="M4 4l12 12M16 4L4 16" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-3">Date Range</label>
            <div className="grid grid-cols-2 gap-2">
              {DATE_RANGES.map((range, index) => (
                <button
                  key={range.value}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    index === 0
                      ? 'border-2 border-purple-600 bg-purple-50 text-purple-700 hover:bg-purple-100'
                      : 'border border-[var(--border)] hover:bg-[var(--muted)]'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Created By Filter */}
          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-3">Created By</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] cursor-pointer transition-colors">
                <input type="checkbox" className="w-4 h-4 accent-purple-600" defaultChecked />
                <span className="text-sm">All Users</span>
              </label>
              {creators.map((creator) => (
                <label
                  key={creator}
                  className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] cursor-pointer transition-colors"
                >
                  <input type="checkbox" className="w-4 h-4 accent-purple-600" />
                  <span className="text-sm">{creator}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tags Filter */}
          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-3">Tags</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map((tag) => (
                <label
                  key={tag}
                  className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-full hover:bg-[var(--muted)] cursor-pointer transition-colors"
                >
                  <input type="checkbox" className="w-4 h-4 accent-purple-600" />
                  <span className="text-sm">{tag}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Entity Type Filter */}
          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-3">Entity Type</label>
            <div className="grid grid-cols-2 gap-2">
              {ENTITY_TYPES.map((entityType) => (
                <label
                  key={entityType}
                  className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] cursor-pointer transition-colors"
                >
                  <input type="checkbox" className="w-4 h-4 accent-purple-600" />
                  <span className="text-sm">{entityType}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Summary Options */}
          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-3">Summary Type</label>
            <div className="space-y-2">
              {SUMMARY_TYPES.map((summaryType, index) => (
                <label
                  key={summaryType.value}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    index === 0
                      ? 'border-2 border-purple-600 bg-purple-50'
                      : 'border border-[var(--border)] hover:bg-[var(--muted)]'
                  }`}
                >
                  <input
                    type="radio"
                    name="summaryType"
                    className="w-4 h-4 accent-purple-600"
                    defaultChecked={index === 0}
                  />
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${index === 0 ? 'text-purple-900' : ''}`}>
                      {summaryType.label}
                    </div>
                    <div className={`text-xs ${index === 0 ? 'text-purple-700' : 'text-[var(--muted-foreground)]'}`}>
                      {summaryType.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-[var(--muted)]/30 px-6 py-4 border-t border-[var(--border)] flex items-center justify-between">
          <div className="text-sm text-[var(--muted-foreground)]">
            <span className="font-medium text-[var(--foreground)]">{filteredNotesCount}</span> notes selected
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
            >
              Cancel
            </button>
            <button className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-md">
              Generate Summary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
