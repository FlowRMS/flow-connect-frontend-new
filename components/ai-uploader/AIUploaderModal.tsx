'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export type DocumentType =
  | 'quote'
  | 'order'
  | 'order-acknowledgement'
  | 'invoice'
  | 'commission-statement'
  | 'contacts'
  | 'companies'
  | 'products';

interface DocumentTypeOption {
  id: DocumentType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const documentTypes: DocumentTypeOption[] = [
  {
    id: 'quote',
    label: 'Quote',
    description: 'Upload manufacturer quotes',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <path d="M14 2v6h6"/>
        <path d="M8 13h8M8 17h8M8 9h2"/>
      </svg>
    ),
  },
  {
    id: 'order',
    label: 'Order',
    description: 'Upload purchase orders',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <path d="M3 6h18"/>
        <path d="M16 10a4 4 0 01-8 0"/>
      </svg>
    ),
  },
  {
    id: 'order-acknowledgement',
    label: 'Order Acknowledgement',
    description: 'Upload order acknowledgements',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 11l3 3L22 4"/>
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
    ),
  },
  {
    id: 'invoice',
    label: 'Invoice',
    description: 'Upload invoices',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <path d="M14 2v6h6"/>
        <path d="M8 12h8M8 16h4"/>
        <circle cx="16" cy="16" r="2"/>
      </svg>
    ),
  },
  {
    id: 'commission-statement',
    label: 'Commission Statement',
    description: 'Upload commission statements',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
      </svg>
    ),
  },
  {
    id: 'contacts',
    label: 'Contacts',
    description: 'Upload contact lists',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    id: 'companies',
    label: 'Companies',
    description: 'Upload company data',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="2" width="16" height="20" rx="2"/>
        <path d="M9 6h6M9 10h6M9 14h6M9 18h6"/>
      </svg>
    ),
  },
  {
    id: 'products',
    label: 'Products',
    description: 'Upload product catalogs',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
        <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/>
      </svg>
    ),
  },
];

// Map pathname prefixes to document types
const pathPrefixToDocType: { prefix: string; type: DocumentType }[] = [
  { prefix: '/quotes', type: 'quote' },
  { prefix: '/orders', type: 'order' },
  { prefix: '/invoices', type: 'invoice' },
  { prefix: '/commissions', type: 'commission-statement' },
  { prefix: '/contacts', type: 'contacts' },
  { prefix: '/companies', type: 'companies' },
  { prefix: '/products', type: 'products' },
];

// Get document type from pathname (matches exact path or paths starting with prefix)
function getDocTypeFromPath(pathname: string): DocumentType {
  for (const { prefix, type } of pathPrefixToDocType) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      return type;
    }
  }
  return 'quote';
}

interface AIUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Sample templates - in production, these would come from an API
const templates = [
  { id: 'default', name: 'Default Template' },
  { id: 'detailed', name: 'Detailed Extraction' },
  { id: 'summary', name: 'Summary Only' },
  { id: 'line-items', name: 'Line Items Focus' },
];

