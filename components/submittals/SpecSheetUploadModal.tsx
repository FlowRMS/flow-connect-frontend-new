'use client';

import React from 'react';
import {
  useSpecSheetUpload,
  SourceTabs,
  UrlInput,
  FileDropZone,
  CategorySelector,
  FolderSelector,
} from './upload-modal';

interface SpecSheetUploadModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  defaultManufacturerId?: string;
}

export default function SpecSheetUploadModal({ onClose, onSuccess, defaultManufacturerId }: SpecSheetUploadModalProps) {
  const upload = useSpecSheetUpload({ defaultManufacturerId, onSuccess, onClose });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Add Spec Sheet</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {upload.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {upload.error}
            </div>
          )}

          <SourceTabs uploadSource={upload.uploadSource} setUploadSource={upload.setUploadSource} />

          {upload.uploadSource === 'url' && (
            <UrlInput url={upload.url} setUrl={upload.setUrl} />
          )}

          {upload.uploadSource === 'file' && (
            <FileDropZone
              file={upload.file}
              isDragging={upload.isDragging}
              onDragOver={upload.handleDragOver}
              onDragLeave={upload.handleDragLeave}
              onDrop={upload.handleDrop}
              onFileSelect={upload.handleFileSelect}
              onClear={() => upload.setFile(null)}
            />
          )}

          {/* Manufacturer */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Manufacturer</label>
            <select
              value={upload.manufacturerId}
              onChange={(e) => upload.handleManufacturerChange(e.target.value)}
              disabled={upload.loadingManufacturers}
              className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)] disabled:opacity-50"
            >
              <option value="">{upload.loadingManufacturers ? 'Loading...' : 'Select manufacturer...'}</option>
              {upload.manufacturers.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {upload.manufacturerId && (
            <FolderSelector
              loadingFolders={upload.loadingFolders}
              folderOptions={upload.folderOptions}
              selectedFolderPath={upload.selectedFolderPath}
              setSelectedFolderPath={upload.setSelectedFolderPath}
              showNewFolder={upload.showNewFolder}
              setShowNewFolder={upload.setShowNewFolder}
              newFolderName={upload.newFolderName}
              setNewFolderName={upload.setNewFolderName}
              handleAddFolder={upload.handleAddFolder}
              handleClearFolder={upload.handleClearFolder}
            />
          )}

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Display Name <span className="text-[var(--muted-foreground)] font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={upload.displayName}
              onChange={(e) => upload.setDisplayName(e.target.value)}
              placeholder="e.g., Lithonia 2x4 LED Troffer Series"
              className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)]"
            />
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">Override the file name with a friendly name</p>
          </div>

          <CategorySelector
            selectedCategories={upload.selectedCategories}
            toggleCategory={upload.toggleCategory}
          />
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
            onClick={upload.handleSubmit}
            disabled={!upload.isValid() || upload.isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {upload.isLoading ? (
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
