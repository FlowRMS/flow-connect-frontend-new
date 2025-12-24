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

// Mock email templates
const mockEmailTemplates = [
  { id: 'et-1', name: 'Quote Delivery', description: 'Standard quote delivery email' },
  { id: 'et-2', name: 'Quote Follow-up', description: 'Follow-up on sent quote' },
  { id: 'et-3', name: 'Quote Revision', description: 'Notify of quote revision' },
  { id: 'et-4', name: 'Price Update', description: 'Inform of price changes' },
];

// Mock contacts - in real app these would come from the quote data
const mockContacts = {
  customer: [
    { id: 'c1', name: 'John Smith', email: 'john.smith@skanska.com', role: 'Project Manager', company: 'Skanska USA' },
    { id: 'c2', name: 'Sarah Johnson', email: 'sarah.j@skanska.com', role: 'Procurement', company: 'Skanska USA' },
  ],
  endUser: [
    { id: 'e1', name: 'Mike Wilson', email: 'mwilson@university.edu', role: 'Facilities Director', company: 'University Lab' },
    { id: 'e2', name: 'Lisa Chen', email: 'lchen@university.edu', role: 'Project Coordinator', company: 'University Lab' },
  ],
  manufacturer: [
    { id: 'm1', name: 'David Brown', email: 'dbrown@philips.com', role: 'Sales Rep', company: 'Philips' },
    { id: 'm2', name: 'Amy Taylor', email: 'ataylor@lutron.com', role: 'Account Manager', company: 'Lutron' },
  ],
};

interface Contact {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string;
}

interface QuotePdfPreviewModalProps {
  quote: QuoteData;
  onClose: () => void;
}

