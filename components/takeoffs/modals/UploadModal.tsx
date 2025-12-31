/**
 * Upload Modal Component
 * Create New Project modal following FlowCRM style
 * With real file upload progress indicators from hook
 */

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { ACCEPTED_FILE_TYPES } from '../constants';
import type { FileUploadProgress } from '../hooks/useTakeoffsState';

interface UploadModalProps {
  isOpen: boolean;
  files: File[];
  uploadProgress: Record<number, FileUploadProgress>;
  isUploading: boolean;
  existingClients?: string[]; // List of existing client names for autocomplete
  onClose: () => void;
  onFileSelect: (files: FileList | null) => void;
  onRemoveFile: (index: number) => void;
  onUploadStart: (projectData: ProjectFormData) => void;
}

export interface ProjectFormData {
  projectName: string;
  clientName: string;
  bidDate: string;
  estimatedValue: string;
  city: string;
  state: string;
}

export function UploadModal({
  isOpen,
  files,
  uploadProgress,
  isUploading,
  existingClients = [],
  onClose,
  onFileSelect,
  onRemoveFile,
  onUploadStart,
}: UploadModalProps) {
  const [formData, setFormData] = useState<ProjectFormData>({
    projectName: '',
    clientName: '',
    bidDate: '',
    estimatedValue: '',
    city: '',
    state: '',
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const clientInputRef = useRef<HTMLInputElement>(null);

  // Filter existing clients based on input
  const filteredClients = useMemo(() => {
    if (!formData.clientName.trim()) return existingClients;
    const search = formData.clientName.toLowerCase();
    return existingClients.filter(client =>
      client.toLowerCase().includes(search)
    );
  }, [existingClients, formData.clientName]);

  // Handle client selection from dropdown
  const handleSelectClient = useCallback((client: string) => {
    setFormData(prev => ({ ...prev, clientName: client }));
    setIsClientDropdownOpen(false);
  }, []);

  // Calculate overall progress
  const overallProgress = files.length > 0
    ? Math.round(
        Object.values(uploadProgress).reduce((sum, p) => sum + (p?.progress || 0), 0) / files.length
      )
    : 0;

  const handleInputChange = (field: keyof ProjectFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      onFileSelect(e.dataTransfer.files);
    }
  }, [onFileSelect]);

  const handleSubmit = () => {
    if (!formData.projectName.trim() || files.length === 0 || isUploading) return;
    onUploadStart(formData);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getProgressBarColor = (status?: FileUploadProgress['status']) => {
    switch (status) {
      case 'complete':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'uploading':
        return 'bg-blue-600';
      default:
        return 'bg-gray-300';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between sticky top-0 bg-[var(--card)] z-10">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            Create New Project
          </h2>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Project Name & Client Name Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.projectName}
                onChange={handleInputChange('projectName')}
                placeholder="Enter project name"
                disabled={isUploading}
                className="w-full px-3 py-2.5 border border-[var(--border)] rounded-lg text-sm bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] disabled:opacity-50"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Client Name
              </label>
              <div className="relative">
                <input
                  ref={clientInputRef}
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => {
                    handleInputChange('clientName')(e);
                    setIsClientDropdownOpen(true);
                  }}
                  onFocus={() => setIsClientDropdownOpen(true)}
                  onBlur={() => {
                    // Delay closing to allow click on dropdown item
                    setTimeout(() => setIsClientDropdownOpen(false), 200);
                  }}
                  placeholder="Select or enter client name"
                  disabled={isUploading}
                  className="w-full px-3 py-2.5 pr-10 border border-[var(--border)] rounded-lg text-sm bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] disabled:opacity-50"
                />
                {/* Dropdown arrow */}
                <button
                  type="button"
                  onClick={() => {
                    setIsClientDropdownOpen(!isClientDropdownOpen);
                    clientInputRef.current?.focus();
                  }}
                  disabled={isUploading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-50"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d={isClientDropdownOpen ? "M15 12l-5-5-5 5" : "M5 8l5 5 5-5"} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>

              {/* Dropdown menu */}
              {isClientDropdownOpen && existingClients.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredClients.length > 0 ? (
                    filteredClients.map((client, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSelectClient(client)}
                        className="w-full px-3 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors first:rounded-t-lg last:rounded-b-lg"
                      >
                        {client}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">
                      No matches found. Press Enter to use &quot;{formData.clientName}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bid Date & Estimated Value Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Bid Date
              </label>
              <input
                type="date"
                value={formData.bidDate}
                onChange={handleInputChange('bidDate')}
                disabled={isUploading}
                className="w-full px-3 py-2.5 border border-[var(--border)] rounded-lg text-sm bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Estimated Value ($)
              </label>
              <input
                type="number"
                value={formData.estimatedValue}
                onChange={handleInputChange('estimatedValue')}
                placeholder="0.00"
                min="0"
                step="0.01"
                disabled={isUploading}
                className="w-full px-3 py-2.5 border border-[var(--border)] rounded-lg text-sm bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] disabled:opacity-50"
              />
            </div>
          </div>

          {/* City & State Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={handleInputChange('city')}
                placeholder="Enter city"
                disabled={isUploading}
                className="w-full px-3 py-2.5 border border-[var(--border)] rounded-lg text-sm bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                State
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={handleInputChange('state')}
                placeholder="Enter state"
                disabled={isUploading}
                className="w-full px-3 py-2.5 border border-[var(--border)] rounded-lg text-sm bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] disabled:opacity-50"
              />
            </div>
          </div>

          {/* Choose Project Files Button */}
          {!isUploading && (
            <>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Choose Project Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ACCEPTED_FILE_TYPES}
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>

              <p className="text-center text-sm text-[var(--muted-foreground)]">or</p>

              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                    : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                }`}
              >
                <svg
                  className="mx-auto h-10 w-10 text-[var(--muted-foreground)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p className="mt-3 text-sm font-medium text-[var(--foreground)]">
                  Drop files here
                </p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Drag and drop your project files
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium"
                >
                  Click to Browse
                </button>
                <p className="mt-3 text-[10px] text-[var(--muted-foreground)]">
                  Supported formats: PDF, DOC, DOCX, XLS, XLSX, DWG, JPG, PNG (Max 10MB each)
                </p>
              </div>
            </>
          )}

          {/* Selected Files List with Progress */}
          {files.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">
                Selected Files ({files.length})
              </h3>

              {/* Overall Progress Bar (shown during upload) */}
              {isUploading && (
                <div className="mb-4">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    Uploading to storage... {overallProgress}%
                  </p>
                </div>
              )}

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {files.map((file, index) => {
                  const fileProgress = uploadProgress[index] || { progress: 0, status: 'pending' };

                  return (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 rounded-lg border border-[var(--border)]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center flex-shrink-0">
                            {fileProgress.status === 'complete' ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            ) : fileProgress.status === 'error' ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="15" y1="9" x2="9" y2="15"/>
                                <line x1="9" y1="9" x2="15" y2="15"/>
                              </svg>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                              </svg>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-[var(--foreground)] truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-[var(--muted-foreground)]">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        {!isUploading && (
                          <button
                            onClick={() => onRemoveFile(index)}
                            className="p-1.5 hover:bg-[var(--muted)] rounded-lg transition-colors flex-shrink-0"
                          >
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                            </svg>
                          </button>
                        )}
                        {isUploading && fileProgress.status === 'complete' && (
                          <span className="text-xs text-green-600 font-medium">Complete</span>
                        )}
                        {isUploading && fileProgress.status === 'error' && (
                          <span className="text-xs text-red-600 font-medium">Failed</span>
                        )}
                      </div>

                      {/* Individual File Progress Bar */}
                      {isUploading && (
                        <div className="mt-2">
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${getProgressBarColor(fileProgress.status)}`}
                              style={{ width: `${fileProgress.progress}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
                            {fileProgress.status === 'uploading' && `Uploading... ${fileProgress.progress}%`}
                            {fileProgress.status === 'pending' && 'Waiting...'}
                            {fileProgress.status === 'complete' && 'Upload complete'}
                            {fileProgress.status === 'error' && (fileProgress.error || 'Upload failed')}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3 sticky bottom-0 bg-[var(--card)]">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2.5 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formData.projectName.trim() || files.length === 0 || isUploading}
            className="px-6 py-2.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Uploading... {overallProgress}%
              </>
            ) : (
              'Create Project'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
