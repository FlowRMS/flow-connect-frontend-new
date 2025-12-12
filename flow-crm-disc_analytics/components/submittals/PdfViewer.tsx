'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface PdfViewerProps {
  fileUrl: string;
  pageCount: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  showThumbnails?: boolean;
  className?: string;
  children?: React.ReactNode; // For overlay content like highlights
}

export default function PdfViewer({
  fileUrl,
  pageCount,
  currentPage = 1,
  onPageChange,
  zoom = 100,
  onZoomChange,
  showThumbnails = false,
  className = '',
  children,
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 });

  const zoomLevels = [50, 75, 100, 125, 150, 200];

  const handleZoomIn = () => {
    const currentIndex = zoomLevels.findIndex(z => z >= zoom);
    const nextIndex = Math.min(currentIndex + 1, zoomLevels.length - 1);
    onZoomChange?.(zoomLevels[nextIndex]);
  };

  const handleZoomOut = () => {
    const currentIndex = zoomLevels.findIndex(z => z >= zoom);
    const prevIndex = Math.max(currentIndex - 1, 0);
    onZoomChange?.(zoomLevels[prevIndex]);
  };

  const handleFitWidth = () => {
    onZoomChange?.(100);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      // Middle mouse button or Alt+Left click for panning
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      if (containerRef.current) {
        setScrollStart({
          x: containerRef.current.scrollLeft,
          y: containerRef.current.scrollTop,
        });
      }
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && containerRef.current) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      containerRef.current.scrollLeft = scrollStart.x - dx;
      containerRef.current.scrollTop = scrollStart.y - dy;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -10 : 10;
      const newZoom = Math.max(50, Math.min(200, zoom + delta));
      onZoomChange?.(newZoom);
    }
  }, [zoom, onZoomChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--muted)]/50 border-b border-[var(--border)]">
        {/* Page Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="p-1.5 hover:bg-[var(--muted)] rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Previous page"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex items-center gap-1 text-sm">
            <input
              type="number"
              min={1}
              max={pageCount}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= pageCount) {
                  onPageChange?.(page);
                }
              }}
              className="w-12 px-2 py-1 text-center border border-[var(--border)] rounded bg-[var(--background)] text-sm"
            />
            <span className="text-[var(--muted-foreground)]">/ {pageCount}</span>
          </div>
          <button
            onClick={() => onPageChange?.(Math.min(pageCount, currentPage + 1))}
            disabled={currentPage >= pageCount}
            className="p-1.5 hover:bg-[var(--muted)] rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Next page"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= zoomLevels[0]}
            className="p-1.5 hover:bg-[var(--muted)] rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Zoom out"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="9" r="6"/>
              <path d="M6 9h6M14 14l4 4" strokeLinecap="round"/>
            </svg>
          </button>
          <select
            value={zoom}
            onChange={(e) => onZoomChange?.(parseInt(e.target.value))}
            className="px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)]"
          >
            {zoomLevels.map(z => (
              <option key={z} value={z}>{z}%</option>
            ))}
          </select>
          <button
            onClick={handleZoomIn}
            disabled={zoom >= zoomLevels[zoomLevels.length - 1]}
            className="p-1.5 hover:bg-[var(--muted)] rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Zoom in"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="9" r="6"/>
              <path d="M9 6v6M6 9h6M14 14l4 4" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="w-px h-5 bg-[var(--border)] mx-1"/>
          <button
            onClick={handleFitWidth}
            className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors"
            title="Fit to width"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 8V4h12v4M4 12v4h12v-4M2 10h16" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* View Options */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {/* Toggle continuous scroll vs single page */}}
            className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors"
            title="Toggle view mode"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="2" width="14" height="7" rx="1"/>
              <rect x="3" y="11" width="14" height="7" rx="1"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Main Viewer Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Thumbnails Sidebar (optional) */}
        {showThumbnails && (
          <div className="w-24 border-r border-[var(--border)] overflow-y-auto bg-[var(--muted)]/30 p-2 space-y-2">
            {Array.from({ length: pageCount }).map((_, index) => (
              <button
                key={index}
                onClick={() => onPageChange?.(index + 1)}
                className={`w-full aspect-[3/4] bg-white border rounded shadow-sm hover:shadow transition-shadow ${
                  currentPage === index + 1 ? 'ring-2 ring-[var(--primary)]' : 'border-[var(--border)]'
                }`}
              >
                <div className="w-full h-full flex items-center justify-center text-xs text-[var(--muted-foreground)]">
                  {index + 1}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* PDF Content Area */}
        <div
          ref={containerRef}
          className={`flex-1 overflow-auto bg-[var(--muted)]/20 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="min-h-full flex flex-col items-center p-4 gap-4"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          >
            {/* Render pages */}
            {Array.from({ length: pageCount }).map((_, index) => (
              <div
                key={index}
                id={`page-${index + 1}`}
                className="relative bg-white shadow-lg"
                style={{ width: '8.5in', minHeight: '11in' }}
              >
                {/* Page placeholder - in real implementation would render actual PDF */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--muted-foreground)]">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <path d="M14 2v6h6"/>
                    <path d="M10 9H8M10 13H8M14 13h-4M14 17H8"/>
                  </svg>
                  <span className="text-sm">Page {index + 1}</span>
                  <span className="text-xs mt-1 text-[var(--muted-foreground)]">{fileUrl}</span>
                </div>

                {/* Highlight overlay for this page */}
                {children && (
                  <div className="absolute inset-0 pointer-events-none">
                    {children}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Export a simpler preview component for thumbnails
export function PdfThumbnail({
  pageNumber,
  isActive,
  onClick,
}: {
  pageNumber: number;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full aspect-[3/4] bg-white border rounded shadow-sm hover:shadow transition-all ${
        isActive ? 'ring-2 ring-[var(--primary)] border-[var(--primary)]' : 'border-[var(--border)]'
      }`}
    >
      <div className="w-full h-full flex flex-col items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[var(--muted-foreground)] mb-1">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <path d="M14 2v6h6"/>
        </svg>
        <span className="text-xs text-[var(--muted-foreground)]">{pageNumber}</span>
      </div>
    </button>
  );
}
