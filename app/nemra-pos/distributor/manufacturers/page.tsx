'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import {
  searchOrganizations,
  createOrganizationConnection,
  createOrganization,
  inviteConnection,
  uploadAgreement,
  type ManufacturerContact,
  type ManufacturerDirectoryEntry,
  type POSContact,
  type ManufacturerInput,
} from '@/lib/organizationsGqlSdk';
import { ManufacturerCard } from '@/components/manufacturers/manufacturer-card';
import { ManufacturerDirectoryCard } from '@/components/manufacturers/manufacturer-directory-card';
import { ManufacturerSummaryCards } from '@/components/manufacturers/manufacturer-summary-cards';
import { ManufacturersPage } from '@/components/manufacturers/ManufacturersPage';
import { distributorManufacturersCopy } from '@/components/manufacturers/manufacturers-copy';
import { type FilterOption } from '@/components/shared';
import { toast } from '@/components/ui/use-toast';

type FilterStatus = 'all' | 'active' | 'pending' | 'no_invite';
type DirectoryFilter = 'all' | 'nemra-free' | 'nemra-paid' | 'flowconnect';

const STATUS_FILTERS: FilterOption<FilterStatus>[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'no_invite', label: 'Not Invited' },
];

const DIRECTORY_FILTERS: FilterOption<DirectoryFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'flowconnect', label: 'FlowConnect Member' },
];