export default function AIUploaderModal({ isOpen, onClose }: AIUploaderModalProps) {
  const pathname = usePathname();
  const [selectedType, setSelectedType] = useState<DocumentType>('quote');
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Advanced settings state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('default');
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [isRefDragging, setIsRefDragging] = useState(false);

  // Set default document type based on current page and reset state
  useEffect(() => {
    if (isOpen) {
      setSelectedType(getDocTypeFromPath(pathname));
      setFiles([]);
      setShowAdvanced(false);
      setSpecialInstructions('');
      setSelectedTemplate('default');
      setReferenceFiles([]);
    }
  }, [isOpen, pathname]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      setFiles(prev => [...prev, ...Array.from(selectedFiles)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Reference file handlers
  const handleRefDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsRefDragging(true);
  };

  const handleRefDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsRefDragging(false);
  };

  const handleRefDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsRefDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setReferenceFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleRefFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      setReferenceFiles(prev => [...prev, ...Array.from(selectedFiles)]);
    }
  };

  const removeRefFile = (index: number) => {
    setReferenceFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsUploading(false);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-gradient-to-r from-violet-500/10 to-purple-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">AI Uploader</h2>
              <p className="text-xs text-[var(--muted-foreground)]">Upload documents for AI processing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Document Type Selection */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
              What are you uploading?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {documentTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    selectedType === type.id
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]'
                      : 'border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <div className={selectedType === type.id ? 'text-[var(--primary)]' : ''}>
                    {type.icon}
                  </div>
                  <span className="text-xs font-medium text-center leading-tight">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* File Upload Zone */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Upload Files
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-5 text-center transition-all ${
                isDragging
                  ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                  : 'border-[var(--border)] hover:border-[var(--primary)]/50'
              }`}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2 text-[var(--muted-foreground)]">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="text-sm text-[var(--foreground)] mb-2">
                Drag and drop your files here
              </p>
              <label className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-lg cursor-pointer hover:bg-[var(--primary-hover)] transition-colors">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 16v2a2 2 0 002 2h8a2 2 0 002-2v-2M10 4v10M6 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Browse Files
                <input
                  type="file"
                  multiple
                  accept=".pdf,.csv,.xlsx,.xls,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                PDF, CSV, Excel, and Word files
              </p>
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
                Selected Files ({files.length})
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-[var(--muted)]/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                          <path d="M14 2v6h6"/>
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--foreground)] truncate">{file.name}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1.5 hover:bg-[var(--muted)] rounded-lg transition-colors flex-shrink-0"
                    >
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Advanced Settings */}
          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                </svg>
                Advanced Settings
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
              >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {showAdvanced && (
              <div className="px-4 pb-4 space-y-4 border-t border-[var(--border)]">
                {/* Special Instructions */}
                <div className="pt-4">
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Special Instructions
                  </label>
                  <textarea
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="Add any special instructions for the AI processor..."
                    className="w-full px-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] transition-colors"
                    rows={3}
                  />
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    E.g., "Focus on extracting line item quantities" or "Ignore header information"
                  </p>
                </div>

                {/* Template Selection */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Processing Template
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] transition-colors"
                  >
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    Choose a template to customize how documents are processed
                  </p>
                </div>

                {/* Reference Files */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Reference Files
                  </label>
                  <div
                    onDragOver={handleRefDragOver}
                    onDragLeave={handleRefDragLeave}
                    onDrop={handleRefDrop}
                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-all ${
                      isRefDragging
                        ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                        : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                    }`}
                  >
                    <p className="text-xs text-[var(--muted-foreground)] mb-2">
                      Drop reference files here or
                    </p>
                    <label className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-[var(--muted)] text-[var(--foreground)] rounded-lg cursor-pointer hover:bg-[var(--muted)]/80 transition-colors">
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 16v2a2 2 0 002 2h8a2 2 0 002-2v-2M10 4v10M6 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Browse
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.csv,.xlsx,.xls,.doc,.docx"
                        onChange={handleRefFileSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    Upload files to use as reference for mapping or comparison
                  </p>

                  {/* Reference File List */}
                  {referenceFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {referenceFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-[var(--muted)]/30 rounded-lg"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)] flex-shrink-0">
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                              <path d="M14 2v6h6"/>
                            </svg>
                            <span className="text-xs text-[var(--foreground)] truncate">{file.name}</span>
                            <span className="text-xs text-[var(--muted-foreground)]">({formatFileSize(file.size)})</span>
                          </div>
                          <button
                            onClick={() => removeRefFile(index)}
                            className="p-1 hover:bg-[var(--muted)] rounded transition-colors flex-shrink-0"
                          >
                            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border)] bg-[var(--muted)]/30">
          {/* Stream from manufacturer link */}
          <div className="px-6 py-3 border-b border-[var(--border)]">
            <Link
              href="/settings?tab=manufacturer-integrations"
              onClick={onClose}
              className="flex items-center gap-2 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                <circle cx="12" cy="12" r="4"/>
              </svg>
              Stream data from the manufacturer
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 10h10M12 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 px-6 py-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || isUploading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Upload & Process
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
