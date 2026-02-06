'use client';

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  Upload,
  Search,
  Building2,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { useOrganizationAliases } from '@/lib/hooks';
import type { OrganizationLiteResponse, BulkCreateFailureResponse } from '@/lib/graphql/index';

interface OrganizationAliasPanelProps {
  /**
   * List of organizations that can have aliases
   */
  organizations: OrganizationLiteResponse[];
  /**
   * Optional title override
   */
  title?: string;
  /**
   * Optional description override
   */
  description?: string;
  /**
   * Whether to show the bulk upload feature
   */
  showBulkUpload?: boolean;
}

/**
 * Panel for managing organization aliases.
 * Allows adding, removing, and bulk uploading aliases.
 */
export function OrganizationAliasPanel({
  organizations,
  title = 'Organization Aliases',
  description = 'Map alternative names to organizations for data routing',
  showBulkUpload = true,
}: OrganizationAliasPanelProps) {
  const {
    isLoading,
    error,
    isOperating,
    aliasGroups,
    allAliases,
    addAlias,
    removeAlias,
    bulkUpload,
    reload,
    checkExists,
  } = useOrganizationAliases();

  // Add alias form state
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [newAlias, setNewAlias] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk upload state
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<{
    insertedCount: number;
    failures: BulkCreateFailureResponse[];
  } | null>(null);

  // Filter aliases by search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return aliasGroups;

    const query = searchQuery.toLowerCase();
    return aliasGroups
      .map(group => ({
        ...group,
        aliases: group.aliases.filter(
          a =>
            a.alias.toLowerCase().includes(query) ||
            a.connectedOrgName.toLowerCase().includes(query)
        ),
      }))
      .filter(group => group.aliases.length > 0);
  }, [aliasGroups, searchQuery]);

  // Handle adding a new alias
  const handleAddAlias = useCallback(async () => {
    if (!selectedOrgId || !newAlias.trim()) return;

    const result = await addAlias(selectedOrgId, newAlias.trim());
    if (result) {
      setNewAlias('');
    }
  }, [selectedOrgId, newAlias, addAlias]);

  // Handle bulk upload
  const handleBulkUpload = useCallback(async () => {
    if (!uploadFile) return;

    const result = await bulkUpload(uploadFile);
    if (result) {
      setUploadResult(result);
      if (result.failures.length === 0) {
        setShowBulkUploadModal(false);
        setUploadFile(null);
        setUploadResult(null);
      }
    }
  }, [uploadFile, bulkUpload]);

  // Get organization name by ID
  const getOrgName = useCallback((orgId: string) => {
    const org = organizations.find(o => o.id === orgId);
    return org?.name ?? 'Unknown';
  }, [organizations]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading aliases...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={reload}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {showBulkUpload && (
            <Button variant="outline" onClick={() => setShowBulkUploadModal(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Bulk Upload
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Add Alias Form */}
        <div className="p-4 border rounded-lg space-y-4">
          <h4 className="font-medium">Add New Alias</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Organization</Label>
              <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map(org => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Alias</Label>
              <Input
                placeholder="Enter alias name"
                value={newAlias}
                onChange={(e) => setNewAlias(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddAlias();
                  }
                }}
              />
              {newAlias && checkExists(newAlias) && (
                <p className="text-sm text-destructive">This alias already exists</p>
              )}
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleAddAlias}
                disabled={!selectedOrgId || !newAlias.trim() || checkExists(newAlias) || isOperating}
              >
                {isOperating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add Alias
              </Button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search aliases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Alias List */}
        <div className="space-y-4">
          {filteredGroups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No aliases found</p>
              {searchQuery && (
                <Button variant="link" onClick={() => setSearchQuery('')}>
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            filteredGroups.map(group => (
              <div key={group.connectedOrgId} className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{group.connectedOrgName}</span>
                  <Badge variant="secondary">{group.aliases.length} aliases</Badge>
                </div>
                <div className="divide-y">
                  {group.aliases.map(alias => (
                    <div
                      key={alias.id}
                      className="px-4 py-2 flex items-center justify-between hover:bg-muted/30 transition-colors"
                    >
                      <span className="text-sm">{alias.alias}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAlias(alias.id)}
                        disabled={isOperating}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        <div className="text-sm text-muted-foreground text-center">
          {allAliases.length} alias{allAliases.length !== 1 ? 'es' : ''} across{' '}
          {aliasGroups.length} organization{aliasGroups.length !== 1 ? 's' : ''}
        </div>
      </CardContent>

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Bulk Upload Aliases</CardTitle>
                  <CardDescription>
                    Upload a CSV or Excel file with aliases
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowBulkUploadModal(false);
                    setUploadFile(null);
                    setUploadResult(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  id="alias-upload"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setUploadFile(file);
                  }}
                />
                <label htmlFor="alias-upload" className="cursor-pointer">
                  {uploadFile ? (
                    <span className="text-sm font-medium">{uploadFile.name}</span>
                  ) : (
                    <>
                      <span className="text-sm text-muted-foreground">
                        Click to select a file or drag and drop
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        CSV or Excel with columns: Organization Name, Alias
                      </p>
                    </>
                  )}
                </label>
              </div>

              {uploadResult && uploadResult.failures.length > 0 && (
                <div className="border border-destructive/50 bg-destructive/10 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium text-destructive">
                    {uploadResult.failures.length} rows failed:
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {uploadResult.failures.slice(0, 5).map((failure, i) => (
                      <p key={i} className="text-xs text-destructive">
                        Row {failure.rowNumber}: {failure.reason}
                      </p>
                    ))}
                    {uploadResult.failures.length > 5 && (
                      <p className="text-xs text-muted-foreground">
                        ...and {uploadResult.failures.length - 5} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBulkUploadModal(false);
                    setUploadFile(null);
                    setUploadResult(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkUpload}
                  disabled={!uploadFile || isOperating}
                >
                  {isOperating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  );
}