export default function DistributorManufacturersPage() {
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

  // Data state
  const [manufacturerContacts, setManufacturerContacts] = useState<ManufacturerContact[]>([]);
  const [connectedManufacturers, setConnectedManufacturers] = useState<ManufacturerDirectoryEntry[]>([]);
  const [directoryResults, setDirectoryResults] = useState<ManufacturerDirectoryEntry[]>([]);
  const [directorySearchResults, setDirectorySearchResults] = useState<ManufacturerDirectoryEntry[] | null>(null);
  const [directorySearchTerm, setDirectorySearchTerm] = useState('');
  const [mayHaveMoreResults, setMayHaveMoreResults] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDirectory, setIsLoadingDirectory] = useState(false);
  const [shouldFetchDirectory, setShouldFetchDirectory] = useState(false);
  const [isSearchingDirectory, setIsSearchingDirectory] = useState(false);
  const [accessToken, setAccessToken] = useState<string | undefined>();
  const [addLoading, setAddLoading] = useState(false);
  const [addingManufacturerId, setAddingManufacturerId] = useState<string | null>(null);
  const [addedManufacturerIds, setAddedManufacturerIds] = useState<Set<string>>(new Set());
  const [uploadingAgreementId, setUploadingAgreementId] = useState<string | null>(null);
  const [sendingInviteId, setSendingInviteId] = useState<string | null>(null);

  // Add Manufacturer modal handler
  const handleAddManufacturer = useCallback(
    async (input: ManufacturerInput) => {
      setAddLoading(true);
      try {
        const newManufacturer = await createOrganization(input, accessToken);
        console.log('Created manufacturer:', newManufacturer);
        await createOrganizationConnection(newManufacturer.id, false, accessToken);
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

  // Fetch data when access token is available
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

        console.log('Connected manufacturers fetched:', connected);

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
        console.error('Error fetching manufacturers:', error);
        setManufacturerContacts([]);
        setConnectedManufacturers([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [accessToken]);

  // Fetch all manufacturers for directory (lazy loaded when tab is activated)
  useEffect(() => {
    async function fetchDirectory() {
      if (!accessToken || !shouldFetchDirectory) return;

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
          membershipTier: r.flowConnectMember ? 'flowconnect' : 'nemra-free',
          orgCount: r.members,
          category: 'General',
          posContacts: r.posContacts?.map((c) => ({ name: c.name, email: c.email, phone: '' })),
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
  }, [accessToken, shouldFetchDirectory]);

  // Handler for when directory tab is activated
  const handleDirectoryTabActivated = useCallback(() => {
    setShouldFetchDirectory(true);
  }, []);

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
          membershipTier: r.flowConnectMember ? 'flowconnect' : 'nemra-free',
          orgCount: r.members,
          category: 'General',
          posContacts: r.posContacts?.map((c) => ({ name: c.name, email: c.email, phone: '' })),
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

  const connectedIds = useMemo(() => new Set(connectedManufacturers.map((m) => m.id)), [connectedManufacturers]);

  const activeManus = useMemo(
    () => manufacturerContacts.filter((m) => m.inviteStatus === 'active'),
    [manufacturerContacts]
  );
  const pendingManus = useMemo(
    () => manufacturerContacts.filter((m) => m.inviteStatus === 'pending'),
    [manufacturerContacts]
  );
  const noInviteManus = useMemo(
    () => manufacturerContacts.filter((m) => m.inviteStatus === 'no_invite'),
    [manufacturerContacts]
  );

  const handleResendInvite = useCallback((id: string) => {
    console.log('Resend invite to:', id);
  }, []);

  const handleSendInvite = useCallback(
    async (id: string) => {
      if (!accessToken) {
        toast({ title: 'Error', description: 'No access token available', variant: 'destructive' });
        return;
      }
      setSendingInviteId(id);
      try {
        const success = await inviteConnection(id, accessToken);
        if (success) {
          // Update the manufacturer status to pending
          setManufacturerContacts((prev) =>
            prev.map((m) => (m.id === id ? { ...m, inviteStatus: 'pending' as const } : m))
          );
          toast({ title: 'Success', description: 'Invitation sent successfully', variant: 'success' });
        }
      } catch (e: any) {
        toast({ title: 'Error', description: e?.message || 'Failed to send invitation', variant: 'destructive' });
      } finally {
        setSendingInviteId(null);
      }
    },
    [accessToken]
  );

  const handleUploadAgreement = useCallback(
    async (id: string, file: File) => {
      if (!accessToken) {
        toast({ title: 'Error', description: 'No access token available', variant: 'destructive' });
        return;
      }
      setUploadingAgreementId(id);
      try {
        const result = await uploadAgreement(id, file, accessToken);
        // Update the manufacturer contact with the uploaded file name
        setManufacturerContacts((prev) =>
          prev.map((m) => (m.id === id ? { ...m, agreementFileName: result.fileName } : m))
        );
        toast({ title: 'Success', description: 'Agreement uploaded successfully', variant: 'success' });
      } catch (e: any) {
        toast({ title: 'Error', description: e?.message || 'Failed to upload agreement', variant: 'destructive' });
      } finally {
        setUploadingAgreementId(null);
      }
    },
    [accessToken]
  );

  const handleAddFromDirectory = useCallback(
    async (id: string) => {
      if (!accessToken) {
        toast({ title: 'Error', description: 'No access token available', variant: 'destructive' });
        return;
      }
      setAddingManufacturerId(id);
      try {
        await createOrganizationConnection(id, true, accessToken);
        setAddedManufacturerIds((prev) => new Set(prev).add(id));
        toast({
          title: 'Success',
          description: 'Manufacturer added. You can send the invitation from Your Manufacturers.',
          variant: 'success',
        });
      } catch (e: any) {
        toast({
          title: 'Error',
          description: e?.message || 'Failed to add manufacturer connection',
          variant: 'destructive',
        });
      } finally {
        setAddingManufacturerId(null);
      }
    },
    [accessToken]
  );

  const handleOpenContactsModal = useCallback((manufacturer: string, contacts: POSContact[] | undefined) => {
    setContactsModal({ open: true, manufacturer, contacts: contacts ?? [] });
  }, []);

  const handleCloseContactsModal = useCallback(() => {
    setContactsModal({ open: false, manufacturer: '', contacts: [] });
  }, []);

  const suggestedManufacturers = useMemo(
    () =>
      manufacturerContacts
        .filter((m) => m.inviteStatus === 'no_invite')
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

  // Use search results if searching, otherwise use all directory results
  const manufacturerDirectory = directorySearchResults !== null ? directorySearchResults : directoryResults;

  // Filter functions
  const filterManufacturer = useCallback((manufacturer: ManufacturerContact, searchQuery: string, filterStatus: FilterStatus) => {
    const matchesSearch =
      manufacturer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (manufacturer.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    let matchesStatus = true;
    if (filterStatus !== 'all') {
      matchesStatus = manufacturer.inviteStatus === filterStatus;
    }
    return matchesSearch && matchesStatus;
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

  const isInYourManufacturers = useCallback(
    (directory: ManufacturerDirectoryEntry) => {
      return manufacturerContacts.some((m) => m.domain === directory.domain);
    },
    [manufacturerContacts]
  );

  // Render functions
  const renderSummaryCards = useCallback(
    (summaryData: any, onFilterChange: (filter: FilterStatus) => void) => {
      return (
        <ManufacturerSummaryCards
          activeCount={summaryData.activeCount}
          pendingCount={summaryData.pendingCount}
          notInvitedCount={summaryData.otherCount}
          onFilterChange={onFilterChange}
        />
      );
    },
    []
  );

  const renderManufacturerCard = useCallback(
    (manufacturer: ManufacturerContact) => {
      return (
        <ManufacturerCard
          manufacturer={manufacturer}
          onResendInvite={handleResendInvite}
          onSendInvite={handleSendInvite}
          onUploadAgreement={handleUploadAgreement}
          isUploadingAgreement={uploadingAgreementId === manufacturer.id}
          isSendingInvite={sendingInviteId === manufacturer.id}
        />
      );
    },
    [handleResendInvite, handleSendInvite, handleUploadAgreement, uploadingAgreementId, sendingInviteId]
  );

  const renderDirectoryCard = useCallback(
    (directory: ManufacturerDirectoryEntry, isAlreadyAdded: boolean) => {
      return (
        <ManufacturerDirectoryCard
          manufacturer={directory}
          isAlreadyAdded={isAlreadyAdded}
          isAdding={addingManufacturerId === directory.id}
          isAdded={addedManufacturerIds.has(directory.id)}
          onViewContacts={handleOpenContactsModal}
          onAdd={handleAddFromDirectory}
        />
      );
    },
    [handleOpenContactsModal, handleAddFromDirectory, addingManufacturerId, addedManufacturerIds]
  );

  const renderInfoCard = useCallback(() => {
    if (activeManus.length < 3) return null;
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">Free plan limit: 3 manufacturers</p>
              <p className="text-sm text-blue-700">Upgrade to add more manufacturers to your network.</p>
            </div>
            <Button variant="outline" className="ml-auto border-blue-300 text-blue-700">
              Upgrade Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }, [activeManus.length]);

  return (
    <ManufacturersPage<ManufacturerContact, ManufacturerDirectoryEntry>
      copy={distributorManufacturersCopy}
      manufacturerContacts={manufacturerContacts}
      manufacturerDirectory={manufacturerDirectory}
      isLoading={isLoading}
      isLoadingDirectory={isLoadingDirectory}
      isSearchingDirectory={isSearchingDirectory}
      mayHaveMoreResults={mayHaveMoreResults}
      onDirectorySearchChange={setDirectorySearchTerm}
      onDirectoryTabActivated={handleDirectoryTabActivated}
      summaryData={{
        activeCount: activeManus.length,
        pendingCount: pendingManus.length,
        otherCount: noInviteManus.length,
        activeLabel: 'Active',
        pendingLabel: 'Pending',
        otherLabel: 'Not Invited',
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
    />
  );
}
