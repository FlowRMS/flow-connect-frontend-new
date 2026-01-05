'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowRight, X, FileText, Zap, Brain, Lightbulb, File, Upload, Loader2, Trash2, Database } from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import { Textarea } from '@/components/flow-ai/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/flow-ai/ui/card';
import { Badge } from '@/components/flow-ai/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/flow-ai/ui/select';
import { useMutation as useApolloMutation } from '@apollo/client/react';
import { flowrmsApolloClient } from '@/lib/flow-ai/flowrms-apollo';
import { M_UPLOAD_FILE } from '@/lib/flow-ai/gql';
import { toast } from 'sonner';

interface UploadedFile {
  id: string;
  fileName: string;
  file: File;
}

interface InitialInstructionsPromptProps {
  onSubmit: (instructions: string, fileIds?: string[]) => void;
  onSkip: () => void;
  documentName?: string;
}

type ContextSourceMode = 'upload' | 'localStorage';

export function InitialInstructionsPrompt({
  onSubmit,
  onSkip,
  documentName,
}: InitialInstructionsPromptProps) {
  const [instructions, setInstructions] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [contextSourceMode, setContextSourceMode] = useState<ContextSourceMode>('upload');
  const [localStorageContextIds, setLocalStorageContextIds] = useState<string[]>([]);
  const [selectedEntityType, setSelectedEntityType] = useState<string>('invoices');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadFileMutation] = useApolloMutation(M_UPLOAD_FILE, {
    client: flowrmsApolloClient,
  });

  useEffect(() => {
    // Trigger fade-in animation
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Load reference document IDs from localStorage
  useEffect(() => {
    const storedReferenceIds = localStorage.getItem('REFERENCE_DOCUMENT_IDS');
    if (storedReferenceIds) {
      try {
        const ids = JSON.parse(storedReferenceIds) as string[];
        setLocalStorageContextIds(ids);
        // If there are IDs in localStorage, default to localStorage mode
        if (ids.length > 0) {
          setContextSourceMode('localStorage');
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const fileArray = Array.from(files);

    try {
      console.log('📤 Uploading files:', fileArray.map(f => f.name));
      
      // Upload files one by one since we're using singleFileUpload
      const uploadResults: Array<{ id: string; fileName: string }> = [];
      
      for (const file of fileArray) {
        console.log('📤 Uploading single file:', file.name);
        
        const result = await uploadFileMutation({
          variables: {
            file: file,
            tenantLevel: true,
            public: false,
            entityType: selectedEntityType,
          },
        });

        if (result.error) {
          console.error('❌ Upload error:', result.error);
          toast.error(`Failed to upload ${file.name}: ${result.error.message}`);
          continue; // Continue with other files
        }

        const data = result.data as { singleFileUpload?: { results?: Array<{ id: string; fileName: string; status: { code: string; message: string } }> } };

        if (data?.singleFileUpload?.results) {
          const results = data.singleFileUpload.results;
          console.log('✅ Upload successful:', results);
          
          // Check status of each result
          results.forEach(uploadResult => {
            if (uploadResult.status?.code === 'SUCCESS' || uploadResult.id) {
              uploadResults.push({
                id: uploadResult.id,
                fileName: uploadResult.fileName,
              });
            } else {
              console.error('❌ Upload failed with status:', uploadResult.status);
              toast.error(`Failed to upload ${uploadResult.fileName}: ${uploadResult.status?.message || 'Unknown error'}`);
            }
          });
        }
      }

      if (uploadResults.length > 0) {
        const newFiles: UploadedFile[] = uploadResults.map((uploadResult, index) => ({
          id: uploadResult.id,
          fileName: uploadResult.fileName,
          file: fileArray[index],
        }));

        setUploadedFiles(prev => [...prev, ...newFiles]);
        toast.success(`${uploadResults.length} file(s) uploaded successfully`);
      }
    } catch (error) {
      console.error('❌ Upload failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload files');
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    toast.success('File removed');
  };

  const handleSubmit = () => {
    let fileIds: string[] | undefined = undefined;
    
    if (contextSourceMode === 'upload' && uploadedFiles.length > 0) {
      fileIds = uploadedFiles.map(f => f.id);
    } else if (contextSourceMode === 'localStorage' && localStorageContextIds.length > 0) {
      fileIds = localStorageContextIds;
    }
    
    onSubmit(instructions.trim(), fileIds);
  };

  const handleSkip = () => {
    onSkip();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-gradient-to-br from-background/95 via-background/98 to-primary/5 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className={`w-full max-w-2xl transform transition-all duration-500 ${
          isVisible ? 'translate-y-0 scale-100' : 'translate-y-8 scale-95'
        }`}
      >
        <Card className="border-2 border-primary/20 shadow-2xl bg-gradient-to-br from-card via-card to-primary/5 overflow-hidden">
          {/* Decorative gradient border */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 pointer-events-none" />

          <CardHeader className="space-y-6 pb-8 relative">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    <div className="p-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl shadow-lg">
                      <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                    </div>
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl blur opacity-50" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                      Add Context for AI
                    </CardTitle>
                    <CardDescription className="text-lg mt-2 text-muted-foreground">
                      Help our AI understand what matters most in your document
                    </CardDescription>
                  </div>
                </div>

                {documentName && (
                  <div className="flex items-center gap-3 mt-6 p-3 bg-muted/50 rounded-xl border border-primary/10">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Processing Document</p>
                      <p className="text-sm text-muted-foreground">{documentName}</p>
                    </div>
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkip}
                className="rounded-full hover:bg-muted/80 transition-colors h-10 w-10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-3">
              <Badge variant="outline" className="border-primary/30 bg-primary/5 px-3 py-1.5 text-sm font-medium">
                <Brain className="w-4 h-4 mr-2" />
                AI-Powered
              </Badge>
              <Badge variant="outline" className="border-blue-500/30 bg-blue-500/5 px-3 py-1.5 text-sm font-medium">
                <Zap className="w-4 h-4 mr-2" />
                Context-Aware
              </Badge>
              <Badge variant="outline" className="border-green-500/30 bg-green-500/5 px-3 py-1.5 text-sm font-medium">
                <Lightbulb className="w-4 h-4 mr-2" />
                Intelligent
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-8 relative">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-base font-semibold flex items-center gap-2 text-foreground">
                  <span>Additional Instructions</span>
                  <span className="text-sm font-normal text-muted-foreground">(Optional)</span>
                </label>
                <p className="text-sm text-muted-foreground">
                  Provide specific guidance to help the AI extract the most relevant information from your document.
                </p>
              </div>

              <div className="relative">
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="E.g., Focus on extracting vendor information, line items with quantities, and all financial totals..."
                  className="min-h-[140px] resize-none text-base bg-background/80 border-2 border-primary/20 focus:border-primary/50 transition-all duration-200 shadow-sm focus:shadow-md text-foreground placeholder:text-muted-foreground/70"
                  autoFocus
                />
                <div className="absolute bottom-3 right-3 text-xs text-muted-foreground bg-background/90 px-2 py-1 rounded-md border">
                  Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs font-mono">Ctrl</kbd> +{' '}
                  <kbd className="px-1 py-0.5 bg-muted rounded text-xs font-mono">Enter</kbd> to submit
                </div>
              </div>
            </div>

            {/* File Upload Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-base font-semibold flex items-center gap-2 text-foreground">
                  <span>Context Documents</span>
                  <span className="text-sm font-normal text-muted-foreground">(Optional)</span>
                </label>
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
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                        Document Type
                      </label>
                      <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checks">Checks</SelectItem>
                          <SelectItem value="invoices">Invoices</SelectItem>
                          <SelectItem value="orders">Orders</SelectItem>
                          <SelectItem value="quotes">Quotes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Upload reference documents to provide additional context for AI processing.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="gap-2"
                    >
                      {isUploading ? (
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
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      accept=".pdf,.csv,.xlsx,.xls,.doc,.docx,.txt"
                    />
                  </div>
                  
                  {/* Display uploaded files */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2 p-4 bg-muted/30 rounded-lg border border-primary/10">
                      <div className="flex items-center gap-2">
                        <File className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-semibold">Uploaded Documents ({uploadedFiles.length})</h4>
                      </div>
                      <div className="space-y-2">
                        {uploadedFiles.map((file, index) => (
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
                              onClick={() => handleRemoveFile(index)}
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        These documents will be used as context during processing
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Using reference document IDs from localStorage (configured in /auth/test).
                  </p>
                  
                  {/* Display localStorage context IDs */}
                  {localStorageContextIds.length > 0 && (
                    <div className="space-y-2 p-4 bg-muted/30 rounded-lg border border-primary/10">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-semibold">Saved Context Document IDs ({localStorageContextIds.length})</h4>
                      </div>
                      <div className="space-y-2">
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
                      <p className="text-xs text-muted-foreground">
                        These document IDs will be passed as contextFiles to the processDocumentForReview endpoint
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button
                onClick={handleSubmit}
                className="flex-1 h-12 text-base font-semibold gap-3 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                disabled={
                  !instructions.trim() && 
                  (contextSourceMode === 'upload' ? uploadedFiles.length === 0 : localStorageContextIds.length === 0)
                }
              >
                <Sparkles className="w-5 h-5" />
                Start Processing
              </Button>
              <Button
                onClick={handleSkip}
                variant="outline"
                className="flex-1 sm:flex-none h-12 text-base font-semibold border-2 border-muted hover:bg-muted/80 hover:border-primary/30 transition-all duration-200"
              >
                Skip & Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            <div className="pt-4 text-center border-t border-primary/10">
              <p className="text-sm text-muted-foreground">
                💡 You can always add more instructions or modify extracted data later in the review process
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}









