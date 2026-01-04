'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  fetchFilesByLinkedEntity,
  getFilePresignedUrl,
  uploadAndLinkFile,
  archiveFile,
  deleteFile,
  formatFileSize,
  getFileExtension,
  type FileResponse,
  type FileEntityType,
} from '../../lib/graphql/files';

interface FilesTabV2Props {
  entityId: string;
  entityType: FileEntityType;
}

type ViewMode = 'grid' | 'list';

export function FilesTabV2({ entityId, entityType }: FilesTabV2Props) {
  const [files, setFiles] = useState<FileResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch files on mount and when entityId changes
  const loadFiles = useCallback(async () => {
    if (!entityId) {
      setFiles([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fetchedFiles = await fetchFilesByLinkedEntity(entityType, entityId);
      // Filter out archived files
      const activeFiles = fetchedFiles.filter((f) => !f.archived);
      setFiles(activeFiles);
    } catch (err) {
      console.error('Failed to fetch files:', err);
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setIsLoading(false);
    }
  }, [entityId, entityType]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleFileUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || !entityId) return;

    setIsUploading(true);
    setError(null);

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        setUploadProgress(`Uploading ${file.name} (${i + 1}/${fileList.length})...`);

        await uploadAndLinkFile(
          {
            file,
            fileName: file.name,
          },
          entityType,
          entityId
        );
      }

      setUploadProgress(null);
      // Reload files after upload
      await loadFiles();
    } catch (err) {
      console.error('Failed to upload file:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDownload = async (file: FileResponse) => {
    try {
      const url = await getFilePresignedUrl(file.id);
      if (url) {
        window.open(url, '_blank');
      }
    } catch (err) {
      console.error('Failed to get download URL:', err);
      setError(err instanceof Error ? err.message : 'Failed to download file');
    }
  };

  const handleArchive = async (file: FileResponse) => {
    if (!confirm(`Are you sure you want to archive "${file.fileName}"?`)) return;

    try {
      await archiveFile(file.id);
      await loadFiles();
    } catch (err) {
      console.error('Failed to archive file:', err);
      setError(err instanceof Error ? err.message : 'Failed to archive file');
    }
  };

  const handleDelete = async (file: FileResponse) => {
    if (!confirm(`Are you sure you want to permanently delete "${file.fileName}"? This action cannot be undone.`)) return;

    try {
      await deleteFile(file.id);
      await loadFiles();
    } catch (err) {
      console.error('Failed to delete file:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete file');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedFiles.size} file(s)?`)) return;

    try {
      await Promise.all(Array.from(selectedFiles).map((fileId) => archiveFile(fileId)));
      setSelectedFiles(new Set());
      await loadFiles();
    } catch (err) {
      console.error('Failed to delete files:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete files');
    }
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

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
    handleFileUpload(e.dataTransfer.files);
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCreatedByName = (createdBy?: FileResponse['createdBy']): string => {
    if (!createdBy) return 'Unknown';
    if (typeof createdBy === 'string') return createdBy;
    return createdBy.fullName || createdBy.email || 'Unknown';
  };

  const getFileIconColor = (fileType?: string): string => {
    if (!fileType) return 'text-gray-400';

    const type = fileType.toLowerCase();
    if (type.includes('image')) return 'text-purple-500';
    if (type.includes('pdf')) return 'text-red-500';
    if (type.includes('word') || type.includes('doc')) return 'text-blue-500';
    if (type.includes('excel') || type.includes('spreadsheet') || type.includes('xls')) return 'text-green-500';
    if (type.includes('powerpoint') || type.includes('presentation') || type.includes('ppt')) return 'text-orange-500';
    if (type.includes('video')) return 'text-pink-500';
    if (type.includes('audio')) return 'text-yellow-500';
    if (type.includes('zip') || type.includes('archive')) return 'text-amber-500';

    return 'text-gray-400';
  };

  // Loading state
  if (isLoading && files.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="px-6 py-4 pb-32">
        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Files</h3>
            <p className="text-sm text-gray-500">
              {files.length} {files.length === 1 ? 'file' : 'files'} attached
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                title="Grid view"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-gray-600">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                title="List view"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-gray-600">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Bulk Delete */}
            {selectedFiles.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Delete ({selectedFiles.size})
              </button>
            )}

            {/* Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || !entityId}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 5v10M5 10h10" strokeLinecap="round" />
              </svg>
              Upload Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
          </div>
        </div>

        {/* Upload Progress */}
        {uploadProgress && (
          <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600" />
            <p className="text-sm text-indigo-600">{uploadProgress}</p>
          </div>
        )}

        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mb-6 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-indigo-400 bg-indigo-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${!entityId ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-4 text-gray-300">
            <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-gray-600 mb-1">
            {isDragging ? 'Drop files here...' : 'Drag and drop files here, or'}
          </p>
          {!isDragging && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!entityId}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              browse to upload
            </button>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Supports all file types. Max file size: 50MB
          </p>
        </div>

        {/* Files Display */}
        {files.length === 0 ? (
          <div className="text-center py-12">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-4 text-gray-300">
              <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-gray-500">No files attached yet</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!entityId}
              className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
            >
              Upload the first file
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {files.map((file) => (
              <div
                key={file.id}
                className={`relative group bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                  selectedFiles.has(file.id) ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'
                }`}
                onClick={() => toggleFileSelection(file.id)}
              >
                {/* Selection Checkbox */}
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedFiles.has(file.id)}
                    onChange={() => toggleFileSelection(file.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                </div>

                {/* Actions Menu */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <div className="flex items-center gap-1 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                      title="Download"
                    >
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" className="text-gray-500">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleArchive(file); }}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                      title="Archive"
                    >
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" className="text-gray-500">
                        <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                        <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(file); }}
                      className="p-1.5 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" className="text-red-500">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* File Icon */}
                <div className={`w-12 h-12 mx-auto mb-3 flex items-center justify-center ${getFileIconColor(file.fileType)}`}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M13 3v6h6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                {/* File Extension Badge */}
                <div className="absolute top-14 left-1/2 -translate-x-1/2">
                  <span className={`text-xs font-bold uppercase px-1.5 py-0.5 rounded ${getFileIconColor(file.fileType)} bg-opacity-10`} style={{ backgroundColor: 'currentColor', color: 'white', opacity: 0.9 }}>
                    {getFileExtension(file.fileName) || 'FILE'}
                  </span>
                </div>

                {/* File Name */}
                <p className="text-sm font-medium text-gray-900 text-center truncate mt-2" title={file.fileName}>
                  {file.fileName}
                </p>

                {/* File Size */}
                <p className="text-xs text-gray-500 text-center">
                  {formatFileSize(file.fileSize)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedFiles.size === files.length && files.length > 0}
                      onChange={() => {
                        if (selectedFiles.size === files.length) {
                          setSelectedFiles(new Set());
                        } else {
                          setSelectedFiles(new Set(files.map((f) => f.id)));
                        }
                      }}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded By</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {files.map((file) => (
                  <tr
                    key={file.id}
                    className={`hover:bg-gray-50 ${selectedFiles.has(file.id) ? 'bg-indigo-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(file.id)}
                        onChange={() => toggleFileSelection(file.id)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex-shrink-0 ${getFileIconColor(file.fileType)}`}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.fileName}</p>
                          <p className="text-xs text-gray-500 uppercase">{getFileExtension(file.fileName) || 'Unknown'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatFileSize(file.fileSize)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{getCreatedByName(file.createdBy)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(file.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleDownload(file)}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          title="Download"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-gray-500">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleArchive(file)}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          title="Archive"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-gray-500">
                            <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                            <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(file)}
                          className="p-1.5 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-red-500">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default FilesTabV2;
