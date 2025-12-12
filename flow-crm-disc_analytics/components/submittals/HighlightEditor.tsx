'use client';

import React, { useState, useCallback, useMemo } from 'react';
import type { SpecSheet, HighlightDefinition, HighlightRegion, HighlightShape } from '../../lib/types/submittals';
import HighlightToolbar, { useHighlightKeyboardShortcuts } from './HighlightToolbar';
import HighlightCanvas from './HighlightCanvas';

interface HighlightEditorProps {
  specSheet: SpecSheet;
  catalogNumber: string;
  manufacturer: string;
  existingHighlight?: HighlightDefinition;
  onSave: (regions: HighlightRegion[]) => void;
  onClose: () => void;
}

export default function HighlightEditor({
  specSheet,
  catalogNumber,
  manufacturer,
  existingHighlight,
  onSave,
  onClose,
}: HighlightEditorProps) {
  // Tool state
  const [activeTool, setActiveTool] = useState<HighlightShape | 'select'>('highlight');
  const [activeColor, setActiveColor] = useState('#FFEB3B');
  const [strokeWidth, setStrokeWidth] = useState(2);

  // Page state
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);

  // Regions state with undo/redo
  const [regions, setRegions] = useState<HighlightRegion[]>(
    existingHighlight?.regions || []
  );
  const [history, setHistory] = useState<HighlightRegion[][]>([existingHighlight?.regions || []]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Selected region
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);

  // Track if changes were made
  const hasChanges = useMemo(() => {
    const original = existingHighlight?.regions || [];
    if (regions.length !== original.length) return true;
    return regions.some((r, i) => {
      const o = original[i];
      return !o || r.x !== o.x || r.y !== o.y || r.width !== o.width || r.height !== o.height;
    });
  }, [regions, existingHighlight]);

  // Handle regions change with history
  const handleRegionsChange = useCallback((newRegions: HighlightRegion[]) => {
    setRegions(newRegions);
    // Add to history (trim any future states)
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newRegions);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Undo/Redo
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleUndo = useCallback(() => {
    if (canUndo) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setRegions(history[newIndex]);
      setSelectedRegionId(null);
    }
  }, [canUndo, historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setRegions(history[newIndex]);
      setSelectedRegionId(null);
    }
  }, [canRedo, historyIndex, history]);

  const handleClearAll = useCallback(() => {
    if (regions.length > 0 && confirm('Clear all highlights on this page?')) {
      const newRegions = regions.filter(r => r.pageNumber !== currentPage);
      handleRegionsChange(newRegions);
      setSelectedRegionId(null);
    }
  }, [regions, currentPage, handleRegionsChange]);

  // Keyboard shortcuts
  useHighlightKeyboardShortcuts({
    onToolChange: setActiveTool,
    onUndo: handleUndo,
    onRedo: handleRedo,
  });

  // Delete selected region
  const handleDeleteSelected = useCallback(() => {
    if (selectedRegionId) {
      handleRegionsChange(regions.filter(r => r.id !== selectedRegionId));
      setSelectedRegionId(null);
    }
  }, [selectedRegionId, regions, handleRegionsChange]);

  // Page dimensions (8.5 x 11 inches at 96 DPI)
  const pageWidth = 816;
  const pageHeight = 1056;

  // Regions for current page
  const currentPageRegions = regions.filter(r => r.pageNumber === currentPage);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-lg shadow-2xl w-[95vw] h-[95vh] max-w-[1600px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Highlight Editor</h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                {specSheet.displayName}
              </p>
            </div>
            <div className="px-3 py-1.5 bg-[var(--primary)]/10 rounded-lg">
              <span className="text-sm font-medium text-[var(--primary)]">{catalogNumber}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="text-xs text-[var(--muted-foreground)] mr-2">Unsaved changes</span>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(regions)}
              disabled={!hasChanges}
              className="px-4 py-1.5 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Highlights
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <HighlightToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          activeColor={activeColor}
          onColorChange={setActiveColor}
          strokeWidth={strokeWidth}
          onStrokeWidthChange={setStrokeWidth}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClearAll={handleClearAll}
        />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Thumbnail Sidebar */}
          <div className="w-24 border-r border-[var(--border)] bg-[var(--muted)]/20 overflow-y-auto p-2 space-y-2">
            {Array.from({ length: specSheet.pageCount }).map((_, index) => {
              const pageNum = index + 1;
              const pageRegionCount = regions.filter(r => r.pageNumber === pageNum).length;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-full aspect-[3/4] bg-white border rounded shadow-sm transition-all relative ${
                    currentPage === pageNum
                      ? 'ring-2 ring-[var(--primary)] border-[var(--primary)]'
                      : 'border-[var(--border)] hover:shadow'
                  }`}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-[var(--muted-foreground)]">
                    {pageNum}
                  </div>
                  {pageRegionCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--primary)] text-white text-[10px] rounded-full flex items-center justify-center">
                      {pageRegionCount}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* PDF Viewer with Canvas */}
          <div className="flex-1 overflow-auto bg-[var(--muted)]/30 p-4">
            <div
              className="mx-auto bg-white shadow-lg relative"
              style={{
                width: pageWidth * (zoom / 100),
                height: pageHeight * (zoom / 100),
              }}
            >
              {/* PDF Page Placeholder */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--muted-foreground)] pointer-events-none">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-2 opacity-30">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <path d="M14 2v6h6"/>
                  <path d="M10 9H8M10 13H8M14 13h-4M14 17H8"/>
                </svg>
                <span className="text-sm opacity-50">Page {currentPage} of {specSheet.pageCount}</span>
              </div>

              {/* Highlight Canvas */}
              <HighlightCanvas
                width={pageWidth}
                height={pageHeight}
                regions={regions}
                onRegionsChange={handleRegionsChange}
                activeTool={activeTool}
                activeColor={activeColor}
                strokeWidth={strokeWidth}
                pageNumber={currentPage}
                zoom={zoom}
                selectedRegionId={selectedRegionId ?? undefined}
                onRegionSelect={setSelectedRegionId}
              />
            </div>
          </div>

          {/* Properties Panel */}
          <div className="w-64 border-l border-[var(--border)] bg-[var(--card)] flex flex-col">
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">Part Number</h3>
              <p className="text-sm text-[var(--muted-foreground)]">{catalogNumber}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{manufacturer}</p>
            </div>

            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">Zoom</h3>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={50}
                  max={200}
                  step={10}
                  value={zoom}
                  onChange={(e) => setZoom(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-[var(--muted-foreground)] w-12">{zoom}%</span>
              </div>
            </div>

            {/* Page Highlights */}
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                Page {currentPage} Highlights ({currentPageRegions.length})
              </h3>
              {currentPageRegions.length === 0 ? (
                <p className="text-xs text-[var(--muted-foreground)]">
                  No highlights on this page. Use the tools above to add highlights.
                </p>
              ) : (
                <div className="space-y-2">
                  {currentPageRegions.map((region, index) => (
                    <div
                      key={region.id}
                      onClick={() => setSelectedRegionId(region.id)}
                      className={`p-2 rounded border cursor-pointer transition-colors ${
                        selectedRegionId === region.id
                          ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                          : 'border-[var(--border)] hover:bg-[var(--muted)]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: region.color }}
                          />
                          <span className="text-xs font-medium capitalize">{region.shape}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRegionsChange(regions.filter(r => r.id !== region.id));
                            if (selectedRegionId === region.id) {
                              setSelectedRegionId(null);
                            }
                          }}
                          className="p-1 text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                      <div className="text-[10px] text-[var(--muted-foreground)] mt-1">
                        {Math.round(region.width)}% x {Math.round(region.height)}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="p-4 border-t border-[var(--border)] bg-[var(--muted)]/30">
              <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                <span>Total highlights:</span>
                <span className="font-medium text-[var(--foreground)]">{regions.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] mt-1">
                <span>Pages with highlights:</span>
                <span className="font-medium text-[var(--foreground)]">
                  {new Set(regions.map(r => r.pageNumber)).size}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Help */}
        <div className="px-4 py-2 bg-[var(--muted)]/30 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)]">
          <span className="mr-4"><kbd className="px-1 py-0.5 bg-[var(--muted)] rounded">H</kbd> Highlighter</span>
          <span className="mr-4"><kbd className="px-1 py-0.5 bg-[var(--muted)] rounded">R</kbd> Rectangle</span>
          <span className="mr-4"><kbd className="px-1 py-0.5 bg-[var(--muted)] rounded">O</kbd> Oval</span>
          <span className="mr-4"><kbd className="px-1 py-0.5 bg-[var(--muted)] rounded">A</kbd> Arrow</span>
          <span className="mr-4"><kbd className="px-1 py-0.5 bg-[var(--muted)] rounded">V</kbd> Select</span>
          <span className="mr-4"><kbd className="px-1 py-0.5 bg-[var(--muted)] rounded">Del</kbd> Delete selected</span>
          <span><kbd className="px-1 py-0.5 bg-[var(--muted)] rounded">Ctrl+Z</kbd> Undo</span>
        </div>
      </div>
    </div>
  );
}
