'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  X,
  Eye,
  EyeOff,
  Send,
  ExternalLink,
  Lock,
  Unlock,
  Building2,
  Check,
  Clock,
  Factory,
} from 'lucide-react';
import {
  searchOrganizations,
  createOrganization,
  createOrganizationConnection,
  type ManufacturerContact,
  type ManufacturerDirectoryEntry,
  type POSContact,
  type ManufacturerInput,
} from '@/lib/organizationsGqlSdk';
import { RepManufacturerCard } from '@/components/manufacturers/rep-manufacturer-card';
import { RepManufacturerDirectoryCard } from '@/components/manufacturers/rep-manufacturer-directory-card';
import { ManufacturersPage } from '@/components/manufacturers/ManufacturersPage';
import { repManufacturersCopy } from '@/components/manufacturers/manufacturers-copy';
import { type FilterOption } from '@/components/shared';
import { mockManufacturerFieldVisibility, mockDistributorFieldVisibility, allPOSFields } from '@/lib/nemra-pos-data';
import { toast } from '@/components/ui/use-toast';

type FilterStatus = 'all' | 'active' | 'pending' | 'not_on_platform';
type DirectoryFilter = 'all' | 'nemra-free' | 'nemra-paid' | 'flowconnect';

const STATUS_FILTERS: FilterOption<FilterStatus>[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Reporting' },
  { value: 'pending', label: 'Pending' },
  { value: 'not_on_platform', label: 'Not on Platform' },
];

const DIRECTORY_FILTERS: FilterOption<DirectoryFilter>[] = [
  { value: 'all', label: 'All' },
  // { value: 'nemra-paid', label: 'NEMRA POS Paid' },
  // { value: 'nemra-free', label: 'NEMRA POS Free' },
  { value: 'flowconnect', label: 'FlowConnect Member' },
];

