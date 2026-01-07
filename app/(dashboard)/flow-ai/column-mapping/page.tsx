'use client';

import { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client/react';
import { ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Loader2, FileSpreadsheet, Database, Sparkles, Check, Edit3, X, Copy, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import { Input } from '@/components/flow-ai/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/flow-ai/ui/card';
import { Badge } from '@/components/flow-ai/ui/badge';
import { Combobox } from '@/components/flow-ai/ui/combobox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/flow-ai/ui/tooltip';
import { toast } from 'sonner';
import { M_REMAP_TABULAR_COLUMNS } from '@/lib/flow-ai/gql';
import { usePendingReview } from '@/components/flow-ai/hooks/usePendingReview';
import { useProcessExtractedDtos } from '@/components/flow-ai/hooks/useProcessExtractedDtos';
import type { ParsedMappingData, MappingRow, ColumnDuplicateInput } from '@/components/flow-ai/types/column-mapping';
import { cn } from '@/lib/flow-ai/cn';
import { searchFactories } from '@/components/lib/api/search';

// Format action message to show only the part after the last fullstop
// e.g., "Processed entity type 3. Processed 9 of 12 pending entities." => "Processed 9 of 12 pending entities."
function formatActionMessage(action: string | undefined | null): string {
  if (!action) return 'Processing your document...';

  // Split by ". " and get the last meaningful part
  const parts = action.split('. ').filter(part => part.trim().length > 0);
  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1];
    return lastPart.endsWith('.') ? lastPart : lastPart;
  }

  return action;
}

