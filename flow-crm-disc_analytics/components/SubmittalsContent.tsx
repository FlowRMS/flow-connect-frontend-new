'use client';

import React, { useState, useMemo } from 'react';
import {
  mockSubmittals,
  mockSpecSheets,
  submittalStatusLabels,
  submittalStatusColors,
  matchStatusLabels,
  matchStatusColors,
  getManufacturersWithSpecSheets,
} from '../lib/data/submittals-mock';
import type { Submittal, SubmittalStatus } from '../lib/types/submittals';
import CreateSubmittalModal from './submittals/CreateSubmittalModal';
import SubmittalDetailPanel from './submittals/SubmittalDetailPanel';
import PrintSubmittalDialog from './submittals/PrintSubmittalDialog';
import type { PrintSettings } from './submittals/PrintSubmittalDialog';

export default function SubmittalsContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubmittalStatus | 'all'>('all');
  const [selectedSubmittal, setSelectedSubmittal] = useState<Submittal | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [printSubmittal, setPrintSubmittal] = useState<Submittal | null>(null);
  // Resubmit mode state
  const [resubmitMode, setResubmitMode] = useState(false);
  const [resubmitItemIds, setResubmitItemIds] = useState<string[]>([]);

  // Filter submittals
  const filteredSubmittals = useMemo(() => {
    let result = [...mockSubmittals];

    if (statusFilter !== 'all') {
      result = result.filter(s => s.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.jobName.toLowerCase().includes(query) ||
        s.items.some(i =>
          i.catalogNumber.toLowerCase().includes(query) ||
          i.manufacturer.toLowerCase().includes(query)
        )
      );
    }

    return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [searchQuery, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = mockSubmittals.length;
    const draft = mockSubmittals.filter(s => s.status === 'draft').length;
    const forApproval = mockSubmittals.filter(s => s.status === 'for_approval' || s.status === 'resubmit_for_approval').length;
    const approved = mockSubmittals.filter(s => s.status === 'approved' || s.status === 'approved_as_noted' || s.status === 'approved_as_submitted').length;
    return { total, draft, forApproval, approved };
  }, []);

  const manufacturers = getManufacturersWithSpecSheets();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--border)] bg-[var(--background)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Submittals</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Manage submittal packages for your projects
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Spec Sheet Library
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
              </svg>
              New Submittal
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-6 mb-4">
          <button
            onClick={() => setStatusFilter('all')}
            className={`text-sm ${statusFilter === 'all' ? 'text-[var(--primary)] font-medium' : 'text-[var(--muted-foreground)]'}`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`text-sm ${statusFilter === 'draft' ? 'text-[var(--primary)] font-medium' : 'text-[var(--muted-foreground)]'}`}
          >
            Drafts ({stats.draft})
          </button>
          <button
            onClick={() => setStatusFilter('for_approval')}
            className={`text-sm ${statusFilter === 'for_approval' ? 'text-[var(--primary)] font-medium' : 'text-[var(--muted-foreground)]'}`}
          >
            Pending Approval ({stats.forApproval})
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`text-sm ${statusFilter === 'approved' ? 'text-[var(--primary)] font-medium' : 'text-[var(--muted-foreground)]'}`}
          >
            Approved ({stats.approved})
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
              <circle cx="9" cy="9" r="7"/>
              <path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search submittals, products, or manufacturers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--background)]"
            />
          </div>
          <div className="flex items-center border border-[var(--border)] rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-[var(--muted)]' : 'hover:bg-[var(--muted)]/50'} transition-colors`}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 10h16M4 14h16M4 18h16" strokeLinecap="round"/>
              </svg>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-[var(--muted)]' : 'hover:bg-[var(--muted)]/50'} transition-colors`}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="6" height="6" rx="1"/>
                <rect x="11" y="3" width="6" height="6" rx="1"/>
                <rect x="3" y="11" width="6" height="6" rx="1"/>
                <rect x="11" y="11" width="6" height="6" rx="1"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {filteredSubmittals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--muted)] flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2v6h6M9 15l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No submittals found</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-4 max-w-sm">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first submittal package to get started'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <button className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                </svg>
                New Submittal
              </button>
            )}
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-4">
            {filteredSubmittals.map((submittal) => (
              <div
                key={submittal.id}
                className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedSubmittal(submittal)}
              >
                {/* Submittal Header */}
                <div className="px-5 py-4 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-semibold text-[var(--foreground)]">{submittal.jobName}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${submittalStatusColors[submittal.status].bg} ${submittalStatusColors[submittal.status].text}`}>
                        {submittalStatusLabels[submittal.status]}
                      </span>
                      {submittal.currentRevision > 0 && (
                        <span className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-0.5 rounded">
                          Rev {submittal.currentRevision}
                        </span>
                      )}
                    </div>
                    {submittal.jobLocation && (
                      <p className="text-sm text-[var(--muted-foreground)] mb-2">{submittal.jobLocation}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                      <span className="flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="14" height="14" rx="2"/>
                          <path d="M3 8h14M7 2v4M13 2v4"/>
                        </svg>
                        {new Date(submittal.submittalDate).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                          <path d="M14 2v6h6"/>
                        </svg>
                        {submittal.items.length} items
                      </span>
                      {submittal.customers.length > 0 && (
                        <span className="flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="4" y="2" width="12" height="16" rx="2"/>
                            <path d="M8 6h4M8 9h4M8 12h4"/>
                          </svg>
                          {submittal.customers[0].companyName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {submittal.revisions.length > 0 && submittal.revisions[submittal.currentRevision]?.generatedPdfUrl && (
                      <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
                        title="Download PDF"
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 16v2a2 2 0 002 2h8a2 2 0 002-2v-2M10 4v10M6 10l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); }}
                      className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="10" cy="5" r="1.5"/>
                        <circle cx="10" cy="10" r="1.5"/>
                        <circle cx="10" cy="15" r="1.5"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="px-5 pb-4">
                  <div className="flex flex-wrap gap-2">
                    {submittal.items.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 px-2 py-1 bg-[var(--muted)]/50 rounded text-xs"
                      >
                        <span className="font-medium text-[var(--foreground)]">{item.fixtureType}</span>
                        <span className="text-[var(--muted-foreground)]">{item.catalogNumber}</span>
                        <span className={`w-2 h-2 rounded-full ${
                          item.matchStatus === 'matched_with_highlight' ? 'bg-green-500' :
                          item.matchStatus === 'matched_no_highlight' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                      </div>
                    ))}
                    {submittal.items.length > 5 && (
                      <span className="px-2 py-1 text-xs text-[var(--muted-foreground)]">
                        +{submittal.items.length - 5} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Stats */}
                <div className="px-5 py-3 bg-[var(--muted)]/30 border-t border-[var(--border)] flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1 text-green-600">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      {submittal.items.filter(i => i.matchStatus === 'matched_with_highlight').length} ready
                    </span>
                    <span className="flex items-center gap-1 text-yellow-600">
                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                      {submittal.items.filter(i => i.matchStatus === 'matched_no_highlight').length} need highlights
                    </span>
                    <span className="flex items-center gap-1 text-red-600">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      {submittal.items.filter(i => i.matchStatus === 'no_match').length} missing
                    </span>
                  </div>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    Updated {new Date(submittal.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubmittals.map((submittal) => (
              <div
                key={submittal.id}
                className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedSubmittal(submittal)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${submittalStatusColors[submittal.status].bg} ${submittalStatusColors[submittal.status].text}`}>
                      {submittalStatusLabels[submittal.status]}
                    </span>
                    {submittal.currentRevision > 0 && (
                      <span className="text-xs text-[var(--muted-foreground)]">Rev {submittal.currentRevision}</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-1 line-clamp-1">{submittal.jobName}</h3>
                  <p className="text-sm text-[var(--muted-foreground)] mb-3 line-clamp-1">
                    {submittal.jobLocation || 'No location'}
                  </p>
                  <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                    <span>{submittal.items.length} items</span>
                    <span>{new Date(submittal.submittalDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="px-4 py-2 bg-[var(--muted)]/30 border-t border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{
                          width: `${(submittal.items.filter(i => i.matchStatus === 'matched_with_highlight').length / submittal.items.length) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {Math.round((submittal.items.filter(i => i.matchStatus === 'matched_with_highlight').length / submittal.items.length) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spec Sheet Library Summary */}
      <div className="flex-shrink-0 px-6 py-3 border-t border-[var(--border)] bg-[var(--muted)]/30">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-[var(--muted-foreground)]">
              Spec Sheet Library: <span className="font-medium text-[var(--foreground)]">{mockSpecSheets.length} sheets</span>
            </span>
            <span className="text-[var(--muted-foreground)]">
              from <span className="font-medium text-[var(--foreground)]">{manufacturers.length} manufacturers</span>
            </span>
          </div>
          <button className="text-[var(--primary)] hover:text-[var(--primary-hover)] text-sm">
            Manage Library
          </button>
        </div>
      </div>

      {/* Create Submittal Modal */}
      {showCreateModal && (
        <CreateSubmittalModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(submittalData) => {
            // In real implementation, this would create a new submittal
            console.log('Creating submittal:', submittalData);
            setShowCreateModal(false);
            // Could redirect to the new submittal detail view
          }}
        />
      )}

      {/* Submittal Detail Panel */}
      {selectedSubmittal && (
        <SubmittalDetailPanel
          submittal={selectedSubmittal}
          onClose={() => setSelectedSubmittal(null)}
          onUpdate={(updates) => {
            // In real implementation, this would update the submittal in the database
            // For now, update the local state
            console.log('Updating submittal:', updates);
            setSelectedSubmittal(prev => prev ? { ...prev, ...updates } : null);
          }}
          onPrint={() => {
            setResubmitMode(false);
            setResubmitItemIds([]);
            setPrintSubmittal(selectedSubmittal);
          }}
          onResubmit={(itemIds) => {
            // Open print dialog in resubmit mode with pre-selected items
            setResubmitMode(true);
            setResubmitItemIds(itemIds);
            setPrintSubmittal(selectedSubmittal);
          }}
        />
      )}

      {/* Print Dialog */}
      {printSubmittal && (
        <PrintSubmittalDialog
          submittal={printSubmittal}
          onClose={() => {
            setPrintSubmittal(null);
            setResubmitMode(false);
            setResubmitItemIds([]);
          }}
          onPrint={(settings: PrintSettings) => {
            // In real implementation, this would generate and print/email the submittal
            console.log('Printing submittal with settings:', settings);
            console.log('Resubmit mode:', resubmitMode);

            // Simulate creating a new revision
            if (selectedSubmittal) {
              const newRevisionNumber = selectedSubmittal.currentRevision + 1;
              console.log(`Creating revision ${newRevisionNumber} with selected items:`, settings.selectedItemIds);

              // In real app, this would update the submittal's revisions array
              // and create the PDF
            }

            setPrintSubmittal(null);
            setResubmitMode(false);
            setResubmitItemIds([]);
          }}
          resubmitMode={resubmitMode}
          resubmitItemIds={resubmitItemIds}
        />
      )}
    </div>
  );
}
