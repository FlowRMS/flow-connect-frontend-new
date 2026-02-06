'use client';

import { useState, useMemo, useCallback, useEffect, useRef, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Factory, Plus } from 'lucide-react';
import {
  TabNavigation,
  SearchAndFilter,
  DirectoryHeader,
  EmptyState,
  ContactsModal,
  UploadModal,
  AddEntityModal,
  type FilterOption,
} from '@/components/shared';
import type { POSContact } from '@/lib/organizationsGqlSdk';

// Types
export interface ManufacturersCopy {
  pageTitle: string;
  pageDescription: string;
  yourManufacturersTab: string;
  directoryTab: string;
  searchPlaceholder: string;
  directoryTitle: string;
  directoryDescription: string;
  directorySearchPlaceholder: string;
  addModalTitle: string;
  addModalDescription: string;
  uploadModalTitle: string;
  uploadModalDescription: string;
  uploadModalCsvColumns: string;
  emptyStateMessage: string;
}

export interface ManufacturersSummaryData {
  activeCount: number;
  pendingCount: number;
  otherCount: number;
  activeLabel: string;
  pendingLabel: string;
  otherLabel: string;
}

export interface ManufacturersPageProps<TManufacturer, TDirectory> {
  copy: ManufacturersCopy;

  // Data
  manufacturerContacts: TManufacturer[];
  manufacturerDirectory: TDirectory[];
  isLoading: boolean;
  isLoadingDirectory?: boolean;
  isSearchingDirectory?: boolean;
  mayHaveMoreResults?: boolean;

  // Summary data
  summaryData: ManufacturersSummaryData;

  // Filters
  statusFilters: FilterOption<any>[];
  directoryFilters: FilterOption<any>[];

  // Handlers
  onAddClick: () => void;
  onUploadClick: () => void;
  onDirectorySearchChange?: (searchTerm: string) => void;
  onDirectoryTabActivated?: () => void;

  // Render functions for role-specific components
  renderSummaryCards: (summaryData: ManufacturersSummaryData, onFilterChange: (filter: any) => void) => ReactNode;
  renderManufacturerCard: (manufacturer: TManufacturer) => ReactNode;
  renderDirectoryCard: (directory: TDirectory, isAlreadyAdded: boolean) => ReactNode;
  renderInfoCard?: () => ReactNode;

  // Modal props
  addModalProps?: {
    isOpen: boolean;
    onClose: () => void;
    suggestedEntities?: Array<{ id: string; name: string; domain: string }>;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    searchResults?: Array<{ id: string; name: string; domain?: string }>;
    isSearching?: boolean;
    onSelectSearchResult?: (result: { id: string; name: string; domain?: string }) => void;
    onAdd?: (input?: any) => void;
    addLoading?: boolean;
  };

  uploadModalProps?: {
    isOpen: boolean;
    onClose: () => void;
  };

  contactsModalProps?: {
    isOpen: boolean;
    onClose: () => void;
    entityName: string;
    contacts: POSContact[];
  };

  // Filter predicates
  filterManufacturer: (manufacturer: TManufacturer, searchQuery: string, filterStatus: any) => boolean;
  filterDirectory: (directory: TDirectory, searchQuery: string, filterValue: any) => boolean;
  isInYourManufacturers: (directory: TDirectory) => boolean;

  // Additional content (e.g., visibility modal for rep)
  additionalContent?: ReactNode;
}

type Tab = 'your-manufacturers' | 'directory';

