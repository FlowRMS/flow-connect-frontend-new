'use client';

import React from 'react';
import { Manufacturer } from '../types';

interface ApprovalRequestModalProps {
  show: boolean;
  soldToCustomer: string;
  quoteName: string;
  manufacturers: Manufacturer[];
  onClose: () => void;
  onSend: () => void;
}

export function ApprovalRequestModal({
  show,
  soldToCustomer,
  quoteName,
  manufacturers,
  onClose,
  onSend,
}: ApprovalRequestModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between sticky top-0 bg-[var(--card)] z-10">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Request Manufacturer Approval</h2>
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
          {/* Builder and Project Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-[var(--muted)]/30 rounded-lg">
            <div>
              <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Builder</p>
              <p className="font-medium text-[var(--foreground)]">{soldToCustomer}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Project</p>
              <p className="font-medium text-[var(--foreground)]">{quoteName}</p>
            </div>
          </div>

          {/* Manufacturer Selection */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Manufacturer Requesting Approval</label>
            <select className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-white">
              <option>Select manufacturer...</option>
              {manufacturers.map(m => (
                <option key={m.domain} value={m.domain}>{m.manufacturer_name}</option>
              ))}
            </select>
          </div>

          {/* Products/SKUs Included */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-[var(--foreground)]">Products/SKUs Included</label>
              <span className="text-xs text-[var(--muted-foreground)]">5 line items</span>
            </div>
            <div className="border border-[var(--border)] rounded-lg overflow-hidden">
              <div className="max-h-48 overflow-y-auto">
                {[
                  { sku: 'PLX-200-DIM', desc: 'Programmable Dimmer Switch with Daylight Harvesting', qty: 75, price: 185, total: 13875 },
                  { sku: 'PEND-MOD-18', desc: 'Modern Pendant Light 18" Decorative LED', qty: 24, price: 385, total: 9240 },
                  { sku: 'TRK-LED-30W', desc: 'Track Light Head LED 30W Adjustable Beam', qty: 48, price: 165, total: 7920 },
                ].map((item, idx) => (
                  <label key={idx} className="flex items-center justify-between p-3 border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--muted)]/20 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" defaultChecked className="accent-[var(--primary)]" />
                      <div>
                        <span className="font-mono text-sm text-[var(--foreground)]">{item.sku}</span>
                        <p className="text-xs text-[var(--muted-foreground)] truncate max-w-[300px]">{item.desc}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-[var(--foreground)]">{item.qty} x ${item.price}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">${item.total.toLocaleString()}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="px-3 py-2 bg-[var(--muted)]/30 border-t border-[var(--border)] flex justify-between">
                <span className="text-sm font-medium text-[var(--foreground)]">Total Value:</span>
                <span className="text-sm font-semibold text-[var(--foreground)]">$31,035</span>
              </div>
            </div>
          </div>

          {/* Justification */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Justification / Reason for Request</label>
            <textarea
              placeholder="Explain why this manufacturer should be approved for this project..."
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm h-32 resize-none"
              defaultValue="Lutron dimmers provide superior daylight harvesting integration with the Acuity fixtures already approved. Lead time is 2 weeks vs 6 weeks for alternatives. The dimming system is required to meet the energy code compliance for this medical facility."
            />
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Attachments</label>
            <div className="border-2 border-dashed border-[var(--border)] rounded-lg p-4 text-center hover:border-[var(--primary)] transition-colors cursor-pointer">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto mb-2 text-[var(--muted-foreground)]">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="text-sm text-[var(--muted-foreground)]">Drop files here or click to upload</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">PDF, DOC, XLS up to 10MB</p>
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between p-2 bg-[var(--muted)]/30 rounded text-sm">
                <span className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <path d="M14 2v6h6"/>
                  </svg>
                  lutron-spec-sheet.pdf
                </span>
                <button className="text-[var(--muted-foreground)] hover:text-red-600">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <div className="flex items-center justify-between p-2 bg-[var(--muted)]/30 rounded text-sm">
                <span className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <path d="M14 2v6h6"/>
                  </svg>
                  comparison-analysis.pdf
                </span>
                <button className="text-[var(--muted-foreground)] hover:text-red-600">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Send To Section */}
          <div className="border-t border-[var(--border)] pt-6">
            <h3 className="text-sm font-medium text-[var(--foreground)] mb-4">Send To</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">Contact</label>
                <select className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-white">
                  <option>Mike Johnson (Procurement)</option>
                  <option>John Smith (Engineering)</option>
                  <option>Sarah Williams (Project Manager)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">Email</label>
                <input
                  type="email"
                  value="mike.johnson@turner.com"
                  readOnly
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--muted)]/30"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs text-[var(--muted-foreground)] mb-1">CC (optional)</label>
              <input
                type="text"
                placeholder="Additional email addresses..."
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm"
              />
            </div>
            <label className="flex items-center gap-2 mt-4 cursor-pointer">
              <input type="checkbox" className="accent-[var(--primary)]" />
              <span className="text-sm text-[var(--foreground)]">Also send via FlowConnect message</span>
            </label>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-between sticky bottom-0 bg-[var(--card)]">
          <button className="px-4 py-2 text-sm text-[var(--primary)] hover:bg-[var(--muted)] rounded-lg transition-colors">
            Preview PDF
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
            >
              Save Draft
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSend}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors"
            >
              Send Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
