'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { PdfTemplate } from '../../lib/types/pdf-templates';
import { templateTypeLabels, templateTypeColors } from '../../lib/types/pdf-templates';
import { mockPdfTemplates, getTemplatesByType } from '../../lib/data/pdf-templates-mock';
import {
  generatePdfBlobFromTemplate,
  downloadPdfFromTemplate,
  type QuoteData,
} from '../../lib/utils/generatePdfFromTemplate';

// Dynamically import react-pdf components to avoid SSR issues
const Document = dynamic(
  () => import('react-pdf').then((mod) => {
    // Configure PDF.js worker when the module loads on client
    mod.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.mjs`;
    return mod.Document;
  }),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" /></div> }
);

const Page = dynamic(
  () => import('react-pdf').then((mod) => mod.Page),
  { ssr: false }
);

interface QuotePdfPreviewModalProps {
  quote: QuoteData;
  onClose: () => void;
}

export default function QuotePdfPreviewModal({ quote, onClose }: QuotePdfPreviewModalProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [numPages, setNumPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(100);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Get available templates for quotes
  const quoteTemplates = useMemo(() => getTemplatesByType('quote'), []);

  // Get selected template
  const selectedTemplate = useMemo(
    () => mockPdfTemplates.find(t => t.id === selectedTemplateId) || quoteTemplates[0],
    [selectedTemplateId, quoteTemplates]
  );

  // Set default template on mount
  useEffect(() => {
    if (quoteTemplates.length > 0 && !selectedTemplateId) {
      const defaultTemplate = quoteTemplates.find(t => t.isDefault) || quoteTemplates[0];
      setSelectedTemplateId(defaultTemplate.id);
    }
  }, [quoteTemplates, selectedTemplateId]);

  // Generate PDF when template changes
  useEffect(() => {
    if (!selectedTemplate) return;

    setLoading(true);
    setError(null);

    try {
      const blob = generatePdfBlobFromTemplate(selectedTemplate, quote);
      setPdfBlob(blob);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setLoading(false);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF preview');
      setLoading(false);
    }

    // Cleanup URL on unmount
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate, quote]);

  const handleDownload = () => {
    if (selectedTemplate) {
      downloadPdfFromTemplate(selectedTemplate, quote);
    }
  };

  const handlePrint = () => {
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      }
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const zoomLevels = [50, 75, 100, 125, 150, 200];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[var(--card)] rounded-xl shadow-2xl w-[95vw] h-[90vh] max-w-[1400px] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                PDF Preview
              </h2>
              <span className="text-sm text-[var(--muted-foreground)]">
                {quote.quoteName} - {quote.quoteNumber}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* PDF Preview Panel (Left - 70%) */}
            <div className="flex-1 flex flex-col bg-gray-100 overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  {/* Page Navigation */}
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="p-1.5 hover:bg-[var(--muted)] rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 15l-5-5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <span className="text-sm text-[var(--foreground)] min-w-[80px] text-center">
                    Page {currentPage} of {numPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                    disabled={currentPage >= numPages}
                    className="p-1.5 hover:bg-[var(--muted)] rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setZoom(z => Math.max(50, z - 25))}
                    className="p-1.5 hover:bg-[var(--muted)] rounded"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 10h10" strokeLinecap="round" />
                    </svg>
                  </button>
                  <select
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="px-2 py-1 text-sm border border-[var(--border)] rounded bg-white"
                  >
                    {zoomLevels.map(level => (
                      <option key={level} value={level}>{level}%</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setZoom(z => Math.min(200, z + 25))}
                    className="p-1.5 hover:bg-[var(--muted)] rounded"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 5v10M5 10h10" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* PDF Viewer */}
              <div className="flex-1 overflow-auto flex items-start justify-center p-4">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-[var(--muted-foreground)]">Generating preview...</span>
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <p className="text-red-600 mb-2">{error}</p>
                      <button
                        onClick={() => {
                          setLoading(true);
                          setError(null);
                          // Trigger re-generation
                          setSelectedTemplateId(prev => prev);
                        }}
                        className="text-sm text-[var(--primary)] hover:underline"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                ) : pdfUrl ? (
                  <Document
                    file={pdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={
                      <div className="flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                      </div>
                    }
                    error={
                      <div className="text-red-600 text-center p-4">
                        Failed to load PDF
                      </div>
                    }
                  >
                    <Page
                      pageNumber={currentPage}
                      scale={zoom / 100}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      className="shadow-lg"
                    />
                  </Document>
                ) : null}
              </div>
            </div>

            {/* Settings Panel (Right - 30%) */}
            <div className="w-[320px] border-l border-[var(--border)] flex flex-col bg-[var(--card)]">
              {/* Template Selection */}
              <div className="p-4 border-b border-[var(--border)]">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Template
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                >
                  {quoteTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} {template.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Template Info */}
              {selectedTemplate && (
                <div className="p-4 border-b border-[var(--border)]">
                  <h3 className="text-sm font-medium text-[var(--foreground)] mb-2">
                    {selectedTemplate.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${templateTypeColors[selectedTemplate.type]}`}>
                      {templateTypeLabels[selectedTemplate.type]}
                    </span>
                    {selectedTemplate.isDefault && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600">
                        Default
                      </span>
                    )}
                  </div>
                  {selectedTemplate.description && (
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {selectedTemplate.description}
                    </p>
                  )}
                </div>
              )}

              {/* Modules List */}
              <div className="flex-1 overflow-auto p-4">
                <h4 className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-3">
                  Template Modules
                </h4>
                <div className="space-y-2">
                  {selectedTemplate?.modules
                    .filter(m => m.config.visible)
                    .sort((a, b) => a.position - b.position)
                    .map(module => (
                      <div
                        key={module.id}
                        className="flex items-center gap-2 px-3 py-2 bg-[var(--muted)]/30 rounded text-sm"
                      >
                        <span className="w-5 h-5 flex items-center justify-center bg-[var(--primary)]/10 text-[var(--primary)] rounded text-xs">
                          {module.position + 1}
                        </span>
                        <span className="text-[var(--foreground)] capitalize">
                          {module.type.replace(/-/g, ' ')}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-[var(--border)] space-y-2">
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 3v10M6 9l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 15v2h14v-2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Download PDF
                </button>
                <button
                  onClick={handlePrint}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 8V2h10v6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5 14H3v-4h14v4h-2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5 12h10v6H5z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Print
                </button>
                <a
                  href="/pdf-templates"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-[var(--primary)] hover:underline"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 3H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V9" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 11l8-8M13 3h4v4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Manage Templates
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
