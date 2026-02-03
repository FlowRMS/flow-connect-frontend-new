'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileText,
  Loader2,
  Sparkles,
  File,
  Trash2,
  Database,
  Brain,
  Zap,
  Lightbulb,
  CheckCircle2,
  ClipboardList,
  FileCheck,
  Receipt,
  DollarSign,
  Users,
  Building2,
  Package,
  Truck,
  LucideIcon
} from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/flow-ai/ui/card';
import { Textarea } from '@/components/flow-ai/ui/textarea';
import { Badge } from '@/components/flow-ai/ui/badge';
import { uploadFile, type DocumentEntityType } from '@/components/lib/graphql/files';
import { toast } from 'sonner';

interface UploadedContextFile {
  id: string;
  fileName: string;
  file: File;
}

export type DocumentType = 'quotes' | 'orders' | 'order_acknowledgements' | 'invoices' | 'checks' | 'statements' | 'products' | 'factories' | 'customers' | 'deliveries';

interface CombinedUploadPaneProps {
  onDocumentUploaded: (documentId: string, documentType: string, instructions?: string, contextFileIds?: string[]) => void;
  onBatchDocumentsUploaded?: (documentIds: string[], documentType: string, instructions?: string, contextFileIds?: string[]) => void;
  initialDocumentType?: DocumentType;
}
type ContextSourceMode = 'upload' | 'localStorage';

const DOCUMENT_TYPE_OPTIONS: Array<{ value: DocumentType; label: string; icon: LucideIcon; comingSoon?: boolean }> = [
  { value: 'quotes', label: 'Quote', icon: FileText },
  { value: 'orders', label: 'Order', icon: ClipboardList },
  { value: 'order_acknowledgements', label: 'Order Acknowledgement', icon: FileCheck },
  { value: 'invoices', label: 'Invoice', icon: Receipt },
  { value: 'statements', label: 'Statements', icon: DollarSign },
  { value: 'checks', label: 'Checks', icon: Receipt },
  { value: 'products', label: 'Products', icon: Package },
  { value: 'factories', label: 'Factories', icon: Building2 },
  { value: 'customers', label: 'Customers', icon: Users },
  { value: 'deliveries', label: 'Packing Slip / Delivery', icon: Truck },
] as const;

// Map Flow AI document types to CRM DocumentEntityType for file uploads
const getDocumentEntityType = (documentType: DocumentType): DocumentEntityType => {
  switch (documentType) {
    case 'quotes':
      return 'QUOTES';
    case 'orders':
      return 'ORDERS';
    case 'order_acknowledgements':
      return 'ORDER_ACKNOWLEDGEMENTS';
    case 'invoices':
      return 'INVOICES';
    case 'statements':
      return 'COMMISSION_STATEMENTS';
    case 'checks':
      return 'CHECKS';
    case 'products':
      return 'PRODUCTS';
    case 'factories':
      return 'FACTORIES';
    case 'customers':
      return 'CUSTOMERS';
    case 'deliveries':
      return 'DELIVERIES';
    default:
      return 'UNDEFINED';
  }
};

