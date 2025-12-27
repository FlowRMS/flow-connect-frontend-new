'use client';

import React from 'react';

interface PdfTemplate {
  companyLogo: boolean;
  companyName: string;
  companyAddress: string;
  includeProjectDetails: boolean;
  includeProductList: boolean;
  includeSpecSheets: boolean;
  includeJustification: boolean;
  headerText: string;
  footerText: string;
  customMessage: string;
}

interface EditTemplateModalProps {
  show: boolean;
  pdfTemplate: PdfTemplate;
  onClose: () => void;
  onSetPdfTemplate: React.Dispatch<React.SetStateAction<PdfTemplate>>;
  onSave: () => void;
  onReset: () => void;
}

export function EditTemplateModal({
  show,
  pdfTemplate,
  onClose,
  onSetPdfTemplate,
  onSave,
  onReset,
}: EditTemplateModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between sticky top-0 bg-[var(--card)] z-10">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Edit PDF Template</h2>
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
          {/* Company Information */}
          <div>
            <h3 className="font-medium text-[var(--foreground)] mb-3 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21,15 16,10 5,21"/>
              </svg>
              Company Information
            </h3>
            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pdfTemplate.companyLogo}
                  onChange={(e) => onSetPdfTemplate(prev => ({ ...prev, companyLogo: e.target.checked }))}
                  className="accent-[var(--primary)]"
                />
                <span className="text-sm text-[var(--foreground)]">Include company logo</span>
              </label>
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">Company Name</label>
                <input
                  type="text"
                  value={pdfTemplate.companyName}
                  onChange={(e) => onSetPdfTemplate(prev => ({ ...prev, companyName: e.target.value }))}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">Company Address</label>
                <textarea
                  value={pdfTemplate.companyAddress}
                  onChange={(e) => onSetPdfTemplate(prev => ({ ...prev, companyAddress: e.target.value }))}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm h-20 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Content Sections */}
          <div>
            <h3 className="font-medium text-[var(--foreground)] mb-3 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <path d="M14 2v6h6"/>
                <path d="M16 13H8M16 17H8M10 9H8"/>
              </svg>
              Content Sections
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-[var(--muted)]/30 rounded">
                <input
                  type="checkbox"
                  checked={pdfTemplate.includeProjectDetails}
                  onChange={(e) => onSetPdfTemplate(prev => ({ ...prev, includeProjectDetails: e.target.checked }))}
                  className="accent-[var(--primary)]"
                />
                <span className="text-sm text-[var(--foreground)]">Include project details (builder, project name, manufacturer, value)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-[var(--muted)]/30 rounded">
                <input
                  type="checkbox"
                  checked={pdfTemplate.includeProductList}
                  onChange={(e) => onSetPdfTemplate(prev => ({ ...prev, includeProductList: e.target.checked }))}
                  className="accent-[var(--primary)]"
                />
                <span className="text-sm text-[var(--foreground)]">Include product list table</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-[var(--muted)]/30 rounded">
                <input
                  type="checkbox"
                  checked={pdfTemplate.includeSpecSheets}
                  onChange={(e) => onSetPdfTemplate(prev => ({ ...prev, includeSpecSheets: e.target.checked }))}
                  className="accent-[var(--primary)]"
                />
                <span className="text-sm text-[var(--foreground)]">Include spec sheet attachments</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-[var(--muted)]/30 rounded">
                <input
                  type="checkbox"
                  checked={pdfTemplate.includeJustification}
                  onChange={(e) => onSetPdfTemplate(prev => ({ ...prev, includeJustification: e.target.checked }))}
                  className="accent-[var(--primary)]"
                />
                <span className="text-sm text-[var(--foreground)]">Include justification text</span>
              </label>
            </div>
          </div>

          {/* Header & Footer Text */}
          <div>
            <h3 className="font-medium text-[var(--foreground)] mb-3 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7V4h16v3M9 20h6M12 4v16"/>
              </svg>
              Header & Footer
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">Header Text</label>
                <input
                  type="text"
                  value={pdfTemplate.headerText}
                  onChange={(e) => onSetPdfTemplate(prev => ({ ...prev, headerText: e.target.value }))}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">Footer Text</label>
                <textarea
                  value={pdfTemplate.footerText}
                  onChange={(e) => onSetPdfTemplate(prev => ({ ...prev, footerText: e.target.value }))}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm h-16 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <h3 className="font-medium text-[var(--foreground)] mb-3 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
              Custom Message (Optional)
            </h3>
            <textarea
              value={pdfTemplate.customMessage}
              onChange={(e) => onSetPdfTemplate(prev => ({ ...prev, customMessage: e.target.value }))}
              placeholder="Add any additional notes or custom message to include in the PDF..."
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm h-24 resize-none"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-between sticky bottom-0 bg-[var(--card)]">
          <button
            onClick={onReset}
            className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            Reset to Default
          </button>
          <div className="flex gap-3">
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
              Save Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
