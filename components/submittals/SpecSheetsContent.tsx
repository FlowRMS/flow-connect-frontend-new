'use client';

import React from 'react';
import { useSpecSheetsContent } from './hooks/useSpecSheetsContent';

import { FolderContextMenu } from './FolderContextMenu';
import { ManufacturerManagementModal } from './ManufacturerManagementModal';
import { AddFolderModal } from './AddFolderModal';
import { SpecSheetsSidebar } from './SpecSheetsSidebar';
import { SpecSheetsMainContent } from './SpecSheetsMainContent';
import { OpenCatalogModal } from './OpenCatalogModal';
import SpecSheetUploadModal from './SpecSheetUploadModal';
import SpecSheetViewerModal from './SpecSheetViewerModal';

export default function SpecSheetsContent() {
  const state = useSpecSheetsContent();

  return (
    <div className="flex h-full">
      <SpecSheetsSidebar
        searchQuery={state.searchQuery}
        setSearchQuery={state.setSearchQuery}
        sectionsExpanded={state.sectionsExpanded}
        toggleSection={state.toggleSection}
        allCategories={state.allCategories}
        selectedTags={state.selectedTags}
        setSelectedTags={state.setSelectedTags}
        allSpecSheets={state.allSpecSheets}
        highlightFilter={state.highlightFilter}
        setHighlightFilter={state.setHighlightFilter}
        manufacturers={state.manufacturers}
        isLoadingManufacturers={state.isLoadingManufacturers}
        selectedManufacturerId={state.selectedManufacturerId}
        setSelectedManufacturerId={state.setSelectedManufacturerId}
        selectedFolderId={state.selectedFolderId}
        setSelectedFolderId={state.setSelectedFolderId}
        expandedManufacturers={state.expandedManufacturers}
        toggleManufacturer={state.toggleManufacturer}
        manufacturerCounts={state.manufacturerCounts}
        folders={state.folders}
        expandedFolders={state.expandedFolders}
        toggleFolder={state.toggleFolder}
        editingFolderId={state.editingFolderId}
        editingFolderName={state.editingFolderName}
        setEditingFolderName={state.setEditingFolderName}
        handleSaveRename={state.handleSaveRename}
        setEditingFolderId={state.setEditingFolderId}
        handleFolderContextMenu={state.handleFolderContextMenu}
        selectManufacturerByName={state.selectManufacturerByName}
        getFolderCount={state.getFolderCount}
        getChildFoldersLocal={state.getChildFoldersLocal}
        getFoldersForManufacturer={state.getFoldersForManufacturer}
        handleAddRootFolder={state.handleAddRootFolder}
        setShowUploadModal={state.setShowUploadModal}
        setShowManufacturerModal={state.setShowManufacturerModal}
        specSheetDragOverFolderId={state.specSheetDragOverFolderId}
        setSpecSheetDragOverFolderId={state.setSpecSheetDragOverFolderId}
        onSpecSheetDrop={state.onSpecSheetDrop}
      />

      <SpecSheetsMainContent
        filteredSpecSheets={state.filteredSpecSheets}
        selectedSpecSheet={state.selectedSpecSheet}
        setSelectedSpecSheet={state.setSelectedSpecSheet}
        selectedManufacturer={state.selectedManufacturer}
        isLoadingSpecSheets={state.isLoadingSpecSheets}
        apiError={state.apiError}
        searchQuery={state.searchQuery}
        viewMode={state.viewMode}
        setViewMode={state.setViewMode}
        hasActiveFilters={state.hasActiveFilters}
        clearFilters={state.clearFilters}
        getHighlightCount={state.getHighlightCount}
        setShowUploadModal={state.setShowUploadModal}
        setShowCatalogModal={state.setShowCatalogModal}
        selectedSpecSheetIds={state.selectedSpecSheetIds}
        toggleSpecSheetSelection={state.toggleSpecSheetSelection}
        selectAllVisibleSpecSheets={state.selectAllVisibleSpecSheets}
        clearSpecSheetSelection={state.clearSpecSheetSelection}
      />

      {state.selectedSpecSheet && (
        <SpecSheetViewerModal specSheet={state.selectedSpecSheet} onClose={() => state.setSelectedSpecSheet(null)} />
      )}

      {state.showUploadModal && (
        <SpecSheetUploadModal onClose={() => state.setShowUploadModal(false)} defaultManufacturerId={state.selectedManufacturer || undefined} />
      )}

      {state.showCatalogModal && <OpenCatalogModal onClose={() => state.setShowCatalogModal(false)} />}

      {state.contextMenu && (
        <FolderContextMenu
          folder={state.contextMenu.folder}
          position={state.contextMenu.position}
          onClose={() => state.setContextMenu(null)}
          onRename={() => state.handleRenameFolder(state.contextMenu!.folder)}
          onDelete={() => state.handleDeleteFolder(state.contextMenu!.folder)}
          onAddSubfolder={() => state.handleAddSubfolder(state.contextMenu!.folder)}
        />
      )}

      {state.showAddFolderModal && (
        <AddFolderModal
          onClose={() => state.setShowAddFolderModal(false)}
          newFolderParentId={state.newFolderParentId}
          newFolderManufacturer={state.newFolderManufacturer}
          newFolderName={state.newFolderName}
          setNewFolderName={state.setNewFolderName}
          handleCreateFolder={state.handleCreateFolder}
          isCreatingFolder={state.isCreatingFolder}
          folderError={state.folderError}
          setFolderError={state.setFolderError}
          folders={state.folders}
        />
      )}

      {state.showManufacturerModal && (
        <ManufacturerManagementModal
          onClose={() => state.setShowManufacturerModal(false)}
          manufacturerList={state.manufacturerList}
          manufacturerCounts={state.manufacturerCounts}
          expandedManufacturers={state.expandedManufacturers}
          toggleManufacturer={state.toggleManufacturer}
          expandedFolders={state.expandedFolders}
          toggleFolder={state.toggleFolder}
          editingManufacturerIndex={state.editingManufacturerIndex}
          editingManufacturerName={state.editingManufacturerName}
          setEditingManufacturerName={state.setEditingManufacturerName}
          handleRenameManufacturer={state.handleRenameManufacturer}
          handleSaveManufacturerRename={state.handleSaveManufacturerRename}
          handleDeleteManufacturer={state.handleDeleteManufacturer}
          handleAddManufacturer={state.handleAddManufacturer}
          draggedManufacturerIndex={state.draggedManufacturerIndex}
          dragOverIndex={state.dragOverIndex}
          handleDragStart={state.handleDragStart}
          handleDragOver={state.handleDragOver}
          handleDragLeave={state.handleDragLeave}
          handleDrop={state.handleDrop}
          handleDragEnd={state.handleDragEnd}
          getAllFoldersForManufacturer={state.getAllFoldersForManufacturer}
          getChildFoldersFromAll={state.getChildFoldersFromAll}
          getFolderCountForManufacturer={state.getFolderCountForManufacturer}
          getFolderSpecSheetCount={state.getFolderSpecSheetCount}
          editingFolderId={state.editingFolderId}
          editingFolderName={state.editingFolderName}
          setEditingFolderName={state.setEditingFolderName}
          handleRenameFolder={state.handleRenameFolder}
          handleSaveRename={state.handleSaveRename}
          setEditingFolderId={state.setEditingFolderId}
          handleDeleteFolder={state.handleDeleteFolder}
          handleAddSubfolder={state.handleAddSubfolder}
          handleAddRootFolder={state.handleAddRootFolder}
          draggedFolderId={state.draggedFolderId}
          dragOverFolderId={state.dragOverFolderId}
          handleFolderDragStart={state.handleFolderDragStart}
          handleFolderDragOver={state.handleFolderDragOver}
          handleFolderDragLeave={state.handleFolderDragLeave}
          handleFolderDrop={state.handleFolderDrop}
          handleFolderDragEnd={state.handleFolderDragEnd}
          setDragOverFolderId={state.setDragOverFolderId}
          folderError={state.folderError}
          setFolderError={state.setFolderError}
          isSavingFolder={state.isSavingFolder}
          isLoadingFolders={state.isLoadingFolders}
          isLoadingAllFolders={state.isLoadingAllFolders}
          folders={state.folders}
        />
      )}
    </div>
  );
}
