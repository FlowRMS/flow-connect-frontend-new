'use client';

import React, { useState } from 'react';
import type {
  ReturnedPdf,
  ItemChange,
  SubmittalItem,
} from '../../lib/types/submittals';
import {
  getStatusColor,
  getStatusLabel,
  ItemChangeStatusIcon,
  AddChangeModal,
  EditChangeModal,
} from './change-analysis';

interface ChangeAnalysisPanelProps {
  returnedPdf: ReturnedPdf;
  submittalItems: SubmittalItem[];
  onClose: () => void;
  onResubmit: () => void;
  onUpdateChange: (changeId: string, updates: Partial<ItemChange>) => void;
  onAddChange: (change: Omit<ItemChange, 'id'>) => void;
  onDeleteChange: (changeId: string) => void;
}

export default function ChangeAnalysisPanel({
  returnedPdf,
  submittalItems,
  onClose,
  onResubmit,
  onUpdateChange,
  onAddChange,
  onDeleteChange,
}: ChangeAnalysisPanelProps) {
  const [editingChange, setEditingChange] = useState<ItemChange | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const analysis = returnedPdf.changeAnalysis;

  if (!analysis) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-xl mx-4 p-8 text-center">
          <p className="text-[var(--muted-foreground)]">No analysis available for this document.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 text-sm text-[var(--primary)]">
            Close
          </button>
        </div>
      </div>
    );
  }

  const needsResubmit = analysis.itemChanges.some(c => c.status === 'revise' || c.status === 'rejected');
  const unresolvedCount = analysis.itemChanges.filter(c => !c.resolved && (c.status === 'revise' || c.status === 'rejected')).length;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Change Analysis</h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                {analysis.itemChanges.length} items need attention
              </p>
            </div>
            <div className="flex items-center gap-3">
              {needsResubmit && (
                <button
                  onClick={onResubmit}
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 4v6h-6M1 20v-6h6" />
                    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                  </svg>
                  Resubmit
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Summary */}
          {analysis.summary && (
            <div className="px-6 py-3 bg-[var(--muted)]/30 border-b border-[var(--border)]">
              <p className="text-sm text-[var(--muted-foreground)]">{analysis.summary}</p>
              {unresolvedCount > 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  {unresolvedCount} item{unresolvedCount > 1 ? 's' : ''} still need{unresolvedCount === 1 ? 's' : ''} to be resolved
                </p>
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-3">
              {analysis.itemChanges.map((change) => (
                <div
                  key={change.id}
                  className={`border rounded-lg overflow-hidden ${
                    change.resolved ? 'opacity-60' : ''
                  }`}
                >
                  <div className="px-4 py-3 flex items-center gap-3">
                    <ItemChangeStatusIcon status={change.status} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--foreground)]">
                          {change.fixtureType}
                        </span>
                        <span className="text-sm text-[var(--muted-foreground)]">
                          {change.catalogNumber}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded border ${getStatusColor(change.status)}`}>
                          {getStatusLabel(change.status)}
                        </span>
                        {change.resolved && (
                          <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">
                            Resolved
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {change.manufacturer}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingChange(change)}
                        className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
                        title="Edit"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      {!change.resolved && (change.status === 'revise' || change.status === 'rejected') && (
                        <button
                          onClick={() => onUpdateChange(change.id, { resolved: true, resolvedAt: new Date().toISOString() })}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Mark Resolved"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteChange(change.id)}
                        className="p-1.5 text-[var(--muted-foreground)] hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Notes */}
                  {change.notes.length > 0 && (
                    <div className="px-4 py-3 bg-[var(--muted)]/20 border-t border-[var(--border)]">
                      <ul className="space-y-1">
                        {change.notes.map((note, idx) => (
                          <li key={idx} className="text-sm text-[var(--foreground)] flex items-start gap-2">
                            <span className="text-[var(--muted-foreground)]">&bull;</span>
                            <span>&quot;{note}&quot;</span>
                          </li>
                        ))}
                      </ul>
                      {change.pageReferences && change.pageReferences.length > 0 && (
                        <p className="text-xs text-[var(--muted-foreground)] mt-2">
                          Page{change.pageReferences.length > 1 ? 's' : ''}: {change.pageReferences.join(', ')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/20">
            <button
              onClick={() => setShowAddModal(true)}
              className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" />
              </svg>
              Add Change Manually
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingChange && (
        <EditChangeModal
          change={editingChange}
          onSave={(updates) => {
            onUpdateChange(editingChange.id, updates);
            setEditingChange(null);
          }}
          onCancel={() => setEditingChange(null)}
        />
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddChangeModal
          items={submittalItems}
          onAdd={(change) => {
            onAddChange(change);
            setShowAddModal(false);
          }}
          onCancel={() => setShowAddModal(false)}
        />
      )}
    </>
  );
}