// Helper to format field path for display
const formatFieldPath = (path: string) => {
  // Convert paths like "contacts[].firstname" to "Contacts → Firstname"
  // Convert "addresses[].city" to "Addresses → City"
  // Convert "company_name" to "Company Name"
  // Convert "inside_sales_rep_name" to "Inside Sales Rep Name"
  
  // Check if path has array notation (indicates nested/array field)
  const hasArrayNotation = path.includes('[]');
  
  // Remove array brackets for processing
  const cleanPath = path.replace(/\[\]/g, '');
  
  // Split by dots
  const parts = cleanPath.split('.');
  
  // Helper to format a single part (convert snake_case to Title Case)
  const formatPart = (part: string) => {
    return part
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // For nested paths with arrays (like contacts[].firstname, addresses[].city)
  // Keep the parent context to distinguish fields
  if (parts.length > 1) {
    // Skip only truly generic prefixes that don't add meaning
    const genericPrefixes = ['details', 'order'];
    
    const meaningfulParts = parts.filter(part => 
      !genericPrefixes.includes(part.toLowerCase())
    );
    
    if (meaningfulParts.length > 1) {
      // Format as "Parent → Child" for clarity
      // e.g., "contacts[].firstname" -> "Contacts → Firstname"
      // e.g., "addresses[].address_line_one" -> "Addresses → Address Line One"
      return meaningfulParts.map(formatPart).join(' → ');
    }
    
    // If only one meaningful part remains, just format it
    return formatPart(meaningfulParts[0] || parts[parts.length - 1]);
  }
  
  // For simple paths, just format the single field
  return formatPart(parts[0]);
};

function ColumnMappingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pendingId = searchParams.get('pendingId');
  const saveToTemplate = searchParams.get('saveToTemplate') === 'true';

  const { refetchPending } = usePendingReview();
  const [remapMutation, { loading: isRemapping }] = useMutation(M_REMAP_TABULAR_COLUMNS);

  // Hook for processing extracted DTOs subscription
  const {
    isComplete: processingComplete,
    progress: entityProgress,
    error: entityProcessingError,
    startProcessing: startEntityProcessing,
    reset: resetEntityProcessing,
  } = useProcessExtractedDtos(pendingId);

  // Factory search state
  const [factoryOptions, setFactoryOptions] = useState<{ value: string; label: string }[]>([]);
  const [loadingFactories, setLoadingFactories] = useState(false);

  // Load factories using searchFactories from CRM API
  useEffect(() => {
    async function loadFactories() {
      setLoadingFactories(true);
      try {
        // Search with empty string to get all factories (or use a wildcard search)
        const factories = await searchFactories('', true, 100);
        setFactoryOptions(
          factories.map(f => ({
            value: f.title,
            label: f.title
          }))
        );
      } catch (error) {
        console.error('Error loading factories:', error);
        toast.error('Failed to load factories');
      } finally {
        setLoadingFactories(false);
      }
    }
    loadFactories();
  }, []);

  const [defaultValues, setDefaultValues] = useState<Record<string, string>>({});

  const handleDefaultValueChange = (field: string, value: string) => {
    setDefaultValues(prev => ({ ...prev, [field]: value }));
  };

  const handleAddDefaultValue = (field: string) => {
    setDefaultValues(prev => ({ ...prev, [field]: '' }));
  };

  const handleRemoveDefaultValue = (field: string) => {
    setDefaultValues(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const [mappingData, setMappingData] = useState<ParsedMappingData | null>(null);
  const [mappingRows, setMappingRows] = useState<MappingRow[]>([]);
  const [selectedDestinations, setSelectedDestinations] = useState<Record<string, string>>({});
  const [manuallyMappedColumns, setManuallyMappedColumns] = useState<Set<string>>(new Set());
  const [selectedColumnForPreview, setSelectedColumnForPreview] = useState<string | null>(null);
  const [csvPreviewData, setCsvPreviewData] = useState<unknown[][] | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Duplicate columns: map source column to additional target DTO fields
  // Key is sourceColumn, value is array of additional targetDtoFields (beyond the primary mapping)
  const [duplicateColumns, setDuplicateColumns] = useState<Record<string, string[]>>({});

  // Navigate to entity matching when processing is complete
  useEffect(() => {
    if (processingComplete && isRedirecting && pendingId) {
      console.log('✅ Entity processing complete, navigating to entity matching...');
      router.push(`/flow-ai/entity-matching?pendingId=${encodeURIComponent(pendingId)}&saveToTemplate=${saveToTemplate}&source=spreadsheet`);
    }
  }, [processingComplete, isRedirecting, pendingId, saveToTemplate, router]);

  // Handle entity processing errors - show toast and reset state
  useEffect(() => {
    if (entityProcessingError) {
      console.error('❌ Entity processing error:', entityProcessingError);
      // Extract a user-friendly message from the error
      const errorMsg = entityProcessingError.includes('validation error')
        ? 'Processing failed due to a data validation error.'
        : 'Processing failed. Please try again.';

      // Build description with error details and pending ID for support
      const errorDetails = entityProcessingError.length > 150
        ? entityProcessingError.substring(0, 150) + '...'
        : entityProcessingError;
      const pendingIdInfo = pendingId ? `\n\nDocument ID for support: ${pendingId}` : '';

      toast.error(errorMsg, {
        description: `${errorDetails}${pendingIdInfo}`,
        duration: 15000, // Keep visible longer so user can copy the ID
      });
      // Reset the processing state so the user isn't stuck on the overlay
      setIsRedirecting(false);
      resetEntityProcessing();
    }
  }, [entityProcessingError, resetEntityProcessing, pendingId]);

  // Fetch the pending document and parse extractedDataJson
  useEffect(() => {
    async function loadMappingData() {
      if (!pendingId) {
        toast.error('No pending ID provided');
        router.push('/flow-ai');
        return;
      }

      try {
        setIsLoading(true);
        const pending = await refetchPending(pendingId);
        
        if (!pending?.extractedDataJson) {
          toast.error('No mapping data available');
          router.push('/flow-ai');
          return;
        }

        // Parse the extractedDataJson - it's a JSON string
        let parsedData: ParsedMappingData;
        try {
          const extracted = JSON.parse(pending.extractedDataJson);
          
          // The structure might be wrapped in a data array or directly the mapping data
          if (Array.isArray(extracted)) {
            parsedData = extracted[0] as ParsedMappingData;
          } else if (extracted.data && Array.isArray(extracted.data)) {
            parsedData = extracted.data[0] as ParsedMappingData;
          } else {
            parsedData = extracted as ParsedMappingData;
          }
        } catch (parseError) {
          console.error('Error parsing extractedDataJson:', parseError);
          toast.error('Invalid mapping data format');
          router.push('/flow-ai');
          return;
        }

        // Validate that we have the expected structure
        if (!parsedData.mappings) {
          toast.error('Mapping data structure is invalid');
          router.push('/flow-ai');
          return;
        }

        setMappingData(parsedData);

        // Build mapping rows from the parsed data
        const rows: MappingRow[] = [];
        const initialDestinations: Record<string, string> = {};

        // Add mapped columns
        if (parsedData.mappings?.mappings) {
          parsedData.mappings.mappings.forEach((mapping) => {
            rows.push({
              columnName: mapping.column_name,
              suggestedDtoField: mapping.dto_field_path,
              confidence: mapping.confidence,
              reasoning: mapping.reasoning,
              isAutoMapped: true,
            });
            initialDestinations[mapping.column_name] = mapping.dto_field_path;
          });
        }

        // Add unmapped columns
        if (parsedData.mappings?.unmapped_columns) {
          parsedData.mappings.unmapped_columns.forEach((columnName) => {
            rows.push({
              columnName,
              suggestedDtoField: null,
              confidence: null,
              reasoning: null,
              isAutoMapped: false,
            });
          });
        }

        setMappingRows(rows);
        setSelectedDestinations(initialDestinations);
        
        // Auto-select first column for preview
        if (rows.length > 0) {
          setSelectedColumnForPreview(rows[0].columnName);
        }
      } catch (error) {
        console.error('Error loading mapping data:', error);
        toast.error('Failed to load mapping data');
        router.push('/flow-ai');
      } finally {
        setIsLoading(false);
      }
    }

    loadMappingData();
  }, [pendingId, refetchPending, router]);

  // Load CSV preview data when a column is selected
  useEffect(() => {
    async function loadPreview() {
      if (!selectedColumnForPreview || !mappingData?.original_presigned_url) return;

      try {
        setIsLoadingPreview(true);
        const response = await fetch('/api/flow-ai/csv-fetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ csvUrl: mappingData.original_presigned_url }),
        });

        if (!response.ok) throw new Error('Failed to fetch CSV preview');

        const data = await response.json();
        setCsvPreviewData(data.csvData);
      } catch (error) {
        console.error('Error loading preview:', error);
        toast.error('Failed to load column preview');
      } finally {
        setIsLoadingPreview(false);
      }
    }

    loadPreview();
  }, [selectedColumnForPreview, mappingData?.original_presigned_url]);

  // Get available destination fields sorted by label
  const destinationOptions = useMemo(() => {
    if (!mappingData?.mappings) return [];

    const fields = new Set<string>();
    
    // Add all suggested fields from mappings
    mappingData.mappings.mappings?.forEach((m) => {
      fields.add(m.dto_field_path);
    });

    // Add unmapped DTO fields
    mappingData.mappings.unmapped_dto_fields?.forEach((field) => {
      fields.add(field);
    });

    return Array.from(fields).map(field => ({
      value: field,
      label: formatFieldPath(field),
      isRequired: mappingData.required_fields?.includes(field)
    })).sort((a, b) => a.label.localeCompare(b.label));
  }, [mappingData]);

  // Get currently mapped destinations (for duplicate detection)
  const mappedDestinations = useMemo(() => {
    return new Set(
      Object.values(selectedDestinations).filter(dest => dest !== '')
    );
  }, [selectedDestinations]);

  // Calculate mapping statistics
  const mappingStats = useMemo(() => {
    const total = mappingRows.length;
    let autoMapped = 0;
    let manuallyMapped = 0;
    let unmapped = 0;

    mappingRows.forEach(row => {
      const currentDestination = selectedDestinations[row.columnName];
      
      if (!currentDestination) {
        unmapped++;
      } else if (manuallyMappedColumns.has(row.columnName)) {
        manuallyMapped++;
      } else {
        autoMapped++;
      }
    });

    // Add default values to manual mappings count
    manuallyMapped += Object.keys(defaultValues).length;

    return { total, autoMapped, manuallyMapped, unmapped };
  }, [mappingRows, selectedDestinations, manuallyMappedColumns, defaultValues]);

  // Get preview values for the selected column
  const previewValues = useMemo(() => {
    if (!csvPreviewData || !selectedColumnForPreview) return [];

    const headers = csvPreviewData[0] as string[];
    const columnIndex = headers.indexOf(selectedColumnForPreview);
    
    if (columnIndex === -1) return [];

    return csvPreviewData
      .slice(1, 21) // Get first 20 rows (excluding header)
      .map((row) => (row as unknown[])[columnIndex])
      .filter((val) => val !== null && val !== undefined);
  }, [csvPreviewData, selectedColumnForPreview]);

  // Validation: check if all required fields are mapped
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    
    // Check if there are duplicate mappings
    const destinations = Object.values(selectedDestinations).filter(Boolean);
    const duplicates = destinations.filter((item, index) => destinations.indexOf(item) !== index);
    
    if (duplicates.length > 0) {
      errors.push('Some destination fields are mapped multiple times');
    }

    return errors;
  }, [selectedDestinations]);

  // Check for unmapped required fields
  const unmappedRequiredFields = useMemo(() => {
    if (!mappingData?.required_fields) return [];
    
    const mappedFields = new Set(Object.values(selectedDestinations).filter(Boolean));
    return mappingData.required_fields.filter(field => !mappedFields.has(field));
  }, [mappingData?.required_fields, selectedDestinations]);

  const { missingRequiredFields, defaultedRequiredFields } = useMemo(() => {
    const missing: string[] = [];
    const defaulted: string[] = [];
    
    unmappedRequiredFields.forEach(field => {
      if (Object.prototype.hasOwnProperty.call(defaultValues, field)) {
        defaulted.push(field);
      } else {
        missing.push(field);
      }
    });
    
    return { missingRequiredFields: missing, defaultedRequiredFields: defaulted };
  }, [unmappedRequiredFields, defaultValues]);

  const handleDestinationChange = useCallback((columnName: string, value: string) => {
    setSelectedDestinations((prev) => ({
      ...prev,
      [columnName]: value === '__NONE__' ? '' : value,
    }));

    // Track if this was a manual change (different from auto-suggested)
    const originalMapping = mappingRows.find(row => row.columnName === columnName);
    if (originalMapping && value !== '__NONE__' && value !== originalMapping.suggestedDtoField) {
      setManuallyMappedColumns(prev => new Set(prev).add(columnName));
    } else if (value === '__NONE__' || (originalMapping && value === originalMapping.suggestedDtoField)) {
      // User reverted to auto-suggestion or unmapped it
      setManuallyMappedColumns(prev => {
        const newSet = new Set(prev);
        newSet.delete(columnName);
        return newSet;
      });
    }
  }, [mappingRows]);

  // Duplicate column handlers
  const handleAddDuplicateMapping = useCallback((sourceColumn: string) => {
    setDuplicateColumns(prev => ({
      ...prev,
      [sourceColumn]: [...(prev[sourceColumn] || []), ''],
    }));
  }, []);

  const handleRemoveDuplicateMapping = useCallback((sourceColumn: string, index: number) => {
    setDuplicateColumns(prev => {
      const current = prev[sourceColumn] || [];
      const updated = current.filter((_, i) => i !== index);
      if (updated.length === 0) {
        const { [sourceColumn]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [sourceColumn]: updated };
    });
  }, []);

  const handleDuplicateMappingChange = useCallback((sourceColumn: string, index: number, value: string) => {
    setDuplicateColumns(prev => {
      const current = prev[sourceColumn] || [];
      const updated = [...current];
      updated[index] = value === '__NONE__' ? '' : value;
      return { ...prev, [sourceColumn]: updated };
    });
  }, []);

  // Get all fields used by duplicate mappings (for disabling in dropdowns)
  const duplicateMappedFields = useMemo(() => {
    const fields = new Set<string>();
    Object.values(duplicateColumns).forEach(targets => {
      targets.forEach(field => {
        if (field) fields.add(field);
      });
    });
    return fields;
  }, [duplicateColumns]);

  // handleSkip removed


  const handleSaveMapping = async () => {
    if (!pendingId) return;

    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }

    // Check if required fields are mapped OR have a default value
    const missingRequired = unmappedRequiredFields.filter(field => {
      const hasDefault = !!defaultValues[field]?.trim();
      return !hasDefault;
    });

    if (missingRequired.length > 0) {
      toast.error(`Required fields must be mapped or have a default value: ${missingRequired.map(f => formatFieldPath(f)).join(', ')}`);
      return;
    }

    try {
      // Build mapping hints
      const mappingHints = {
        mappings: Object.entries(selectedDestinations)
          .filter(([, dtoFieldPath]) => dtoFieldPath)
          .map(([columnName, dtoFieldPath]) => ({
            column_name: columnName,
            dto_field_path: dtoFieldPath,
          })),
      };

      // Format default values as requested: {columnName: "", defaultValue: ""}
      const formattedDefaultValues = Object.entries(defaultValues).map(([field, value]) => ({
        columnName: field,
        defaultValue: value
      }));

      // Build duplicate columns array for the mutation
      // Format: { sourceColumn: string, targetDtoField: string }
      const formattedDuplicateColumns: ColumnDuplicateInput[] = [];
      Object.entries(duplicateColumns).forEach(([sourceColumn, targetFields]) => {
        targetFields.forEach(targetDtoField => {
          if (targetDtoField) {
            formattedDuplicateColumns.push({
              sourceColumn,
              targetDtoField,
            });
          }
        });
      });

      // Call remap mutation
      await remapMutation({
        variables: {
          pendingId,
          mappingHints,
          defaultValues: formattedDefaultValues,
          duplicateColumns: formattedDuplicateColumns.length > 0 ? formattedDuplicateColumns : null,
        },
      });

      toast.success('Column mappings saved.');
      toast.info('Processing entities for matching...');
      setIsRedirecting(true);
      startEntityProcessing();
    } catch (error) {
      console.error('Error saving mappings:', error);
      toast.error('Failed to save mappings');
      setIsRedirecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading column mappings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/flow-ai')}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Review
          </Button>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="w-6 h-6 text-[#5048E6]" />
              </div>
              <h1 className="text-3xl font-bold">Map Your Columns</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Connect your spreadsheet columns to the system fields. AI has suggested matches for you.
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Columns</p>
                  <p className="text-2xl font-bold">{mappingStats.total}</p>
                </div>
                <FileSpreadsheet className="w-8 h-8 text-[#0B84C7]" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">AI-Mapped</p>
                  <p className="text-2xl font-bold text-[#6BD194]">
                    {mappingStats.autoMapped}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-[#6BD194]" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Manual Mappings</p>
                  <p className="text-2xl font-bold text-[#0B84C7]">
                    {mappingStats.manuallyMapped}
                  </p>
                </div>
                <Edit3 className="w-8 h-8 text-[#0B84C7]" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unmapped</p>
                  <p className="text-2xl font-bold text-[#F0B972]">
                    {mappingStats.unmapped}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-[#F0B972]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mapping List */}
          <div className="lg:col-span-2">
            {/* Missing Required Fields Pane */}
            {missingRequiredFields.length > 0 && (
              <Card className="border-2 shadow-lg mb-6 border-[#F0B972]/50">
                <CardHeader className="border-b bg-[#F0B972]/10">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-[#F0B972]" />
                    <div>
                      <CardTitle className="text-base text-[#F0B972] dark:text-[#F0B972]">Missing Required Fields</CardTitle>
                      <div className="text-sm text-muted-foreground mt-1.5">
                        The fields below are required but haven&apos;t been mapped yet. You can either set a default value below or map them to a column in the table below.
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {missingRequiredFields.map((field) => (
                      <div key={field} className="p-4 hover:bg-muted/50 transition-all duration-300">
                        <div className="flex items-center justify-between">
                          {/* System Field */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 px-3 py-2 bg-[#5048E6]/5 dark:bg-[#5048E6]/10 rounded-lg border border-[#5048E6]/20">
                              <Database className="w-4 h-4 text-[#5048E6] flex-shrink-0" />
                              <span className="font-medium text-sm">
                                {formatFieldPath(field)}
                              </span>
                              <Badge variant="secondary" className="ml-auto text-xs bg-[#F0B972]/20 text-[#F0B972] border-[#F0B972]/30">
                                Required
                              </Badge>
                            </div>
                          </div>

                          {/* Button */}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleAddDefaultValue(field)}
                            className="gap-2"
                          >
                            <Edit3 className="w-3 h-3" />
                            Set Default Value
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Default Value Mappings Pane */}
            {defaultedRequiredFields.length > 0 && (
              <Card className="border-2 shadow-lg mb-6 border-[#6BD194]/50">
                <CardHeader className="border-b bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-5 h-5 text-[#0B84C7]" />
                      <span className="font-semibold text-sm">Default Value</span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    <div className="flex items-center gap-2">
                      <Database className="w-5 h-5 text-[#5048E6]" />
                      <span className="font-semibold text-sm">System Fields</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {defaultedRequiredFields.map((field) => {
                      const isFactoryName = field === 'factory.name' || field === 'details[].factory.name';
                      
                      return (
                        <div key={field} className="p-4 hover:bg-muted/50 transition-all duration-300">
                          <div className="flex items-center gap-4">
                            {/* Input */}
                            <div className="flex-1 min-w-0 relative">
                              {isFactoryName ? (
                                <Combobox
                                  value={defaultValues[field] || ''}
                                  onValueChange={(val) => handleDefaultValueChange(field, val)}
                                  options={factoryOptions}
                                  placeholder="Select factory..."
                                  searchPlaceholder="Search factories..."
                                  className="w-full"
                                  disabled={loadingFactories}
                                />
                              ) : (
                                <Input
                                  placeholder={`Enter default value for ${formatFieldPath(field)}`}
                                  value={defaultValues[field] || ''}
                                  onChange={(e) => handleDefaultValueChange(field, e.target.value)}
                                  className="w-full"
                                  autoFocus={!defaultValues[field]}
                                />
                              )}
                            </div>

                            {/* Arrow */}
                            <div className="flex-shrink-0">
                              <div className="p-2 rounded-full bg-[#6BD194]/20">
                                <ArrowRight className="w-5 h-5 text-[#6BD194]" />
                              </div>
                            </div>

                            {/* System Field */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 px-3 py-2 bg-[#5048E6]/5 dark:bg-[#5048E6]/10 rounded-lg border border-[#5048E6]/20">
                                <Database className="w-4 h-4 text-[#5048E6] flex-shrink-0" />
                                <span className="font-medium text-sm">
                                  {formatFieldPath(field)}
                                </span>
                                <Badge variant="secondary" className="ml-auto text-xs bg-[#F0B972]/20 text-[#F0B972] border-[#F0B972]/30">
                                  Required
                                </Badge>
                              </div>
                            </div>

                            {/* Remove Button */}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleRemoveDefaultValue(field)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-[#0B84C7]" />
                    <span className="font-semibold text-sm">Your Spreadsheet</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-[#5048E6]" />
                    <span className="font-semibold text-sm">System Fields</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {mappingRows.map((row) => {
                    const isSelected = selectedColumnForPreview === row.columnName;
                    const isMapped = selectedDestinations[row.columnName];
                    
                    return (
                      <div
                        key={row.columnName}
                        onClick={() => setSelectedColumnForPreview(row.columnName)}
                        className={cn(
                          "p-4 hover:bg-muted/50 transition-all duration-300 cursor-pointer",
                          isSelected && "bg-[#5048E6]/5 dark:bg-[#5048E6]/10 border-l-4 border-l-[#5048E6]"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          {/* Source Column */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0B84C7]/10 dark:bg-[#0B84C7]/20 rounded-lg border border-[#0B84C7]/30">
                                <FileSpreadsheet className="w-4 h-4 text-[#0B84C7] flex-shrink-0" />
                                <span className="font-mono text-sm font-medium">
                                  {row.columnName}
                                </span>
                              </div>
                              {row.isAutoMapped && (
                                <Badge variant="secondary" className="text-xs bg-[#6BD194]/20 text-[#6BD194] dark:bg-[#6BD194]/20 border-[#6BD194]/30 gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  {Math.round((row.confidence || 0) * 100)}% match
                                </Badge>
                              )}
                              {/* AI Reasoning Tooltip */}
                              {row.reasoning && (
                                <TooltipProvider delayDuration={200}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#5048E6]/10 hover:bg-[#5048E6]/20 cursor-help transition-colors">
                                        <Sparkles className="w-3 h-3 text-[#5048E6]" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent 
                                      side="right" 
                                      align="start"
                                      className="max-w-sm bg-card/95 backdrop-blur-sm border-[#5048E6]/20 shadow-xl"
                                    >
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <Sparkles className="w-4 h-4 text-[#5048E6]" />
                                          <p className="text-xs font-semibold text-[#5048E6]">
                                            AI Reasoning
                                          </p>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                          {row.reasoning}
                                        </p>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </div>

                          {/* Arrow */}
                          <div className="flex-shrink-0">
                            <div className={cn(
                              "p-2 rounded-full transition-colors",
                              isMapped ? "bg-[#6BD194]/20" : "bg-muted"
                            )}>
                              <ArrowRight className={cn(
                                "w-5 h-5",
                                isMapped ? "text-[#6BD194]" : "text-muted-foreground"
                              )} />
                            </div>
                          </div>

                          {/* Destination Field */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Combobox
                                value={selectedDestinations[row.columnName] || '__NONE__'}
                                onValueChange={(value) => handleDestinationChange(row.columnName, value)}
                                placeholder="Select system field..."
                                searchPlaceholder="Search fields..."
                                emptyText="No field found."
                                className={cn(
                                  "w-full h-auto min-h-[44px] border-2 transition-all",
                                  isMapped
                                    ? "border-[#5048E6]/30 bg-[#5048E6]/5"
                                    : "border-dashed"
                                )}
                                options={[
                                  {
                                    value: '__NONE__',
                                    label: "Don't map this column",
                                    disabled: false,
                                  },
                                  ...destinationOptions.map((opt) => {
                                    const isAlreadyMapped = mappedDestinations.has(opt.value) && selectedDestinations[row.columnName] !== opt.value;
                                    const isDuplicateMapped = duplicateMappedFields.has(opt.value);
                                    const isDefaulted = !!defaultValues[opt.value];
                                    return {
                                      value: opt.value,
                                      label: `${opt.label}${opt.isRequired ? ' ⭐' : ''}${isAlreadyMapped ? ' (already mapped)' : ''}${isDuplicateMapped ? ' (duplicate target)' : ''}${isDefaulted ? ' (has default value)' : ''}`,
                                      disabled: isAlreadyMapped || isDefaulted,
                                    };
                                  }),
                                ]}
                              />
                              {/* Add Duplicate Mapping Button - only show if primary mapping exists */}
                              {isMapped && (
                                <TooltipProvider delayDuration={200}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-[44px] w-[44px] flex-shrink-0 border-2 border-dashed border-[#5048E6]/30 hover:border-[#5048E6] hover:bg-[#5048E6]/10"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAddDuplicateMapping(row.columnName);
                                        }}
                                      >
                                        <Plus className="w-4 h-4 text-[#5048E6]" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      <p className="text-xs">Map to additional field</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            {/* Manual Mapping Indicator */}
                            {manuallyMappedColumns.has(row.columnName) && (
                              <Badge variant="outline" className="mt-2 bg-[#0B84C7]/10 text-[#0B84C7] border-[#0B84C7]/30">
                                <Edit3 className="w-3 h-3 mr-1" />
                                Manual
                              </Badge>
                            )}

                            {/* Duplicate Mappings for this column */}
                            {duplicateColumns[row.columnName]?.map((targetField, dupIndex) => (
                              <div key={dupIndex} className="flex items-center gap-2 mt-2">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Copy className="w-3 h-3" />
                                  <span>Also map to:</span>
                                </div>
                                <Combobox
                                  value={targetField || '__NONE__'}
                                  onValueChange={(value) => handleDuplicateMappingChange(row.columnName, dupIndex, value)}
                                  placeholder="Select additional field..."
                                  searchPlaceholder="Search fields..."
                                  emptyText="No field found."
                                  className="flex-1 h-9 border-2 border-dashed border-[#5048E6]/20"
                                  options={[
                                    {
                                      value: '__NONE__',
                                      label: "Remove this mapping",
                                      disabled: false,
                                    },
                                    ...destinationOptions.map((opt) => {
                                      const isPrimaryMapping = selectedDestinations[row.columnName] === opt.value;
                                      const isAlreadyMapped = mappedDestinations.has(opt.value) && !isPrimaryMapping;
                                      const isDuplicateMapped = duplicateMappedFields.has(opt.value) && targetField !== opt.value;
                                      const isDefaulted = !!defaultValues[opt.value];
                                      return {
                                        value: opt.value,
                                        label: `${opt.label}${opt.isRequired ? ' ⭐' : ''}${isPrimaryMapping ? ' (primary)' : ''}${isAlreadyMapped ? ' (already mapped)' : ''}${isDuplicateMapped ? ' (duplicate target)' : ''}${isDefaulted ? ' (has default value)' : ''}`,
                                        disabled: isPrimaryMapping || isAlreadyMapped || isDefaulted || isDuplicateMapped,
                                      };
                                    }),
                                  ]}
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveDuplicateMapping(row.columnName, dupIndex);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Validation & Actions */}
            <div className="mt-6 space-y-4">
              {validationErrors.length > 0 && (
                <Card className="border-2 border-destructive bg-destructive/5">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-destructive mb-2">Validation Errors</p>
                        <ul className="space-y-1">
                          {validationErrors.map((error, index) => (
                            <li key={index} className="text-sm text-destructive flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                              {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleSaveMapping}
                  disabled={validationErrors.length > 0 || isRemapping || (unmappedRequiredFields.length > 0 && unmappedRequiredFields.some(f => !defaultValues[f]))}
                  className="flex-1 h-12 text-base bg-[#5048E6] hover:bg-[#5048E6]/90"
                  size="lg"
                >
                  {isRemapping ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Save Mappings & Continue to Matching
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Preview Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-2 shadow-lg sticky top-6">
              <CardHeader className="border-b bg-[#5048E6]/5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#5048E6] rounded">
                    <FileSpreadsheet className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base">Sample Data</CardTitle>
                    {selectedColumnForPreview && (
                      <CardDescription className="truncate font-mono text-xs">
                        {selectedColumnForPreview}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingPreview ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : selectedColumnForPreview && previewValues.length > 0 ? (
                  <div className="p-4">
                    <div className="space-y-1 max-h-[calc(100vh-500px)] overflow-y-auto">
                      {previewValues.map((value, index) => (
                        <div
                          key={index}
                          className="px-3 py-2.5 bg-muted/50 hover:bg-muted rounded-lg text-sm font-mono border border-transparent hover:border-border transition-all"
                        >
                          {String(value)}
                        </div>
                      ))}
                    </div>
                    {previewValues.length === 20 && (
                      <p className="text-xs text-muted-foreground text-center pt-3 border-t mt-3">
                        Showing first 20 sample values
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground px-4">
                    <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-medium">No preview available</p>
                    <p className="text-xs mt-1">Click on a column to see sample data</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Loading Overlay for Redirecting */}
      {isRedirecting && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="border-2 shadow-2xl">
            <CardContent className="p-8">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <div className="text-center space-y-2">
                  <p className="text-lg font-semibold">{formatActionMessage(entityProgress?.action)}</p>
                  <p className="text-sm text-muted-foreground">You&apos;ll be redirected shortly</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function ColumnMappingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <ColumnMappingContent />
    </Suspense>
  );
}








