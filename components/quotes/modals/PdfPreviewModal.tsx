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
  companyLogo: boolean;
  companyName: string;
  companyAddress: string;
  headerText: string;
  includeProjectDetails: boolean;
  includeProductList: boolean;
  includeJustification: boolean;
  customMessage: string;
  footerText: string;
}

interface PdfPreviewModalProps {
  show: boolean;
  generatedPdfData: PdfData | null;
  pdfTemplate: PdfTemplate;
  onClose: () => void;
  onEditTemplate: () => void;
  onSendEmail: () => void;
  onDownload: () => void;
}

export function PdfPreviewModal({
  show,
  generatedPdfData,
  pdfTemplate,
  onClose,
  onEditTemplate,
  onSendEmail,
  onDownload,
}: PdfPreviewModalProps) {
  if (!show || !generatedPdfData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Approval Request PDF</h2>
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">PDF Preview</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* PDF Preview Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
          <div className="bg-white shadow-lg mx-auto max-w-[8.5in] p-8 min-h-[11in]" style={{ fontFamily: 'Georgia, serif' }}>
            {/* PDF Header */}
            {pdfTemplate.companyLogo && (
              <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-300">
                <div>
                  <div className="w-16 h-16 bg-[var(--primary)] rounded-lg flex items-center justify-center mb-2">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <circle cx="12" cy="12" r="4"/>
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-800">{pdfTemplate.companyName}</h1>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{pdfTemplate.companyAddress}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Date: {new Date().toLocaleDateString()}</p>
                  <p className="text-sm text-gray-500">Ref: APR-{Date.now().toString().slice(-6)}</p>
                </div>
              </div>
            )}

            {/* Title */}
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide">{pdfTemplate.headerText}</h2>
            </div>

            {/* Project Details */}
            {pdfTemplate.includeProjectDetails && (
              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Project Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Builder:</span>
                    <p className="font-semibold text-gray-800">{generatedPdfData.builder}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Project:</span>
                    <p className="font-semibold text-gray-800">{generatedPdfData.project}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Manufacturer:</span>
                    <p className="font-semibold text-gray-800">{generatedPdfData.manufacturer}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Value:</span>
                    <p className="font-semibold text-gray-800">${generatedPdfData.totalValue.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Product List */}
            {pdfTemplate.includeProductList && (
              <div className="mb-8">
                <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Products Requiring Approval</h3>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-2 border border-gray-300 font-semibold">SKU</th>
                      <th className="text-left p-2 border border-gray-300 font-semibold">Description</th>
                      <th className="text-center p-2 border border-gray-300 font-semibold">Qty</th>
                      <th className="text-right p-2 border border-gray-300 font-semibold">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generatedPdfData.products.map((product, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="p-2 border border-gray-300 font-mono">{product.sku}</td>
                        <td className="p-2 border border-gray-300">{product.description}</td>
                        <td className="p-2 border border-gray-300 text-center">{product.qty}</td>
                        <td className="p-2 border border-gray-300 text-right">${product.value.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-bold">
                      <td colSpan={3} className="p-2 border border-gray-300 text-right">Total:</td>
                      <td className="p-2 border border-gray-300 text-right">${generatedPdfData.totalValue.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Justification */}
            {pdfTemplate.includeJustification && (
              <div className="mb-8">
                <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Justification</h3>
                <p className="text-gray-700 leading-relaxed">{generatedPdfData.justification}</p>
              </div>
            )}

            {/* Custom Message */}
            {pdfTemplate.customMessage && (
              <div className="mb-8">
                <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Additional Notes</h3>
                <p className="text-gray-700 leading-relaxed">{pdfTemplate.customMessage}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-auto pt-8 border-t border-gray-300">
              <p className="text-sm text-gray-600 text-center italic">{pdfTemplate.footerText}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-between bg-[var(--card)]">
          <button
            onClick={onEditTemplate}
            className="px-4 py-2 text-sm text-[var(--primary)] hover:bg-[var(--muted)] rounded-lg transition-colors flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit Template
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
            >
              Close
            </button>
            <button
              onClick={onDownload}
              className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download PDF
            </button>
            <button
              onClick={onSendEmail}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M22 7l-10 7L2 7"/>
              </svg>
              Send Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
