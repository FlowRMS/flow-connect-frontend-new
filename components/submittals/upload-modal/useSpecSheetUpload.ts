import { useState, useMemo, useCallback } from 'react';
import type { SpecSheetCategory, UploadSource } from '../../../lib/types/submittals';
import { useManufacturersWithSpecSheets, useCreateSpecSheet, useFoldersByFactory, useCreateFolder, type FolderResponse } from '../api/useSpecSheetsApi';

export interface FolderOption {
  id: string;
  name: string;
  displayPath: string;
}

interface UseSpecSheetUploadParams {
  defaultManufacturerId?: string;
  onSuccess?: () => void;
  onClose: () => void;
}

export function useSpecSheetUpload({ defaultManufacturerId, onSuccess, onClose }: UseSpecSheetUploadParams) {
  const [uploadSource, setUploadSource] = useState<UploadSource>('url');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [manufacturerId, setManufacturerId] = useState(defaultManufacturerId || '');
  const [displayName, setDisplayName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<SpecSheetCategory[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const { data: manufacturers = [], isLoading: loadingManufacturers } = useManufacturersWithSpecSheets();
  const createSpecSheetMutation = useCreateSpecSheet();
  const createFolderMutation = useCreateFolder();
  const { data: existingFolders = [], isLoading: loadingFolders } = useFoldersByFactory(manufacturerId || null);

  // Build display path for a folder by traversing parent chain
  const buildFolderPath = useCallback((folder: FolderResponse, allFolders: FolderResponse[]): string => {
    const pathParts: string[] = [folder.name];
    let currentParentId = folder.parentId;

    while (currentParentId) {
      const parent = allFolders.find(f => f.id === currentParentId);
      if (parent) {
        pathParts.unshift(parent.name);
        currentParentId = parent.parentId;
      } else {
        break;
      }
    }

    return pathParts.join('/');
  }, []);

  const folderOptions = useMemo((): FolderOption[] => {
    if (!existingFolders || existingFolders.length === 0) return [];
    return existingFolders
      .map(f => ({
        id: f.id,
        name: f.name,
        displayPath: buildFolderPath(f, existingFolders),
      }))
      .sort((a, b) => a.displayPath.localeCompare(b.displayPath));
  }, [existingFolders, buildFolderPath]);

  const selectedFolderDisplayPath = useMemo(() => {
    if (!selectedFolderId) return '';
    const folder = folderOptions.find(f => f.id === selectedFolderId);
    return folder?.displayPath || '';
  }, [selectedFolderId, folderOptions]);

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
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const handleAddFolder = async () => {
    if (!newFolderName.trim() || !manufacturerId) return;

    try {
      const newFolder = await createFolderMutation.mutateAsync({
        factoryId: manufacturerId,
        folderName: newFolderName.trim(),
        parentFolderId: selectedFolderId || null, // Create as child of selected folder, or at root
      });

      // Select the newly created folder
      setSelectedFolderId(newFolder.id);
      setNewFolderName('');
      setShowNewFolder(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder');
    }
  };

  const handleClearFolder = () => setSelectedFolderId('');

  const getFileName = () => {
    if (uploadSource === 'file' && file) return file.name;
    if (uploadSource === 'url' && url) {
      const urlParts = url.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      return lastPart.split('?')[0] || 'spec-sheet.pdf';
    }
    return 'spec-sheet.pdf';
  };

  const handleSubmit = async () => {
    setError(null);
    try {
      const input = {
        factoryId: manufacturerId,
        fileName: getFileName(),
        displayName: displayName || undefined,
        uploadSource: uploadSource,
        sourceUrl: uploadSource === 'url' ? url : undefined,
        pageCount: 1,
        categories: selectedCategories,
        folderId: selectedFolderId || undefined,
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

  const handleManufacturerChange = (id: string) => {
    setManufacturerId(id);
    setSelectedFolderId('');
  };

  const isValid = () => {
    const hasSource = uploadSource === 'url' ? url.trim() : file;
    return hasSource && manufacturerId && selectedCategories.length > 0;
  };

  const isLoading = createSpecSheetMutation.isPending;
  const isCreatingFolder = createFolderMutation.isPending;

  return {
    // State
    uploadSource,
    url,
    file,
    manufacturerId,
    displayName,
    selectedCategories,
    isDragging,
    error,
    selectedFolderId,
    selectedFolderDisplayPath,
    showNewFolder,
    newFolderName,
    manufacturers,
    loadingManufacturers,
    loadingFolders,
    folderOptions,
    isLoading,
    isCreatingFolder,
    // Setters
    setUploadSource,
    setUrl,
    setFile,
    setDisplayName,
    setSelectedFolderId,
    setShowNewFolder,
    setNewFolderName,
    // Handlers
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    toggleCategory,
    handleAddFolder,
    handleClearFolder,
    handleSubmit,
    handleManufacturerChange,
    isValid,
  };
}
