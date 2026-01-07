'use client';

import React, { useState, useRef } from 'react';
import { DocumentType } from '@/lib/types/warehouse';
import { uploadDocument, deleteDocument, type FulfillmentDocument } from './api/fulfillmentApi';

interface DocumentsSectionProps {
  fulfillmentOrderId: string;
  documents: FulfillmentDocument[];
  onDocumentsChange?: () => void;
  isEditable?: boolean;
  title?: string;
}

// Document type labels and icons
const documentTypeInfo: Record<DocumentType, { label: string; icon: React.ReactNode; color: string }> = {
  PACKING_SLIP: {
    label: 'Packing Slip',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    color: 'text-blue-600',
  },
  BILL_OF_LADING: {
    label: 'Bill of Lading',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
    color: 'text-purple-600',
  },
  SHIPPING_LABEL: {
    label: 'Shipping Label',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
        <line x1="7" y1="7" x2="7.01" y2="7"/>
      </svg>
    ),
    color: 'text-orange-600',
  },
  PROOF_OF_DELIVERY: {
    label: 'Proof of Delivery',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    color: 'text-green-600',
  },
  INVOICE: {
    label: 'Invoice',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="4" width="20" height="16" rx="2"/>
        <path d="M7 8h10M7 12h4"/>
      </svg>
    ),
    color: 'text-emerald-600',
  },
  RECEIPT: {
    label: 'Receipt',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 2v20l2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2V2l-2 2-2-2-2 2-2-2-2 2-2-2-2 2-2-2z"/>
        <path d="M8 10h8M8 14h4"/>
      </svg>
    ),
    color: 'text-teal-600',
  },
  PHOTO: {
    label: 'Photo',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
    color: 'text-pink-600',
  },
  OTHER: {
    label: 'Other',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/>
        <polyline points="13 2 13 9 20 9"/>
      </svg>
    ),
    color: 'text-gray-600',
  },
};