export default function RepManufacturersPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [modalSearchResults, setModalSearchResults] = useState<{ id: string; name: string; domain?: string }[]>([]);
  const [isModalSearching, setIsModalSearching] = useState(false);
  const [contactsModal, setContactsModal] = useState<{ open: boolean; manufacturer: string; contacts: POSContact[] }>({
    open: false,
    manufacturer: '',
    contacts: [],
  });
  const [visibilityModal, setVisibilityModal] = useState<{ open: boolean; manufacturerId: string; manufacturerName: string }>({
    open: false,
    manufacturerId: '',
    manufacturerName: '',
  });

  const [manufacturerContacts, setManufacturerContacts] = useState<ManufacturerContact[]>([]);
  const [connectedManufacturers, setConnectedManufacturers] = useState<ManufacturerDirectoryEntry[]>([]);
  const [directoryResults, setDirectoryResults] = useState<ManufacturerDirectoryEntry[]>([]);
  const [directorySearchResults, setDirectorySearchResults] = useState<ManufacturerDirectoryEntry[] | null>(null);
  const [directorySearchTerm, setDirectorySearchTerm] = useState('');
  const [mayHaveMoreResults, setMayHaveMoreResults] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDirectory, setIsLoadingDirectory] = useState(true);
  const [isSearchingDirectory, setIsSearchingDirectory] = useState(false);
  const [accessToken, setAccessToken] = useState<string | undefined>();
  const [addLoading, setAddLoading] = useState(false);

  // Fetch access token on mount
  useEffect(() => {
    async function fetchToken() {
      try {
        const res = await fetch('/api/auth/token');
        if (res.ok) {
          const body = await res.json();
          setAccessToken(body?.accessToken);
          console.debug('Access token obtained:', body?.accessToken ? 'yes' : 'no');
        } else {
          console.debug('Token endpoint returned:', res.status);
        }
      } catch (e) {
        console.debug('Failed to fetch access token:', e);
      }
    }
    fetchToken();
  }, []);

  // Fetch manufacturer contacts when access token is available
  useEffect(() => {
    async function fetchData() {
      if (!accessToken) return;

      setIsLoading(true);
      try {
        const connected = await searchOrganizations(
          {
            searchTerm: '',
            connected: true,
            limit: 100,
          },
          accessToken
        );

        const mappedContacts: ManufacturerContact[] = connected.map((r) => ({
          id: r.id,
          name: r.name,
          domain: r.domain || '',
          inviteStatus:
            r.connectionStatus === 'ACCEPTED'
              ? 'active'
              : r.connectionStatus === 'PENDING'
              ? 'pending'
              : 'no_invite',
        }));
        setManufacturerContacts(mappedContacts);

        // Map connected manufacturers for directory comparison
        const mappedConnected = connected.map((r) => ({
          id: r.id,
          name: r.name,
          domain: r.domain || '',
          membershipTier: r.flowConnectMember
            ? ('flowconnect' as ManufacturerDirectoryEntry['membershipTier'])
            : ('nemra-free' as ManufacturerDirectoryEntry['membershipTier']),
          orgCount: r.members,
          category: 'General',
        }));
        setConnectedManufacturers(mappedConnected);
      } catch (error) {
        console.error('Error fetching rep manufacturers:', error);
        setManufacturerContacts([]);
        setConnectedManufacturers([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [accessToken]);

  // Fetch all manufacturers for directory
  useEffect(() => {
    async function fetchDirectory() {
      if (!accessToken) return;

      setIsLoadingDirectory(true);
      try {
        const DISPLAY_LIMIT = 50;
        const results = await searchOrganizations(
          {
            searchTerm: '',
            active: true,
            flowConnectMember: undefined,
            connected: undefined,
            limit: DISPLAY_LIMIT,
          },
          accessToken
        );
        const mappedResults: ManufacturerDirectoryEntry[] = results.map((r) => ({
          id: r.id,
          name: r.name,
          domain: r.domain || '',
          posContacts: r.posContacts?.map((c) => ({ name: c.name, email: c.email, phone: '' })),
          membershipTier: r.flowConnectMember ? 'flowconnect' : 'nemra-free',
          orgCount: r.members,
          category: 'General',
          territories: [],
        }));
        setDirectoryResults(mappedResults);
        // If we got exactly the limit, there might be more results
        setMayHaveMoreResults(results.length === DISPLAY_LIMIT);
      } catch (err) {
        console.error('Directory fetch failed', err);
        setDirectoryResults([]);
        setMayHaveMoreResults(false);
      } finally {
        setIsLoadingDirectory(false);
      }
    }
    fetchDirectory();
  }, [accessToken]);

  // API-based directory search
  useEffect(() => {
    if (!directorySearchTerm.trim()) {
      setDirectorySearchResults(null);
      setIsSearchingDirectory(false);
      return;
    }
    if (!accessToken) return;

    const DISPLAY_LIMIT = 50;
    setIsSearchingDirectory(true);

    searchOrganizations(
      {
        searchTerm: directorySearchTerm,
        active: true,
        limit: DISPLAY_LIMIT,
      },
      accessToken
    )
      .then((results) => {
        const mappedResults: ManufacturerDirectoryEntry[] = results.map((r) => ({
          id: r.id,
          name: r.name,
          domain: r.domain || '',
          posContacts: r.posContacts?.map((c) => ({ name: c.name, email: c.email, phone: '' })),
          membershipTier: r.flowConnectMember ? 'flowconnect' : 'nemra-free',
          orgCount: r.members,
          category: 'General',
          territories: [],
        }));
        setDirectorySearchResults(mappedResults);
        setMayHaveMoreResults(results.length === DISPLAY_LIMIT);
      })
      .catch((err) => {
        console.error('Search failed', err);
        setDirectorySearchResults([]);
        setMayHaveMoreResults(false);
      })
      .finally(() => setIsSearchingDirectory(false));
  }, [directorySearchTerm, accessToken]);

  // Add Manufacturer handler
  const handleAddManufacturer = useCallback(
    async (input: ManufacturerInput) => {
      setAddLoading(true);
      try {
        const newManufacturer = await createOrganization(input, accessToken);
        console.log('Created manufacturer:', newManufacturer);
        await createOrganizationConnection(newManufacturer.id, true, accessToken);
        toast({
          title: 'Manufacturer added',
          description: `${newManufacturer.name} added and invitation sent successfully.`,
          variant: 'success',
        });
        setShowAddModal(false);
      } catch (e: any) {
        toast({
          title: 'Error',
          description: e?.message || 'Failed to add manufacturer',
          variant: 'destructive',
        });
      } finally {
        setAddLoading(false);
      }
    },
    [accessToken]
  );

  // Add from directory handler
  const handleAddFromDirectory = useCallback(
    async (id: string) => {
      if (!accessToken) {
        toast({ title: 'Error', description: 'No access token available', variant: 'destructive' });
        return;
      }
      try {
        await createOrganizationConnection(id, false, accessToken);
        toast({
          title: 'Success',
          description: 'Manufacturer connection created and invitation sent',
          variant: 'success',
        });
      } catch (e: any) {
        toast({
          title: 'Error',
          description: e?.message || 'Failed to add manufacturer connection',
          variant: 'destructive',
        });
      }
    },
    [accessToken]
  );

  const activeManus = useMemo(
    () => manufacturerContacts.filter((m) => m.inviteStatus === 'active'),
    [manufacturerContacts]
  );
  const pendingManus = useMemo(
    () => manufacturerContacts.filter((m) => m.inviteStatus === 'pending'),
    [manufacturerContacts]
  );
  const notOnPlatformManus = useMemo(
    () => manufacturerContacts.filter((m) => m.inviteStatus === 'not_on_platform'),
    [manufacturerContacts]
  );

  // Use search results if searching, otherwise use all directory results
  const finalManufacturerDirectory = useMemo(
    () => directorySearchResults !== null ? directorySearchResults : directoryResults,
    [directorySearchResults, directoryResults]
  );

  const isInYourManufacturers = useCallback(
    (directory: ManufacturerDirectoryEntry) => {
      return manufacturerContacts.some((m) => m.domain === directory.domain);
    },
    [manufacturerContacts]
  );

  const handleFollowUp = useCallback((id: string) => {
    console.log('Follow up with manufacturer:', id);
  }, []);

  const handleRequestAccess = useCallback((id: string) => {
    console.log('Request access to manufacturer:', id);
  }, []);

  const handleOpenContactsModal = useCallback((manufacturer: string, contacts: POSContact[]) => {
    setContactsModal({ open: true, manufacturer, contacts });
  }, []);

  const handleCloseContactsModal = useCallback(() => {
    setContactsModal({ open: false, manufacturer: '', contacts: [] });
  }, []);

  const handleOpenVisibilityModal = useCallback((manufacturerId: string, manufacturerName: string) => {
    setVisibilityModal({ open: true, manufacturerId, manufacturerName });
  }, []);

  const handleCloseVisibilityModal = useCallback(() => {
    setVisibilityModal({ open: false, manufacturerId: '', manufacturerName: '' });
  }, []);

  const suggestedManufacturers = useMemo(
    () =>
      manufacturerContacts
        .filter((m) => m.inviteStatus === 'not_on_platform')
        .slice(0, 3)
        .map((m) => ({ id: m.id, name: m.name, domain: m.domain || '' })),
    [manufacturerContacts]
  );

  // Modal search effect
  useEffect(() => {
    if (!modalSearch.trim()) {
      setModalSearchResults([]);
      return;
    }
    if (!accessToken) return;

    setIsModalSearching(true);
    searchOrganizations(
      {
        searchTerm: modalSearch,
        active: true,
        connected: false,
        limit: 10,
      },
      accessToken
    )
      .then((results) => {
        setModalSearchResults(results.map((r) => ({ id: r.id, name: r.name, domain: r.domain || undefined })));
      })
      .catch(() => setModalSearchResults([]))
      .finally(() => setIsModalSearching(false));
  }, [modalSearch, accessToken]);

  const handleSelectModalSearchResult = useCallback(
    async (result: { id: string; name: string; domain?: string }) => {
      await handleAddFromDirectory(result.id);
      setShowAddModal(false);
      setModalSearch('');
      setModalSearchResults([]);
    },
    [handleAddFromDirectory]
  );

  // Filter functions
  const filterManufacturer = useCallback((manufacturer: ManufacturerContact, searchQuery: string, filterStatus: FilterStatus) => {
    const matchesSearch =
      manufacturer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (manufacturer.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesFilter = filterStatus === 'all' || manufacturer.inviteStatus === filterStatus;
    return matchesSearch && matchesFilter;
  }, []);

  const filterDirectory = useCallback(
    (directory: ManufacturerDirectoryEntry, searchQuery: string, filterValue: DirectoryFilter) => {
      // If we have API search results, skip search filtering (already filtered by API)
      const matchesSearch = directorySearchResults !== null ? true : (
        directory.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        directory.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        directory.category.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (filterValue === 'all') {
        return matchesSearch;
      }
      return matchesSearch && directory.membershipTier === filterValue;
    },
    [directorySearchResults]
  );

  // Render functions
  const renderSummaryCards = useCallback(
    (summaryData: any, onFilterChange: (filter: FilterStatus) => void) => {
      return (
        <div className="grid grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:border-green-300" onClick={() => onFilterChange('active')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">{summaryData.activeCount}</p>
                  <p className="text-sm text-muted-foreground">{summaryData.activeLabel}</p>
                </div>
                <Check className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-yellow-300" onClick={() => onFilterChange('pending')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{summaryData.pendingCount}</p>
                  <p className="text-sm text-muted-foreground">{summaryData.pendingLabel}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-gray-300" onClick={() => onFilterChange('not_on_platform')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-600">{summaryData.otherCount}</p>
                  <p className="text-sm text-muted-foreground">{summaryData.otherLabel}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      );
    },
    []
  );

  const renderManufacturerCard = useCallback(
    (manufacturer: ManufacturerContact) => {
      return (
        <RepManufacturerCard
          manufacturer={manufacturer}
          onFollowUp={handleFollowUp}
          onViewVisibilityDetails={handleOpenVisibilityModal}
        />
      );
    },
    [handleFollowUp, handleOpenVisibilityModal]
  );

  const renderDirectoryCard = useCallback(
    (directory: ManufacturerDirectoryEntry, isInNetwork: boolean) => {
      return (
        <RepManufacturerDirectoryCard
          manufacturer={directory}
          isInNetwork={isInNetwork}
          onViewContacts={handleOpenContactsModal}
          onRequestAccess={handleRequestAccess}
        />
      );
    },
    [handleOpenContactsModal, handleRequestAccess]
  );

  const renderInfoCard = useCallback(() => {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">Want more manufacturers reporting?</p>
              <p className="text-sm text-blue-700">
                Use the Nudge feature to reach out to manufacturers not yet on the platform.
              </p>
            </div>
            <Button variant="outline" className="ml-auto border-blue-300 text-blue-700" asChild>
              <Link href="/nemra-pos/rep/nudge">
                <Send className="w-4 h-4 mr-1" />
                Nudge Manufacturers
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }, []);

  // Visibility Modal Content
  const visibilityModalContent = useMemo(() => {
    if (!visibilityModal.open) return null;

    const manuVisibility = mockManufacturerFieldVisibility.find((m) => m.manufacturerId === visibilityModal.manufacturerId);
    const distVisibilities = mockDistributorFieldVisibility.filter((d) => d.manufacturerId === visibilityModal.manufacturerId);

    const getFieldLabel = (fieldName: string) => {
      const field = allPOSFields.find((f) => f.fieldName === fieldName);
      return field?.fieldLabel || fieldName;
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
          <CardHeader className="shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Field Visibility Details</CardTitle>
                <CardDescription>{visibilityModal.manufacturerName}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/nemra-pos/rep/visibility">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Full Visibility Grid
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleCloseVisibilityModal}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-y-auto space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Factory className="w-4 h-4 text-primary" />
                <h3 className="font-medium">Fields Hidden by Manufacturer</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                These fields are hidden by {visibilityModal.manufacturerName} and you cannot see them regardless of distributor settings.
              </p>
              {manuVisibility && manuVisibility.hiddenFields.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {manuVisibility.hiddenFields.map((field) => (
                    <Badge key={field} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      <Lock className="w-3 h-3 mr-1" />
                      {getFieldLabel(field)}
                    </Badge>
                  ))}
                </div>
              ) : (
                <Badge className="bg-green-100 text-green-700">
                  <Unlock className="w-3 h-3 mr-1" />
                  No fields hidden by manufacturer
                </Badge>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <h3 className="font-medium">Fields Hidden by Distributors</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Distributors can configure which fields are visible to reps. These settings are per distributor.
              </p>

              {distVisibilities.length > 0 ? (
                <div className="space-y-3">
                  {distVisibilities.map((dist) => (
                    <div key={dist.distributorId} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{dist.distributorName}</span>
                      </div>
                      {dist.hiddenFromRep.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {dist.hiddenFromRep.map((field) => (
                            <Badge key={field} variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                              <EyeOff className="w-3 h-3 mr-1" />
                              {getFieldLabel(field)}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <Badge className="text-xs bg-green-100 text-green-700">
                          <Eye className="w-3 h-3 mr-1" />
                          All fields visible
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No distributor visibility data available for this manufacturer.
                </p>
              )}
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Understanding Field Visibility</p>
              <p className="text-xs text-muted-foreground">
                Your data access is determined by both manufacturer and distributor settings. A field is only visible to you if both
                the manufacturer AND the distributor allow it. View the full visibility grid to see all field access across your
                network.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }, [visibilityModal, handleCloseVisibilityModal]);

  return (
    <ManufacturersPage<ManufacturerContact, ManufacturerDirectoryEntry>
      copy={repManufacturersCopy}
      manufacturerContacts={manufacturerContacts}
      manufacturerDirectory={finalManufacturerDirectory}
      isLoading={isLoading}
      isLoadingDirectory={isLoadingDirectory}
      isSearchingDirectory={isSearchingDirectory}
      mayHaveMoreResults={mayHaveMoreResults}
      onDirectorySearchChange={setDirectorySearchTerm}
      summaryData={{
        activeCount: activeManus.length,
        pendingCount: pendingManus.length,
        otherCount: notOnPlatformManus.length,
        activeLabel: 'Reporting Data',
        pendingLabel: 'Pending Setup',
        otherLabel: 'Not on Platform',
      }}
      statusFilters={STATUS_FILTERS}
      directoryFilters={DIRECTORY_FILTERS}
      onAddClick={() => setShowAddModal(true)}
      onUploadClick={() => setShowUploadModal(true)}
      renderSummaryCards={renderSummaryCards}
      renderManufacturerCard={renderManufacturerCard}
      renderDirectoryCard={renderDirectoryCard}
      renderInfoCard={renderInfoCard}
      addModalProps={{
        isOpen: showAddModal,
        onClose: () => {
          setShowAddModal(false);
          setModalSearch('');
          setModalSearchResults([]);
        },
        suggestedEntities: suggestedManufacturers,
        searchValue: modalSearch,
        onSearchChange: setModalSearch,
        searchResults: modalSearchResults,
        isSearching: isModalSearching,
        onSelectSearchResult: handleSelectModalSearchResult,
        onAdd: handleAddManufacturer as (input?: any) => void,
        addLoading: addLoading,
      }}
      uploadModalProps={{
        isOpen: showUploadModal,
        onClose: () => setShowUploadModal(false),
      }}
      contactsModalProps={{
        isOpen: contactsModal.open,
        onClose: handleCloseContactsModal,
        entityName: contactsModal.manufacturer,
        contacts: contactsModal.contacts,
      }}
      filterManufacturer={filterManufacturer}
      filterDirectory={filterDirectory}
      isInYourManufacturers={isInYourManufacturers}
      additionalContent={visibilityModalContent}
    />
  );
}
