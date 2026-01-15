'use client';

import React, { useState } from 'react';
import { specSheetCategoryLabels } from '../../lib/data/submittals-mock';
import type { SpecSheetCategory, UploadSource } from '../../lib/types/submittals';
import { useManufacturersWithSpecSheets, useCreateSpecSheet } from './api/useSpecSheetsApi';

interface SpecSheetUploadModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  defaultManufacturerId?: string;
}

export default function SpecSheetUploadModal({ onClose, onSuccess, defaultManufacturerId }: SpecSheetUploadModalProps) {
  const [uploadSource, setUploadSource] = useState<UploadSource>('url');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [manufacturerId, setManufacturerId] = useState(defaultManufacturerId || '');
  const [displayName, setDisplayName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<SpecSheetCategory[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [folders, setFolders] = useState<string[]>([]);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const { data: manufacturers = [], isLoading: loadingManufacturers } = useManufacturersWithSpecSheets();
  const createSpecSheetMutation = useCreateSpecSheet();

  const allCategories: SpecSheetCategory[] = [
    'indoor', 'outdoor', 'sports_lighting', 'controls', 'emergency',
    'decorative', 'industrial', 'drives', 'sub_metering', 'cable_tray', 'other'
  ];

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
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      if (!displayName) {
        setDisplayName(droppedFile.name.replace('.pdf', ''));
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!displayName) {
        setDisplayName(selectedFile.name.replace('.pdf', ''));
      }
    }
  };

  const toggleCategory = (category: SpecSheetCategory) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    setFolders(prev => [...prev, newFolderName.trim()]);
    setNewFolderName('');
    setShowNewFolder(false);
  };

  const handleRemoveFolder = (index: number) => {
    setFolders(prev => prev.filter((_, i) => i !== index));
  };

  const getFileName = () => {
    if (uploadSource === 'file' && file) {
      return file.name;
    }
    if (uploadSource === 'url' && url) {
      // Extract filename from URL
      const urlParts = url.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      return lastPart.split('?')[0] || 'spec-sheet.pdf';
    }
    return 'spec-sheet.pdf';
  };

  const handleSubmit = async () => {
    setError(null);

    try {
      const folderPath = folders.length > 0 ? folders.join('/') : undefined;
      const input = {
        factoryId: manufacturerId,
        fileName: getFileName(),
        displayName: displayName || undefined,
        uploadSource: uploadSource,
        sourceUrl: uploadSource === 'url' ? url : undefined,
        pageCount: 1, // Backend will determine actual page count when processing
        categories: selectedCategories,
        folderPath,
        file: uploadSource === 'file' ? file ?? undefined : undefined,
        published: true,
        needsReview: false,
      };

      await createSpecSheetMutation.mutateAsync(input);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create spec sheet');
    }
  };

  const isValid = () => {
    const hasSource = uploadSource === 'url' ? url.trim() : file;
    return hasSource && manufacturerId && selectedCategories.length > 0;
  };

  const isLoading = createSpecSheetMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Add Spec Sheet</h2>
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
          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Upload Source Tabs */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Upload Method</label>
            <div className="flex border border-[var(--border)] rounded-lg overflow-hidden">
              <button
                onClick={() => setUploadSource('url')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  uploadSource === 'url'
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)]'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 12a4 4 0 004-4V4a4 4 0 00-8 0v4a4 4 0 004 4z"/>
                    <path d="M12 12v2a4 4 0 01-8 0v-2"/>
                  </svg>
                  From URL
                </span>
              </button>
              <button
                onClick={() => setUploadSource('file')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  uploadSource === 'file'
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)]'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 14V6M6 10l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 17h14" strokeLinecap="round"/>
                  </svg>
                  Upload File
                </span>
              </button>
            </div>
          </div>

          {/* URL Input */}
          {uploadSource === 'url' && (
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Spec Sheet URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://manufacturer.com/specs/product.pdf"
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)]"
              />
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Paste a direct link to the PDF spec sheet
              </p>
            </div>
          )}

          {/* File Upload */}
          {uploadSource === 'file' && (
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Upload PDF
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragging
                    ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                    : file
                    ? 'border-green-500 bg-green-50'
                    : 'border-[var(--border)] hover:border-[var(--primary)]'
                }`}
              >
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <path d="M14 2v6h6"/>
                    </svg>
                    <div className="text-left">
                      <p className="text-sm font-medium text-[var(--foreground)]">{file.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="p-1 hover:bg-[var(--muted)] rounded"
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ) : (
                  <>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 text-[var(--muted-foreground)]">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <p className="text-sm text-[var(--foreground)] mb-1">
                      Drag and drop your PDF here
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] mb-3">or</p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-[var(--muted)] text-[var(--foreground)] rounded-lg cursor-pointer hover:bg-[var(--muted)]/80 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 16v2a2 2 0 002 2h8a2 2 0 002-2v-2M10 4v10M6 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Browse Files
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Manufacturer */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Manufacturer
            </label>
            <select
              value={manufacturerId}
              onChange={(e) => {
                setManufacturerId(e.target.value);
                setFolders([]); // Reset folders when manufacturer changes
              }}
              disabled={loadingManufacturers}
              className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)] disabled:opacity-50"
            >
              <option value="">{loadingManufacturers ? 'Loading...' : 'Select manufacturer...'}</option>
              {manufacturers.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            {/* Nested Folders */}
            {manufacturerId && (
              <div className="mt-3 ml-4 border-l-2 border-[var(--border)] pl-3">
                {/* Existing folders */}
                {folders.map((folder, index) => (
                  <div key={index} className="flex items-center gap-2 py-1">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                      <path d="M3 4h5l2 2h7a1 1 0 011 1v9a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-sm text-[var(--foreground)]">{folder}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFolder(index)}
                      className="p-0.5 text-[var(--muted-foreground)] hover:text-red-500 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ))}

                {/* Add new folder form */}
                {showNewFolder ? (
                  <div className="flex items-center gap-2 py-1">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                      <path d="M3 4h5l2 2h7a1 1 0 011 1v9a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Folder name"
                      className="flex-1 px-2 py-1 text-sm border border-[var(--border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)]"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddFolder();
                        } else if (e.key === 'Escape') {
                          setShowNewFolder(false);
                          setNewFolderName('');
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddFolder}
                      disabled={!newFolderName.trim()}
                      className="px-2 py-1 text-xs font-medium bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewFolder(false);
                        setNewFolderName('');
                      }}
                      className="p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowNewFolder(true)}
                    className="text-xs text-[var(--primary)] hover:underline py-1"
                  >
                    + Add folder
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Display Name <span className="text-[var(--muted-foreground)] font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g., Lithonia 2x4 LED Troffer Series"
              className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)]"
            />
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Override the file name with a friendly name
            </p>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {allCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    selectedCategories.includes(cat)
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]/80'
                  }`}
                >
                  {specSheetCategoryLabels[cat]}
                </button>
              ))}
            </div>
            {selectedCategories.length === 0 && (
              <p className="mt-2 text-xs text-red-500">Select at least one category</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid() || isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                </svg>
                Add Spec Sheet
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
