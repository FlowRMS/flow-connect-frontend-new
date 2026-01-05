'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, Loader2, Sparkles, Info } from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/flow-ai/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/flow-ai/ui/select';
import { uploadFile, type DocumentEntityType } from '@/components/lib/graphql/files';
import { toast } from 'sonner';

interface DocumentUploadPaneProps {
  onDocumentUploaded: (documentId: string, documentType: string) => void;
}

type DocumentType = 'quotes' | 'orders' | 'order_acknowledgements' | 'invoices' | 'checks';

const DOCUMENT_TYPE_OPTIONS: Array<{ value: DocumentType; label: string }> = [
  { value: 'quotes', label: 'Quote' },
  { value: 'orders', label: 'Order' },
  { value: 'order_acknowledgements', label: 'Order Acknowledgement' },
  { value: 'invoices', label: 'Invoice' },
  { value: 'checks', label: 'Checks' },
];

// Map Flow AI document types to CRM DocumentEntityType for file uploads
const getDocumentEntityType = (documentType: DocumentType): DocumentEntityType => {
  switch (documentType) {
    case 'quotes':
      return 'QUOTES';
    case 'orders':
    case 'order_acknowledgements':
      return 'ORDERS';
    case 'invoices':
      return 'INVOICES';
    case 'checks':
      return 'CHECKS';
    default:
      return 'UNDEFINED';
  }
};

export function DocumentUploadPane({ onDocumentUploaded }: DocumentUploadPaneProps) {
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType>('invoices');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    setIsUploading(true);

    try {
      console.log('📤 Uploading document:', file.name);
      console.log('📋 Document type:', selectedDocumentType);

      // Get the appropriate fileEntityType for the selected document type
      const fileEntityType = getDocumentEntityType(selectedDocumentType);
      console.log('📋 File entity type:', fileEntityType);

      const uploadResult = await uploadFile({
        file,
        fileName: file.name,
        fileEntityType,
      });

      console.log('✅ Upload successful:', uploadResult);
      toast.success('Document uploaded successfully');

      // Store the document ID in localStorage
      localStorage.setItem('flowrms_document_id', uploadResult.id);

      // Notify parent component with the id from uploadFile response
      onDocumentUploaded(uploadResult.id, selectedDocumentType);
    } catch (error) {
      console.error('❌ Upload failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload document');
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="min-h-[calc(100vh-220px)] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-2 border-primary/20 shadow-xl bg-gradient-to-br from-card via-card to-primary/5">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl shadow-lg">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Upload Document</CardTitle>
              <CardDescription className="text-base">
                No document found. Upload a document to begin review.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/30 rounded-lg">
            <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Getting Started</h4>
              <p className="text-sm text-muted-foreground">
                Select the document type below, then upload your file. The document will be processed immediately.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Document Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
              Document Type
            </label>
            <Select
              value={selectedDocumentType}
              onValueChange={(value) => setSelectedDocumentType(value as DocumentType)}
              disabled={isUploading}
            >
              <SelectTrigger className="w-full h-12 text-base border-2 border-primary/20">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-base">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This helps the AI understand how to process your document
            </p>
          </div>

          {/* Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ${
              dragActive
                ? 'border-primary bg-primary/5 scale-[1.02]'
                : 'border-primary/30 bg-muted/30 hover:bg-muted/50 hover:border-primary/50'
            } ${isUploading ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleInputChange}
              className="hidden"
              accept=".pdf,.csv,.xlsx,.xls,.doc,.docx"
              disabled={isUploading}
            />

            <div className="flex flex-col items-center gap-4 text-center">
              {isUploading ? (
                <>
                  <div className="p-6 bg-primary/10 rounded-full">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Uploading Document...</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Please wait while we upload your file
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-6 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                    <Upload className="w-12 h-12 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Drop your file here or click to browse
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Supported formats: PDF, CSV, Excel, Word
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="gap-2 border-2 hover:bg-primary/10 hover:border-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    <Upload className="w-5 h-5" />
                    Browse Files
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="pt-4 border-t border-primary/10">
            <div className="flex items-start gap-3 text-sm">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground mb-1">What happens next?</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Your document will be uploaded securely</li>
                  <li>• AI will automatically extract relevant information</li>
                  <li>• You can review and modify the extracted data</li>
                  <li>• Approve when everything looks correct</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}









