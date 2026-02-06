'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Factory,
  Briefcase,
  Building2,
  Plus,
  X,
  AlertCircle,
  Upload,
  FileSpreadsheet,
  Check,
  Map,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import type { EntityAlias, UnmatchedEntity } from '@/lib/nemra-pos-data';
import {
  fetchUnmatchedEntitiesGql,
  matchUnmatchedEntityGql,
  type RoutingEntityType,
} from '@/lib/routingGqlSdk';
import {
  searchOrganizations,
  createOrganizationAlias,
  deleteOrganizationAlias,
  fetchOrganizationAliases,
} from '@/lib/organizationsGqlSdk';
import {
  updateOrganizationPreference,
  getOrganizationPreference,
} from '@/lib/graphql/organization-preferences';
import { getAccessToken } from '@/lib/auth';
import { toast } from 'sonner';

export type RoutingRole = 'distributor' | 'manufacturer' | 'rep';

type RoutingMethod = 'column' | 'file' | 'territory';

interface RoutingEntity {
  id: string;
  name: string;
  inviteStatus?: string;
  territory?: string;
}

export interface RoutingPanelProps {
  role: RoutingRole;
  title?: string;
  description?: string;
  className?: string;
  // Optional initial data to avoid loading state
  initialEntities?: RoutingEntity[];
  initialAliases?: EntityAlias[];
  initialUnmatched?: UnmatchedEntity[];
}

// Configuration by role
const roleConfig: Record<RoutingRole, {
  entityType: RoutingEntityType;
  entityLabel: string;
  entityLabelPlural: string;
  entityIcon: typeof Factory;
  routingMethods: { value: RoutingMethod; label: string; description: string }[];
  defaultRoutingMethod: RoutingMethod;
  showColumnConfig: boolean;
  showTerritoryConfig: boolean;
  repMapLink?: string;
  searchRepFirms: boolean;
}> = {
  distributor: {
    entityType: 'manufacturer',
    entityLabel: 'Manufacturer',
    entityLabelPlural: 'Manufacturers',
    entityIcon: Factory,
    routingMethods: [
      { value: 'column', label: 'By Column', description: 'A column in your data identifies the manufacturer for each row' },
      { value: 'file', label: 'By File', description: 'Each file you upload is for a single manufacturer' },
    ],
    defaultRoutingMethod: 'column',
    showColumnConfig: true,
    showTerritoryConfig: false,
    searchRepFirms: false,
  },
  manufacturer: {
    entityType: 'repFirm',
    entityLabel: 'Rep Firm',
    entityLabelPlural: 'Rep Firms',
    entityIcon: Briefcase,
    routingMethods: [
      { value: 'territory', label: 'By Territory (ZIP Code)', description: 'Route records based on ZIP code to the rep firm that covers that territory' },
      { value: 'file', label: 'By File', description: 'Each file you upload is for a single rep firm' },
    ],
    defaultRoutingMethod: 'territory',
    showColumnConfig: false,
    showTerritoryConfig: true,
    repMapLink: '/nemra-pos/manufacturer/rep-firms?tab=rep-map',
    searchRepFirms: true,
  },
  rep: {
    entityType: 'distributor',
    entityLabel: 'Distributor',
    entityLabelPlural: 'Distributors',
    entityIcon: Building2,
    routingMethods: [
      { value: 'column', label: 'By Column', description: 'A column in your data identifies the distributor for each row' },
      { value: 'file', label: 'By File', description: 'Each file you upload is for a single distributor' },
    ],
    defaultRoutingMethod: 'column',
    showColumnConfig: true,
    showTerritoryConfig: false,
    searchRepFirms: false,
  },
};

