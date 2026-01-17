'use client';

import React from 'react';
import { Document, Page } from 'react-pdf';

interface PageThumbnailsProps {
  fileUrl: string;
  numPages: number;
  currentPage: number;
  pdfLoading: boolean;
  getPageHighlightCount: (pageNum: number) => number;
  onPageSelect: (page: number) => void;
}

export function PageThumbnails({
  fileUrl,
  numPages,
  currentPage,
  pdfLoading,
  getPageHighlightCount,
  onPageSelect,
}: PageThumbnailsProps) {
  return (
    <div className="w-32 border-r border-[var(--border)] bg-[var(--muted)]/20 overflow-y-auto p-3 space-y-2">
      <Document
        file={fileUrl}
        onLoadSuccess={() => {}}
        loading={null}
        error={null}
      >
        {!pdfLoading && numPages > 0 && Array.from({ length: numPages }).map((_, index) => {
          const pageNum = index + 1;
          const pageHighlightCount = getPageHighlightCount(pageNum);

          return (
            <button
              key={pageNum}
              onClick={() => onPageSelect(pageNum)}
              className={`w-full bg-white border rounded-lg shadow-sm transition-all relative mb-2 ${
                currentPage === pageNum
                  ? 'ring-2 ring-[var(--primary)] border-[var(--primary)]'
                  : 'border-[var(--border)] hover:shadow-md'
              }`}
            >
              <Page
                pageNumber={pageNum}
                width={76}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
              <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                {pageNum}
              </div>
              {pageHighlightCount > 0 && (
                <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium shadow-sm">
                  {pageHighlightCount}
                </div>
              )}
            </button>
          );
        })}
      </Document>
    </div>
  );
}
