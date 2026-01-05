'use client'

import { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FileText, Loader2, ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2, FileCode } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/flow-ai/ui/card';
import { Badge } from '@/components/flow-ai/ui/badge';
import { Button } from '@/components/flow-ai/ui/button';
import { Slider } from '@/components/flow-ai/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/flow-ai/ui/tabs';
import { initializePdfWorker } from '@/lib/flow-ai/pdf-worker';
import { MarkdownViewer } from '@/components/flow-ai/flowrms/MarkdownViewer';

// Initialize PDF.js worker
initializePdfWorker();

// Define PDF options OUTSIDE component to prevent re-creation
const PDF_OPTIONS = {
  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
};

export interface PdfPreviewPaneProps {
  file?: File;
  fileUrl?: string;
  fileName?: string;
  pages?: Array<{ markdownContent?: string }>;
  onMarkdownTextSelect?: (selectedText: string, closeDialog?: () => void) => void;
}

export function PdfPreviewPane({ file, fileUrl, fileName, pages, onMarkdownTextSelect }: PdfPreviewPaneProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const [baseWidth, setBaseWidth] = useState<number>(700);
  const [zoom, setZoom] = useState<number>(100); // Zoom percentage
  const [rotation, setRotation] = useState<number>(0); // Rotation in degrees
  const [isFullscreen, setIsFullscreen] = useState(false); // Fullscreen state
  const [viewMode, setViewMode] = useState<'pdf' | 'markdown'>('pdf'); // View mode toggle

  // Handler to close fullscreen and invoke text selection
  const handleMarkdownTextSelectWithClose = useCallback((selectedText: string) => {
    if (isFullscreen) {
      // Close fullscreen first
      setIsFullscreen(false);
      // Small delay to allow the UI to transition before calling the parent handler
      setTimeout(() => {
        onMarkdownTextSelect?.(selectedText);
      }, 100);
    } else {
      onMarkdownTextSelect?.(selectedText);
    }
  }, [isFullscreen, onMarkdownTextSelect]);
  
  // Calculate the actual page width based on zoom
  const pageWidth = useMemo(() => {
    return Math.floor(baseWidth * (zoom / 100));
  }, [baseWidth, zoom]);
  
  // Memoize document source to prevent re-renders
  const documentSource = useMemo(() => {
    if (file) return file;
    if (fileUrl) {
      // Use proxy for external URLs to avoid CORS issues
      if (fileUrl.includes('digitaloceanspaces.com') || fileUrl.includes('s3.')) {
        const proxyUrl = `/api/pdf-proxy?url=${encodeURIComponent(fileUrl)}`;
        return { url: proxyUrl };
      }
      return { url: fileUrl };
    }
    return null;
  }, [file, fileUrl]);
  
  const derivedRemoteName = useMemo(() => {
    if (!fileUrl) return undefined;
    try {
      const url = new URL(fileUrl);
      const lastSegment = url.pathname.split('/').pop();
      if (!lastSegment) return undefined;
      return decodeURIComponent(lastSegment);
    } catch {
      const fallbackSegment = fileUrl.split('?')[0]?.split('/').pop();
      if (!fallbackSegment) return undefined;
      try {
        return decodeURIComponent(fallbackSegment);
      } catch {
        return fallbackSegment;
      }
    }
  }, [fileUrl]);
  
  const displayName = file?.name ?? fileName ?? derivedRemoteName ?? 'Document';

  // Combine markdown content from all pages
  const combinedMarkdownContent = useMemo(() => {
    if (!pages || pages.length === 0) return '';
    return pages
      .map((page, index) => {
        const content = page.markdownContent || '';
        return content ? `## Page ${index + 1}\n\n${content}` : '';
      })
      .filter(Boolean)
      .join('\n\n---\n\n');
  }, [pages]);

  // Check if markdown is available
  const hasMarkdown = Boolean(combinedMarkdownContent);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }

  function onDocumentLoadError(error: Error) {
    console.error('PDF loading error:', error);
    setLoading(false);
    setError('Failed to load PDF. Please try refreshing the page.');
  }

  function onPageRenderError(error: Error) {
    console.warn('Page render error:', error);
    // Don't set global error for individual page failures
  }

  useEffect(() => {
    const element = scrollAreaRef.current;
    if (!element) return;

    const calcWidth = () => {
      const measuredWidth = element.clientWidth || 700;
      // account for inner padding (p-4 -> 16px each side)
      const adjusted = Math.max(240, measuredWidth - 32);
      setBaseWidth(prev => (Math.abs(prev - adjusted) < 0.5 ? prev : adjusted));
    };

    const resizeObserver = new ResizeObserver(calcWidth);
    resizeObserver.observe(element);
    window.addEventListener('resize', calcWidth);
    calcWidth();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calcWidth);
    };
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 10, 200));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 10, 50));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const handleZoomSliderChange = useCallback((value: number[]) => {
    if (value && value.length > 0 && typeof value[0] === 'number') {
      setZoom(value[0]);
    }
  }, []);
  
  const handleResetZoom = useCallback(() => {
    setZoom(100);
  }, []);

  useEffect(() => {
    setNumPages(0);
    setLoading(true);
    setError(null);
    // Reset zoom when document changes
    setZoom(100);
    setRotation(0);
  }, [file, fileUrl]);

  if (!documentSource) {
    return (
      <Card className="flow-card h-full flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <div className="p-6 bg-muted rounded-2xl inline-flex">
            <FileText className="w-12 h-12 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No PDF Selected</h3>
            <p className="text-sm text-muted-foreground">Upload a PDF to see the preview</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`flow-card ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'h-full'} flex flex-col ${viewMode === 'markdown' ? '' : 'animated-border'}`}>
      <CardHeader className="flex-none border-b bg-gradient-to-r from-muted/30 to-primary/5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <span className="truncate">{displayName}</span>
          {numPages > 0 && (
            <Badge variant="secondary" className="text-xs ml-auto">
              {numPages} page{numPages !== 1 ? 's' : ''}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsFullscreen(!isFullscreen);
            }}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            className="ml-2 shrink-0 h-7 w-7 p-0"
            type="button"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </CardTitle>
        
        {/* View Mode Toggle - Only show if markdown is available */}
        {hasMarkdown && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'pdf' | 'markdown')} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pdf" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  PDF Preview
                </TabsTrigger>
                <TabsTrigger value="markdown" className="flex items-center gap-2">
                  <FileCode className="w-4 h-4" />
                  Markdown
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}
        
        {/* Zoom Controls - Only show in PDF mode */}
        {!error && numPages > 0 && viewMode === 'pdf' && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleZoomOut();
              }}
              disabled={zoom <= 50}
              title="Zoom Out (10%)"
              type="button"
              className="shrink-0"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-2 flex-1 max-w-[240px]">
              <Slider
                value={[zoom]}
                onValueChange={handleZoomSliderChange}
                min={50}
                max={200}
                step={5}
                className="flex-1"
                aria-label="Zoom level"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleResetZoom();
                }}
                className="text-xs font-mono w-16 h-7 px-2 hover:bg-primary/10 shrink-0"
                title="Click to reset to 100%"
                type="button"
              >
                {Math.round(zoom)}%
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleZoomIn();
              }}
              disabled={zoom >= 200}
              title="Zoom In (10%)"
              type="button"
              className="shrink-0"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleRotate();
              }}
              title="Rotate 90°"
              className="ml-2 shrink-0"
              type="button"
            >
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 p-0 overflow-hidden min-h-0">
        {viewMode === 'markdown' && hasMarkdown ? (
          <div className="h-full bg-background">
            <MarkdownViewer 
              markdownContent={combinedMarkdownContent}
              onTextSelect={handleMarkdownTextSelectWithClose}
              closeDialog={isFullscreen ? () => setIsFullscreen(false) : undefined}
            />
          </div>
        ) : (
          <div className="h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" ref={scrollAreaRef}>
            <div className="p-4 space-y-4" style={{ width: 'max-content', minWidth: '100%' }}>
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}
              
              {error && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-2">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                </div>
              )}
              
              {!error && documentSource && (
                <div style={{ width: 'max-content', minWidth: '100%' }}>
                  <Document
                    file={documentSource}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={null}
                    className="space-y-4 fade-in"
                    options={PDF_OPTIONS}
                  >
                    {numPages > 0 && Array.from(new Array(numPages), (_, index) => (
                      <div
                        key={`page_${index + 1}`}
                        className="border-2 border-border rounded-lg shadow-sm overflow-hidden bg-white hover:border-primary/30 transition-colors duration-200 mx-auto"
                        style={{ 
                          animationDelay: `${index * 0.1}s`,
                          width: `${pageWidth}px`
                        }}
                      >
                        <Page
                          pageNumber={index + 1}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                          width={pageWidth}
                          rotate={rotation}
                          onRenderError={onPageRenderError}
                          loading={
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                          }
                        />
                      </div>
                    ))}
                  </Document>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default memo(PdfPreviewPane);









