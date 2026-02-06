'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Plus, Upload, AlertCircle } from 'lucide-react';
import {
  type ExtendedDistributorContact,
  type POSContact,
  type DistributorDirectoryEntry,
} from '@/lib/nemra-pos-data';
import { toast } from 'sonner';
import { ManufacturerDistributorSummaryCards } from '@/components/distributors/manufacturer-distributor-summary-cards';
import { ManufacturerDistributorCard } from '@/components/distributors/manufacturer-distributor-card';
import { ManufacturerDistributorDirectoryCard } from '@/components/distributors/manufacturer-distributor-directory-card';
import {
  getManufacturerDistributors,
  getDistributorDirectory,
  sendDistributorInvite,
  addDistributor,
} from '@/lib/graphql/manufacturer-distributors';
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

type Tab = 'your-distributors' | 'directory';
type FilterStatus = 'all' | 'active' | 'pending' | 'no_invite';
type DirectoryFilter = 'all' | 'nemra' | 'flowconnect';

const STATUS_FILTERS: FilterOption<FilterStatus>[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'no_invite', label: 'Not Invited' },
];

const DIRECTORY_FILTERS: FilterOption<DirectoryFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'nemra', label: 'NEMRA POS' },
  { value: 'flowconnect', label: 'FlowConnect Member' },
];

