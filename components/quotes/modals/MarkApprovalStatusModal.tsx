'use client';

import React from 'react';

interface MarkApprovalStatusModalProps {
  show: boolean;
  soldToCustomer: string;
  onClose: () => void;
  onSave: () => void;
}

export function MarkApprovalStatusModal({
  show,
  soldToCustomer,
  onClose,
  onSave,
}: MarkApprovalStatusModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Update Approval Status</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-6">
          {/* Info Section */}
          <div className="p-4 bg-[var(--muted)]/30 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">Manufacturer:</span>
              <span className="font-medium text-[var(--foreground)]">Lutron</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">Builder:</span>
              <span className="font-medium text-[var(--foreground)]">{soldToCustomer}</span>
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-3">New Status</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg cursor-pointer hover:bg-[var(--muted)]/20">
                <input type="radio" name="status" value="approved" className="accent-green-600" />
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                    <circle cx="10" cy="10" r="7"/>
                    <path d="M7 10l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-[var(--foreground)]">Approved (full approval for all products)</span>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg cursor-pointer hover:bg-[var(--muted)]/20 bg-[var(--primary)]/5 border-[var(--primary)]">
                <input type="radio" name="status" value="conditional" defaultChecked className="accent-[var(--primary)]" />
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-500">
                    <circle cx="10" cy="10" r="7"/>
                    <path d="M10 6v4l2 2" strokeLinecap="round"/>
                  </svg>
                  <span className="text-[var(--foreground)]">Approved with Conditions</span>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg cursor-pointer hover:bg-[var(--muted)]/20">
                <input type="radio" name="status" value="rejected" className="accent-red-600" />
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                    <circle cx="10" cy="10" r="7"/>
                    <path d="M8 8l4 4M12 8l-4 4" strokeLinecap="round"/>
                  </svg>
                  <span className="text-[var(--foreground)]">Rejected</span>
                </div>
              </label>
            </div>
          </div>

          {/* Conditions (if applicable) */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Conditions (if applicable)</label>
            <textarea
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm h-24 resize-none"
              placeholder="Enter any conditions for the approval..."
              defaultValue="Approved for PLX-200-DIM and PLX-300-DIM only. Other products require separate approval."
            />
          </div>

          {/* Approved By */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Approved By</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm"
                placeholder="Name of approver"
                defaultValue="Mike Johnson"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Date Approved</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm"
                defaultValue="2024-03-23"
              />
            </div>
          </div>

          {/* Attach Proof */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Attach Proof (email, document)</label>
            <div className="border-2 border-dashed border-[var(--border)] rounded-lg p-4 text-center hover:border-[var(--primary)] transition-colors cursor-pointer">
              <p className="text-sm text-[var(--muted-foreground)]">Drop files here or click to upload</p>
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between p-2 bg-[var(--muted)]/30 rounded text-sm">
                <span className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <path d="M14 2v6h6"/>
                  </svg>
                  approval-email-mar23.pdf
                </span>
                <button className="text-[var(--muted-foreground)] hover:text-red-600">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Notes</label>
            <textarea
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm h-20 resize-none"
              placeholder="Any additional notes..."
              defaultValue="Phone call with Mike Johnson on 3/23. He confirmed the two dimmer types are approved. Will need separate request for sensors and controllers."
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-[var(--primary)]" />
              <span className="text-sm text-[var(--foreground)]">Save to builder&apos;s Approved Manufacturers List</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-[var(--primary)]" />
              <span className="text-sm text-[var(--foreground)]">Apply to all future quotes for this builder</span>
            </label>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors"
          >
            Save Status
          </button>
        </div>
      </div>
    </div>
  );
}
