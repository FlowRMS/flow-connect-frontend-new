'use client';

import React from 'react';
import type { SpecSheet, HighlightRegion, HighlightShape } from '../../../lib/types/submittals';
import type { HighlightVersion } from '../hooks/useSpecSheetViewer';
import {
  DetailsSection,
  ToolsSection,
  VersionsSection,
  TagsSection,
  AIHighlightSection,
} from './sections';

interface ViewerSidebarProps {
  specSheet: SpecSheet;
  numPages: number;

  // Editable name
  editableSpecSheetName: string;
  setEditableSpecSheetName: (name: string) => void;
  isEditingSpecSheetName: boolean;
  setIsEditingSpecSheetName: (editing: boolean) => void;
  onSaveSpecSheetName: () => void;

  // Tools
  activeTool: HighlightShape | 'select';
  setActiveTool: (tool: HighlightShape | 'select') => void;
  activeColor: string;
  setActiveColor: (color: string) => void;

  // Unsaved changes
  hasUnsavedChanges: boolean;
  drawingRegionsCount: number;
  onClearDrawing: () => void;
  onUpdateVersion: () => void;

  // Versions
  versions: HighlightVersion[];
  selectedVersionId: string;
  onVersionSelect: (id: string) => void;
  onShowSaveModal: () => void;
  editingVersionId: string | null;
  setEditingVersionId: (id: string | null) => void;
  editingVersionName: string;
  setEditingVersionName: (name: string) => void;
  onRenameVersion: (id: string, name: string) => void;
  onDeleteVersion: (id: string) => void;

  // Tags
  selectedRegionId: string | null;
  selectedRegion: HighlightRegion | null | undefined;
  newTag: string;
  setNewTag: (tag: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;

  // Sections
  sectionsExpanded: {
    details: boolean;
    tools: boolean;
    versions: boolean;
    aiHighlight: boolean;
    tags: boolean;
  };
  toggleSection: (section: 'details' | 'tools' | 'versions' | 'aiHighlight' | 'tags') => void;
}

export function ViewerSidebar({
  specSheet,
  numPages,
  editableSpecSheetName,
  setEditableSpecSheetName,
  isEditingSpecSheetName,
  setIsEditingSpecSheetName,
  onSaveSpecSheetName,
  activeTool,
  setActiveTool,
  activeColor,
  setActiveColor,
  hasUnsavedChanges,
  drawingRegionsCount,
  onClearDrawing,
  onUpdateVersion,
  versions,
  selectedVersionId,
  onVersionSelect,
  onShowSaveModal,
  editingVersionId,
  setEditingVersionId,
  editingVersionName,
  setEditingVersionName,
  onRenameVersion,
  onDeleteVersion,
  selectedRegionId,
  selectedRegion,
  newTag,
  setNewTag,
  onAddTag,
  onRemoveTag,
  sectionsExpanded,
  toggleSection,
}: ViewerSidebarProps) {
  return (
    <div className="w-80 border-l border-[var(--border)] bg-[var(--card)] flex flex-col overflow-y-auto">
      <DetailsSection
        specSheet={specSheet}
        numPages={numPages}
        editableSpecSheetName={editableSpecSheetName}
        setEditableSpecSheetName={setEditableSpecSheetName}
        isEditingSpecSheetName={isEditingSpecSheetName}
        setIsEditingSpecSheetName={setIsEditingSpecSheetName}
        onSaveSpecSheetName={onSaveSpecSheetName}
        expanded={sectionsExpanded.details}
        onToggle={() => toggleSection('details')}
      />

      <ToolsSection
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        activeColor={activeColor}
        setActiveColor={setActiveColor}
        hasUnsavedChanges={hasUnsavedChanges}
        drawingRegionsCount={drawingRegionsCount}
        onClearDrawing={onClearDrawing}
        onUpdateVersion={onUpdateVersion}
        expanded={sectionsExpanded.tools}
        onToggle={() => toggleSection('tools')}
      />

      <VersionsSection
        versions={versions}
        selectedVersionId={selectedVersionId}
        onVersionSelect={onVersionSelect}
        onShowSaveModal={onShowSaveModal}
        editingVersionId={editingVersionId}
        setEditingVersionId={setEditingVersionId}
        editingVersionName={editingVersionName}
        setEditingVersionName={setEditingVersionName}
        onRenameVersion={onRenameVersion}
        onDeleteVersion={onDeleteVersion}
        expanded={sectionsExpanded.versions}
        onToggle={() => toggleSection('versions')}
      />

      {selectedRegionId && (
        <TagsSection
          selectedRegion={selectedRegion}
          newTag={newTag}
          setNewTag={setNewTag}
          onAddTag={onAddTag}
          onRemoveTag={onRemoveTag}
          expanded={sectionsExpanded.tags}
          onToggle={() => toggleSection('tags')}
        />
      )}

      <AIHighlightSection
        expanded={sectionsExpanded.aiHighlight}
        onToggle={() => toggleSection('aiHighlight')}
      />
    </div>
  );
}