export default function DistributorsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('your-distributors');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryFilter, setDirectoryFilter] = useState<DirectoryFilter>('all');
  const [contactsModal, setContactsModal] = useState<{
    open: boolean;
    distributor: string;
    contacts: POSContact[];
  }>({
    open: false,
    distributor: '',
    contacts: [],
  });

  const [distributors, setDistributors] = useState<ExtendedDistributorContact[]>([]);
  const [directory, setDirectory] = useState<DistributorDirectoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDistributors();
    if (activeTab === 'directory') {
      loadDirectory();
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'directory') {
      loadDirectory();
    }
  }, [activeTab]);

  const loadDistributors = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getManufacturerDistributors();
      console.log('Manufacturer Distributors Result:', result);
      if (result?.distributors) {
        setDistributors(result.distributors);
        console.log('Distributors loaded:', result.distributors.length);
      }
    } catch (error) {
      console.error('Failed to load distributors:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadDirectory = useCallback(async () => {
    try {
      const result = await getDistributorDirectory();
      console.log('Distributor Directory Result:', result);
      if (result?.distributorDirectory) {
        setDirectory(result.distributorDirectory);
        console.log('Directory loaded:', result.distributorDirectory.length);
      }
    } catch (error) {
      console.error('Failed to load directory:', error);
    }
  }, []);

  const summary = useMemo(
    () => ({
      active: distributors.filter(d => d.inviteStatus === 'active').length,
      pending: distributors.filter(d => d.inviteStatus === 'pending').length,
      noInvite: distributors.filter(d => d.inviteStatus === 'no_invite').length,
    }),
    [distributors]
  );

  const filteredDists = useMemo(() => {
    return distributors.filter(dist => {
      const matchesSearch = dist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dist.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesFilter = filterStatus === 'all' || dist.inviteStatus === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [distributors, searchQuery, filterStatus]);

  const filteredDirectory = useMemo(() => {
    return directory.filter(dist => {
      const searchLower = directorySearch.toLowerCase();
      const matchesSearch = dist.name.toLowerCase().includes(searchLower) ||
        dist.domain.toLowerCase().includes(searchLower) ||
        dist.category.toLowerCase().includes(searchLower) ||
        dist.posContacts.some(c => c.name.toLowerCase().includes(searchLower));

      if (directoryFilter === 'all') {
        return matchesSearch;
      }
      if (directoryFilter === 'nemra') {
        return matchesSearch && (dist.membershipTier === 'nemra-free' || dist.membershipTier === 'nemra-paid');
      }
      return matchesSearch && dist.membershipTier === directoryFilter;
    });
  }, [directory, directorySearch, directoryFilter]);

  const isInYourDistributors = useCallback((domain: string) => {
    return distributors.some(d => d.domain === domain);
  }, [distributors]);

  const handleFilterChange = useCallback((status: FilterStatus) => {
    setFilterStatus(status);
  }, []);

  const handleResendInvite = useCallback(async (id: string) => {
    try {
      const result = await sendDistributorInvite(id);
      if (result?.sendDistributorInvite.success) {
        toast.success('Invite resent successfully');
        await loadDistributors();
      } else {
        toast.error(result?.sendDistributorInvite.message || 'Failed to resend invite');
      }
    } catch (error) {
      toast.error('Failed to resend invite');
    }
  }, [loadDistributors]);

  const handleSendInvite = useCallback(async (id: string) => {
    try {
      const result = await sendDistributorInvite(id);
      if (result?.sendDistributorInvite.success) {
        toast.success('Invite sent successfully');
        await loadDistributors();
      } else {
        toast.error(result?.sendDistributorInvite.message || 'Failed to send invite');
      }
    } catch (error) {
      toast.error('Failed to send invite');
    }
  }, [loadDistributors]);

  const handleEditMappings = useCallback((_id: string) => {
    toast.info('Custom mappings editor coming soon');
  }, []);

  const handleUploadAgreement = useCallback((_id: string) => {
    toast.info('Agreement upload coming soon');
  }, []);

  const handleViewContacts = useCallback((dist: DistributorDirectoryEntry) => {
    setContactsModal({
      open: true,
      distributor: dist.name,
      contacts: dist.posContacts,
    });
  }, []);

  const handleAddFromDirectory = useCallback(async (id: string) => {
    const dist = directory.find(d => d.id === id);
    if (!dist) return;

    try {
      const result = await addDistributor({
        domain: dist.domain,
        contactEmail: dist.posContacts[0]?.email,
        contactFirstName: dist.posContacts[0]?.name.split(' ')[0],
        contactLastName: dist.posContacts[0]?.name.split(' ').slice(1).join(' '),
      });

      if (result?.addDistributor.success) {
        toast.success('Distributor added successfully');
        await loadDistributors();
      } else {
        toast.error(result?.addDistributor.message || 'Failed to add distributor');
      }
    } catch (error) {
      toast.error('Failed to add distributor');
    }
  }, [directory, loadDistributors]);

  const handleCloseContactsModal = useCallback(() => {
    setContactsModal({ open: false, distributor: '', contacts: [] });
  }, []);

  const suggestedDistributors = useMemo(() =>
    distributors
      .filter(d => d.inviteStatus === 'no_invite')
      .slice(0, 3)
      .map(d => ({ id: d.id, name: d.name, domain: d.domain || '' })),
    [distributors]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading distributors...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Distributors</h1>
          <p className="text-muted-foreground">Manage distributors sending you POS data</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowUploadModal(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload List
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Distributor
          </Button>
        </div>
      </div>

      <TabNavigation
        tabs={[
          { id: 'your-distributors', label: 'Your Distributors' },
          { id: 'directory', label: 'Distributor Directory' },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as Tab)}
      />

      {activeTab === 'your-distributors' && (
        <>
          <ManufacturerDistributorSummaryCards
            summary={summary}
            onFilterChange={handleFilterChange}
          />

          <SearchAndFilter
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search distributors..."
            filterValue={filterStatus}
            onFilterChange={setFilterStatus}
            filterOptions={STATUS_FILTERS}
          />

          {filteredDists.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredDists.map((dist) => (
                    <ManufacturerDistributorCard
                      key={dist.id}
                      distributor={dist}
                      onResendInvite={handleResendInvite}
                      onSendInvite={handleSendInvite}
                      onEditMappings={handleEditMappings}
                      onUploadAgreement={handleUploadAgreement}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              icon={Building2}
              title="No distributors found"
              description="Try adjusting your search or filter"
            />
          )}

          {summary.active >= 3 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Free plan limit: 3 distributors</p>
                    <p className="text-sm text-blue-700">Upgrade to add more distributors to your network.</p>
                  </div>
                  <Button variant="outline" className="ml-auto border-blue-300 text-blue-700">
                    Upgrade Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {activeTab === 'directory' && (
        <>
          <DirectoryHeader
            title="FlowConnect Distributor Directory"
            description="Browse all distributors on the FlowConnect network. Contact them directly to start receiving POS data."
          />

          <SearchAndFilter
            searchValue={directorySearch}
            onSearchChange={setDirectorySearch}
            searchPlaceholder="Search by name, domain, category, or contact..."
            filterValue={directoryFilter}
            onFilterChange={setDirectoryFilter}
            filterOptions={DIRECTORY_FILTERS}
          />

          <div className="grid grid-cols-3 gap-4">
            {filteredDirectory.map((dist) => (
              <ManufacturerDistributorDirectoryCard
                key={dist.id}
                distributor={dist}
                isAlreadyAdded={isInYourDistributors(dist.domain)}
                onViewContacts={handleViewContacts}
                onAdd={handleAddFromDirectory}
              />
            ))}
          </div>

          {filteredDirectory.length === 0 && (
            <EmptyState
              icon={Building2}
              title="No distributors found"
              description="Try adjusting your search or filter"
            />
          )}
        </>
      )}

      <AddEntityModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Distributor"
        description="Search our directory or add by domain"
        entityIcon={Building2}
        suggestedEntities={suggestedDistributors}
        domainLabel="Company Domain"
        domainPlaceholder="e.g., newdistributor.com"
      />

      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Distributor List"
        description="Upload a CSV with distributor names and domains"
        csvColumns="CSV with columns: Name, Domain, Contact Email"
      />

      <ContactsModal
        isOpen={contactsModal.open}
        onClose={handleCloseContactsModal}
        entityName={contactsModal.distributor}
        contacts={contactsModal.contacts}
      />
    </div>
  );
}
