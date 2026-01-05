'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useApolloClient, useMutation as useApolloMutation } from '@apollo/client/react';
import { Q_GET_CLUSTER, Q_GET_CLUSTER_DOCUMENTS, M_UPDATE_CLUSTER_INSTRUCTIONS, M_ADD_CLUSTER_CONTEXTS, M_REMOVE_CLUSTER_CONTEXTS, M_UPLOAD_FILE, M_UPDATE_CLUSTER_NAME, M_DELETE_CLUSTER } from '@/lib/flow-ai/gql';
import { flowrmsApolloClient } from '@/lib/flow-ai/flowrms-apollo';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/flow-ai/ui/dialog';
import { Button } from '@/components/flow-ai/ui/button';
import { Input } from '@/components/flow-ai/ui/input';
import { Badge } from '@/components/flow-ai/ui/badge';
import { Loader2, Plus, X, Save, FileText, ChevronLeft, ChevronRight, File, Upload, Trash2, Pencil } from 'lucide-react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { cn } from '@/lib/flow-ai/cn';

const PdfPreviewPane = dynamic(
  () => import('@/components/flow-ai/flowrms/PdfPreviewPane').then((mod) => ({ default: mod.PdfPreviewPane })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-muted rounded-lg">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    ),
  }
);

const CsvPreviewPane = dynamic(
  () => import('@/components/flow-ai/flowrms/CsvPreviewPane').then((mod) => ({ default: mod.CsvPreviewPane })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-muted rounded-lg">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    ),
  }
);



interface ClusterDocument {
  id: string;
  originalPresignedUrl: string;
}

interface ClusterContext {
  id: string;
  clusterId: string;
  fileName: string;
  fileType: string;
  fileId: string;
  createdAt: string;
}

