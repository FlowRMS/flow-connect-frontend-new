'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import type { SpecSheet, HighlightRegion } from '../../lib/types/submittals';
import { HighlightRegionDisplay } from './HighlightCanvas';

// Set up the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const DEFAULT_ZOOM_INDEX = 2; // 100%

interface SpecSheetPreviewPanelProps {
  specSheet: SpecSheet;
  highlightRegions?: HighlightRegion[];
  onRemove: () => void | Promise<void>;
  onEditHighlights?: () => void;
}

export function SpecSheetPreviewPanel({
  specSheet,
  highlightRegions = [],
  onRemove,
  onEditHighlights,
}: SpecSheetPreviewPanelProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(specSheet.pageCount || 1);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pageSize, setPageSize] = useState({ width: 612, height: 792 }); // Default US Letter
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const [isRemoving, setIsRemoving] = useState(false);

  const zoom = ZOOM_LEVELS[zoomIndex];

  const onDocumentLoadSuccess = useCallback(({ numPages: pages }: { numPages: number }) => {
    setNumPages(pages);
    setPdfLoading(false);
  }, []);

  const onPageLoadSuccess = useCallback(({ originalWidth, originalHeight }: { width: number; height: number; originalWidth: number; originalHeight: number }) => {
    // Use original (unscaled) dimensions - react-pdf's width/height are already scaled
    setPageSize({ width: originalWidth, height: originalHeight });
  }, []);

  // Filter regions for current page
  const pageRegions = useMemo(() => {
    return highlightRegions.filter(r => r.pageNumber === currentPage);
  }, [highlightRegions, currentPage]);

  // Get highlight count per page
  const getPageHighlightCount = useCallback((pageNum: number) => {
    return highlightRegions.filter(r => r.pageNumber === pageNum).length;
  }, [highlightRegions]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoomIndex(prev => Math.min(prev + 1, ZOOM_LEVELS.length - 1));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomIndex(prev => Math.max(prev - 1, 0));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomIndex(DEFAULT_ZOOM_INDEX);
  }, []);

  // Handle remove with loading state
  const handleRemove = useCallback(async () => {
    if (isRemoving) return;
    setIsRemoving(true);
    try {
      await onRemove();
    } catch (err) {
      console.error('Error removing spec sheet:', err);
      setIsRemoving(false);
    }
  }, [onRemove, isRemoving]);

  // Base width for scaling (fit to container)
  const baseWidth = 450;
  const scaledWidth = baseWidth * zoom;
  const scaledHeight = (pageSize.height / pageSize.width) * scaledWidth;

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-3 bg-[var(--muted)]/30 flex items-center justify-between border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-100 rounded flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--foreground)] truncate">{specSheet.displayName}</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {numPages} pages {specSheet.manufacturer && `• ${specSheet.manufacturer}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onEditHighlights && (
            <button
              onClick={onEditHighlights}
              className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
            >
              Edit Highlights
            </button>
          )}
          <button
            onClick={handleRemove}
            disabled={isRemoving}
            className="p-1.5 text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
            title="Remove spec sheet from item"
          >
            {isRemoving ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="px-3 py-2 bg-[var(--muted)]/20 border-b border-[var(--border)] flex items-center justify-center gap-2">
        <button
          onClick={handleZoomOut}
          disabled={zoomIndex === 0}
          className="p-1.5 rounded hover:bg-[var(--muted)] transition-colors disabled:opacity-30"
          title="Zoom out"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="9" r="6" />
            <path d="M14 14l4 4M6 9h6" strokeLinecap="round" />
          </svg>
        </button>
        <button
          onClick={handleResetZoom}
          className="px-2 py-1 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded transition-colors min-w-[50px]"
          title="Reset zoom"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={handleZoomIn}
          disabled={zoomIndex === ZOOM_LEVELS.length - 1}
          className="p-1.5 rounded hover:bg-[var(--muted)] transition-colors disabled:opacity-30"
          title="Zoom in"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="9" r="6" />
            <path d="M14 14l4 4M9 6v6M6 9h6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Thumbnails Sidebar */}
        <div className="w-24 border-r border-[var(--border)] bg-[var(--muted)]/20 overflow-y-auto p-2 space-y-2">
          <Document
            file={specSheet.fileUrl}
            loading={null}
            error={null}
          >
            {!pdfLoading && numPages > 0 && Array.from({ length: numPages }).map((_, index) => {
              const pageNum = index + 1;
              const pageHighlightCount = getPageHighlightCount(pageNum);

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-full bg-white border rounded shadow-sm transition-all relative mb-2 overflow-hidden ${
                    currentPage === pageNum
                      ? 'ring-2 ring-[var(--primary)] border-[var(--primary)]'
                      : 'border-[var(--border)] hover:shadow-md'
                  }`}
                >
                  <Page
                    pageNumber={pageNum}
                    width={64}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                  <div className="absolute bottom-0.5 left-0.5 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded">
                    {pageNum}
                  </div>
                  {pageHighlightCount > 0 && (
                    <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-green-500 text-white text-[9px] rounded-full flex items-center justify-center font-medium shadow-sm">
                      {pageHighlightCount}
                    </div>
                  )}
                </button>
              );
            })}
          </Document>
          {pdfLoading && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-full aspect-[3/4] bg-[var(--muted)] rounded animate-pulse" />
              ))}
            </div>
          )}
        </div>

        {/* Main PDF View */}
        <div className="flex-1 overflow-auto bg-[var(--muted)]/10 p-4 flex justify-center items-start">
          <Document
            file={specSheet.fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex flex-col items-center justify-center h-96">
                <div className="w-10 h-10 border-3 border-[var(--muted)] border-t-[var(--primary)] rounded-full animate-spin mb-3" />
                <span className="text-sm text-[var(--muted-foreground)]">Loading PDF...</span>
              </div>
            }
            error={
              <div className="flex flex-col items-center justify-center h-96 text-[var(--muted-foreground)]">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-3 opacity-50">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 8v4M12 16h.01"/>
                </svg>
                <span className="text-sm">Failed to load PDF</span>
              </div>
            }
          >
            <div
              className="relative bg-white shadow-lg rounded overflow-hidden"
              style={{ width: scaledWidth, height: scaledHeight }}
            >
              <Page
                pageNumber={currentPage}
                width={scaledWidth}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                onLoadSuccess={onPageLoadSuccess}
              />
              {/* Highlight Overlay */}
              {pageRegions.length > 0 && (
                <div className="absolute inset-0 pointer-events-none">
                  {pageRegions.map(region => (
                    <HighlightRegionDisplay
                      key={region.id}
                      region={region}
                      containerWidth={scaledWidth}
                      containerHeight={scaledHeight}
                    />
                  ))}
                </div>
              )}
            </div>
          </Document>
        </div>
      </div>

      {/* Page Navigation Footer */}
      <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--muted)]/30 flex items-center justify-center gap-4">
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage <= 1}
          className="p-1.5 rounded hover:bg-[var(--muted)] transition-colors disabled:opacity-30"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="text-sm text-[var(--muted-foreground)]">
          Page {currentPage} of {numPages}
        </span>
        <button
          onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
          disabled={currentPage >= numPages}
          className="p-1.5 rounded hover:bg-[var(--muted)] transition-colors disabled:opacity-30"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
