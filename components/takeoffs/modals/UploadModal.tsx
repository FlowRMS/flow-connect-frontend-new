/**
 * Upload Modal Component
 * Simple upload modal following FlowCRM design
 */

import React, { useState, useRef, useCallback } from 'react';
import { ACCEPTED_FILE_TYPES, MAX_UPLOAD_FILES } from '../constants';
import type { FileUploadProgress } from '../hooks/useTakeoffsState';

interface UploadModalProps {
  isOpen: boolean;
  files: File[];
  uploadProgress: Record<number, FileUploadProgress>;
  isUploading: boolean;
  existingClients?: string[];
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
  onClose,
  onFileSelect,
  onRemoveFile,
  onUploadStart,
}: UploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [takeoffTitle, setTakeoffTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate overall progress
  const overallProgress = files.length > 0
    ? Math.round(
        Object.values(uploadProgress).reduce((sum, p) => sum + (p?.progress || 0), 0) / files.length
      )
    : 0;

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
    if (files.length === 0 || isUploading) return;
    // Use provided title or generate from first file
    const projectName = takeoffTitle.trim() || files[0]?.name.replace(/\.[^/.]+$/, '') || 'New Project';
    onUploadStart({
      projectName,
      clientName: 'New Client',
      bidDate: '',
      estimatedValue: '',
      city: '',
      state: '',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Upload Documents for New Project
          </h2>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Takeoff Title Input */}
          <div className="mb-4">
            <label htmlFor="takeoff-title" className="block text-sm font-medium text-gray-700 mb-1">
              Takeoff Title
            </label>
            <input
              id="takeoff-title"
              type="text"
              value={takeoffTitle}
              onChange={(e) => setTakeoffTitle(e.target.value)}
              placeholder="Enter takeoff title..."
              disabled={isUploading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-100"
            />
          </div>
          {/* Drop Zone */}
          {!isUploading && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              {/* Image icon */}
              <div className="flex justify-center mb-4">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                  <path d="M14 3v4h4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-sm text-gray-600">
                <span className="text-purple-600 font-medium">Choose files</span>
                {' '}or drag and drop
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PDF files only, up to {MAX_UPLOAD_FILES} files
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPTED_FILE_TYPES}
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="py-8">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-purple-600 rounded-full transition-all duration-300"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 text-center">
                Uploading files... {overallProgress}%
              </p>
            </div>
          )}

          {/* Selected Files List */}
          {files.length > 0 && !isUploading && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Selected Files ({files.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 flex-shrink-0">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <span className="text-sm text-gray-700 truncate">
                        {file.name}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFile(index);
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                        <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={files.length === 0 || isUploading}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : 'Upload & Start'}
          </button>
        </div>
      </div>
    </div>
  );
}
