'use client'

import { useRef, useCallback, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { ScrollArea } from '@/components/flow-ai/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownViewerProps {
  markdownContent: string;
  onTextSelect?: (selectedText: string, closeDialog?: () => void) => void;
  closeDialog?: () => void;
}

export function MarkdownViewer({ markdownContent, onTextSelect, closeDialog }: MarkdownViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (!selection) return;

    const selectedText = selection.toString().trim();
    if (selectedText && onTextSelect) {
      // Check if the selection is within our content area
      const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      if (range && contentRef.current?.contains(range.commonAncestorContainer)) {
        onTextSelect(selectedText, closeDialog);
      }
    }
  }, [onTextSelect, closeDialog]);

  useEffect(() => {
    document.addEventListener('mouseup', handleSelectionChange);
    document.addEventListener('touchend', handleSelectionChange);

    return () => {
      document.removeEventListener('mouseup', handleSelectionChange);
      document.removeEventListener('touchend', handleSelectionChange);
    };
  }, [handleSelectionChange]);

  if (!markdownContent) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <div className="p-6 bg-muted rounded-2xl inline-flex">
            <FileText className="w-12 h-12 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No Markdown Content</h3>
            <p className="text-sm text-muted-foreground">Markdown content is not available for this document</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div 
        ref={contentRef}
        className="p-6 prose prose-xs sm:prose-sm dark:prose-invert max-w-4xl mx-auto select-text
                   prose-headings:font-semibold prose-headings:text-foreground
                   prose-h1:text-xl prose-h1:mb-3 prose-h2:text-lg prose-h2:mb-2 prose-h3:text-base prose-h3:mb-2 prose-h4:text-sm
                   prose-p:text-foreground prose-p:leading-normal prose-p:text-sm prose-p:mb-3
                   prose-strong:text-foreground prose-strong:font-semibold
                   prose-ul:text-foreground prose-ol:text-foreground prose-ul:text-sm prose-ol:text-sm prose-ul:my-2 prose-ol:my-2
                   prose-li:text-foreground prose-li:marker:text-muted-foreground prose-li:text-sm prose-li:my-1
                   prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:text-sm prose-blockquote:my-3
                   prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                   prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:text-xs prose-pre:my-3
                   prose-table:text-foreground prose-th:bg-muted prose-td:border prose-td:border-border prose-table:text-sm prose-table:my-3
                   prose-th:px-2 prose-th:py-1 prose-td:px-2 prose-td:py-1
                   prose-hr:border-border prose-hr:my-4
                   prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:text-sm
                   [&>*]:transition-none [&>*]:hover:bg-transparent"
        style={{
          userSelect: 'text',
          WebkitUserSelect: 'text',
          MozUserSelect: 'text',
          msUserSelect: 'text',
          backgroundColor: 'transparent',
        }}
      >
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            // Custom component for better table rendering - more compact
            table: ({ ...props }) => (
              <div className="overflow-x-auto my-3">
                <table className="table-auto border-collapse text-sm" {...props} />
              </div>
            ),
            // Better code block styling
            code: ({ className, children, ...props }) => {
              const isInline = !className?.includes('language-');
              if (isInline) {
                return (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                    {children}
                  </code>
                );
              }
              return (
                <code className={`block p-3 rounded-lg text-xs ${className || ''}`} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {markdownContent}
        </ReactMarkdown>
      </div>
    </ScrollArea>
  );
}









