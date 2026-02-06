"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
  Factory,
  Trash2,
  Link2,
  Eye,
  Building2,
} from 'lucide-react';
import { getFieldMap, saveFieldMap, type FieldMapType } from '@/lib/fieldMapGql';
import { toast } from 'sonner';

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
  PosPotTabs,
  MappingLegend,
  EntityOverrideBanner,
  SaveConfigurationButton,
  AddCustomColumnRow,
  QuantityPricingInfoBox,
  FieldMappingRow,
  VisibilityToggleCell,
} from '@/components/mapping';

// Import types from fieldMapGql
import type { FieldMapFieldResponse, CategoryConfigResponse } from '@/lib/fieldMapGql';

// Use backend types directly
type FieldDefinition = FieldMapFieldResponse;
type CategoryConfig = CategoryConfigResponse;

interface CustomColumn {
  id: string;
  name: string;
  apiName: string;
  description: string;
  dataType: 'string' | 'date' | 'decimal' | 'integer';
}

// Manufacturer type for the dropdown
interface Manufacturer {
  id: string;
  name: string;
}

// Runtime state for POS/POT definitions, sections, system fields and manufacturers
// These are fetched from GraphQL on mount; the SDK will fall back to built-in mocks if the server is unavailable.

export default function MappingPage() {
  // Loading and error state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  // Store full field definitions from backend
  const [posFieldDefinitionsFromBackend, setPosFieldDefinitionsFromBackend] = useState<any[]>([]);
  const [potFieldDefinitionsFromBackend, setPotFieldDefinitionsFromBackend] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'pos' | 'pot'>('pos');

  // Manufacturer selection state
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('default');

  // Track which manufacturers have custom overrides
  const [manufacturerOverrides, setManufacturerOverrides] = useState<Record<string, {
    posFieldMappings?: Record<string, string>;
    potFieldMappings?: Record<string, string>;
    manufacturerVisibility?: Record<string, boolean>;
    repVisibility?: Record<string, boolean>;
  }>>({});

  // POS-specific state
  const [shippingSameAsSelling, setShippingSameAsSelling] = useState(false);

  // POT-specific state
  const [billToSameAsSelling, setBillToSameAsSelling] = useState(false);

  // Shared visibility state (default)
  const [manufacturerVisibility, setManufacturerVisibility] = useState<Record<string, boolean>>({});
  const [repVisibility, setRepVisibility] = useState<Record<string, boolean>>({});

  // Custom columns state (per tab)
  const [posCustomColumns, setPosCustomColumns] = useState<CustomColumn[]>([]);
  const [potCustomColumns, setPotCustomColumns] = useState<CustomColumn[]>([]);
  const [showAddCustomColumn, setShowAddCustomColumn] = useState(false);
  const [newCustomColumn, setNewCustomColumn] = useState<Partial<CustomColumn>>({
    name: '',
    apiName: '',
    description: '',
    dataType: 'string',
  });

  // POS Field mapping state - populated from backend
  const [posFieldMappings, setPosFieldMappings] = useState<Record<string, string>>({});

  // POT Field mapping state - populated from backend
  const [potFieldMappings, setPotFieldMappings] = useState<Record<string, string>>({});

  const [sampleFileColumns, setSampleFileColumns] = useState<string[]>([]);
  const [showColumnDropdown, setShowColumnDropdown] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Runtime data fetched from GraphQL (SDK falls back to mocks)
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [fieldDefinitions, setFieldDefinitions] = useState<{ pos: FieldDefinition[]; pot: FieldDefinition[] }>({ pos: [], pot: [] });
  const [categoryConfigs, setCategoryConfigs] = useState<{ pos: CategoryConfig[]; pot: CategoryConfig[] }>({ pos: [], pot: [] });

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

  // Single data fetching effect - loads all config from GraphQL backend
  useEffect(() => {
    if (!accessToken) return;

    const abortController = new AbortController();

    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        const [posMap, potMap] = await Promise.all([
          getFieldMap('POS', undefined, accessToken),
          getFieldMap('POT', undefined, accessToken),
        ]);

        if (abortController.signal.aborted) return;

        // Store field definitions directly from backend
        const posFields: FieldDefinition[] = posMap?.fields || [];
        const potFields: FieldDefinition[] = potMap?.fields || [];

        setPosFieldDefinitionsFromBackend(posFields);
        setPotFieldDefinitionsFromBackend(potFields);
        setFieldDefinitions({ pos: posFields, pot: potFields });

        // Store category configs directly from backend
        const posCategories: CategoryConfig[] = posMap?.categories || [];
        const potCategories: CategoryConfig[] = potMap?.categories || [];
        setCategoryConfigs({ pos: posCategories, pot: potCategories });

        // Set field mappings and visibility from backend
        const posMappings: Record<string, string> = {};
        const posManuVisibility: Record<string, boolean> = {};
        const posRepVisibility: Record<string, boolean> = {};
        if (posMap?.fields) {
          posMap.fields.forEach(f => {
            if (f.organizationFieldName) {
              posMappings[f.standardFieldKey] = f.organizationFieldName;
            }
            // Set visibility from backend (null/undefined = true, false = false)
            if (f.manufacturer !== null && f.manufacturer !== undefined) {
              posManuVisibility[f.standardFieldKey] = f.manufacturer;
            }
            if (f.rep !== null && f.rep !== undefined) {
              posRepVisibility[f.standardFieldKey] = f.rep;
            }
          });
        }
        setPosFieldMappings(posMappings);

        const potMappings: Record<string, string> = {};
        const potManuVisibility: Record<string, boolean> = {};
        const potRepVisibility: Record<string, boolean> = {};
        if (potMap?.fields) {
          potMap.fields.forEach(f => {
            if (f.organizationFieldName) {
              potMappings[f.standardFieldKey] = f.organizationFieldName;
            }
            // Set visibility from backend (null/undefined = true, false = false)
            if (f.manufacturer !== null && f.manufacturer !== undefined) {
              potManuVisibility[f.standardFieldKey] = f.manufacturer;
            }
            if (f.rep !== null && f.rep !== undefined) {
              potRepVisibility[f.standardFieldKey] = f.rep;
            }
          });
        }
        
        setPotFieldMappings(potMappings);

        // Merge POS and POT visibility settings
        setManufacturerVisibility({ ...posManuVisibility, ...potManuVisibility });
        setRepVisibility({ ...posRepVisibility, ...potRepVisibility });

        // TODO: Fetch manufacturers from connectionSearch
        setManufacturers([]);
      } catch (e) {
        if (!abortController.signal.aborted) {
          console.error('Failed to load field mapping configuration:', e);
          setError('Failed to load configuration from backend.');
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      abortController.abort();
    };
  }, [accessToken]);

  // Get current field definitions based on active tab
  const currentFieldDefinitions = activeTab === 'pos' ? fieldDefinitions.pos : fieldDefinitions.pot;
  const currentCategoryConfigs = activeTab === 'pos' ? categoryConfigs.pos : categoryConfigs.pot;

  // Build group config from categories that have ONE_REQUIRED or CAN_CALCULATE status fields
  const currentGroupConfig: Record<string, { label: string; description: string }> = useMemo(() => {
    const map: Record<string, { label: string; description: string }> = {};
    currentFieldDefinitions.forEach(f => {
      if ((f.status === 'ONE_REQUIRED' || f.status === 'CAN_CALCULATE') && !map[f.category]) {
        const catConfig = currentCategoryConfigs.find(c => c.category === f.category);
        map[f.category] = {
          label: catConfig?.name || f.category,
          description: catConfig?.description || ''
        };
      }
    });
    return map;
  }, [currentFieldDefinitions, currentCategoryConfigs]);

  const currentCustomColumns = activeTab === 'pos' ? posCustomColumns : potCustomColumns;
  const setCurrentCustomColumns = activeTab === 'pos' ? setPosCustomColumns : setPotCustomColumns;

  // Get effective field mappings (default or manufacturer override)
  const getEffectiveFieldMappings = (): Record<string, string> => {
    const defaultMappings = activeTab === 'pos' ? posFieldMappings : potFieldMappings;
    if (selectedManufacturer === 'default') return defaultMappings;

    const override = manufacturerOverrides[selectedManufacturer];
    if (!override) return defaultMappings;

    const overrideMappings = activeTab === 'pos' ? override.posFieldMappings : override.potFieldMappings;
    return overrideMappings ? { ...defaultMappings, ...overrideMappings } : defaultMappings;
  };

  // Get effective visibility settings
  const getEffectiveManufacturerVisibility = (): Record<string, boolean> => {
    if (selectedManufacturer === 'default') return manufacturerVisibility;

    const override = manufacturerOverrides[selectedManufacturer];
    if (!override?.manufacturerVisibility) return manufacturerVisibility;

    return { ...manufacturerVisibility, ...override.manufacturerVisibility };
  };

  const getEffectiveRepVisibility = (): Record<string, boolean> => {
    if (selectedManufacturer === 'default') return repVisibility;

    const override = manufacturerOverrides[selectedManufacturer];
    if (!override?.repVisibility) return repVisibility;

    return { ...repVisibility, ...override.repVisibility };
  };

  const currentFieldMappings = getEffectiveFieldMappings();
  const effectiveManufacturerVisibility = getEffectiveManufacturerVisibility();
  const effectiveRepVisibility = getEffectiveRepVisibility();

  // Update field mapping (handles both default and manufacturer-specific)
  const setCurrentFieldMappings = (updater: (prev: Record<string, string>) => Record<string, string>) => {
    if (selectedManufacturer === 'default') {
      if (activeTab === 'pos') {
        setPosFieldMappings(updater);
      } else {
        setPotFieldMappings(updater);
      }
    } else {
      // Create or update manufacturer override
      setManufacturerOverrides(prev => {
        const currentOverride = prev[selectedManufacturer] || {};
        const defaultMappings = activeTab === 'pos' ? posFieldMappings : potFieldMappings;
        const currentMappings = activeTab === 'pos'
          ? (currentOverride.posFieldMappings || defaultMappings)
          : (currentOverride.potFieldMappings || defaultMappings);
        const newMappings = updater(currentMappings);

        return {
          ...prev,
          [selectedManufacturer]: {
            ...currentOverride,
            [activeTab === 'pos' ? 'posFieldMappings' : 'potFieldMappings']: newMappings,
          },
        };
      });
    }
  };

  // Check if a group requirement is satisfied (group = category for ONE_REQUIRED/CAN_CALCULATE)
  const isGroupSatisfied = (category: string): boolean => {
    // Special logic for QUANTITY_PRICING category:
    // Extended Net Price alone satisfies it, OR both Quantity AND Unit Cost together satisfy it
    if (category === 'QUANTITY_PRICING') {
      const hasExtendedPrice = (currentFieldMappings['extended_net_price'] || '').length > 0;
      const hasQuantity = (currentFieldMappings['quantity_units_sold'] || '').length > 0;
      const hasUnitCost = (currentFieldMappings['distributor_unit_cost'] || '').length > 0;
      return hasExtendedPrice || (hasQuantity && hasUnitCost);
    }

    // Default: at least one field in the group (category) is mapped
    const groupFields = currentFieldDefinitions.filter(f =>
      f.category === category && (f.status === 'ONE_REQUIRED' || f.status === 'CAN_CALCULATE')
    );
    return groupFields.some(f => (currentFieldMappings[f.standardFieldKey] || '').length > 0);
  };

  // Get fields by category
  const getFieldsByCategory = (category: string) => {
    return currentFieldDefinitions
      .filter(f => f.category === category)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  };

  // Sorted categories based on order
  const sortedCategories = useMemo(() =>
    [...currentCategoryConfigs]
      .filter(cat => cat.visible)
      .sort((a, b) => a.order - b.order),
    [currentCategoryConfigs]
  );

  const addCustomColumn = useCallback(() => {
    if (!newCustomColumn.name || !newCustomColumn.apiName) return;

    const prefix = activeTab === 'pot' ? 'pot_custom_' : 'custom_';
    const column: CustomColumn = {
      id: `${prefix}${Date.now()}`,
      name: newCustomColumn.name || '',
      apiName: `${prefix}${newCustomColumn.apiName || ''}`,
      description: newCustomColumn.description || '',
      dataType: newCustomColumn.dataType || 'string',
    };

    setCurrentCustomColumns([...currentCustomColumns, column]);
    setNewCustomColumn({ name: '', apiName: '', description: '', dataType: 'string' });
    setShowAddCustomColumn(false);
  }, [newCustomColumn, activeTab, currentCustomColumns, setCurrentCustomColumns]);

  const removeCustomColumn = useCallback((id: string) => {
    setCurrentCustomColumns(currentCustomColumns.filter(c => c.id !== id));
  }, [currentCustomColumns, setCurrentCustomColumns]);

  const toggleManufacturerVisibility = useCallback((field: string) => {
    if (selectedManufacturer === 'default') {
      setManufacturerVisibility(prev => ({
        ...prev,
        [field]: prev[field] === false ? true : false,
      }));
    } else {
      setManufacturerOverrides(prev => {
        const currentOverride = prev[selectedManufacturer] || {};
        const currentVisibility = currentOverride.manufacturerVisibility || { ...manufacturerVisibility };
        const currentValue = currentVisibility[field] ?? manufacturerVisibility[field] ?? true;
        return {
          ...prev,
          [selectedManufacturer]: {
            ...currentOverride,
            manufacturerVisibility: {
              ...currentVisibility,
              [field]: !currentValue,
            },
          },
        };
      });
    }
  }, [selectedManufacturer, manufacturerVisibility]);

  const toggleRepVisibility = useCallback((field: string) => {
    if (selectedManufacturer === 'default') {
      setRepVisibility(prev => ({
        ...prev,
        [field]: prev[field] === false ? true : false,
      }));
    } else {
      setManufacturerOverrides(prev => {
        const currentOverride = prev[selectedManufacturer] || {};
        const currentVisibility = currentOverride.repVisibility || { ...repVisibility };
        const currentValue = currentVisibility[field] ?? repVisibility[field] ?? true;
        return {
          ...prev,
          [selectedManufacturer]: {
            ...currentOverride,
            repVisibility: {
              ...currentVisibility,
              [field]: !currentValue,
            },
          },
        };
      });
    }
  }, [selectedManufacturer, repVisibility]);

  const updateFieldMapping = useCallback((apiName: string, yourField: string) => {
    setCurrentFieldMappings(prev => ({
      ...prev,
      [apiName]: yourField,
    }));
    setShowColumnDropdown(null);
    setSearchTerm('');
  }, [setCurrentFieldMappings]);

  const filteredColumns = useCallback((currentSearch: string) => {
    if (!currentSearch) return sampleFileColumns;
    return sampleFileColumns.filter(col =>
      col.toLowerCase().includes(currentSearch.toLowerCase())
    );
  }, [sampleFileColumns]);

  // Get requirement badge - shows dynamic status based on field status
  const getRequirementBadge = (field: FieldDefinition) => {
    if (field.status === 'REQUIRED') {
      return <Badge variant="default" className="text-xs">Required</Badge>;
    }
    if (field.status === 'HIGHLY_SUGGESTED') {
      return <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">Highly Suggested</Badge>;
    }
    if (field.status === 'ONE_REQUIRED' || field.status === 'CAN_CALCULATE') {
      // Special dynamic status for QUANTITY_PRICING category
      if (field.category === 'QUANTITY_PRICING') {
        const hasExtendedPrice = currentFieldMappings['extended_net_price'] && currentFieldMappings['extended_net_price'].length > 0;
        const hasQuantity = currentFieldMappings['quantity_units_sold'] && currentFieldMappings['quantity_units_sold'].length > 0;
        const hasUnitCost = currentFieldMappings['distributor_unit_cost'] && currentFieldMappings['distributor_unit_cost'].length > 0;

        // If Extended Price is mapped, the other two become optional
        if (hasExtendedPrice && field.standardFieldKey !== 'extended_net_price') {
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">Highly Suggested</Badge>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-sm">
                <p className="text-sm">Optional because Extended Net Price is already mapped. Useful for validation.</p>
              </TooltipContent>
            </Tooltip>
          );
        }

        // If both Qty and Unit Cost are mapped, Extended Price becomes optional (can be calculated)
        if (hasQuantity && hasUnitCost && field.standardFieldKey === 'extended_net_price') {
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Can Calculate</Badge>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-sm">
                <p className="text-sm">Will be calculated from Quantity × Unit Cost if not provided directly.</p>
              </TooltipContent>
            </Tooltip>
          );
        }

        // Otherwise show appropriate required state
        if (field.standardFieldKey === 'extended_net_price') {
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="default" className="text-xs">Required</Badge>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-sm">
                <p className="text-sm">Map this directly, OR map both Quantity and Unit Cost to calculate it.</p>
              </TooltipContent>
            </Tooltip>
          );
        }

        // For Qty and Unit Cost when Extended Price is not mapped
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">Highly Suggested</Badge>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-sm">
              <p className="text-sm">
                {hasExtendedPrice
                  ? 'Optional - Extended Price is already mapped'
                  : 'Required if Extended Net Price is not mapped (both Qty and Unit Cost needed to calculate it)'}
              </p>
            </TooltipContent>
          </Tooltip>
        );
      }

      // Default one-of-group badge
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="default" className="text-xs">
              One Required
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-sm">
            <p className="text-sm">
              {currentGroupConfig[field.category]?.description || 'One field in this group is required'}
            </p>
          </TooltipContent>
        </Tooltip>
      );
    }
    return <Badge variant="outline" className="text-xs">Optional</Badge>;
  };

  // Check if field should show visibility toggles
  const shouldShowVisibilityToggles = (field: FieldDefinition) => {
    return field.status !== 'REQUIRED';
  };

  // Save configuration to backend
  const handleSaveConfiguration = useCallback(async () => {
    setIsSaving(true);
    try {
      const mapType: FieldMapType = activeTab.toUpperCase() as FieldMapType;
      const mappings = activeTab === 'pos' ? posFieldMappings : potFieldMappings;
      const fieldDefs = activeTab === 'pos' ? posFieldDefinitionsFromBackend : potFieldDefinitionsFromBackend;

      // Check if field definitions are loaded
      if (!fieldDefs || fieldDefs.length === 0) {
        toast.error('No field definitions loaded. Please refresh the page.');
        setIsSaving(false);
        return;
      }

      // Build fields array - send editable fields with visibility
      // For default fields: send standardFieldKey, organizationFieldName, and visibility
      // For custom fields: send all fields including standardFieldName, fieldType, category, status
      const fields = fieldDefs.map(fieldDef => {
        const fieldKey = fieldDef.standardFieldKey;
        const baseField = {
          standardFieldKey: fieldKey,
          organizationFieldName: mappings[fieldKey] || undefined,
          // Include visibility settings
          manufacturer: manufacturerVisibility[fieldKey] !== false ? true : false,
          rep: repVisibility[fieldKey] !== false ? true : false,
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

      await saveFieldMap({ mapType, fields }, accessToken);
      toast.success('Field mapping saved successfully');
    } catch (error) {
      console.error('Failed to save field mapping:', error);
      toast.error('Failed to save field mapping');
    } finally {
      setIsSaving(false);
    }
  }, [activeTab, posFieldMappings, potFieldMappings, accessToken, posFieldDefinitionsFromBackend, potFieldDefinitionsFromBackend, manufacturerVisibility, repVisibility]);

  // Check if a category should be locked (auto-populated from another)
  const isCategoryLocked = (category: string): boolean => {
    if (activeTab === 'pos' && category === 'SHIPPING_BRANCH') {
      return shippingSameAsSelling;
    }
    if (activeTab === 'pot' && category === 'BILL_TO') {
      return billToSameAsSelling;
    }
    return false;
  };

  // Get the locked mapping value for a field
  const getLockedMapping = (field: FieldDefinition): string => {
    if (activeTab === 'pos' && field.category === 'SHIPPING_BRANCH' && shippingSameAsSelling) {
      if (field.standardFieldKey === 'shipping_branch_number') return posFieldMappings['selling_branch_number'] || '';
      if (field.standardFieldKey === 'shipping_branch_name_city') return posFieldMappings['selling_branch_name_city'] || '';
      if (field.standardFieldKey === 'shipping_branch_zip_code') return posFieldMappings['selling_branch_zip_code'] || '';
    }
    if (activeTab === 'pot' && field.category === 'BILL_TO' && billToSameAsSelling) {
      if (field.standardFieldKey === 'bill_to_branch_number') return potFieldMappings['selling_branch_number'] || '';
      if (field.standardFieldKey === 'bill_to_branch_name_city') return potFieldMappings['selling_branch_name_city'] || '';
    }
    return '';
  };

  // Render field row
  const renderFieldRow = (field: FieldDefinition, index: number) => {
    const isLocked = isCategoryLocked(field.category);
    let currentMapping = currentFieldMappings[field.standardFieldKey] || '';

    if (isLocked) {
      const lockedValue = getLockedMapping(field);
      if (lockedValue) currentMapping = lockedValue;
    }

    const isDropdownOpen = showColumnDropdown === field.standardFieldKey;
    const manuVisible = field.status === 'REQUIRED' || effectiveManufacturerVisibility[field.standardFieldKey] !== false;
    const repVisible = field.status === 'REQUIRED' || effectiveRepVisibility[field.standardFieldKey] !== false;
    const isGroupField = field.status === 'ONE_REQUIRED' || field.status === 'CAN_CALCULATE';

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
        isLocked={isLocked}
        isGroupField={isGroupField}
        isRequired={field.status === 'REQUIRED'}
        isGroupUnsatisfied={isGroupField && !isGroupSatisfied(field.category)}
        columns={sampleFileColumns}
        onInputChange={(value) => {
          if (isDropdownOpen) {
            setSearchTerm(value);
          } else {
            updateFieldMapping(field.standardFieldKey, value);
          }
        }}
        onFocus={() => {
          if (!isLocked) {
            setShowColumnDropdown(field.standardFieldKey);
            setSearchTerm(currentMapping);
          }
        }}
        onSelect={(value) => updateFieldMapping(field.standardFieldKey, value)}
        onClose={() => {
          setShowColumnDropdown(null);
          setSearchTerm('');
        }}
        renderRequirementBadge={() => getRequirementBadge(field)}
        renderVisibilityColumns={() => (
          <>
            <VisibilityToggleCell
              showToggle={shouldShowVisibilityToggles(field)}
              isVisible={manuVisible}
              onToggle={() => toggleManufacturerVisibility(field.standardFieldKey)}
            />
            <VisibilityToggleCell
              showToggle={shouldShowVisibilityToggles(field)}
              isVisible={repVisible}
              onToggle={() => toggleRepVisibility(field.standardFieldKey)}
            />
          </>
        )}
      />
    );
  };

  // Get unique group categories (those with ONE_REQUIRED or CAN_CALCULATE fields)
  const getGroupCategories = (): string[] => {
    const groups = new Set<string>();
    currentFieldDefinitions.forEach(f => {
      if (f.status === 'ONE_REQUIRED' || f.status === 'CAN_CALCULATE') {
        groups.add(f.category);
      }
    });
    return Array.from(groups);
  };

  // Prepare required fields status items
  const requiredFieldsStatusItems = useMemo(() => {
    const requiredFields = currentFieldDefinitions.filter(f => f.status === 'REQUIRED');
    const groupCategories = getGroupCategories();

    const fieldItems = requiredFields.map(field => ({
      id: field.standardFieldKey,
      label: field.standardFieldName,
      isSatisfied: !!(currentFieldMappings[field.standardFieldKey] && currentFieldMappings[field.standardFieldKey].length > 0),
    }));

    const groupItems = groupCategories.map(category => ({
      id: category,
      label: currentGroupConfig[category]?.label || category,
      isSatisfied: isGroupSatisfied(category),
      isGroup: true,
    }));

    return [...fieldItems, ...groupItems];
  }, [currentFieldDefinitions, currentFieldMappings, currentGroupConfig, isGroupSatisfied]);

  // Render category toggle (for shipping/bill-to same as selling)
  const renderCategoryToggle = (category: string) => {
    if (activeTab === 'pos' && category === 'SHIPPING_BRANCH') {
      return (
        <div className="flex items-center gap-2">
          <Checkbox
            id="shipping-same-selling"
            checked={shippingSameAsSelling}
            onCheckedChange={(checked) => setShippingSameAsSelling(checked === true)}
          />
          <label
            htmlFor="shipping-same-selling"
            className="text-xs font-medium cursor-pointer"
          >
            Shipping Branch is the same as Selling Branch
          </label>
        </div>
      );
    }
    if (activeTab === 'pot' && category === 'BILL_TO') {
      return (
        <div className="flex items-center gap-2">
          <Checkbox
            id="billto-same-selling"
            checked={billToSameAsSelling}
            onCheckedChange={(checked) => setBillToSameAsSelling(checked === true)}
          />
          <label
            htmlFor="billto-same-selling"
            className="text-xs font-medium cursor-pointer"
          >
            Bill-To Branch is the same as Selling Branch
          </label>
        </div>
      );
    }
    return null;
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Field Mapping & Permissions</h1>
          <p className="text-muted-foreground">Map your field names to NEMRA standard fields and control visibility</p>
        </div>

        {/* Error Banner */}
        {error && (
          <StatusBanner variant="warning" message={error} />
        )}

        {/* Loading State */}
        {isLoading ? (
          <LoadingSpinner message="Loading field configuration..." />
        ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Field Configuration</CardTitle>
                <CardDescription>
                  Map your column names to NEMRA fields and set visibility permissions. Fields are organized for accurate rep credit assignment.
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Select manufacturer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">
                        <div className="flex items-center gap-2">
                          <span>Default Configuration</span>
                        </div>
                      </SelectItem>
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-t mt-1 pt-2">
                        Manufacturer-Specific
                      </div>
                      {manufacturers.map((mfr) => (
                        <SelectItem key={mfr.id} value={mfr.id}>
                          <div className="flex items-center gap-2">
                            <span>{mfr.name}</span>
                            {manufacturerOverrides[mfr.id] && (
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
            {selectedManufacturer !== 'default' && (
              <EntityOverrideBanner
                entityName={manufacturers.find(m => m.id === selectedManufacturer)?.name || ''}
                hasOverride={!!manufacturerOverrides[selectedManufacturer]}
                onResetOverride={() => {
                  const newOverrides = { ...manufacturerOverrides };
                  delete newOverrides[selectedManufacturer];
                  setManufacturerOverrides(newOverrides);
                }}
              />
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* POS / POT Tabs */}
            <PosPotTabs activeTab={activeTab} onTabChange={setActiveTab}>
              <div className="mt-4">
                {/* Context info for POT */}
                {activeTab === 'pot' && (
                  <InfoBanner
                    title="Point of Transfer (POT)"
                    description="POT represents internal product movement within your organization, not a customer sale. Common scenarios include: Manufacturer → CDC/RDC → Branch, or Branch → Branch transfers."
                  >
                    <div className="mt-2 text-xs text-blue-600 space-y-1">
                      <p><strong>Key difference from POS:</strong></p>
                      <p>• POS = &quot;Who bought it?&quot; (customer sale)</p>
                      <p>• POT = &quot;Where did inventory move?&quot; (internal transfer)</p>
                      <p>• Selling Branch always owns credit in POT</p>
                    </div>
                  </InfoBanner>
                )}

                {/* Upload sample file */}
                <SampleFileUpload columns={sampleFileColumns} />

                {/* Required Fields Status */}
                <RequiredFieldsStatus items={requiredFieldsStatusItems} />

                {/* Field mapping sections grouped by category */}
                <div className="space-y-6">
                  {sortedCategories.map((catConfig) => {
                    const categoryFields = getFieldsByCategory(catConfig.category);
                    if (categoryFields.length === 0) return null;

                    const categoryToggle = renderCategoryToggle(catConfig.category);

                    return (
                      <div key={catConfig.category} className="border rounded-lg overflow-hidden">
                        {/* Category header */}
                        <SectionHeader title={catConfig.name} description={catConfig.description}>
                          {categoryToggle}
                        </SectionHeader>

                        {/* Category-specific info box for QUANTITY_PRICING */}
                        {activeTab === 'pos' && catConfig.category === 'QUANTITY_PRICING' && (
                          <QuantityPricingInfoBox />
                        )}

                        {/* Category table */}
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium">NEMRA Field</th>
                              <th className="px-4 py-2 text-left text-xs font-medium w-48">Your Field</th>
                              <th className="px-4 py-2 text-center text-xs font-medium w-14">
                                <Link2 className="w-3 h-3 mx-auto" />
                              </th>
                              <th className="px-4 py-2 text-center text-xs font-medium w-28">Status</th>
                              <th className="px-4 py-2 text-center text-xs font-medium w-20">
                                <div className="flex items-center justify-center gap-1">
                                  <Factory className="w-3 h-3" />
                                  Mfr
                                </div>
                              </th>
                              <th className="px-4 py-2 text-center text-xs font-medium w-20">
                                <div className="flex items-center justify-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  Reps
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {categoryFields.map((field, idx) =>
                              renderFieldRow(field, idx)
                            )}
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
                    description="Add additional fields beyond the NEMRA standard" 
                  />
                  <table className="w-full">
                    <tbody className="divide-y">
                      {currentCustomColumns.map((column) => {
                        const manuVisible = effectiveManufacturerVisibility[column.apiName] !== false;
                        const repVisible = effectiveRepVisibility[column.apiName] !== false;
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
                              <div className="flex justify-center">
                                <Switch
                                  checked={manuVisible}
                                  onCheckedChange={() => toggleManufacturerVisibility(column.apiName)}
                                />
                              </div>
                            </td>
                            <td className="px-4 py-3 w-20">
                              <div className="flex items-center justify-center gap-2">
                                <Switch
                                  checked={repVisible}
                                  onCheckedChange={() => toggleRepVisibility(column.apiName)}
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
                          <td colSpan={2} className="px-4 py-2">
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
                          colSpan={6}
                        />
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Info notes */}
                <MappingLegend showPotNote={activeTab === 'pot'} />

                {/* Save button */}
                <div className="flex gap-3 pt-4 border-t">
                  <SaveConfigurationButton
                    onClick={handleSaveConfiguration}
                    isSaving={isSaving}
                    isLoading={isLoading}
                  />
                </div>
              </div>
            </PosPotTabs>
          </CardContent>
        </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
