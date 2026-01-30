'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface UsePipelineFilesReturn {
  files: File[];
  uploadedFileIds: string[];
  handleFileChange: (fileList: FileList | null) => void;
  removeFile: (index: number) => void;
  setUploadedFileIds: (ids: string[]) => void;
  clearFiles: () => void;
}

export function usePipelineFiles(): UsePipelineFilesReturn {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFileIds, setUploadedFileIds] = useState<string[]>([]);

  const handleFileChange = useCallback((fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const newFiles = Array.from(fileList);
    setFiles((prev) => [...prev, ...newFiles]);
    setUploadedFileIds([]);
    toast.success(`Added ${newFiles.length} file(s)`);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadedFileIds([]);
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setUploadedFileIds([]);
  }, []);

  return {
    files,
    uploadedFileIds,
    handleFileChange,
    removeFile,
    setUploadedFileIds,
    clearFiles,
  };
}
