'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TooltipProvider,
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
  Factory,
  ArrowRight,
} from 'lucide-react';
import { getFieldMap, saveFieldMap, type FieldMapType } from '@/lib/fieldMapGql';
import { toast } from 'sonner';
import {
  mockRepManufacturerContacts,
  type POSFieldSection,
  type POTFieldSection,
} from '@/lib/nemra-pos-data';

interface FieldDefinition {
  name: string;
  apiName: string;
  section: POSFieldSection | POTFieldSection;
  requirement: 'required' | 'highly-suggested' | 'optional' | 'one-of-group';
  groupId?: string;
  isPreferred?: boolean;
  description: string;
}

// Import shared mapping components
import {
  LoadingSpinner,
  StatusBanner,
  InfoBanner,
  RequirementBadge,
  MappedIndicator,
  FieldNameCell,
  SectionHeader,
  SummaryStatsGrid,
  PosPotTabs,
  RepMappingLegend,
} from '@/components/mapping';

export default function RepMappingPage() {
  const [activeTab, setActiveTab] = useState<'pos' | 'pot'>('pos');
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | undefined>(undefined);

  // Fetched data from backend
  const [manufacturers, setManufacturers] = useState<typeof mockRepManufacturerContacts>([]);
  const [fieldDefinitions, setFieldDefinitions] = useState<{ pos: FieldDefinition[]; pot: FieldDefinition[] }>({ pos: [], pot: [] });
  const [sectionConfigs, setSectionConfigs] = useState<{ pos: Record<string, any>; pot: Record<string, any> }>({ pos: {}, pot: {} });

  // Separate field mappings for POS and POT
  const [posFieldMappings, setPosFieldMappings] = useState<Record<string, string>>({});
  const [potFieldMappings, setPotFieldMappings] = useState<Record<string, string>>({});

  // Store full field definitions from backend
  const [posFieldDefinitionsFromBackend, setPosFieldDefinitionsFromBackend] = useState<any[]>([]);
  const [potFieldDefinitionsFromBackend, setPotFieldDefinitionsFromBackend] = useState<any[]>([]);

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

  // Fetch field map from backend
  useEffect(() => {
    if (!accessToken) return;

    const controller = new AbortController();

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [posMap, potMap] = await Promise.all([
          getFieldMap('POS', undefined, accessToken),
          getFieldMap('POT', undefined, accessToken),
        ]);

        if (controller.signal.aborted) return;

        // Store full field definitions from backend
        if (posMap?.fields) {
          setPosFieldDefinitionsFromBackend(posMap.fields);
        }
        if (potMap?.fields) {
          setPotFieldDefinitionsFromBackend(potMap.fields);
        }

        // Helper to map backend category to UI section
        const mapCategoryToSection = (category: string): string => {
          const categoryMap: Record<string, string> = {
            'PRODUCT_IDENTIFICATION': 'product-id',
            'QUANTITY_PRICING': 'quantity-pricing',
            'QUANTITY_COST': 'quantity-cost',
            'TRANSFER_BRANCH': 'transfer-branch',
          };
          const mapped = categoryMap[category];
          if (mapped) return mapped;
          return category.toLowerCase().replace(/_/g, '-');
        };

        // Transform POS response to UI format
        const posFieldDefs: FieldDefinition[] = posMap?.fields ? posMap.fields.map(f => ({
          name: f.standardFieldName,
          apiName: f.standardFieldKey,
          section: mapCategoryToSection(f.category) as POSFieldSection,
          requirement: f.status === 'REQUIRED' ? 'required' :
                      f.status === 'HIGHLY_SUGGESTED' ? 'highly-suggested' :
                      f.status === 'ONE_REQUIRED' || f.status === 'CAN_CALCULATE' ? 'one-of-group' : 'optional',
          groupId: (f.status === 'ONE_REQUIRED' || f.status === 'CAN_CALCULATE') ? f.category : undefined,
          isPreferred: f.preferred,
          description: f.standardFieldNameDescription || '',
        })) : [];

        // Transform POT response if available, otherwise use empty array
        const potFieldDefs: FieldDefinition[] = potMap?.fields ? potMap.fields.map(f => ({
          name: f.standardFieldName,
          apiName: f.standardFieldKey,
          section: mapCategoryToSection(f.category) as POTFieldSection,
          requirement: f.status === 'REQUIRED' ? 'required' :
                      f.status === 'HIGHLY_SUGGESTED' ? 'highly-suggested' :
                      f.status === 'ONE_REQUIRED' || f.status === 'CAN_CALCULATE' ? 'one-of-group' : 'optional',
          groupId: (f.status === 'ONE_REQUIRED' || f.status === 'CAN_CALCULATE') ? f.category : undefined,
          isPreferred: f.preferred,
          description: f.standardFieldNameDescription || '',
        })) : [];

        setFieldDefinitions({ pos: posFieldDefs, pot: potFieldDefs });

        // Build POS section configs
        const posSections: Record<string, any> = {};
        if (posMap?.categories) {
          posMap.categories.forEach(cat => {
            const sectionKey = mapCategoryToSection(cat.category);
            posSections[sectionKey] = {
              title: cat.name,
              description: cat.description,
              order: cat.order,
            };
          });
        }

        // Build POT section configs if available
        const potSections: Record<string, any> = {};
        if (potMap?.categories) {
          potMap.categories.forEach(cat => {
            const sectionKey = mapCategoryToSection(cat.category);
            potSections[sectionKey] = {
              title: cat.name,
              description: cat.description,
              order: cat.order,
            };
          });
        }
        setSectionConfigs({ pos: posSections, pot: potSections });

        // Set POS field mappings from backend
        const posMappingsRecord: Record<string, string> = {};
        if (posMap?.fields) {
          posMap.fields.forEach(f => {
            if (f.organizationFieldName) {
              posMappingsRecord[f.standardFieldKey] = f.organizationFieldName;
            }
          });
        }
        setPosFieldMappings(posMappingsRecord);

        // Set POT field mappings from backend
        const potMappingsRecord: Record<string, string> = {};
        if (potMap?.fields) {
          potMap.fields.forEach(f => {
            if (f.organizationFieldName) {
              potMappingsRecord[f.standardFieldKey] = f.organizationFieldName;
            }
          });
        }
        setPotFieldMappings(potMappingsRecord);

        // TODO: Fetch manufacturers from connectionSearch
        setManufacturers([]);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error('Failed to fetch field mapping data:', err);
          setError('Failed to load field mapping data from backend.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => controller.abort();
  }, [accessToken]);

  const activeManufacturers = useMemo(() =>
    manufacturers.length > 0
      ? manufacturers
      : mockRepManufacturerContacts.filter(m => m.status === 'active'),
    [manufacturers]
  );

  const currentFieldDefinitions = useMemo(() =>
    activeTab === 'pos' ? fieldDefinitions.pos : fieldDefinitions.pot,
    [activeTab, fieldDefinitions]
  );

  const currentSectionConfig = useMemo(() =>
    activeTab === 'pos' ? sectionConfigs.pos : sectionConfigs.pot,
    [activeTab, sectionConfigs]
  );

  const currentFieldMappings = useMemo(() =>
    activeTab === 'pos' ? posFieldMappings : potFieldMappings,
    [activeTab, posFieldMappings, potFieldMappings]
  );

  const getFieldsBySection = useCallback((section: POSFieldSection | POTFieldSection) => {
    return currentFieldDefinitions.filter(f => f.section === section);
  }, [currentFieldDefinitions]);

  const sortedSections = useMemo(() =>
    Object.entries(currentSectionConfig)
      .sort(([, a], [, b]) => (a as any).order - (b as any).order)
      .map(([key]) => key as POSFieldSection | POTFieldSection),
    [currentSectionConfig]
  );

  // Calculate summary stats
  const mappedCount = useMemo(() =>
    currentFieldDefinitions.filter(f => currentFieldMappings[f.apiName]).length,
    [currentFieldDefinitions, currentFieldMappings]
  );

  const visibleCount = useMemo(() => mappedCount, [mappedCount]);
  const hiddenCount = 0;

  const handleFieldMappingChange = useCallback((apiName: string, value: string) => {
    // Reps can map to their own fields
    if (activeTab === 'pos') {
      setPosFieldMappings(prev => ({ ...prev, [apiName]: value }));
    } else {
      setPotFieldMappings(prev => ({ ...prev, [apiName]: value }));
    }
  }, [activeTab]);

  // Save configuration to backend
  const handleSaveConfiguration = useCallback(async () => {
    try {
      const mapType: FieldMapType = activeTab.toUpperCase() as FieldMapType;
      const fieldDefs = activeTab === 'pos' ? posFieldDefinitionsFromBackend : potFieldDefinitionsFromBackend;
      const mappings = activeTab === 'pos' ? posFieldMappings : potFieldMappings;

      // Check if field definitions are loaded
      if (!fieldDefs || fieldDefs.length === 0) {
        toast.error('No field definitions loaded. Please refresh the page.');
        return;
      }

      // Build fields array - only send editable fields
      // For default fields: only send standardFieldKey and organizationFieldName
      // For custom fields: send all fields including standardFieldName, fieldType, category, status
      const fields = fieldDefs.map(fieldDef => {
        const baseField = {
          standardFieldKey: fieldDef.standardFieldKey,
          organizationFieldName: mappings[fieldDef.standardFieldKey] || undefined,
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
    }
  }, [activeTab, posFieldMappings, potFieldMappings, accessToken, posFieldDefinitionsFromBackend, potFieldDefinitionsFromBackend]);

  const renderFieldRow = (field: FieldDefinition) => {
    const isMapped = !!currentFieldMappings[field.apiName];
    const mappedValue = currentFieldMappings[field.apiName] || '';

    return (
      <tr key={field.apiName} className="hover:bg-muted/50">
        <td className="px-4 py-3">
          <FieldNameCell
            name={field.name}
            description={field.description}
            isPreferred={field.isPreferred}
          />
        </td>
        <td className="px-4 py-3 text-center">
          <RequirementBadge requirement={field.requirement} />
        </td>
        <td className="px-4 py-3 text-center">
          <MappedIndicator isMapped={isMapped} />
        </td>
        <td className="px-4 py-3 text-center">
          {isMapped ? (
            <div className="flex items-center justify-center gap-1">
              <Eye className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-700">Visible</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={mappedValue}
              onChange={(e) => handleFieldMappingChange(field.apiName, e.target.value)}
              placeholder="Your field name..."
              className="w-[180px] h-8 text-xs border rounded px-2"
            />
          </div>
        </td>
      </tr>
    );
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Field Mapping</h1>
          <p className="text-muted-foreground">Map NEMRA fields to your system fields</p>
        </div>

        {isLoading ? (
          <LoadingSpinner message="Loading field mapping data..." />
        ) : (
          <>
            {error && (
              <StatusBanner variant="warning" message={error} />
            )}

            {/* Info card */}
            <InfoBanner
              title="About Field Mapping"
              description="Use the dropdowns to map incoming NEMRA fields to your own system fields. Fields marked as &quot;Hidden&quot; have been restricted by the manufacturer or distributor and cannot be mapped."
            />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>NEMRA Field Mapping</CardTitle>
                <CardDescription>
                  Map fields from your manufacturer network to your system
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Factory className="w-4 h-4 text-muted-foreground" />
                  <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Select manufacturer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Manufacturers</SelectItem>
                      {activeManufacturers.map((mfr: typeof mockRepManufacturerContacts[number]) => (
                        <SelectItem key={mfr.id} value={mfr.id}>
                          {mfr.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary stats */}
            <SummaryStatsGrid 
              stats={[
                { value: mappedCount, label: 'Fields Receiving', variant: 'success' },
                { value: visibleCount, label: 'Visible to You', variant: 'success' },
                { value: hiddenCount, label: 'Hidden', variant: 'warning' },
              ]}
            />

            {/* POS / POT Tabs */}
            <PosPotTabs activeTab={activeTab} onTabChange={setActiveTab}>
              <div className="mt-4">
                {/* POT info */}
                {activeTab === 'pot' && (
                  <InfoBanner
                    title="Point of Transfer (POT)"
                    description="POT represents internal inventory movement, not a customer sale. This data helps track product flow within the distribution network."
                  />
                )}

                {/* Field sections */}
                <div className="space-y-6">
                  {sortedSections.map((section) => {
                    const sectionFields = getFieldsBySection(section);
                    if (sectionFields.length === 0) return null;

                    const config = currentSectionConfig[section as keyof typeof currentSectionConfig];

                    return (
                      <div key={section} className="border rounded-lg overflow-hidden">
                        <SectionHeader title={config.title} description={config.description} />

                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium">NEMRA Field</th>
                              <th className="px-4 py-2 text-center text-xs font-medium w-28">NEMRA Status</th>
                              <th className="px-4 py-2 text-center text-xs font-medium w-24">Receiving</th>
                              <th className="px-4 py-2 text-center text-xs font-medium w-28">Your Access</th>
                              <th className="px-4 py-2 text-left text-xs font-medium w-52">Map To</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {sectionFields.map((field) => renderFieldRow(field))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <RepMappingLegend />

                {/* Save button */}
                <div className="flex gap-3 pt-4 border-t mt-6">
                  <button
                    onClick={handleSaveConfiguration}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    Save Configuration
                  </button>
                </div>
              </div>
            </PosPotTabs>
          </CardContent>
        </Card>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