export default function QuotePdfPreviewModal({ quote, onClose }: QuotePdfPreviewModalProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  // Email functionality state
  const [showEmailPanel, setShowEmailPanel] = useState(false);
  const [selectedEmailTemplateId, setSelectedEmailTemplateId] = useState<string>('et-1');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [numPages, setNumPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(100);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Editable PDF content fields
  const [customMessage, setCustomMessage] = useState('');
  const [pdfNotes, setPdfNotes] = useState('');
  const [termsOverride, setTermsOverride] = useState('');
  const [footerText, setFooterText] = useState('');

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

  const toggleContact = (contactId: string) => {
    setSelectedContacts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contactId)) {
        newSet.delete(contactId);
      } else {
        newSet.add(contactId);
      }
      return newSet;
    });
  };

  const getAllContacts = (): Contact[] => {
    return [...mockContacts.customer, ...mockContacts.endUser, ...mockContacts.manufacturer];
  };

  const getFilteredContacts = () => {
    const query = contactSearchQuery.toLowerCase();
    return {
      customer: mockContacts.customer.filter(c =>
        c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query)
      ),
      endUser: mockContacts.endUser.filter(c =>
        c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query)
      ),
      manufacturer: mockContacts.manufacturer.filter(c =>
        c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query)
      ),
    };
  };

  const handleEmailPdf = () => {
    const selectedContactsList = getAllContacts().filter(c => selectedContacts.has(c.id));
    const emailTemplate = mockEmailTemplates.find(t => t.id === selectedEmailTemplateId);

    // In a real app, this would open FlowMail with the template, PDF attached, and recipients
    // For now, we'll show an alert with the details
    console.log('Opening FlowMail with:', {
      template: emailTemplate?.name,
      recipients: selectedContactsList.map(c => c.email),
      attachment: `${quote.quoteNumber}.pdf`,
    });

    // Navigate to FlowMail (or open a compose modal)
    // For demo, we'll open a mailto link or show success
    alert(`Opening FlowMail...\n\nTemplate: ${emailTemplate?.name}\nRecipients: ${selectedContactsList.map(c => c.email).join(', ')}\nAttachment: ${quote.quoteNumber}.pdf`);
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

              {/* Editable PDF Content */}
              <div className="flex-1 overflow-auto p-4">
                <h4 className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-3">
                  Edit Content
                </h4>
                <div className="space-y-4">
                  {/* Custom Message */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--foreground)] mb-1.5">
                      Custom Message
                    </label>
                    <textarea
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="Add a personalized message to appear on the PDF..."
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--foreground)] mb-1.5">
                      Notes / Special Instructions
                    </label>
                    <textarea
                      value={pdfNotes}
                      onChange={(e) => setPdfNotes(e.target.value)}
                      placeholder="Add notes or special instructions..."
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
                    />
                  </div>

                  {/* Terms Override */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--foreground)] mb-1.5">
                      Terms & Conditions
                    </label>
                    <textarea
                      value={termsOverride}
                      onChange={(e) => setTermsOverride(e.target.value)}
                      placeholder="Override default terms and conditions..."
                      rows={4}
                      className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
                    />
                  </div>

                  {/* Footer Text */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--foreground)] mb-1.5">
                      Footer Text
                    </label>
                    <input
                      type="text"
                      value={footerText}
                      onChange={(e) => setFooterText(e.target.value)}
                      placeholder="Custom footer text..."
                      className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                    />
                  </div>
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
                  onClick={() => setShowEmailPanel(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 5h14v10H3z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 5l7 6 7-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Email PDF
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

      {/* Email PDF Modal */}
      {showEmailPanel && (
        <>
          <div className="fixed inset-0 bg-black/30 z-[60]" onClick={() => setShowEmailPanel(false)} />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">Email PDF</h3>
                  <p className="text-sm text-[var(--muted-foreground)]">Select template and recipients</p>
                </div>
                <button
                  onClick={() => setShowEmailPanel(false)}
                  className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Email Template Selection */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Email Template
                  </label>
                  <select
                    value={selectedEmailTemplateId}
                    onChange={(e) => setSelectedEmailTemplateId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  >
                    {mockEmailTemplates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {mockEmailTemplates.find(t => t.id === selectedEmailTemplateId)?.description}
                  </p>
                </div>

                {/* Contact Selection */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Recipients
                  </label>
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={contactSearchQuery}
                    onChange={(e) => setContactSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 mb-3"
                  />

                  <div className="space-y-4 max-h-[300px] overflow-y-auto">
                    {/* Customer Contacts */}
                    {getFilteredContacts().customer.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
                          Customer
                        </h4>
                        <div className="space-y-1">
                          {getFilteredContacts().customer.map(contact => (
                            <label
                              key={contact.id}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--muted)]/50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedContacts.has(contact.id)}
                                onChange={() => toggleContact(contact.id)}
                                className="accent-[var(--primary)]"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-[var(--foreground)] truncate">{contact.name}</div>
                                <div className="text-xs text-[var(--muted-foreground)] truncate">{contact.email}</div>
                              </div>
                              <span className="text-xs text-[var(--muted-foreground)]">{contact.role}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* End User Contacts */}
                    {getFilteredContacts().endUser.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
                          End User
                        </h4>
                        <div className="space-y-1">
                          {getFilteredContacts().endUser.map(contact => (
                            <label
                              key={contact.id}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--muted)]/50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedContacts.has(contact.id)}
                                onChange={() => toggleContact(contact.id)}
                                className="accent-[var(--primary)]"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-[var(--foreground)] truncate">{contact.name}</div>
                                <div className="text-xs text-[var(--muted-foreground)] truncate">{contact.email}</div>
                              </div>
                              <span className="text-xs text-[var(--muted-foreground)]">{contact.role}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Manufacturer Contacts */}
                    {getFilteredContacts().manufacturer.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
                          Manufacturer
                        </h4>
                        <div className="space-y-1">
                          {getFilteredContacts().manufacturer.map(contact => (
                            <label
                              key={contact.id}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--muted)]/50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedContacts.has(contact.id)}
                                onChange={() => toggleContact(contact.id)}
                                className="accent-[var(--primary)]"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-[var(--foreground)] truncate">{contact.name}</div>
                                <div className="text-xs text-[var(--muted-foreground)] truncate">{contact.email}</div>
                              </div>
                              <span className="text-xs text-[var(--muted-foreground)]">{contact.role}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedContacts.size > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                      <span className="font-medium text-[var(--foreground)]">{selectedContacts.size}</span>
                      recipient{selectedContacts.size !== 1 ? 's' : ''} selected
                    </div>
                  )}
                </div>

                {/* Attachment Info */}
                <div className="p-3 bg-[var(--muted)]/30 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                      <path d="M4 4h8l4 4v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M12 4v4h4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="font-medium text-[var(--foreground)]">{quote.quoteNumber}.pdf</span>
                    <span className="text-[var(--muted-foreground)]">will be attached</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between">
                <button
                  onClick={() => setShowEmailPanel(false)}
                  className="px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEmailPdf}
                  disabled={selectedContacts.size === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 5h14v10H3z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 5l7 6 7-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Open in FlowMail
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