export function CombinedUploadPane({ onDocumentUploaded, onBatchDocumentsUploaded, initialDocumentType }: CombinedUploadPaneProps) {
  // Document upload state
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType>(initialDocumentType || 'invoices');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedDocument, setUploadedDocument] = useState<{ id: string; fileName: string } | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<Array<{ id: string; fileName: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Instructions state
  const [instructions, setInstructions] = useState('');

  // Context files state
  const [uploadedContextFiles, setUploadedContextFiles] = useState<UploadedContextFile[]>([]);
  const [isUploadingContext, setIsUploadingContext] = useState(false);
  const [contextSourceMode, setContextSourceMode] = useState<ContextSourceMode>('upload');
  const [localStorageContextIds, setLocalStorageContextIds] = useState<string[]>([]);
  const contextFileInputRef = useRef<HTMLInputElement>(null);

  // Load reference document IDs from localStorage
  useEffect(() => {
    const storedReferenceIds = localStorage.getItem('REFERENCE_DOCUMENT_IDS');
    if (storedReferenceIds) {
      try {
        const ids = JSON.parse(storedReferenceIds) as string[];
        setLocalStorageContextIds(ids);
        if (ids.length > 0) {
          setContextSourceMode('localStorage');
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Check total count including existing uploads
    const currentCount = uploadedDocuments.length + (uploadedDocument ? 1 : 0);
    if (currentCount >= MAX_BATCH_UPLOAD) {
      toast.error(`Maximum ${MAX_BATCH_UPLOAD} files can be uploaded. Please remove some files first.`);
      return;
    }

    setIsUploading(true);

    try {
      console.log('Uploading document:', file.name);
      console.log('Document type:', selectedDocumentType);

      // Get the appropriate fileEntityType for the selected document type
      const fileEntityType = getDocumentEntityType(selectedDocumentType);
      console.log('File entity type:', fileEntityType);

      const uploadResult = await uploadFile({
        file,
        fileName: file.name,
        fileEntityType,
      });

      console.log('Upload successful:', uploadResult);
      toast.success('Document uploaded successfully');
      // Use the id from uploadFile response as the documentId for processing
      setUploadedDocuments(prev => [...prev, { id: uploadResult.id, fileName: uploadResult.fileName }]);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload document');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const MAX_BATCH_UPLOAD = 15;

  const handleMultipleFilesSelect = async (files: File[]) => {
    if (!files || files.length === 0) return;

    // Check total count including existing uploads
    const currentCount = uploadedDocuments.length + (uploadedDocument ? 1 : 0);
    const remainingSlots = MAX_BATCH_UPLOAD - currentCount;

    if (remainingSlots <= 0) {
      toast.error(`Maximum ${MAX_BATCH_UPLOAD} files can be uploaded. Please remove some files first.`);
      return;
    }

    if (files.length > remainingSlots) {
      toast.error(`You can only add ${remainingSlots} more file(s). You selected ${files.length} files.`);
      return;
    }

    setIsUploading(true);
    const uploadResults: Array<{ id: string; fileName: string }> = [];

    // Get the appropriate fileEntityType for the selected document type
    const fileEntityType = getDocumentEntityType(selectedDocumentType);

    try {
      for (const file of files) {
        console.log('Uploading document:', file.name);

        try {
          const uploadResult = await uploadFile({
            file,
            fileName: file.name,
            fileEntityType,
          });

          // Use the id from uploadFile response as the documentId for processing
          uploadResults.push({ id: uploadResult.id, fileName: uploadResult.fileName });
        } catch (fileError) {
          console.error('Upload error:', fileError);
          toast.error(`Failed to upload ${file.name}: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
        }
      }

      if (uploadResults.length > 0) {
        toast.success(`${uploadResults.length} document(s) uploaded successfully`);
        // Append to existing documents instead of replacing
        setUploadedDocuments(prev => [...prev, ...uploadResults]);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload documents');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleContextFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingContext(true);
    const fileArray = Array.from(files);

    // Get the appropriate fileEntityType for the selected document type
    const fileEntityType = getDocumentEntityType(selectedDocumentType);

    try {
      const uploadResults: Array<{ id: string; fileName: string }> = [];

      for (const file of fileArray) {
        try {
          const uploadResult = await uploadFile({
            file,
            fileName: file.name,
            fileEntityType,
          });

          uploadResults.push({
            id: uploadResult.id,
            fileName: uploadResult.fileName,
          });
        } catch (fileError) {
          toast.error(`Failed to upload ${file.name}: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
        }
      }

      if (uploadResults.length > 0) {
        const newFiles: UploadedContextFile[] = uploadResults.map((uploadResult, index) => ({
          id: uploadResult.id,
          fileName: uploadResult.fileName,
          file: fileArray[index],
        }));

        setUploadedContextFiles(prev => [...prev, ...newFiles]);
        toast.success(`${uploadResults.length} context file(s) uploaded`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload context files');
    } finally {
      setIsUploadingContext(false);
      if (contextFileInputRef.current) {
        contextFileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveContextFile = (index: number) => {
    setUploadedContextFiles(prev => prev.filter((_, i) => i !== index));
    toast.success('Context file removed');
  };

  const handleRemoveDocument = () => {
    setUploadedDocument(null);
    localStorage.removeItem('flowrms_document_id');
    toast.success('Document removed');
  };

  const handleRemoveUploadedDocument = (index: number) => {
    setUploadedDocuments(prev => prev.filter((_, i) => i !== index));
    toast.success('Document removed');
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      if (files.length === 1) {
        handleFileSelect(files[0]);
      } else {
        handleMultipleFilesSelect(Array.from(files));
      }
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
      const files = Array.from(e.dataTransfer.files);
      if (files.length === 1) {
        handleFileSelect(files[0]);
      } else {
        handleMultipleFilesSelect(files);
      }
    }
  };

  const handleStartProcessing = () => {
    // Combine legacy uploadedDocument with uploadedDocuments array
    const allDocuments = uploadedDocument
      ? [uploadedDocument, ...uploadedDocuments]
      : uploadedDocuments;

    if (allDocuments.length === 0) {
      toast.error('Please upload a document first');
      return;
    }

    let contextFileIds: string[] | undefined = undefined;

    if (contextSourceMode === 'upload' && uploadedContextFiles.length > 0) {
      contextFileIds = uploadedContextFiles.map(f => f.id);
    } else if (contextSourceMode === 'localStorage' && localStorageContextIds.length > 0) {
      contextFileIds = localStorageContextIds;
    }

    // If multiple documents uploaded and batch callback is available, use batch processing
    if (allDocuments.length > 1 && onBatchDocumentsUploaded) {
      const documentIds = allDocuments.map(d => d.id);
      onBatchDocumentsUploaded(
        documentIds,
        selectedDocumentType,
        instructions.trim() || undefined,
        contextFileIds
      );
    } else if (allDocuments.length === 1) {
      // Single document - use existing flow
      onDocumentUploaded(
        allDocuments[0].id,
        selectedDocumentType,
        instructions.trim() || undefined,
        contextFileIds
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleStartProcessing();
    }
  };

  return (
    <div className="min-h-[calc(100vh-220px)] flex items-center justify-center p-4 pb-8">
      <Card className="w-full max-w-3xl border-2 border-primary/20 shadow-2xl bg-gradient-to-br from-card via-card to-primary/5 relative">

        <CardHeader className="space-y-6 pb-6 relative">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="p-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl shadow-lg">
                <Sparkles className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl blur opacity-50" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Upload & Configure
              </CardTitle>
              <CardDescription className="text-base mt-1 text-muted-foreground">
                Upload your document and optionally add instructions for AI processing
              </CardDescription>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className="border-primary/30 bg-primary/5 px-3 py-1.5 text-sm font-medium">
              <Brain className="w-4 h-4 mr-2" />
              AI-Powered
            </Badge>
            <Badge variant="outline" className="border-blue-500/30 bg-blue-500/5 px-3 py-1.5 text-sm font-medium">
              <Zap className="w-4 h-4 mr-2" />
              Smart Extraction
            </Badge>
            <Badge variant="outline" className="border-green-500/30 bg-green-500/5 px-3 py-1.5 text-sm font-medium">
              <Lightbulb className="w-4 h-4 mr-2" />
              Context-Aware
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 relative">
          {/* Step 1: Document Upload */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                (uploadedDocument || uploadedDocuments.length > 0) ? 'bg-green-500 text-white' : 'bg-primary text-white'
              }`}>
                {(uploadedDocument || uploadedDocuments.length > 0) ? <CheckCircle2 className="w-4 h-4" /> : '1'}
              </div>
              <h3 className="text-lg font-semibold">Upload Documents</h3>
              {(uploadedDocument || uploadedDocuments.length > 0) && (
                <Badge variant="outline" className="border-green-500/30 bg-green-500/5 text-green-600 ml-2">
                  {uploadedDocuments.length + (uploadedDocument ? 1 : 0)} Uploaded
                </Badge>
              )}
            </div>

            {/* Document Type Selection - Card Grid */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">What are you uploading?</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {DOCUMENT_TYPE_OPTIONS.map((option) => {
                  const IconComponent = option.icon;
                  const isSelected = selectedDocumentType === option.value;
                  const isDisabled = isUploading || option.comingSoon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => !isDisabled && setSelectedDocumentType(option.value)}
                      disabled={isDisabled}
                      className={`
                        relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200
                        ${isSelected
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-border/50 bg-card hover:border-primary/30 hover:bg-muted/30'
                        }
                        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      {option.comingSoon && (
                        <span className="absolute top-1 right-1 text-[9px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">SOON</span>
                      )}
                      <IconComponent className={`w-6 h-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-xs font-medium text-center leading-tight ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Uploaded Documents Display */}
            {uploadedDocument && (
              <div className="flex items-center gap-3 p-4 bg-green-500/5 border border-green-500/30 rounded-xl">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{uploadedDocument.fileName}</p>
                  <p className="text-sm text-muted-foreground">Ready for processing</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveDocument}
                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}

            {uploadedDocuments.length > 0 && (
              <div className="space-y-2 p-4 bg-green-500/5 border border-green-500/30 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <FileText className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{uploadedDocuments.length} documents uploaded</p>
                    <p className="text-sm text-muted-foreground">Ready for batch processing</p>
                  </div>
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {uploadedDocuments.map((doc, index) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-2 p-2 bg-background/50 rounded border border-green-500/10 group"
                    >
                      <File className="w-3 h-3 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-foreground flex-1 truncate">{doc.fileName}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveUploadedDocument(index)}
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Area - Always visible */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 ${
                dragActive
                  ? 'border-primary bg-primary/5 scale-[1.01]'
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
                multiple
                onChange={handleInputChange}
                className="hidden"
                accept=".pdf,.csv,.xlsx,.xls,.doc,.docx"
                disabled={isUploading}
              />

              <div className="flex flex-col items-center gap-3 text-center">
                {isUploading ? (
                  <>
                    <div className="p-4 bg-primary/10 rounded-full">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Uploading...</p>
                      <p className="text-sm text-muted-foreground">Please wait</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-primary/10 rounded-full">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {(uploadedDocument || uploadedDocuments.length > 0) ? 'Add more files' : 'Drop your files here or click to browse'}
                      </p>
                      <p className="text-sm text-muted-foreground">PDF, CSV, Excel, Word - Upload up to 15 files</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Step 2: Instructions (Optional) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                2
              </div>
              <h3 className="text-lg font-semibold">Add Instructions</h3>
              <span className="text-sm text-muted-foreground">(Optional)</span>
            </div>

            <div className="relative">
              <Textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="E.g., Focus on extracting vendor information, line items with quantities, and all financial totals..."
                className="min-h-[100px] resize-none text-base bg-background/80 border-2 border-primary/20 focus:border-primary/50 transition-all duration-200"
              />
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/90 px-2 py-1 rounded">
                <kbd className="px-1 py-0.5 bg-muted rounded text-xs font-mono">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-muted rounded text-xs font-mono">Enter</kbd> to submit
              </div>
            </div>
          </div>

          {/* Step 3: Context Documents (Optional) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                3
              </div>
              <h3 className="text-lg font-semibold">Context Documents</h3>
              <span className="text-sm text-muted-foreground">(Optional)</span>
            </div>

            {/* Toggle for context source mode */}
            <div className="flex gap-2 p-1 bg-muted/50 rounded-lg border border-primary/10">
              <Button
                type="button"
                variant={contextSourceMode === 'upload' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setContextSourceMode('upload')}
                className="flex-1 gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Files
              </Button>
              <Button
                type="button"
                variant={contextSourceMode === 'localStorage' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setContextSourceMode('localStorage')}
                className="flex-1 gap-2"
                disabled={localStorageContextIds.length === 0}
              >
                <Database className="w-4 h-4" />
                Use Saved IDs {localStorageContextIds.length > 0 && `(${localStorageContextIds.length})`}
              </Button>
            </div>

            {contextSourceMode === 'upload' ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Add reference documents for additional context
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => contextFileInputRef.current?.click()}
                    disabled={isUploadingContext}
                    className="gap-2"
                  >
                    {isUploadingContext ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Browse
                      </>
                    )}
                  </Button>
                  <input
                    ref={contextFileInputRef}
                    type="file"
                    multiple
                    onChange={handleContextFileSelect}
                    className="hidden"
                    accept=".pdf,.csv,.xlsx,.xls,.doc,.docx,.txt"
                  />
                </div>

                {uploadedContextFiles.length > 0 && (
                  <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-primary/10">
                    <div className="flex items-center gap-2">
                      <File className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Context Files ({uploadedContextFiles.length})</span>
                    </div>
                    <div className="space-y-1">
                      {uploadedContextFiles.map((file, index) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-2 p-2 bg-background/50 rounded border border-primary/5 group"
                        >
                          <File className="w-3 h-3 text-primary flex-shrink-0" />
                          <span className="text-sm text-foreground flex-1 truncate">{file.fileName}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveContextFile(index)}
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Using saved reference document IDs from localStorage
                </p>

                {localStorageContextIds.length > 0 && (
                  <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-primary/10">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Saved IDs ({localStorageContextIds.length})</span>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {localStorageContextIds.map((id, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-background/50 rounded border border-primary/5"
                        >
                          <File className="w-3 h-3 text-primary flex-shrink-0" />
                          <span className="text-xs font-mono text-foreground flex-1 truncate">{id}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Action Button */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-primary/10">
            <Button
              onClick={handleStartProcessing}
              className="flex-1 h-12 text-base font-semibold gap-3 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
              disabled={(uploadedDocuments.length === 0 && !uploadedDocument) || isUploading}
            >
              <Sparkles className="w-5 h-5" />
              {(() => {
                const totalCount = uploadedDocuments.length + (uploadedDocument ? 1 : 0);
                return totalCount > 1 ? `Process ${totalCount} Documents` : 'Start Processing';
              })()}
            </Button>
          </div>

          <div className="text-center pb-2">
            <p className="text-sm text-muted-foreground">
              You can modify extracted data and add more instructions later in the review process
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}









