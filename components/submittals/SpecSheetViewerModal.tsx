'use client';

import React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import type { SpecSheet } from '../../lib/types/submittals';
import HighlightCanvas from './HighlightCanvas';
import { useSpecSheetViewer } from './hooks/useSpecSheetViewer';
import {
  ViewerHeader,
  PageThumbnails,
  ViewerSidebar,
  SaveVersionModal,
  PageNavigation,
} from './viewer';

// Set up the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface SpecSheetViewerModalProps {
  specSheet: SpecSheet;
  onClose: () => void;
}

export default function SpecSheetViewerModal({ specSheet, onClose }: SpecSheetViewerModalProps) {
  const viewer = useSpecSheetViewer({ specSheet });

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-xl shadow-2xl w-[95vw] h-[95vh] max-w-[1800px] flex flex-col overflow-hidden">
        {/* Header */}
        <ViewerHeader
          manufacturer={specSheet.manufacturer}
          zoom={viewer.zoom}
          onZoomIn={() => viewer.setZoom(Math.min(200, viewer.zoom + 25))}
          onZoomOut={() => viewer.setZoom(Math.max(50, viewer.zoom - 25))}
          onClose={onClose}
        />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Page Thumbnails */}
          <PageThumbnails
            fileUrl={specSheet.fileUrl}
            numPages={viewer.numPages}
            currentPage={viewer.currentPage}
            pdfLoading={viewer.pdfLoading}
            getPageHighlightCount={viewer.getPageHighlightCount}
            onPageSelect={viewer.setCurrentPage}
          />

          {/* PDF Viewer */}
          <div className="flex-1 overflow-auto bg-[var(--muted)]/30 p-6 flex justify-center">
            <Document
              file={specSheet.fileUrl}
              onLoadSuccess={viewer.onDocumentLoadSuccess}
              onLoadError={viewer.onDocumentLoadError}
              loading={
                <div className="flex flex-col items-center justify-center h-96">
                  <div className="w-10 h-10 border-3 border-[var(--muted)] border-t-[var(--primary)] rounded-full animate-spin mb-4" />
                  <span className="text-sm text-[var(--muted-foreground)]">Loading PDF...</span>
                </div>
              }
              error={
                <div className="flex flex-col items-center justify-center h-96 text-red-500">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-4">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v4M12 16h.01"/>
                  </svg>
                  <span className="text-sm">Failed to load PDF</span>
                </div>
              }
            >
              <div
                className="relative bg-white shadow-xl rounded overflow-hidden"
                style={{
                  width: viewer.pageSize.width * (viewer.zoom / 100),
                  height: viewer.pageSize.height * (viewer.zoom / 100),
                }}
              >
                <Page
                  pageNumber={viewer.currentPage}
                  scale={viewer.zoom / 100}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  onLoadSuccess={viewer.onPageLoadSuccess}
                />

                {/* Highlight Canvas */}
                <div className="absolute inset-0">
                  <HighlightCanvas
                    width={viewer.pageSize.width * (viewer.zoom / 100)}
                    height={viewer.pageSize.height * (viewer.zoom / 100)}
                    regions={viewer.allRegions}
                    onRegionsChange={viewer.handleRegionsChange}
                    activeTool={viewer.activeTool}
                    activeColor={viewer.activeColor}
                    strokeWidth={2}
                    pageNumber={viewer.currentPage}
                    zoom={viewer.zoom}
                    selectedRegionId={viewer.selectedRegionId || undefined}
                    onRegionSelect={viewer.setSelectedRegionId}
                  />
                </div>
              </div>
            </Document>
          </div>

          {/* Right Sidebar */}
          <ViewerSidebar
            specSheet={specSheet}
            numPages={viewer.numPages}
            editableSpecSheetName={viewer.editableSpecSheetName}
            setEditableSpecSheetName={viewer.setEditableSpecSheetName}
            isEditingSpecSheetName={viewer.isEditingSpecSheetName}
            setIsEditingSpecSheetName={viewer.setIsEditingSpecSheetName}
            activeTool={viewer.activeTool}
            setActiveTool={viewer.setActiveTool}
            activeColor={viewer.activeColor}
            setActiveColor={viewer.setActiveColor}
            hasUnsavedChanges={viewer.hasUnsavedChanges}
            drawingRegionsCount={viewer.drawingRegions.length}
            onClearDrawing={viewer.handleClearDrawing}
            onUpdateVersion={viewer.handleUpdateVersion}
            versions={viewer.versions}
            selectedVersionId={viewer.selectedVersionId}
            onVersionSelect={viewer.handleVersionSelect}
            onShowSaveModal={() => viewer.setShowSaveModal(true)}
            editingVersionId={viewer.editingVersionId}
            setEditingVersionId={viewer.setEditingVersionId}
            editingVersionName={viewer.editingVersionName}
            setEditingVersionName={viewer.setEditingVersionName}
            onRenameVersion={viewer.handleRenameVersion}
            onDeleteVersion={viewer.handleDeleteVersion}
            selectedRegionId={viewer.selectedRegionId}
            selectedRegion={viewer.selectedRegion}
            newTag={viewer.newTag}
            setNewTag={viewer.setNewTag}
            onAddTag={viewer.handleAddTag}
            onRemoveTag={viewer.handleRemoveTag}
            aiHighlightPrompt={viewer.aiHighlightPrompt}
            setAiHighlightPrompt={viewer.setAiHighlightPrompt}
            isAiProcessing={viewer.isAiProcessing}
            aiError={viewer.aiError}
            onAiHighlight={viewer.handleAiHighlight}
            sectionsExpanded={viewer.sectionsExpanded}
            toggleSection={viewer.toggleSection}
          />
        </div>

        {/* Footer - Page Navigation */}
        <PageNavigation
          currentPage={viewer.currentPage}
          numPages={viewer.numPages}
          onPrevious={() => viewer.setCurrentPage(Math.max(1, viewer.currentPage - 1))}
          onNext={() => viewer.setCurrentPage(Math.min(viewer.numPages, viewer.currentPage + 1))}
        />
      </div>

      {/* Save Version Modal */}
      <SaveVersionModal
        isOpen={viewer.showSaveModal}
        totalHighlights={viewer.savedRegions.length + viewer.drawingRegions.length}
        versionName={viewer.newVersionName}
        onVersionNameChange={viewer.setNewVersionName}
        onSave={viewer.handleSaveVersion}
        onCancel={() => {
          viewer.setShowSaveModal(false);
          viewer.setNewVersionName('');
        }}
      />
    </div>
  );
}