interface ClusterModalProps {
  cluster: {
    id: string;
    additionalInstructions: string[];
    clusterMetadata: string | null;
    clusterName: string | null;
    createdAt: string;
    documentCount: number;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export function ClusterModal({ cluster, isOpen, onClose, onUpdate }: ClusterModalProps) {
  const apolloClient = useApolloClient();
  const [documents, setDocuments] = useState<ClusterDocument[]>([]);
  const [contexts, setContexts] = useState<ClusterContext[]>([]);
  const [instructions, setInstructions] = useState<string[]>([]);
  const [newInstruction, setNewInstruction] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [csvData, setCsvData] = useState<unknown[][] | null>(null);
  const [loadingCsv, setLoadingCsv] = useState(false);
  const [currentDocType, setCurrentDocType] = useState<'pdf' | 'csv'>('pdf');
  const [isUploadingContext, setIsUploadingContext] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Template name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [currentClusterName, setCurrentClusterName] = useState<string | null>(null);
  const [nameUpdateLoading, setNameUpdateLoading] = useState(false);

  const [uploadFileMutation] = useApolloMutation(M_UPLOAD_FILE, {
    client: flowrmsApolloClient,
  });

  const [addContextsMutation] = useApolloMutation(M_ADD_CLUSTER_CONTEXTS, {
    client: apolloClient,
  });

  const [removeContextsMutation] = useApolloMutation(M_REMOVE_CLUSTER_CONTEXTS, {
    client: apolloClient,
  });

  const [updateClusterNameMutation] = useApolloMutation(M_UPDATE_CLUSTER_NAME, {
    client: apolloClient,
  });

  const [deleteClusterMutation] = useApolloMutation(M_DELETE_CLUSTER, {
    client: apolloClient,
  });

  const refreshClusterMetadata = useCallback(async (clusterId: string) => {
    try {
      const clusterResult = await apolloClient.query({
        query: Q_GET_CLUSTER,
        variables: { clusterId },
        fetchPolicy: 'network-only',
      });
      
      const clusterData = (clusterResult.data as { getCluster?: { clusterMetadata?: string | null; clusterName?: string | null; contexts?: ClusterContext[] } })?.getCluster;
      setContexts(clusterData?.contexts || []);
      
      // Update template name from clusterName
      const updatedName = clusterData?.clusterName || '';
      setTemplateName(updatedName);
      setCurrentClusterName(updatedName);
    } catch (error) {
      console.error('Failed to refresh cluster metadata:', error);
    }
  }, [apolloClient]);

  const getClusterDocuments = useCallback(async (clusterId: string) => {
    setDocumentsLoading(true);
    try {
      // First get cluster details with contexts and metadata
      const clusterResult = await apolloClient.query({
        query: Q_GET_CLUSTER,
        variables: { clusterId },
        fetchPolicy: 'network-only',
      });
      
      const clusterData = (clusterResult.data as { getCluster?: { clusterMetadata?: string | null; clusterName?: string | null; contexts?: ClusterContext[] } })?.getCluster;
      setContexts(clusterData?.contexts || []);

      // Then get cluster documents
      const { data } = await apolloClient.query({
        query: Q_GET_CLUSTER_DOCUMENTS,
        variables: { clusterId },
        fetchPolicy: 'network-only',
      });
      setDocuments((data as { getClusterDocuments: ClusterDocument[] }).getClusterDocuments || []);
    } catch (error: unknown) {
      toast.error('Failed to load cluster documents', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setDocumentsLoading(false);
    }
  }, [apolloClient]);

  const fetchCsvData = useCallback(async (csvUrl: string) => {
    setLoadingCsv(true);
    try {
      const response = await fetch('/api/csv-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch CSV data');
      }

      const result = await response.json();
      setCsvData(result.csvData);
    } catch (error) {
      toast.error('Failed to load CSV', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      setCsvData(null);
    } finally {
      setLoadingCsv(false);
    }
  }, []);

  const detectFileType = useCallback((url: string): 'pdf' | 'csv' => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('.csv') || lowerUrl.includes('csv')) {
      return 'csv';
    }
    return 'pdf';
  }, []);

  const updateClusterInstructions = async (clusterId: string, instructionsText: string) => {
    setUpdateLoading(true);
    try {
      await apolloClient.mutate({
        mutation: M_UPDATE_CLUSTER_INSTRUCTIONS,
        variables: {
          input: {
            clusterId,
            instructions: instructionsText,
          },
        },
        fetchPolicy: 'network-only',
      });
      toast.success('Instructions updated successfully');
      if (onUpdate) onUpdate();
    } catch (error: unknown) {
      toast.error('Failed to update instructions', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleUploadContext = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!cluster) return;
    
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingContext(true);
    const fileArray = Array.from(files);

    try {
      console.log('📤 Uploading context files:', fileArray.map(f => f.name));
      
      // Upload files one by one since we're using singleFileUpload
      const uploadResults: Array<{ id: string; fileName: string }> = [];
      
      for (const file of fileArray) {
        console.log('📤 Uploading single file:', file.name);
        
        const result = await uploadFileMutation({
          variables: {
            file: file, // ✅ Single file, not array
            tenantLevel: true,
            public: false,
          },
        });

        if (result.error) {
          console.error('❌ Upload error:', result.error);
          toast.error(`Failed to upload ${file.name}: ${result.error.message}`);
          continue; // Continue with other files
        }

        const data = result.data as { 
          singleFileUpload?: { 
            results?: Array<{ 
              id: string; 
              fileName: string; 
              status: { 
                code: number | string; 
                keyword?: string;
                message: string;
              } 
            }> 
          } 
        };

        if (data?.singleFileUpload?.results) {
          const results = data.singleFileUpload.results;
          console.log('✅ Upload successful:', results);
          
          // Check status of each result
          results.forEach(uploadResult => {
            // Status code 1002 means "file_created" - successful upload
            // Also accept if we have an ID (which indicates success)
            const statusCode = typeof uploadResult.status?.code === 'number' 
              ? uploadResult.status.code 
              : parseInt(String(uploadResult.status?.code), 10);
            
            if (uploadResult.id && (statusCode === 1002 || uploadResult.status?.keyword === 'file_created')) {
              uploadResults.push({
                id: uploadResult.id,
                fileName: uploadResult.fileName,
              });
              console.log('✅ File uploaded successfully:', uploadResult.fileName, 'ID:', uploadResult.id);
            } else {
              console.error('❌ Upload failed with status:', uploadResult.status);
              toast.error(`Failed to upload ${uploadResult.fileName}: ${uploadResult.status?.message || 'Unknown error'}`);
            }
          });
        }
      }

      if (uploadResults.length > 0) {
        const uploadedFileIds = uploadResults.map(r => r.id);
        console.log('✅ All uploads successful, adding to cluster:', uploadedFileIds);
        
        // Add the uploaded files as context to the cluster
        const addResult = await addContextsMutation({
          variables: {
            clusterId: cluster.id,
            contextFiles: uploadedFileIds,
          },
        });

        if (addResult.error) {
          throw new Error(addResult.error.message);
        }

        const updatedCluster = (addResult.data as { addClusterContexts?: { contexts?: ClusterContext[] } })?.addClusterContexts;
        if (updatedCluster?.contexts) {
          setContexts(updatedCluster.contexts);
          toast.success(`${uploadedFileIds.length} context file(s) added successfully`);
          
          // Refresh metadata after adding contexts
          await refreshClusterMetadata(cluster.id);
          
          if (onUpdate) onUpdate();
        }
      }
    } catch (error) {
      console.error('❌ Failed to add context files:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add context files');
    } finally {
      setIsUploadingContext(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveContext = async (contextId: string) => {
    if (!cluster) return;

    try {
      const result = await removeContextsMutation({
        variables: {
          input: {
            clusterId: cluster.id,
            contextIds: [contextId],
          },
        },
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      const updatedCluster = (result.data as { removeClusterContexts?: { contexts?: ClusterContext[] } })?.removeClusterContexts;
      if (updatedCluster?.contexts !== undefined) {
        setContexts(updatedCluster.contexts);
        toast.success('Context file removed successfully');
        
        // Refresh metadata after removing context
        await refreshClusterMetadata(cluster.id);
        
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('❌ Failed to remove context file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove context file');
    }
  };

  useEffect(() => {
    if (cluster && isOpen) {
      setInstructions(cluster.additionalInstructions || []);
      setCurrentSlide(0);
      setCsvData(null);
      setLoadingCsv(false);
      setContexts([]);
      setIsEditingName(false);
      
      // Initialize template name from clusterName
      const initialName = cluster.clusterName || '';
      setTemplateName(initialName);
      setCurrentClusterName(initialName);
      
      getClusterDocuments(cluster.id);
    }
  }, [cluster, isOpen, getClusterDocuments]);

  // Load document data when slide changes OR when documents are loaded
  useEffect(() => {
    if (isOpen && documents.length > 0 && documents[currentSlide]) {
      const currentDoc = documents[currentSlide];
      const fileType = detectFileType(currentDoc.originalPresignedUrl);
      setCurrentDocType(fileType);
      
      if (fileType === 'csv') {
        fetchCsvData(currentDoc.originalPresignedUrl);
      } else {
        setCsvData(null);
      }
    }
  }, [currentSlide, documents, detectFileType, fetchCsvData, isOpen]);

  const handleAddInstruction = () => {
    if (!newInstruction.trim()) return;
    const updatedInstructions = [...instructions, newInstruction.trim()];
    setInstructions(updatedInstructions);
    setNewInstruction('');
  };

  const handleRemoveInstruction = (index: number) => {
    const updatedInstructions = instructions.filter((_, i) => i !== index);
    setInstructions(updatedInstructions);
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(instructions[index]);
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editValue.trim()) {
      const updatedInstructions = [...instructions];
      updatedInstructions[editingIndex] = editValue.trim();
      setInstructions(updatedInstructions);
      setEditingIndex(null);
      setEditValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const handleSaveInstructions = async () => {
    if (!cluster) return;
    await updateClusterInstructions(cluster.id, instructions.join('\n'));
  };

  const handleUpdateTemplateName = async () => {
    if (!cluster || !templateName.trim()) return;
    
    setNameUpdateLoading(true);
    try {
      await updateClusterNameMutation({
        variables: {
          clusterId: cluster.id,
          clusterName: templateName.trim(),
        },
      });
      
      toast.success('Template name updated successfully');
      setIsEditingName(false);
      
      // Refresh cluster metadata to get the updated name
      await refreshClusterMetadata(cluster.id);
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to update template name:', error);
      toast.error('Failed to update template name', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setNameUpdateLoading(false);
    }
  };

  const handleDeleteCluster = async () => {
    if (!cluster) return;
    
    // Confirm deletion
    const displayName = currentClusterName || cluster.clusterName || `Template ${cluster.id.slice(0, 8)}`;
    if (!window.confirm(`Are you sure you want to delete "${displayName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await deleteClusterMutation({
        variables: {
          clusterId: cluster.id,
        },
      });
      
      toast.success('Template deleted successfully');
      onClose();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to delete cluster:', error);
      toast.error('Failed to delete template', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  if (!cluster) return null;

  // Use currentClusterName state (which gets updated) instead of cluster prop
  const displayTemplateName = currentClusterName || cluster.clusterName || `Template ${cluster.id.slice(0, 8)}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[90vw] w-full h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <div className="space-y-3">
            {/* Template Name Section */}
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Enter template name"
                    className="flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdateTemplateName();
                      if (e.key === 'Escape') {
                        setIsEditingName(false);
                        setTemplateName(currentClusterName || cluster.clusterName || '');
                      }
                    }}
                  />
                  <Button 
                    size="sm" 
                    onClick={handleUpdateTemplateName}
                    disabled={nameUpdateLoading || !templateName.trim()}
                  >
                    {nameUpdateLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => {
                      setIsEditingName(false);
                      setTemplateName(currentClusterName || cluster.clusterName || '');
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <DialogTitle className="flex items-center gap-2">
                    <span>{displayTemplateName}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setIsEditingName(true)}
                      title="Edit template name"
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                  </DialogTitle>
                  <Badge variant="outline" className="ml-2">
                    {documents.length} Document{documents.length !== 1 ? 's' : ''}
                  </Badge>
                  <div className="ml-auto mr-32">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDeleteCluster}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
                      title="Delete template"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </>
              )}
            </div>
            
            {/* Metadata */}
            {!isEditingName && (
              <DialogDescription>
                Created {new Date(cluster.createdAt).toLocaleDateString()} at{' '}
                {new Date(cluster.createdAt).toLocaleTimeString()}
              </DialogDescription>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="space-y-6 py-4">
            {/* Documents Carousel */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Documents Preview
                {documents.length > 0 && (
                  <span className="text-muted-foreground font-normal">
                    ({currentSlide + 1} of {documents.length})
                  </span>
                )}
              </h3>

              {documentsLoading ? (
                <div className="h-[700px] bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                    <p className="text-sm text-muted-foreground">Loading documents...</p>
                  </div>
                </div>
              ) : documents.length > 0 ? (
                <div className="relative flex justify-center">
                  {/* Document Preview Container - Larger and Simpler */}
                  <div className="relative max-w-4xl w-full" style={{ height: '700px' }}>
                    {currentDocType === 'pdf' ? (
                      <div className="h-full border rounded-lg overflow-hidden bg-background shadow-md">
                        <PdfPreviewPane
                          fileUrl={documents[currentSlide]?.originalPresignedUrl}
                          fileName={`Document ${currentSlide + 1}`}
                        />
                      </div>
                    ) : loadingCsv ? (
                      <div className="h-full border rounded-lg bg-background flex items-center justify-center shadow-md">
                        <div className="text-center space-y-2">
                          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                          <p className="text-sm text-muted-foreground">Loading CSV...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full border rounded-lg overflow-hidden bg-background shadow-md">
                        <CsvPreviewPane
                          csvData={csvData}
                          fileName={`Document ${currentSlide + 1}`}
                        />
                      </div>
                    )}
                  </div>

                  {documents.length > 1 && (
                    <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-4 pointer-events-none">
                      <Button
                        variant="outline"
                        size="icon"
                        className="pointer-events-auto bg-background/95 backdrop-blur-sm hover:bg-background shadow-lg border-2"
                        onClick={() => setCurrentSlide((prev) => (prev > 0 ? prev - 1 : documents.length - 1))}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="pointer-events-auto bg-background/95 backdrop-blur-sm hover:bg-background shadow-lg border-2"
                        onClick={() => setCurrentSlide((prev) => (prev < documents.length - 1 ? prev + 1 : 0))}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-[700px] bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">No documents found</p>
                </div>
              )}
            </div>

            {/* Context Files Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <File className="w-4 h-4" />
                  Context Files
                  {contexts.length > 0 && (
                    <Badge variant="outline" className="ml-1">
                      {contexts.length}
                    </Badge>
                  )}
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
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
                        Add Files
                      </>
                    )}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleUploadContext}
                    className="hidden"
                    accept=".pdf,.csv,.xlsx,.xls,.doc,.docx,.txt"
                  />
                </div>
              </div>
              
              {contexts.length > 0 ? (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {contexts.map((context) => (
                    <div
                      key={context.id}
                      className="flex items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg border border-primary/10 group"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <File className="w-4 h-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate text-foreground" title={context.fileName}>
                            {context.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {context.fileType.toUpperCase()} • Added {new Date(context.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="secondary">{context.fileType}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveContext(context.id)}
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Remove context file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                  <File className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No context files added yet</p>
                  <p className="text-xs mt-1">Click &quot;Add Files&quot; to upload reference documents</p>
                </div>
              )}
            </div>

            {/* Additional Instructions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Additional Instructions</h3>
                <Button
                  onClick={handleSaveInstructions}
                  disabled={updateLoading}
                  size="sm"
                  className="gap-2"
                >
                  {updateLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>

              {/* Scrollable Instructions List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto overflow-x-visible px-1 pt-2 pb-2">
                {instructions.map((instruction, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex items-start gap-2 p-3 rounded-lg border bg-card transition-all',
                      editingIndex === index && 'ring-2 ring-primary shadow-md z-10',
                    )}
                    style={editingIndex === index ? { position: 'relative' } : {}}
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium mt-0.5">
                      {index + 1}
                    </div>
                    {editingIndex === index ? (
                      <div className="flex-1 flex gap-2">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                        <Button size="sm" onClick={handleSaveEdit} variant="default">
                          Save
                        </Button>
                        <Button size="sm" onClick={handleCancelEdit} variant="outline">
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <p className="flex-1 text-sm text-foreground break-words">{instruction}</p>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartEdit(index)}
                            className="h-8 px-2"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveInstruction(index)}
                            className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {instructions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No instructions yet. Add your first instruction below.</p>
                  </div>
                )}
              </div>

              {/* Add New Instruction - Always Visible */}
              <div className="flex gap-2 pt-2 border-t">
                <Input
                  value={newInstruction}
                  onChange={(e) => setNewInstruction(e.target.value)}
                  placeholder="Add a new instruction..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddInstruction();
                  }}
                />
                <Button onClick={handleAddInstruction} className="gap-2 flex-shrink-0">
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}









