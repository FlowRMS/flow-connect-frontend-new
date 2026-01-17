import { useState, useMemo } from 'react';
import type { SpecSheetCategory, UploadSource } from '../../../lib/types/submittals';
import { useManufacturersWithSpecSheets, useCreateSpecSheet, useFoldersByFactory } from '../api/useSpecSheetsApi';

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
  const [selectedFolderPath, setSelectedFolderPath] = useState<string>('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const { data: manufacturers = [], isLoading: loadingManufacturers } = useManufacturersWithSpecSheets();
  const createSpecSheetMutation = useCreateSpecSheet();
  const { data: existingFolders = [], isLoading: loadingFolders } = useFoldersByFactory(manufacturerId || null);

  const folderOptions = useMemo(() => {
    if (!existingFolders || existingFolders.length === 0) return [];
    return existingFolders.map(f => f.folderPath).sort((a, b) => a.localeCompare(b));
  }, [existingFolders]);

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

  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    const currentPath = selectedFolderPath;
    const newPath = currentPath ? `${currentPath}/${newFolderName.trim()}` : newFolderName.trim();
    setSelectedFolderPath(newPath);
    setNewFolderName('');
    setShowNewFolder(false);
  };

  const handleClearFolder = () => setSelectedFolderPath('');

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
        folderPath: selectedFolderPath || undefined,
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
    setSelectedFolderPath('');
  };

  const isValid = () => {
    const hasSource = uploadSource === 'url' ? url.trim() : file;
    return hasSource && manufacturerId && selectedCategories.length > 0;
  };

  const isLoading = createSpecSheetMutation.isPending;

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
    selectedFolderPath,
    showNewFolder,
    newFolderName,
    manufacturers,
    loadingManufacturers,
    loadingFolders,
    folderOptions,
    isLoading,
    // Setters
    setUploadSource,
    setUrl,
    setFile,
    setDisplayName,
    setSelectedFolderPath,
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