export default function DocumentsSection({
  fulfillmentOrderId,
  documents,
  onDocumentsChange,
  isEditable = true,
  title = 'Documents',
}: DocumentsSectionProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('PACKING_SLIP');
  const [docName, setDocName] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMimeType, setPreviewMimeType] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [viewingDocument, setViewingDocument] = useState<FulfillmentDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
      setPreviewMimeType(file.type);
      // Auto-set name if empty
      if (!docName) {
        setDocName(file.name.replace(/\.[^/.]+$/, '')); // Remove extension
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
          setPreviewMimeType(file.type);
          if (!docName) {
            setDocName(`${documentTypeInfo[selectedDocType].label} - ${new Date().toLocaleDateString()}`);
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleUpload = async () => {
    if (!selectedFile || !docName) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      await uploadDocument({
        fulfillmentOrderId,
        documentType: selectedDocType,
        file: selectedFile,
        notes: docNotes || undefined,
      });

      // Reset form
      setShowUploadModal(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setPreviewMimeType('');
      setDocName('');
      setDocNotes('');
      setSelectedDocType('PACKING_SLIP');

      // Notify parent to refresh documents
      onDocumentsChange?.();
    } catch (error) {
      console.error('Failed to upload document:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const isImageType = (mimeType: string) => mimeType.startsWith('image/');
  const isPdfType = (mimeType: string) => mimeType === 'application/pdf';

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <path d="M14 2v6h6"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <h3 className="text-sm font-semibold text-[var(--foreground)]">{title}</h3>
          {documents.length > 0 && (
            <span className="ml-1 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
              {documents.length}
            </span>
          )}
        </div>
        {isEditable && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add
          </button>
        )}
      </div>

      {/* Documents List */}
      {documents.length === 0 ? (
        <div className="text-center py-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2 text-[var(--muted-foreground)] opacity-50">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <path d="M14 2v6h6"/>
          </svg>
          <p className="text-sm text-[var(--muted-foreground)]">No documents attached</p>
          {isEditable && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-2 text-xs text-[var(--primary)] hover:underline"
            >
              Add your first document
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => {
            const typeInfo = documentTypeInfo[doc.documentType as DocumentType];
            return (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--muted)]/50 transition-colors group cursor-pointer"
                onClick={() => setViewingDocument(doc)}
              >
                {/* Thumbnail or Icon */}
                <div className="w-10 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {doc.mimeType && isImageType(doc.mimeType) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={doc.fileUrl}
                      alt={doc.fileName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className={typeInfo.color}>{typeInfo.icon}</span>
                  )}
                </div>

                {/* Document Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)] truncate">{doc.fileName}</p>
                  <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                    <span className={`flex items-center gap-1 ${typeInfo.color}`}>
                      {typeInfo.icon}
                      {typeInfo.label}
                    </span>
                    <span>{formatDate(doc.uploadedAt)}</span>
                    {doc.fileSize && <span>{formatFileSize(doc.fileSize)}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(doc.fileUrl, '_blank');
                    }}
                    className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--muted)] rounded transition-colors"
                    title="Open in new tab"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </button>
                  {isEditable && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await deleteDocument(doc.id);
                          onDocumentsChange?.();
                        } catch (error) {
                          console.error('Failed to delete document:', error);
                        }
                      }}
                      className="p-1.5 text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Remove document"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Add Document</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setPreviewUrl(null);
                  setDocName('');
                  setDocNotes('');
                }}
                className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Document Type Selection */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-2">
                Document Type
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(documentTypeInfo) as DocumentType[]).map((type) => {
                  const info = documentTypeInfo[type];
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedDocType(type)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                        selectedDocType === type
                          ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                          : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                      }`}
                    >
                      <span className={info.color}>{info.icon}</span>
                      <span className="text-xs text-[var(--foreground)] text-center leading-tight">{info.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* File Upload Area */}
            {!previewUrl ? (
              <div className="mb-4">
                <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-2">
                  Upload File
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleCameraCapture}
                    className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-[var(--border)] rounded-lg hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-colors"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                    <span className="text-sm text-[var(--muted-foreground)]">Take Photo</span>
                  </button>
                  <label className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-[var(--border)] rounded-lg hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-colors cursor-pointer">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <span className="text-sm text-[var(--muted-foreground)]">Upload File</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-2">
                  Preview
                </label>
                <div className="relative rounded-lg border border-[var(--border)] overflow-hidden bg-gray-50">
                  {isImageType(previewMimeType) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full max-h-48 object-contain"
                    />
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto mb-2 text-red-600">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                        <p className="text-sm text-[var(--foreground)]">PDF Document</p>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => setPreviewUrl(null)}
                    className="absolute top-2 right-2 p-1 bg-white/90 rounded-full hover:bg-white transition-colors shadow"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Document Name */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-2">
                Document Name
              </label>
              <input
                type="text"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="Enter document name..."
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </div>

            {/* Notes (optional) */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={docNotes}
                onChange={(e) => setDocNotes(e.target.value)}
                placeholder="Add any relevant notes..."
                rows={2}
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
              />
            </div>

            {/* Error Message */}
            {uploadError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{uploadError}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setPreviewUrl(null);
                  setDocName('');
                  setDocNotes('');
                }}
                className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || !docName || isUploading}
                className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  'Add Document'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={documentTypeInfo[viewingDocument.documentType as DocumentType].color}>
                  {documentTypeInfo[viewingDocument.documentType as DocumentType].icon}
                </span>
                <div>
                  <h3 className="font-medium text-[var(--foreground)]">{viewingDocument.fileName}</h3>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {documentTypeInfo[viewingDocument.documentType as DocumentType].label} - Uploaded {formatDate(viewingDocument.uploadedAt)} by {viewingDocument.uploadedByName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.open(viewingDocument.fileUrl, '_blank')}
                  className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
                  title="Open in new tab"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </button>
                <button
                  onClick={() => setViewingDocument(null)}
                  className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-100">
              {viewingDocument.mimeType && isImageType(viewingDocument.mimeType) ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={viewingDocument.fileUrl}
                    alt={viewingDocument.fileName}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                  />
                </div>
              ) : viewingDocument.mimeType && isPdfType(viewingDocument.mimeType) ? (
                <iframe
                  src={viewingDocument.fileUrl}
                  className="w-full h-[70vh] rounded-lg border border-gray-200"
                  title={viewingDocument.fileName}
                />
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4 text-[var(--muted-foreground)]">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <p className="text-[var(--foreground)] font-medium mb-2">Preview not available</p>
                  <button
                    onClick={() => window.open(viewingDocument.fileUrl, '_blank')}
                    className="text-sm text-[var(--primary)] hover:underline"
                  >
                    Open in new tab
                  </button>
                </div>
              )}
            </div>
            {viewingDocument.notes && (
              <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--muted)]/30">
                <p className="text-xs text-[var(--muted-foreground)] uppercase font-medium mb-1">Notes</p>
                <p className="text-sm text-[var(--foreground)]">{viewingDocument.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
