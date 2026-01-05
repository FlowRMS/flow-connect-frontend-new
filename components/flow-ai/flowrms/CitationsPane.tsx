'use client';

import { memo, useState, useEffect } from 'react';
import { X, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import { cn } from '@/lib/flow-ai/cn';
import { DocumentReference } from '@/components/flow-ai/types/chat';
import { getStoredValue } from '@/lib/flow-ai/token-storage';

interface CitationsPaneProps {
  documentReferences: DocumentReference[];
  isOpen: boolean;
  onClose: () => void;
}

const formatPageNumber = (pageNumber: string | number | undefined | null) => {
  if (pageNumber === undefined || pageNumber === null) {
    return null;
  }

  // Convert to string if it's a number
  const value = typeof pageNumber === 'number' ? pageNumber.toString() : pageNumber;
  
  // Remove quotes if present
  return value.replace(/^"|"$/g, '');
};

export const CitationsPane = memo(function CitationsPane({ 
  documentReferences,
  isOpen,
  onClose,
}: CitationsPaneProps) {
  const [presignedUrls, setPresignedUrls] = useState<Record<string, string>>({});
  const [loadingUrls, setLoadingUrls] = useState<Set<string>>(new Set());

  // Fetch presigned URLs for all documents when pane opens
  useEffect(() => {
    if (!isOpen || documentReferences.length === 0) {
      return;
    }

    const fetchUrls = async () => {
      // Get access token from storage
      const accessToken = getStoredValue('ACCESS_TOKEN');
      
      if (!accessToken) {
        console.error('No access token available');
        return;
      }

      // Fetch presigned URLs for each unique document using the presigned-url API
      const uniqueDocIds = [...new Set(documentReferences.map(doc => doc.documentId))];
      const newLoadingUrls = new Set(uniqueDocIds);
      setLoadingUrls(newLoadingUrls);

      for (const docId of uniqueDocIds) {
        try {
          const response = await fetch('/api/presigned-url', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              documentId: docId,
              accessToken: accessToken,
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch presigned URL: ${response.status}`);
          }

          const data = await response.json();
          const presignedUrl = data.presignedUrl;

          if (presignedUrl) {
            setPresignedUrls(prev => ({
              ...prev,
              [docId]: presignedUrl,
            }));
          }
        } catch (error) {
          console.error(`Failed to fetch presigned URL for document ${docId}:`, error);
        } finally {
          setLoadingUrls(prev => {
            const next = new Set(prev);
            next.delete(docId);
            return next;
          });
        }
      }
    };

    fetchUrls();
  }, [isOpen, documentReferences]);

  if (!isOpen || documentReferences.length === 0) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />
      
      {/* Compact Pane - Centered on screen */}
      <div
        className={cn(
          'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl mx-4 bg-card border border-border rounded-xl shadow-2xl z-50 flex flex-col',
          'transition-all duration-300 ease-out',
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
        )}
        style={{ maxHeight: '70vh', height: 'auto' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/30 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Sources</h3>
              <p className="text-xs text-muted-foreground">
                {documentReferences.length} {documentReferences.length === 1 ? 'document' : 'documents'}
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 w-7 p-0 rounded-md flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content - All sources in a scrollable list */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <div className="space-y-3 px-4 py-3">
            {documentReferences.map((doc, index) => {
              const formattedPageNumber = formatPageNumber(doc.pageNumber);
              const presignedUrl = presignedUrls[doc.documentId];
              const isLoading = loadingUrls.has(doc.documentId);
              
              return (
                <div
                  key={index}
                  className="rounded-lg border border-border/50 bg-muted/30 p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/10 text-primary text-xs font-semibold flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2 overflow-hidden">
                      {/* File Name - Clickable if URL available */}
                      <div className="overflow-hidden">
                        {presignedUrl ? (
                          <a
                            href={presignedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-primary hover:text-primary/80 break-words overflow-wrap-anywhere inline-flex items-center gap-1.5 group"
                          >
                            <span>{doc.fileName}</span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 flex-shrink-0" />
                          </a>
                        ) : isLoading ? (
                          <p className="text-sm font-medium text-muted-foreground break-words overflow-wrap-anywhere">
                            {doc.fileName} <span className="text-xs">(loading...)</span>
                          </p>
                        ) : (
                          <p className="text-sm font-medium text-foreground break-words overflow-wrap-anywhere">{doc.fileName}</p>
                        )}
                        {formattedPageNumber && (
                          <p className="text-xs text-muted-foreground">
                            Page {formattedPageNumber}
                          </p>
                        )}
                      </div>

                      {/* Content Preview */}
                      <p className="text-xs text-foreground/80 leading-relaxed break-words overflow-wrap-anywhere">
                        {doc.contentPreview}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
});









