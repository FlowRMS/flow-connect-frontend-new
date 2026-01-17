'use client';

import React from 'react';
import type { SpecSheet, SpecSheetFolder, SpecSheetCategory } from '../../lib/types/submittals';
import { SearchBox, TagsSection, HighlightsSection, ManufacturersSection } from './sidebar';

type HighlightFilter = 'all' | 'highlighted' | 'not_highlighted';

interface Manufacturer {
  id: string;
  name: string;
}

interface SectionsExpanded {
  tags: boolean;
  highlights: boolean;
  manufacturers: boolean;
}

interface SpecSheetsSidebarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sectionsExpanded: SectionsExpanded;
  toggleSection: (section: keyof SectionsExpanded) => void;
  allCategories: SpecSheetCategory[];
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  allSpecSheets: SpecSheet[];
  highlightFilter: HighlightFilter;
  setHighlightFilter: (filter: HighlightFilter) => void;
  manufacturers: Manufacturer[];
  isLoadingManufacturers: boolean;
  selectedManufacturerId: string | null;
  setSelectedManufacturerId: (id: string | null) => void;
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
  expandedManufacturers: Set<string>;
  toggleManufacturer: (manufacturer: string) => void;
  manufacturerCounts: Record<string, number>;
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
  setShowUploadModal: (show: boolean) => void;
  setShowManufacturerModal: (show: boolean) => void;
}

export function SpecSheetsSidebar({
  searchQuery,
  setSearchQuery,
  sectionsExpanded,
  toggleSection,
  allCategories,
  selectedTags,
  setSelectedTags,
  allSpecSheets,
  highlightFilter,
  setHighlightFilter,
  manufacturers,
  isLoadingManufacturers,
  selectedManufacturerId,
  setSelectedManufacturerId,
  selectedFolderId,
  setSelectedFolderId,
  expandedManufacturers,
  toggleManufacturer,
  manufacturerCounts,
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
  setShowUploadModal,
  setShowManufacturerModal,
}: SpecSheetsSidebarProps) {
  return (
    <div className="w-72 border-r border-[var(--border)] bg-[var(--card)] flex flex-col flex-shrink-0">
      <SearchBox searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <div className="flex-1 overflow-y-auto">
        <TagsSection
          isExpanded={sectionsExpanded.tags}
          toggleSection={() => toggleSection('tags')}
          allCategories={allCategories}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          allSpecSheets={allSpecSheets}
          setSelectedManufacturerId={setSelectedManufacturerId}
          setSelectedFolderId={setSelectedFolderId}
        />

        <HighlightsSection
          isExpanded={sectionsExpanded.highlights}
          toggleSection={() => toggleSection('highlights')}
          highlightFilter={highlightFilter}
          setHighlightFilter={setHighlightFilter}
          allSpecSheets={allSpecSheets}
          setSelectedManufacturerId={setSelectedManufacturerId}
          setSelectedFolderId={setSelectedFolderId}
        />

        <ManufacturersSection
          isExpanded={sectionsExpanded.manufacturers}
          toggleSection={() => toggleSection('manufacturers')}
          manufacturers={manufacturers}
          isLoadingManufacturers={isLoadingManufacturers}
          selectedManufacturerId={selectedManufacturerId}
          setSelectedManufacturerId={setSelectedManufacturerId}
          selectedFolderId={selectedFolderId}
          setSelectedFolderId={setSelectedFolderId}
          expandedManufacturers={expandedManufacturers}
          toggleManufacturer={toggleManufacturer}
          manufacturerCounts={manufacturerCounts}
          allSpecSheets={allSpecSheets}
          folders={folders}
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
          getFoldersForManufacturer={getFoldersForManufacturer}
          handleAddRootFolder={handleAddRootFolder}
          setShowManufacturerModal={setShowManufacturerModal}
        />
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-[var(--border)]">
        <button
          onClick={() => setShowUploadModal(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
          </svg>
          Add Spec Sheet
        </button>
      </div>
    </div>
  );
}
