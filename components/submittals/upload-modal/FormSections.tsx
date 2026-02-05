'use client';

import React from 'react';
import type { SpecSheetCategory, UploadSource } from '../../../lib/types/submittals';
import { specSheetCategoryLabels } from '../../../lib/data/submittals-mock';

// Source Tabs (URL / File)
interface SourceTabsProps {
  uploadSource: UploadSource;
  setUploadSource: (source: UploadSource) => void;
}

export function SourceTabs({ uploadSource, setUploadSource }: SourceTabsProps) {
  return (
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
  );
}

// URL Input
interface UrlInputProps {
  url: string;
  setUrl: (url: string) => void;
}

export function UrlInput({ url, setUrl }: UrlInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Spec Sheet URL</label>
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://manufacturer.com/specs/product.pdf"
        className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)]"
      />
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">Paste a direct link to the PDF spec sheet</p>
    </div>
  );
}

// File Drop Zone
interface FileDropZoneProps {
  file: File | null;
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}

export function FileDropZone({ file, isDragging, onDragOver, onDragLeave, onDrop, onFileSelect, onClear }: FileDropZoneProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Upload PDF</label>
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging ? 'border-[var(--primary)] bg-[var(--primary)]/5'
            : file ? 'border-green-500 bg-green-50'
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
              <p className="text-xs text-[var(--muted-foreground)]">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button onClick={onClear} className="p-1 hover:bg-[var(--muted)] rounded">
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
            <p className="text-sm text-[var(--foreground)] mb-1">Drag and drop your PDF here</p>
            <p className="text-xs text-[var(--muted-foreground)] mb-3">or</p>
            <label className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-[var(--muted)] text-[var(--foreground)] rounded-lg cursor-pointer hover:bg-[var(--muted)]/80 transition-colors">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 16v2a2 2 0 002 2h8a2 2 0 002-2v-2M10 4v10M6 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Browse Files
              <input type="file" accept=".pdf" onChange={onFileSelect} className="hidden" />
            </label>
          </>
        )}
      </div>
    </div>
  );
}

// Category Selector
interface CategorySelectorProps {
  selectedCategories: SpecSheetCategory[];
  toggleCategory: (category: SpecSheetCategory) => void;
}

const allCategories: SpecSheetCategory[] = [
  'indoor', 'outdoor', 'sports_lighting', 'controls', 'emergency',
  'decorative', 'industrial', 'drives', 'sub_metering', 'cable_tray', 'other'
];

export function CategorySelector({ selectedCategories, toggleCategory }: CategorySelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Categories</label>
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
  );
}