export default function RoutingPanel({
  role,
  title = 'Routing',
  description,
  className,
  initialEntities,
  initialAliases,
  initialUnmatched,
}: RoutingPanelProps) {
  const config = roleConfig[role];
  const EntityIcon = config.entityIcon;

  // State
  const [routingMethod, setRoutingMethod] = useState<RoutingMethod>(config.defaultRoutingMethod);
  const [routingColumn, setRoutingColumn] = useState('manufacturer');
  const [useSeparateColumns, setUseSeparateColumns] = useState(false);
  const [posRoutingColumn, setPosRoutingColumn] = useState('manufacturer');
  const [potRoutingColumn, setPotRoutingColumn] = useState('manufacturer');
  
  const [entities, setEntities] = useState<RoutingEntity[]>(initialEntities || []);
  const [aliases, setAliases] = useState<EntityAlias[]>(initialAliases || []);
  const [unmatchedEntities, setUnmatchedEntities] = useState<UnmatchedEntity[]>(initialUnmatched || []);
  
  const [matchingUnmatched, setMatchingUnmatched] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [inlineAddingAlias, setInlineAddingAlias] = useState<string | null>(null);
  const [inlineAliasValue, setInlineAliasValue] = useState('');
  const [isLoading, setIsLoading] = useState(!initialEntities);
  const [isSavingAlias, setIsSavingAlias] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    if (initialEntities && initialAliases && initialUnmatched) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = await getAccessToken();
        const [orgsData, aliasGroupsData, unmatchedData, routingPref, columnPref] = await Promise.all([
          !initialEntities
            ? searchOrganizations(
                {
                  searchTerm: '',
                  repFirms: config.searchRepFirms,
                  connected: true,
                  limit: 100,
                },
                token ?? undefined
              )
            : Promise.resolve(null),
          !initialAliases ? fetchOrganizationAliases(token ?? undefined) : Promise.resolve(null),
          !initialUnmatched ? fetchUnmatchedEntitiesGql(config.entityType) : Promise.resolve(initialUnmatched),
          getOrganizationPreference('POS', 'routing_method', token ?? undefined),
          getOrganizationPreference('POS', 'manufacturer_column', token ?? undefined),
        ]);

        // Map organizations to routing entities
        if (orgsData) {
          const mappedEntities: RoutingEntity[] = orgsData.map((org) => ({
            id: org.id,
            name: org.name,
          }));
          setEntities(mappedEntities);
        } else if (initialEntities) {
          setEntities(initialEntities);
        }

        // Flatten alias groups to EntityAlias array
        if (aliasGroupsData) {
          const flatAliases: EntityAlias[] = aliasGroupsData.flatMap((group) =>
            group.aliases.map((a) => ({
              id: a.id,
              entityId: a.connectedOrgId,
              entityName: a.connectedOrgName,
              alias: a.alias,
            }))
          );
          setAliases(flatAliases);
        } else if (initialAliases) {
          setAliases(initialAliases);
        }

        // Set routing method from saved preference
        if (routingPref?.value) {
          const savedMethod = routingPref.value === 'by_file' ? 'file' : 'column';
          if (config.routingMethods.some(m => m.value === savedMethod)) {
            setRoutingMethod(savedMethod);
          }
        }

        // Set manufacturer column from saved preference
        if (columnPref?.value) {
          setRoutingColumn(columnPref.value);
        }

        setUnmatchedEntities(unmatchedData);
      } catch (error) {
        console.error('Failed to fetch routing data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [config.entityType, config.searchRepFirms, initialEntities, initialAliases, initialUnmatched]);

  const saveConfiguration = async () => {
    setIsSavingConfig(true);
    try {
      const token = await getAccessToken();
      const routingValue = routingMethod === 'file' ? 'by_file' : 'by_column';
      await Promise.all([
        updateOrganizationPreference('POS', 'routing_method', routingValue, token ?? undefined),
        updateOrganizationPreference('POS', 'manufacturer_column', routingColumn, token ?? undefined),
      ]);
      toast.success('Configuration saved');
    } catch (error) {
      console.error('Failed to save configuration:', error);
      toast.error('Failed to save configuration');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const addAlias = async (entityId: string, entityName: string, alias: string) => {
    if (!alias.trim()) return;

    const tempId = `alias-${Date.now()}`;
    const newAlias: EntityAlias = {
      id: tempId,
      entityId,
      entityName,
      alias: alias.trim(),
    };

    // Optimistic update
    setAliases(prev => [...prev, newAlias]);
    setInlineAliasValue('');
    setInlineAddingAlias(null);
    setIsSavingAlias(true);

    try {
      const token = await getAccessToken();
      const result = await createOrganizationAlias(entityId, alias.trim(), token ?? undefined);
      // Update with server response
      setAliases(prev => prev.map(a => a.id === tempId ? {
        id: result.id,
        entityId: result.connectedOrgId,
        entityName: result.connectedOrgName,
        alias: result.alias,
      } : a));
      toast.success('Alias added');
    } catch (error) {
      console.error('Failed to add alias:', error);
      // Revert on error
      setAliases(prev => prev.filter(a => a.id !== tempId));
      toast.error('Failed to add alias');
    } finally {
      setIsSavingAlias(false);
    }
  };

  const handleRemoveAlias = async (aliasId: string) => {
    const previousAliases = aliases;

    // Optimistic update
    setAliases(prev => prev.filter(a => a.id !== aliasId));

    try {
      const token = await getAccessToken();
      const success = await deleteOrganizationAlias(aliasId, token ?? undefined);
      if (!success) {
        throw new Error('Failed to remove alias');
      }
      toast.success('Alias removed');
    } catch (error) {
      console.error('Failed to remove alias:', error);
      // Revert on error
      setAliases(previousAliases);
      toast.error('Failed to remove alias');
    }
  };

  const matchUnmatchedToEntity = async (unmatchedId: string, entityId: string) => {
    const unmatched = unmatchedEntities.find(u => u.id === unmatchedId);
    const entity = entities.find(e => e.id === entityId);
    
    if (unmatched && entity) {
      // Add as new alias
      const newAlias: EntityAlias = {
        id: `alias-${Date.now()}`,
        entityId,
        entityName: entity.name,
        alias: unmatched.name,
      };

      // Optimistic update
      setAliases(prev => [...prev, newAlias]);
      setUnmatchedEntities(prev => prev.filter(u => u.id !== unmatchedId));
      setMatchingUnmatched(null);

      try {
        await matchUnmatchedEntityGql(config.entityType, unmatchedId, entityId);
      } catch (error) {
        console.error('Failed to match entity:', error);
        // Revert would be complex here, but the optimistic update provides good UX
      }
    }
  };

  const defaultDescription = role === 'distributor' 
    ? 'Configure how POS data is routed to the correct manufacturers'
    : role === 'manufacturer'
    ? 'Configure how POS data is routed to the correct rep firms'
    : 'Configure how POS data is routed to the correct distributors';

  // Helper to get routing column display
  const getRoutingColumnDisplay = () => {
    if (useSeparateColumns) {
      return (
        <>
          <code className="text-xs bg-muted px-1 py-0.5 rounded">{posRoutingColumn || 'manufacturer'}</code> (POS) or{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">{potRoutingColumn || 'manufacturer'}</code> (POT)
        </>
      );
    }
    return <code className="text-xs bg-muted px-1 py-0.5 rounded">{routingColumn || 'manufacturer'}</code>;
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className || ''}`}>
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{description || defaultDescription}</p>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">Loading routing configuration...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{description || defaultDescription}</p>
      </div>

      {/* Routing Method */}
      <Card>
        <CardHeader>
          <CardTitle>Routing Method</CardTitle>
          <CardDescription>
            {role === 'distributor' && 'How should we identify which manufacturer each record belongs to?'}
            {role === 'manufacturer' && 'How should we determine which rep firm receives each record?'}
            {role === 'rep' && 'How should we identify which distributor each record belongs to?'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {config.routingMethods.map((method) => (
              <div
                key={method.value}
                onClick={() => setRoutingMethod(method.value)}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  routingMethod === method.value ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{method.label}</p>
                  {routingMethod === method.value && (
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{method.description}</p>
              </div>
            ))}
          </div>

          {/* Column Configuration (for distributor/rep) */}
          {config.showColumnConfig && routingMethod === 'column' && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">{config.entityLabel} Column</p>
                  {!useSeparateColumns ? (
                    <>
                      <input
                        type="text"
                        value={routingColumn}
                        onChange={(e) => setRoutingColumn(e.target.value)}
                        placeholder={`e.g., ${config.entityLabel.toLowerCase()}, vendor, brand`}
                        className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Enter the column name in your data that contains the {config.entityLabel.toLowerCase()} name
                      </p>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">POS Column</label>
                        <input
                          type="text"
                          value={posRoutingColumn}
                          onChange={(e) => setPosRoutingColumn(e.target.value)}
                          placeholder={`e.g., ${config.entityLabel.toLowerCase()}`}
                          className="w-full border rounded-lg px-3 py-2 text-sm bg-background mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">POT Column</label>
                        <input
                          type="text"
                          value={potRoutingColumn}
                          onChange={(e) => setPotRoutingColumn(e.target.value)}
                          placeholder="e.g., vendor"
                          className="w-full border rounded-lg px-3 py-2 text-sm bg-background mt-1"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* POS/POT note */}
                <div className="pt-3 border-t">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-xs text-muted-foreground">
                      This field name is used for both POS and POT uploads.
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-xs h-auto p-0 shrink-0"
                      onClick={() => {
                        if (!useSeparateColumns) {
                          setPosRoutingColumn(routingColumn);
                          setPotRoutingColumn(routingColumn);
                        }
                        setUseSeparateColumns(!useSeparateColumns);
                      }}
                    >
                      {useSeparateColumns ? 'Use same column for both' : 'Use different columns for POS and POT'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted px-4 py-2 border-b">
                  <p className="font-medium text-sm">How it works by upload method</p>
                </div>
                <div className="p-4 space-y-3 text-sm">
                  <div className="flex gap-3">
                    <Badge variant="outline" className="shrink-0">API</Badge>
                    <p className="text-muted-foreground">
                      Include {getRoutingColumnDisplay()} field in each record. We&apos;ll route based on the value.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Badge variant="outline" className="shrink-0">SFTP</Badge>
                    <p className="text-muted-foreground">
                      Include a {getRoutingColumnDisplay()} column in your CSV. Each row is routed independently.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Badge variant="outline" className="shrink-0">Upload</Badge>
                    <p className="text-muted-foreground">
                      Include a {getRoutingColumnDisplay()} column in your file. Each row is routed independently.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Badge variant="outline" className="shrink-0">Email</Badge>
                    <p className="text-muted-foreground">
                      Include a {getRoutingColumnDisplay()} column in your attached file. Each row is routed independently.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Territory Configuration (for manufacturer) */}
          {config.showTerritoryConfig && routingMethod === 'territory' && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Territory Assignment</p>
                  <p className="text-sm text-muted-foreground">
                    Records are automatically routed based on the ZIP code in your data. The Selling Branch ZIP or Customer ZIP
                    is matched against each rep firm&apos;s territory configuration.
                  </p>
                </div>

                {config.repMapLink && (
                  <div className="pt-3 border-t flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Configure rep firm territories by state or ZIP code on the Rep Map.
                    </p>
                    <Link href={config.repMapLink}>
                      <Button variant="outline" size="sm">
                        <Map className="w-4 h-4 mr-2" />
                        Open Rep Map
                        <ExternalLink className="w-3 h-3 ml-2" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted px-4 py-2 border-b">
                  <p className="font-medium text-sm">How it works by send method</p>
                </div>
                <div className="p-4 space-y-3 text-sm">
                  <div className="flex gap-3">
                    <Badge variant="outline" className="shrink-0">API</Badge>
                    <p className="text-muted-foreground">
                      Include ZIP code fields in each record. We&apos;ll automatically route based on territory configuration.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Badge variant="outline" className="shrink-0">SFTP</Badge>
                    <p className="text-muted-foreground">
                      Include ZIP code columns in your CSV. Each row is routed to the appropriate rep firm.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Badge variant="outline" className="shrink-0">Upload</Badge>
                    <p className="text-muted-foreground">
                      Include ZIP code columns in your file. Records are distributed to rep firms based on territory.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Badge variant="outline" className="shrink-0">Email</Badge>
                    <p className="text-muted-foreground">
                      Include ZIP code columns in your attached file. Each row is routed independently.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* File-based routing info */}
          {routingMethod === 'file' && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted px-4 py-2 border-b">
                <p className="font-medium text-sm">How it works by upload method</p>
              </div>
              <div className="p-4 space-y-3 text-sm">
                <div className="flex gap-3">
                  <Badge variant="outline" className="shrink-0">API</Badge>
                  <p className="text-muted-foreground">
                    Include <code className="text-xs bg-muted px-1 py-0.5 rounded">{config.entityType}Id</code> at the batch level in your request body.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Badge variant="outline" className="shrink-0">SFTP</Badge>
                  <p className="text-muted-foreground">
                    Name your file to include the {config.entityLabel.toLowerCase()} (e.g., <code className="text-xs bg-muted px-1 py-0.5 rounded">flowtech_dec2024.csv</code>) or upload to a {config.entityLabel.toLowerCase()}-specific folder.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Badge variant="outline" className="shrink-0">Upload</Badge>
                  <p className="text-muted-foreground">
                    We&apos;ll auto-detect the {config.entityLabel.toLowerCase()} from the filename if it matches a known alias. You can also select manually.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Badge variant="outline" className="shrink-0">Email</Badge>
                  <p className="text-muted-foreground">
                    Name your attachment to include the {config.entityLabel.toLowerCase()}, or we&apos;ll ask you to confirm if it can&apos;t be auto-detected.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unmatched Entities - Commented out for now */}
      {/* {unmatchedEntities.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <CardTitle className="text-amber-900">Unmatched {config.entityLabelPlural}</CardTitle>
            </div>
            <CardDescription className="text-amber-700">
              These {config.entityLabel.toLowerCase()} names were found in your data but couldn&apos;t be matched to a known {config.entityLabel.toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unmatchedEntities.map((unmatched) => (
                <div key={unmatched.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div>
                    <p className="font-medium">{unmatched.name}</p>
                    <p className="text-xs text-muted-foreground">
                      First seen: {new Date(unmatched.firstSeen).toLocaleDateString()} · {unmatched.recordCount} records
                    </p>
                  </div>
                  {matchingUnmatched === unmatched.id ? (
                    <div className="flex items-center gap-2">
                      <select
                        className="border rounded px-2 py-1 text-sm"
                        onChange={(e) => {
                          if (e.target.value) {
                            matchUnmatchedToEntity(unmatched.id, e.target.value);
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="" disabled>Select {config.entityLabel.toLowerCase()}...</option>
                        {entities.map((entity) => (
                          <option key={entity.id} value={entity.id}>{entity.name}</option>
                        ))}
                      </select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMatchingUnmatched(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMatchingUnmatched(unmatched.id)}
                    >
                      Match to {config.entityLabel}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )} */}

      {/* Entity Aliases */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{config.entityLabel} Aliases</CardTitle>
              <CardDescription>
                Map different name variations to your registered {config.entityLabelPlural.toLowerCase()}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => setShowUploadModal(true)}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Upload Spreadsheet
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {entities.map((entity) => {
              const entityAliases = aliases.filter(a => a.entityId === entity.id);
              const isInlineAdding = inlineAddingAlias === entity.id;
              return (
                <div key={entity.id} className="border rounded-lg p-4 group/card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <EntityIcon className="w-4 h-4 text-muted-foreground" />
                      <p className="font-medium">{entity.name}</p>
                      {entity.territory && (
                        <Badge variant="outline" className="text-xs">{entity.territory}</Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {entityAliases.length} {entityAliases.length === 1 ? 'alias' : 'aliases'}
                      </Badge>
                    </div>
                  </div>

                  {/* Alias list with inline add */}
                  <div className="flex flex-wrap gap-2 items-center">
                    {entityAliases.map((alias) => {
                      const isSaving = isSavingAlias && alias.id.startsWith('alias-');
                      return (
                        <div
                          key={alias.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-muted rounded-md text-sm group/alias hover:bg-muted/80 transition-colors"
                        >
                          <span>{alias.alias}</span>
                          {isSaving ? (
                            <Loader2 className="w-3.5 h-3.5 ml-1 animate-spin text-muted-foreground" />
                          ) : (
                            <button
                              onClick={() => handleRemoveAlias(alias.id)}
                              className="text-muted-foreground hover:text-destructive ml-1 opacity-0 group-hover/alias:opacity-100 transition-opacity"
                              title="Remove alias"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {/* Inline add input */}
                    {isInlineAdding ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={inlineAliasValue}
                          onChange={(e) => setInlineAliasValue(e.target.value)}
                          placeholder="Type alias..."
                          className="w-32 border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && inlineAliasValue.trim()) {
                              addAlias(entity.id, entity.name, inlineAliasValue);
                            } else if (e.key === 'Escape') {
                              setInlineAddingAlias(null);
                              setInlineAliasValue('');
                            }
                          }}
                          onBlur={() => {
                            if (inlineAliasValue.trim()) {
                              addAlias(entity.id, entity.name, inlineAliasValue);
                            }
                            setInlineAddingAlias(null);
                            setInlineAliasValue('');
                          }}
                        />
                        <button
                          onClick={() => {
                            if (inlineAliasValue.trim()) {
                              addAlias(entity.id, entity.name, inlineAliasValue);
                            }
                            setInlineAddingAlias(null);
                            setInlineAliasValue('');
                          }}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setInlineAddingAlias(null);
                            setInlineAliasValue('');
                          }}
                          className="p-1.5 text-muted-foreground hover:bg-muted rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setInlineAddingAlias(entity.id);
                          setInlineAliasValue('');
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 border border-dashed rounded-md text-sm text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add alias</span>
                      </button>
                    )}
                  </div>

                  {entityAliases.length === 0 && !isInlineAdding && (
                    <p className="text-xs text-muted-foreground mt-2">
                      The exact name &quot;{entity.name}&quot; will be used for matching.
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Tip:</strong> Aliases are case-insensitive. &quot;FlowTech&quot; will match &quot;FLOWTECH&quot;, &quot;flowtech&quot;, etc.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Configuration Button */}
      <div className="flex justify-end">
        <Button onClick={saveConfiguration} disabled={isSavingConfig}>
          {isSavingConfig && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Configuration
        </Button>
      </div>

      {/* Upload Aliases Spreadsheet Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Upload Aliases Spreadsheet</CardTitle>
                  <CardDescription>Upload a CSV or Excel file with {config.entityLabel.toLowerCase()} aliases</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowUploadModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium">Click to upload or drag and drop</p>
                <p className="text-sm text-muted-foreground">CSV or Excel file (.csv, .xlsx)</p>
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-medium">Expected format:</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-1 pr-4 font-medium">{config.entityLabel} Name</th>
                        <th className="text-left py-1 font-medium">Alias</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr>
                        <td className="py-1 pr-4">{entities[0]?.name || 'Example Entity'}</td>
                        <td className="py-1">ALIAS1</td>
                      </tr>
                      <tr>
                        <td className="py-1 pr-4">{entities[0]?.name || 'Example Entity'}</td>
                        <td className="py-1">Alias Two</td>
                      </tr>
                      <tr>
                        <td className="py-1 pr-4">{entities[1]?.name || 'Another Entity'}</td>
                        <td className="py-1">ALT</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Each row should contain a {config.entityLabel.toLowerCase()} name (must match an existing {config.entityLabel.toLowerCase()}) and an alias.
                </p>
              </div>

              <Button variant="link" size="sm" className="p-0 h-auto">
                <FileSpreadsheet className="w-4 h-4 mr-1" />
                Download template
              </Button>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowUploadModal(false)}>Cancel</Button>
                <Button>Upload & Import</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

