'use client';

import React from 'react';
import type { SpecSheet, SpecSheetFolder } from '../../../lib/types/submittals';
import { SidebarFolderTree } from './SidebarFolderTree';

interface Manufacturer {
  id: string;
  name: string;
}

interface ManufacturersSectionProps {
  isExpanded: boolean;
  toggleSection: () => void;
  manufacturers: Manufacturer[];
  isLoadingManufacturers: boolean;
  selectedManufacturerId: string | null;
  setSelectedManufacturerId: (id: string | null) => void;
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
  expandedManufacturers: Set<string>;
  toggleManufacturer: (manufacturer: string) => void;
  manufacturerCounts: Record<string, number>;
  allSpecSheets: SpecSheet[];
  // Folder props
  folders: SpecSheetFolder[];
  expandedFolders: Set<string>;
  toggleFolder: (folderId: string) => void;
  editingFolderId: string | null;
  editingFolderName: string;
  setEditingFolderName: (name: string) => void;
  handleSaveRename: () => void;
  setEditingFolderId: (id: string | null) => void;
  handleFolderContextMenu: (e: React.MouseEvent, folder: SpecSheetFolder) => void;
  selectManufacturerByName: (name: string) => void;
  getFolderCount: (folderId: string) => number;
  getChildFoldersLocal: (parentId: string) => SpecSheetFolder[];
  getFoldersForManufacturer: (manufacturer: string) => SpecSheetFolder[];
  handleAddRootFolder: (manufacturer: string, manufacturerId?: string) => void;
  setShowManufacturerModal: (show: boolean) => void;
}

export function ManufacturersSection({
  isExpanded,
  toggleSection,
  manufacturers,
  isLoadingManufacturers,
  selectedManufacturerId,
  setSelectedManufacturerId,
  selectedFolderId,
  setSelectedFolderId,
  expandedManufacturers,
  toggleManufacturer,
  manufacturerCounts,
  allSpecSheets,
  folders,
  expandedFolders,
  toggleFolder,
  editingFolderId,
  editingFolderName,
  setEditingFolderName,
  handleSaveRename,
  setEditingFolderId,
  handleFolderContextMenu,
  selectManufacturerByName,
  getFolderCount,
  getChildFoldersLocal,
  getFoldersForManufacturer,
  handleAddRootFolder,
  setShowManufacturerModal,
}: ManufacturersSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3 hover:bg-[var(--muted)]/50 transition-colors">
        <button
          onClick={toggleSection}
          className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]"
        >
          <span>Manufacturers</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          >
            <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowManufacturerModal(true);
          }}
          className="p-1 hover:bg-[var(--muted)] rounded transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          title="Manage manufacturers"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      </div>
      {isExpanded && (
        <div className="pb-2">
          <button
            onClick={() => {
              setSelectedManufacturerId(null);
              setSelectedFolderId(null);
            }}
            className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--muted)]/50 transition-colors ${
              !selectedManufacturerId && !selectedFolderId ? 'bg-[var(--muted)] font-medium' : ''
            }`}
          >
            <span className="w-3" />
            <span className="flex-1 text-left">All Manufacturers</span>
            <span className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-0.5 rounded-full">
              {isLoadingManufacturers ? '...' : allSpecSheets.length}
            </span>
          </button>

          {isLoadingManufacturers ? (
            <div className="px-4 py-3 text-sm text-[var(--muted-foreground)]">Loading...</div>
          ) : manufacturers.map(mfr => {
            const isMfrExpanded = expandedManufacturers.has(mfr.name);
            const isSelected = selectedManufacturerId === mfr.id && !selectedFolderId;
            const manufacturerFolders = getFoldersForManufacturer(mfr.name);
            const count = manufacturerCounts[mfr.name] || 0;

            return (
              <div key={mfr.id}>
                <div
                  onClick={() => {
                    toggleManufacturer(mfr.name);
                    setSelectedManufacturerId(mfr.id);
                    setSelectedFolderId(null);
                  }}
                  className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--muted)]/50 transition-colors cursor-pointer group ${
                    isSelected ? 'bg-[var(--muted)] font-medium' : ''
                  }`}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`transition-transform flex-shrink-0 ${isMfrExpanded ? 'rotate-90' : ''}`}
                  >
                    <path d="M7 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="flex-1 text-left truncate">{mfr.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddRootFolder(mfr.name, mfr.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[var(--muted)] rounded transition-all mr-1"
                    title="Add folder"
                  >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                    </svg>
                  </button>
                  <span className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-0.5 rounded-full">
                    {count}
                  </span>
                </div>
                {isMfrExpanded && (
                  <div className="bg-[var(--muted)]/30">
                    {manufacturerFolders.length > 0 && (
                      <SidebarFolderTree
                        folders={manufacturerFolders}
                        depth={1}
                        selectedFolderId={selectedFolderId}
                        setSelectedFolderId={setSelectedFolderId}
                        expandedFolders={expandedFolders}
                        toggleFolder={toggleFolder}
                        editingFolderId={editingFolderId}
                        editingFolderName={editingFolderName}
                        setEditingFolderName={setEditingFolderName}
                        handleSaveRename={handleSaveRename}
                        setEditingFolderId={setEditingFolderId}
                        handleFolderContextMenu={handleFolderContextMenu}
                        selectManufacturerByName={selectManufacturerByName}
                        getFolderCount={getFolderCount}
                        getChildFoldersLocal={getChildFoldersLocal}
                      />
                    )}
                    {manufacturerFolders.length === 0 && (
                      <button
                        onClick={() => handleAddRootFolder(mfr.name, mfr.id)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50 transition-colors"
                        style={{ paddingLeft: '28px' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                        </svg>
                        Add folder
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
