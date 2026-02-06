'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Eye,
  Briefcase,
  Trash2,
  Link2,
} from 'lucide-react';
import {
  getFieldMap,
  saveFieldMap,
  type FieldMapFieldResponse,
  type CategoryConfigResponse,
  type FieldCategory,
} from '@/lib/fieldMapGql';
import { fetchRepFirms } from '@/lib/sendMappingGql';
import { toast } from 'sonner';

interface RepFirm {
  id: string;
  name: string;
  domain?: string;
}

// Import shared mapping components
import {
  LoadingSpinner,
  StatusBanner,
  InfoBanner,
  RequiredFieldsStatus,
  MappedIndicator,
  FieldNameCell,
  SectionHeader,
  SampleFileUpload,
  MappingLegend,
  EntityOverrideBanner,
  SaveConfigurationButton,
  AddCustomColumnRow,
  QuantityPricingInfoBox,
  NoDataAvailableState,
  FieldMappingRow,
  VisibilityToggleCell,
} from '@/components/mapping';

interface CustomColumn {
  id: string;
  name: string;
  apiName: string;
  description: string;
  dataType: 'string' | 'date' | 'decimal' | 'integer';
}

export default function ManufacturerSendMappingPage() {
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Access token
  const [accessToken, setAccessToken] = useState<string | undefined>(undefined);

  // Rep firms state
  const [repFirmsList, setRepFirmsList] = useState<RepFirm[]>([]);

  // Rep firm selection state
  const [selectedRepFirm, setSelectedRepFirm] = useState<string>('default');

  // Store field definitions and category configs from backend
  const [fieldDefinitions, setFieldDefinitions] = useState<FieldMapFieldResponse[]>([]);
  const [categoryConfigs, setCategoryConfigs] = useState<CategoryConfigResponse[]>([]);

  // Track which rep firms have custom overrides
  const [repFirmOverrides, setRepFirmOverrides] = useState<Record<string, {
    fieldMappings?: Record<string, string>;
    visibility?: Record<string, boolean>;
  }>>({});

  // Visibility state (what reps can see)
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});

  // Custom columns
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);
  const [showAddCustomColumn, setShowAddCustomColumn] = useState(false);
  const [newCustomColumn, setNewCustomColumn] = useState<Partial<CustomColumn>>({
    name: '',
    apiName: '',
    description: '',
    dataType: 'string',
  });

  // Field mapping state (initialized empty, populated from backend)
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});

  // Sample file columns (populated from backend organizationFieldNames or empty)
  const [sampleFileColumns, setSampleFileColumns] = useState<string[]>([]);
  const [showColumnDropdown, setShowColumnDropdown] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch access token on mount
  useEffect(() => {
    async function fetchToken() {
      try {
        const res = await fetch('/api/auth/token');
        if (res.ok) {
          const body = await res.json();
          setAccessToken(body?.accessToken);
        }
      } catch (e) {
        console.debug('Failed to fetch access token:', e);
      }
    }
    fetchToken();
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    if (!accessToken) return; // Wait for token

    const controller = new AbortController();

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch field map from backend (POS type for sending data)
        const posMap = await getFieldMap('POS', undefined, accessToken);

        if (controller.signal.aborted) return;

        // Debug logging
        console.log('POS Map response:', posMap);

        // Check if backend returned data
        if (!posMap || !posMap.fields || posMap.fields.length === 0) {
          console.error('Backend returned null or empty field map for POS');
          // Don't set error - just leave empty state for "No Data Available" UI
          setFieldDefinitions([]);
          setCategoryConfigs([]);
          return;
        }

        // Store field definitions and category configs from backend
        setFieldDefinitions(posMap.fields);
        setCategoryConfigs(posMap.categories || []);

        // Set field mappings from backend
        const mappingsRecord: Record<string, string> = {};
        const columnNames: string[] = [];
        posMap.fields.forEach(f => {
          if (f.organizationFieldName) {
            mappingsRecord[f.standardFieldKey] = f.organizationFieldName;
            // Collect unique organization field names for column suggestions
            if (!columnNames.includes(f.organizationFieldName)) {
              columnNames.push(f.organizationFieldName);
            }
          }
        });
        setFieldMappings(mappingsRecord);
        setSampleFileColumns(columnNames);

        // Set visibility from backend (rep visibility)
        const visibilityRecord: Record<string, boolean> = {};
        posMap.fields.forEach(f => {
          if (f.rep !== undefined) {
            visibilityRecord[f.standardFieldKey] = f.rep;
          }
        });
        setVisibility(visibilityRecord);

        // Fetch rep firms from backend
        try {
          const reps = await fetchRepFirms(accessToken);
          setRepFirmsList(reps);
        } catch (error) {
          console.error('Failed to fetch rep firms:', error);
          setRepFirmsList([]);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(`Failed to load data: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => controller.abort();
  }, [accessToken]);

  // Get effective field mappings
  const getEffectiveFieldMappings = (): Record<string, string> => {
    if (selectedRepFirm === 'default') return fieldMappings;

    const override = repFirmOverrides[selectedRepFirm];
    if (!override?.fieldMappings) return fieldMappings;

    return { ...fieldMappings, ...override.fieldMappings };
  };

  // Get effective visibility settings
  const getEffectiveVisibility = (): Record<string, boolean> => {
    if (selectedRepFirm === 'default') return visibility;

    const override = repFirmOverrides[selectedRepFirm];
    if (!override?.visibility) return visibility;

    return { ...visibility, ...override.visibility };
  };

  const currentFieldMappings = getEffectiveFieldMappings();
  const effectiveVisibility = getEffectiveVisibility();

  // Update field mapping
  const setCurrentFieldMappings = (updater: (prev: Record<string, string>) => Record<string, string>) => {
    if (selectedRepFirm === 'default') {
      setFieldMappings(updater);
    } else {
      setRepFirmOverrides(prev => {
        const currentOverride = prev[selectedRepFirm] || {};
        const currentMappings = currentOverride.fieldMappings || fieldMappings;
        const newMappings = updater(currentMappings);

        return {
          ...prev,
          [selectedRepFirm]: {
            ...currentOverride,
            fieldMappings: newMappings,
          },
        };
      });
    }
  };

  // Check if a category has at least one mapped field (for ONE_REQUIRED status)
  const isCategorySatisfied = useCallback((category: FieldCategory): boolean => {
    const categoryFields = fieldDefinitions.filter(f => f.category === category && f.status === 'ONE_REQUIRED');
    return categoryFields.some(f => currentFieldMappings[f.standardFieldKey]?.length > 0);
  }, [fieldDefinitions, currentFieldMappings]);

  // Get fields by category
  const getFieldsByCategory = useCallback((category: FieldCategory): FieldMapFieldResponse[] => {
    return fieldDefinitions
      .filter(f => f.category === category)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [fieldDefinitions]);

  // Get sorted categories from backend
  const sortedCategories = useMemo(() =>
    categoryConfigs
      .filter(c => c.visible)
      .sort((a, b) => a.order - b.order),
    [categoryConfigs]
  );

  const addCustomColumn = useCallback(() => {
    if (!newCustomColumn.name || !newCustomColumn.apiName) return;

    const column: CustomColumn = {
      id: `custom_${Date.now()}`,
      name: newCustomColumn.name || '',
      apiName: `custom_${newCustomColumn.apiName || ''}`,
      description: newCustomColumn.description || '',
      dataType: newCustomColumn.dataType || 'string',
    };

    setCustomColumns(prev => [...prev, column]);
    setNewCustomColumn({ name: '', apiName: '', description: '', dataType: 'string' });
    setShowAddCustomColumn(false);
  }, [newCustomColumn]);

  const removeCustomColumn = useCallback((id: string) => {
    setCustomColumns(prev => prev.filter(c => c.id !== id));
  }, []);

  const toggleVisibility = useCallback((field: string) => {
    if (selectedRepFirm === 'default') {
      setVisibility(prev => ({
        ...prev,
        [field]: prev[field] === false ? true : false,
      }));
    } else {
      setRepFirmOverrides(prev => {
        const currentOverride = prev[selectedRepFirm] || {};
        const currentVisibility = currentOverride.visibility || { ...visibility };
        const currentValue = currentVisibility[field] ?? visibility[field] ?? true;
        return {
          ...prev,
          [selectedRepFirm]: {
            ...currentOverride,
            visibility: {
              ...currentVisibility,
              [field]: !currentValue,
            },
          },
        };
      });
    }
  }, [selectedRepFirm, visibility]);

  const updateFieldMapping = useCallback((apiName: string, yourField: string) => {
    setCurrentFieldMappings(prev => ({
      ...prev,
      [apiName]: yourField,
    }));
    setShowColumnDropdown(null);
    setSearchTerm('');
  }, [setCurrentFieldMappings]);

  // Handle save configuration
  const handleSaveConfiguration = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Check if field definitions are loaded
      if (!fieldDefinitions || fieldDefinitions.length === 0) {
        toast.error('No field definitions loaded. Please refresh the page.');
        setIsSaving(false);
        return;
      }

      // Build fields array - only send editable fields
      // For default fields: only send standardFieldKey, organizationFieldName, and rep
      // For custom fields: send all fields including standardFieldName, fieldType, category, status
      const fields = fieldDefinitions.map(fieldDef => {
        const baseField = {
          standardFieldKey: fieldDef.standardFieldKey,
          organizationFieldName: fieldMappings[fieldDef.standardFieldKey] || undefined,
          rep: visibility[fieldDef.standardFieldKey],
        };

        // Only include structural fields for custom (non-default) fields
        if (!fieldDef.isDefault) {
          return {
            ...baseField,
            standardFieldName: fieldDef.standardFieldName,
            fieldType: fieldDef.fieldType,
            category: fieldDef.category,
            status: fieldDef.status,
          };
        }

        return baseField;
      });

      await saveFieldMap({ mapType: 'POS', fields }, accessToken);

      toast.success('Configuration saved successfully');
      setSuccessMessage('Configuration saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errorMessage = `Failed to save configuration: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMessage);
      toast.error('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  }, [fieldMappings, visibility, accessToken, fieldDefinitions]);

  // Get requirement badge based on backend status
  const getRequirementBadge = (field: FieldMapFieldResponse) => {
    switch (field.status) {
      case 'REQUIRED':
        return <Badge variant="default" className="text-xs">Required</Badge>;
      case 'HIGHLY_SUGGESTED':
        return <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">Highly Suggested</Badge>;
      case 'ONE_REQUIRED':
        // Check if category is satisfied
        const categoryIsSatisfied = isCategorySatisfied(field.category);
        if (categoryIsSatisfied && !currentFieldMappings[field.standardFieldKey]) {
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">Highly Suggested</Badge>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-sm">Optional because another field in this group is already mapped.</p>
              </TooltipContent>
            </Tooltip>
          );
        }
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="default" className="text-xs">One Required</Badge>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="text-sm">At least one field in this category is required.</p>
            </TooltipContent>
          </Tooltip>
        );
      case 'CAN_CALCULATE':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Can Calculate</Badge>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="text-sm">This field can be calculated from other mapped fields.</p>
            </TooltipContent>
          </Tooltip>
        );
      case 'OPTIONAL':
      default:
        return <Badge variant="outline" className="text-xs">Optional</Badge>;
    }
  };

  const shouldShowVisibilityToggle = (field: FieldMapFieldResponse) => {
    return field.status !== 'REQUIRED';
  };

  // Render field row
  const renderFieldRow = (field: FieldMapFieldResponse) => {
    const currentMapping = currentFieldMappings[field.standardFieldKey] || '';
    const isDropdownOpen = showColumnDropdown === field.standardFieldKey;
    const isVisible = field.status === 'REQUIRED' || effectiveVisibility[field.standardFieldKey] !== false;
    const isGroupField = field.status === 'ONE_REQUIRED';

    return (
      <FieldMappingRow
        key={field.standardFieldKey}
        fieldKey={field.standardFieldKey}
        fieldName={field.standardFieldName}
        fieldDescription={field.standardFieldNameDescription || ''}
        isPreferred={field.preferred}
        currentMapping={currentMapping}
        searchTerm={searchTerm}
        isDropdownOpen={isDropdownOpen}
        isGroupField={isGroupField}
        isRequired={field.status === 'REQUIRED'}
        isGroupUnsatisfied={isGroupField && !isCategorySatisfied(field.category)}
        columns={sampleFileColumns}
        onInputChange={(value: string) => {
          if (isDropdownOpen) {
            setSearchTerm(value);
          } else {
            updateFieldMapping(field.standardFieldKey, value);
          }
        }}
        onFocus={() => {
          setShowColumnDropdown(field.standardFieldKey);
          setSearchTerm(currentMapping);
        }}
        onSelect={(value: string) => updateFieldMapping(field.standardFieldKey, value)}
        onClose={() => {
          setShowColumnDropdown(null);
          setSearchTerm('');
        }}
        renderRequirementBadge={() => getRequirementBadge(field)}
        renderVisibilityColumns={() => (
          <VisibilityToggleCell
            showToggle={shouldShowVisibilityToggle(field)}
            isVisible={isVisible}
            onToggle={() => toggleVisibility(field.standardFieldKey)}
          />
        )}
      />
    );
  };

  // Get unique categories that have ONE_REQUIRED fields
  const getCategoriesWithOneRequired = useCallback((): FieldCategory[] => {
    const categories = new Set<FieldCategory>();
    fieldDefinitions.forEach(f => {
      if (f.status === 'ONE_REQUIRED') categories.add(f.category);
    });
    return Array.from(categories);
  }, [fieldDefinitions]);

  // Prepare required fields status items
  const requiredFieldsStatusItems = useMemo(() => {
    const requiredFields = fieldDefinitions.filter(f => f.status === 'REQUIRED');
    const oneRequiredCategories = getCategoriesWithOneRequired();

    const fieldItems = requiredFields.map(field => ({
      id: field.standardFieldKey,
      label: field.standardFieldName,
      isSatisfied: !!(currentFieldMappings[field.standardFieldKey]?.length > 0),
    }));

    const categoryItems = oneRequiredCategories.map(category => {
      const categoryConfig = categoryConfigs.find(c => c.category === category);
      return {
        id: category,
        label: categoryConfig?.name || category,
        isSatisfied: isCategorySatisfied(category),
        isGroup: true,
      };
    });

    return [...fieldItems, ...categoryItems];
  }, [fieldDefinitions, currentFieldMappings, categoryConfigs, getCategoriesWithOneRequired, isCategorySatisfied]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Sending Data Mapping</h1>
          <p className="text-muted-foreground">Map your outgoing field names for POS data sent to rep firms</p>
        </div>

        {/* Error Message */}
        {error && (
          <StatusBanner variant="error" message={error} />
        )}

        {/* Success Message */}
        {successMessage && (
          <StatusBanner variant="success" message={successMessage} />
        )}

        {/* Loading State */}
        {isLoading ? (
          <LoadingSpinner message="Loading configuration..." />
        ) : fieldDefinitions.length === 0 ? (
          /* No Data Available State */
          <NoDataAvailableState />
        ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Outgoing Field Configuration</CardTitle>
                <CardDescription>
                  Map your column names to standard fields and control what rep firms can see in their data.
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  <Select value={selectedRepFirm} onValueChange={setSelectedRepFirm}>
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Select rep firm" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">
                        <div className="flex items-center gap-2">
                          <span>Default Configuration</span>
                        </div>
                      </SelectItem>
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-t mt-1 pt-2">
                        Rep Firm-Specific
                      </div>
                      {repFirmsList.map((rep) => (
                        <SelectItem key={rep.id} value={rep.id}>
                          <div className="flex items-center gap-2">
                            <span>{rep.name}</span>
                            {repFirmOverrides[rep.id] && (
                              <Badge variant="secondary" className="text-xs h-5">Custom</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {selectedRepFirm !== 'default' && (
              <EntityOverrideBanner
                entityName={repFirmsList.find(r => r.id === selectedRepFirm)?.name || ''}
                hasOverride={!!repFirmOverrides[selectedRepFirm]}
                onResetOverride={() => {
                  const newOverrides = { ...repFirmOverrides };
                  delete newOverrides[selectedRepFirm];
                  setRepFirmOverrides(newOverrides);
                }}
              />
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Context info */}
            <InfoBanner
              title="Outgoing Data Mapping"
              description="Configure how your internal field names map to the standard fields when sending POS data to rep firms. This ensures consistent data format across all your rep relationships."
            />

            {/* Upload sample file */}
            <SampleFileUpload columns={sampleFileColumns} maxDisplayColumns={12} />

            {/* Required Fields Status */}
            <RequiredFieldsStatus items={requiredFieldsStatusItems} />

            {/* Field mapping sections */}
            <div className="space-y-6">
              {sortedCategories.map((categoryConfig) => {
                const categoryFields = getFieldsByCategory(categoryConfig.category);
                if (categoryFields.length === 0) return null;

                return (
                  <div key={categoryConfig.category} className="border rounded-lg overflow-hidden">
                    <SectionHeader title={categoryConfig.name} description={categoryConfig.description} />

                    {/* Category-specific info for QUANTITY_PRICING or QUANTITY_COST */}
                    {(categoryConfig.category === 'QUANTITY_PRICING' || categoryConfig.category === 'QUANTITY_COST') && (
                      <QuantityPricingInfoBox showFormula={false} />
                    )}

                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium">Standard Field</th>
                          <th className="px-4 py-2 text-left text-xs font-medium w-48">Your Field</th>
                          <th className="px-4 py-2 text-center text-xs font-medium w-14">
                            <Link2 className="w-3 h-3 mx-auto" />
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-medium w-28">Status</th>
                          <th className="px-4 py-2 text-center text-xs font-medium w-20">
                            <div className="flex items-center justify-center gap-1">
                              <Eye className="w-3 h-3" />
                              Visible
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {categoryFields.map((field) => renderFieldRow(field))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>

            {/* Custom columns section */}
            <div className="border rounded-lg overflow-hidden">
              <SectionHeader 
                title="Custom Columns" 
                description="Add additional fields beyond the standard set" 
              />
              <table className="w-full">
                <tbody className="divide-y">
                  {customColumns.map((column) => {
                    const isVisible = effectiveVisibility[column.apiName] !== false;
                    const currentMapping = currentFieldMappings[column.apiName] || '';
                    const isMapped = currentMapping.length > 0;

                    return (
                      <tr key={column.id} className="hover:bg-muted/50 bg-blue-50/30">
                        <td className="px-4 py-3">
                          <FieldNameCell 
                            name={column.name} 
                            description={column.description || ''} 
                            isCustom 
                          />
                        </td>
                        <td className="px-4 py-3 w-48">
                          <input
                            type="text"
                            value={currentMapping}
                            onChange={(e) => setCurrentFieldMappings(prev => ({
                              ...prev,
                              [column.apiName]: e.target.value,
                            }))}
                            placeholder="Map to your field..."
                            className="w-full border rounded px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-4 py-3 text-center w-14">
                          <MappedIndicator isMapped={isMapped} />
                        </td>
                        <td className="px-4 py-3 text-center w-28">
                          <Badge variant="outline" className="text-xs">Optional</Badge>
                        </td>
                        <td className="px-4 py-3 w-20">
                          <div className="flex items-center justify-center gap-2">
                            <Switch
                              checked={isVisible}
                              onCheckedChange={() => toggleVisibility(column.apiName)}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCustomColumn(column.id)}
                              className="text-destructive hover:text-destructive h-6 w-6 p-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Add column row */}
                  {showAddCustomColumn ? (
                    <tr className="bg-muted/30">
                      <td className="px-4 py-2">
                        <Input
                          placeholder="Field name"
                          value={newCustomColumn.name || ''}
                          onChange={(e) => setNewCustomColumn({ ...newCustomColumn, name: e.target.value, apiName: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                          className="h-8 text-sm"
                        />
                      </td>
                      <td className="px-4 py-2 w-48">
                        <Input
                          placeholder="Your field name"
                          value={newCustomColumn.description || ''}
                          onChange={(e) => setNewCustomColumn({ ...newCustomColumn, description: e.target.value })}
                          className="h-8 text-sm"
                        />
                      </td>
                      <td className="px-4 py-2 w-14"></td>
                      <td className="px-4 py-2 w-28">
                        <select
                          value={newCustomColumn.dataType}
                          onChange={(e) => setNewCustomColumn({ ...newCustomColumn, dataType: e.target.value as 'string' | 'date' | 'decimal' | 'integer' })}
                          className="w-full border rounded px-2 py-1.5 text-sm bg-background"
                        >
                          <option value="string">Text</option>
                          <option value="date">Date</option>
                          <option value="decimal">Decimal</option>
                          <option value="integer">Integer</option>
                        </select>
                      </td>
                      <td className="px-4 py-2 w-20">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            onClick={addCustomColumn}
                            disabled={!newCustomColumn.name}
                            className="h-7"
                          >
                            Add
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowAddCustomColumn(false);
                              setNewCustomColumn({ name: '', apiName: '', description: '', dataType: 'string' });
                            }}
                            className="h-7"
                          >
                            Cancel
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <AddCustomColumnRow
                      onClick={() => setShowAddCustomColumn(true)}
                      colSpan={5}
                    />
                  )}
                </tbody>
              </table>
            </div>

            {/* Info notes */}
            <MappingLegend />

            {/* Action buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <SaveConfigurationButton
                onClick={handleSaveConfiguration}
                isSaving={isSaving}
                isLoading={isLoading}
              />
              <Button variant="outline" disabled={isLoading}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