export function ManufacturersPage<TManufacturer, TDirectory>({
  copy,
  manufacturerContacts,
  manufacturerDirectory,
  isLoading,
  isLoadingDirectory = false,
  isSearchingDirectory = false,
  mayHaveMoreResults = false,
  summaryData,
  statusFilters,
  directoryFilters,
  onAddClick,
  onUploadClick,
  onDirectorySearchChange,
  onDirectoryTabActivated,
  renderSummaryCards,
  renderManufacturerCard,
  renderDirectoryCard,
  renderInfoCard,
  addModalProps,
  uploadModalProps,
  contactsModalProps,
  filterManufacturer,
  filterDirectory,
  isInYourManufacturers,
  additionalContent,
}: ManufacturersPageProps<TManufacturer, TDirectory>) {
  const [activeTab, setActiveTab] = useState<Tab>('your-manufacturers');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<any>('all');
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryFilter, setDirectoryFilter] = useState<any>('all');

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const directoryTabActivatedRef = useRef(false);

  // Handle directory search changes with debouncing
  const handleDirectorySearchChange = useCallback(
    (value: string) => {
      // Update UI immediately for responsive feel
      setDirectorySearch(value);

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce the API call
      debounceTimerRef.current = setTimeout(() => {
        onDirectorySearchChange?.(value);
      }, 400); // 400ms debounce delay
    },
    [onDirectorySearchChange]
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Handle tab change and notify parent when directory tab is first activated
  const handleTabChange = useCallback(
    (tab: string) => {
      setActiveTab(tab as Tab);
      if (tab === 'directory' && !directoryTabActivatedRef.current) {
        directoryTabActivatedRef.current = true;
        onDirectoryTabActivated?.();
      }
    },
    [onDirectoryTabActivated]
  );

  // Filter manufacturers by search and status
  const filteredManus = useMemo(() => {
    return manufacturerContacts.filter(manu =>
      filterManufacturer(manu, searchQuery, filterStatus)
    );
  }, [manufacturerContacts, searchQuery, filterStatus, filterManufacturer]);

  // Filter directory
  const filteredDirectory = useMemo(() => {
    return manufacturerDirectory.filter(dir =>
      filterDirectory(dir, directorySearch, directoryFilter)
    );
  }, [manufacturerDirectory, directorySearch, directoryFilter, filterDirectory]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading manufacturers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{copy.pageTitle}</h1>
          <p className="text-muted-foreground">{copy.pageDescription}</p>
        </div>
        <Button onClick={onAddClick}>
          <Plus className="w-4 h-4 mr-2" />
          Add Manufacturer
        </Button>
      </div>

      <TabNavigation
        tabs={[
          { id: 'your-manufacturers', label: copy.yourManufacturersTab },
          { id: 'directory', label: copy.directoryTab },
        ]}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {activeTab === 'your-manufacturers' && (
        <>
          {renderSummaryCards(summaryData, setFilterStatus)}

          <SearchAndFilter
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder={copy.searchPlaceholder}
            filterValue={filterStatus}
            onFilterChange={setFilterStatus}
            filterOptions={statusFilters}
          />

          {filteredManus.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredManus.map((manu, index) => (
                    <div key={index}>{renderManufacturerCard(manu)}</div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              icon={Factory}
              title="No manufacturers found"
              description={manufacturerContacts.length === 0 ? "Add your first manufacturer to get started" : "Try adjusting your search or filter"}
            />
          )}

          {renderInfoCard?.()}
        </>
      )}

      {activeTab === 'directory' && (
        <>
          <DirectoryHeader
            title={copy.directoryTitle}
            description={copy.directoryDescription}
          />

          <SearchAndFilter
            searchValue={directorySearch}
            onSearchChange={handleDirectorySearchChange}
            searchPlaceholder={copy.directorySearchPlaceholder}
            filterValue={directoryFilter}
            onFilterChange={setDirectoryFilter}
            filterOptions={directoryFilters}
          />

          {isLoadingDirectory ? (
            <div className="flex justify-center p-8">
              <p className="text-muted-foreground animate-pulse">Loading directory...</p>
            </div>
          ) : isSearchingDirectory ? (
            <div className="flex justify-center p-8">
              <p className="text-muted-foreground animate-pulse">Searching directory...</p>
            </div>
          ) : filteredDirectory.length === 0 ? (
            <EmptyState
              icon={Factory}
              title="No manufacturers found"
              description="Try adjusting your search or filter"
            />
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4">
                {filteredDirectory.map((dir, index) => (
                  <div key={index}>
                    {renderDirectoryCard(dir, isInYourManufacturers(dir))}
                  </div>
                ))}
              </div>

              {/* More Results Info */}
              {mayHaveMoreResults && (
                <Card className="mt-6 border-blue-200 bg-blue-50">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-center gap-2 text-sm text-blue-700">
                      <span>Showing top {filteredDirectory.length} results.</span>
                      <span className="font-medium">Use search to narrow down results.</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}

      {addModalProps && (
        <AddEntityModal
          isOpen={addModalProps.isOpen}
          onClose={addModalProps.onClose}
          title={copy.addModalTitle}
          description={copy.addModalDescription}
          entityIcon={Factory}
          suggestedEntities={addModalProps.suggestedEntities || []}
          domainLabel="Company Domain"
          domainPlaceholder="e.g., newmanufacturer.com"
          onAdd={addModalProps.onAdd}
          searchValue={addModalProps.searchValue}
          onSearchChange={addModalProps.onSearchChange}
          searchPlaceholder="Search or enter domain..."
          searchResults={addModalProps.searchResults}
          isSearching={addModalProps.isSearching}
          onSelectSearchResult={addModalProps.onSelectSearchResult as any}
        />
      )}

      {uploadModalProps && (
        <UploadModal
          isOpen={uploadModalProps.isOpen}
          onClose={uploadModalProps.onClose}
          title={copy.uploadModalTitle}
          description={copy.uploadModalDescription}
          csvColumns={copy.uploadModalCsvColumns}
        />
      )}

      {contactsModalProps && (
        <ContactsModal
          isOpen={contactsModalProps.isOpen}
          onClose={contactsModalProps.onClose}
          entityName={contactsModalProps.entityName}
          contacts={contactsModalProps.contacts}
        />
      )}

      {additionalContent}
    </div>
  );
}
