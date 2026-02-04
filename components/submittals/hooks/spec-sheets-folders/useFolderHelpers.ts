import { useMemo, useCallback } from 'react';
import type { SpecSheetFolder } from '../../../../lib/types/submittals';
import type { FolderResponse } from '../../../lib/graphql/spec-sheets';
import { convertToSpecSheetFolders } from '../folderUtils';
import type { Manufacturer } from './types';

interface UseFolderHelpersParams {
  manufacturers: Manufacturer[];
  allManufacturerFolders: Record<string, FolderResponse[]>;
  folders: SpecSheetFolder[];
  selectedManufacturerId: string | null;
}

export function useFolderHelpers({
  manufacturers,
  allManufacturerFolders,
  folders,
  selectedManufacturerId,
}: UseFolderHelpersParams) {
  const findManufacturerIdByName = useCallback(
    (name: string): string | null => {
      const found = manufacturers.find(m => m.name === name);
      return found?.id || null;
    },
    [manufacturers]
  );

  const getFolderPath = useCallback(
    (folderId: string): string | null => {
      const folder = folders.find(f => f.id === folderId);
      return folder?.folderPath || null;
    },
    [folders]
  );

  const getAllFoldersForManufacturer = useCallback(
    (manufacturerName: string): SpecSheetFolder[] => {
      const manufacturerData = manufacturers.find(m => m.name === manufacturerName);
      if (!manufacturerData) return [];
      const apiFolders = allManufacturerFolders[manufacturerData.id] || [];

      // If no folders in cache but this is the selected manufacturer, use individual fetch data
      if (apiFolders.length === 0 && manufacturerData.id === selectedManufacturerId && folders.length > 0) {
        return folders.filter(f => f.parentId === null);
      }

      if (apiFolders.length === 0) return [];

      const allFolders = convertToSpecSheetFolders(apiFolders, manufacturerName);
      return allFolders.filter(f => f.parentId === null);
    },
    [manufacturers, allManufacturerFolders, selectedManufacturerId, folders]
  );

  const getChildFoldersFromAll = useCallback(
    (parentId: string, manufacturerName: string): SpecSheetFolder[] => {
      const manufacturerData = manufacturers.find(m => m.name === manufacturerName);
      if (!manufacturerData) return [];
      const apiFolders = allManufacturerFolders[manufacturerData.id] || [];

      // If no folders in cache but this is the selected manufacturer, use individual fetch data
      if (apiFolders.length === 0 && manufacturerData.id === selectedManufacturerId && folders.length > 0) {
        return folders.filter(f => f.parentId === parentId);
      }

      if (apiFolders.length === 0) return [];

      const allFolders = convertToSpecSheetFolders(apiFolders, manufacturerName);
      return allFolders.filter(f => f.parentId === parentId);
    },
    [manufacturers, allManufacturerFolders, selectedManufacturerId, folders]
  );

  const getFolderCountForManufacturer = useCallback(
    (manufacturerName: string): number => {
      const manufacturerData = manufacturers.find(m => m.name === manufacturerName);
      if (!manufacturerData) return 0;
      return (allManufacturerFolders[manufacturerData.id] || []).length;
    },
    [manufacturers, allManufacturerFolders]
  );

  const getFolderSpecSheetCount = useCallback(
    (folderId: string, manufacturerName: string): number => {
      const manufacturerData = manufacturers.find(m => m.name === manufacturerName);
      if (!manufacturerData) return 0;
      const apiFolders = allManufacturerFolders[manufacturerData.id] || [];
      const folder = apiFolders.find(f => f.id === folderId);
      return folder?.specSheetCount || 0;
    },
    [manufacturers, allManufacturerFolders]
  );

  const getChildFoldersLocal = useCallback(
    (parentId: string) => folders.filter(f => f.parentId === parentId),
    [folders]
  );

  const getFolderCount = useCallback(
    (folderId: string): number => {
      const folder = folders.find(f => f.id === folderId);
      return folder?.specSheetCount || 0;
    },
    [folders]
  );

  return {
    findManufacturerIdByName,
    getFolderPath,
    getAllFoldersForManufacturer,
    getFoldersForManufacturer: getAllFoldersForManufacturer,
    getChildFoldersFromAll,
    getFolderCountForManufacturer,
    getFolderSpecSheetCount,
    getChildFoldersLocal,
    getFolderCount,
  };
}
