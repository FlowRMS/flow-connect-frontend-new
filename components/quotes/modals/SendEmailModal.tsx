'use client';

import React from 'react';

interface PdfProduct {
  sku: string;
  description: string;
  qty: number;
  value: number;
}

interface PdfData {
  builder: string;
  project: string;
  manufacturer: string;
  totalValue: number;
  products: PdfProduct[];
  justification: string;
}

interface PdfTemplate {
  includeSpecSheets: boolean;
}

interface SendEmailModalProps {
  show: boolean;
  generatedPdfData: PdfData | null;
  pdfTemplate: PdfTemplate;
  onClose: () => void;
  onPreviewPdf: () => void;
  onSend: () => void;
}

export function SendEmailModal({
  show,
  generatedPdfData,
  pdfTemplate,
  onClose,
  onPreviewPdf,
  onSend,
}: SendEmailModalProps) {
  if (!show || !generatedPdfData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between sticky top-0 bg-[var(--card)] z-10">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Send Approval Request Email</h2>
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
          {/* Request Summary */}
          <div className="p-4 bg-[var(--muted)]/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <path d="M14 2v6h6"/>
              </svg>
              <span className="font-medium text-[var(--foreground)]">Approval Request for {generatedPdfData.manufacturer}</span>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              {generatedPdfData.products.length} products | ${generatedPdfData.totalValue.toLocaleString()} total value
            </p>
          </div>

          {/* Recipients */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">To</label>
            <div className="space-y-2">
              <select className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-white">
                <option>Mike Johnson (Procurement) - mike.johnson@turner.com</option>
                <option>John Smith (Engineering) - john.smith@turner.com</option>
                <option>Sarah Williams (Project Manager) - sarah.w@turner.com</option>
              </select>
            </div>
          </div>

          {/* CC */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">CC (optional)</label>
            <input
              type="text"
              placeholder="Enter additional email addresses separated by commas..."
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Subject</label>
            <input
              type="text"
              defaultValue={`Approval Request: ${generatedPdfData.manufacturer} for ${generatedPdfData.project}`}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm"
            />
          </div>

          {/* Email Body */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Message</label>
            <textarea
              defaultValue={`Dear Team,

Please find attached the manufacturer approval request for ${generatedPdfData.manufacturer} products for the ${generatedPdfData.project} project.

This request includes ${generatedPdfData.products.length} product(s) with a total value of $${generatedPdfData.totalValue.toLocaleString()}.

${generatedPdfData.justification}

Please review and respond at your earliest convenience.

Best regards,
FlowConnect Lighting`}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm h-48 resize-none"
            />
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Attachments</label>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-[var(--muted)]/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <path d="M14 2v6h6"/>
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">Approval_Request_{generatedPdfData.manufacturer.replace(/\s+/g, '_')}.pdf</p>
                    <p className="text-xs text-[var(--muted-foreground)]">Generated approval request document</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Attached</span>
              </div>
              {pdfTemplate.includeSpecSheets && (
                <div className="flex items-center justify-between p-3 bg-[var(--muted)]/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <path d="M14 2v6h6"/>
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">Product_Spec_Sheets.zip</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{generatedPdfData.products.length} spec sheet(s)</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Attached</span>
                </div>
              )}
              <button className="w-full p-3 border-2 border-dashed border-[var(--border)] rounded-lg text-sm text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors">
                + Add additional attachments
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-[var(--primary)]" />
              <span className="text-sm text-[var(--foreground)]">Request read receipt</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-[var(--primary)]" />
              <span className="text-sm text-[var(--foreground)]">Send copy to myself</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-[var(--primary)]" />
              <span className="text-sm text-[var(--foreground)]">Schedule follow-up reminder (5 business days)</span>
            </label>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-between sticky bottom-0 bg-[var(--card)]">
          <button
            onClick={onPreviewPdf}
            className="px-4 py-2 text-sm text-[var(--primary)] hover:bg-[var(--muted)] rounded-lg transition-colors flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Preview PDF
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSend}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22,2 15,22 11,13 2,9"/>
              </svg>
              Send Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
