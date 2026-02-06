'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Plus,
  Upload,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { RepDistributorCard } from '@/components/distributors/rep-distributor-card';
import { RepDistributorDirectoryCard } from '@/components/distributors/rep-distributor-directory-card';
import { RepDistributorSummaryCards } from '@/components/distributors/rep-distributor-summary-cards';
import {
  getRepDistributors,
  type RepDistributorContact,
  type DistributorDirectoryEntry,
} from '@/lib/gqlSdk';
import {
  TabNavigation,
  SearchAndFilter,
  DirectoryHeader,
  EmptyState,
  ContactsModal,
  UploadModal,
  AddEntityModal,
  type FilterOption,
  type Contact,
} from '@/components/shared';

type Tab = 'your-distributors' | 'directory';
type FilterStatus = 'all' | 'on_flowconnect' | 'invited' | 'not_invited';
type DirectoryFilter = 'all' | 'nemra-free' | 'nemra-paid' | 'flowconnect';

const STATUS_FILTERS: FilterOption<FilterStatus>[] = [
  { value: 'all', label: 'All' },
  { value: 'on_flowconnect', label: 'On FlowConnect' },
  { value: 'invited', label: 'Invited' },
  { value: 'not_invited', label: 'Not Invited' },
];

const DIRECTORY_FILTERS: FilterOption<DirectoryFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'nemra-paid', label: 'NEMRA POS Paid' },
  { value: 'nemra-free', label: 'NEMRA POS Free' },
  { value: 'flowconnect', label: 'FlowConnect Member' },
];

export default function RepDistributorsPage() {
  // Get auth info at the component level (following Rules of Hooks)

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
    contacts: Contact[]
  }>({
    open: false,
    distributor: '',
    contacts: [],
  });

  const [distributors, setDistributors] = useState<RepDistributorContact[]>([]);
  const [directory, setDirectory] = useState<DistributorDirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch access token from the server
        const response = await fetch('/api/auth/token');
        const { accessToken } = await response.json();

        console.log('Fetching distributors with token:', accessToken ? 'Token present' : 'No token');

        // Pass the token to the GraphQL query
        const data = await getRepDistributors(accessToken);
        setDistributors(data.distributorContacts);
        setDirectory(data.distributorDirectory);
      } catch (error) {
        console.error('Error fetching distributor data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const onFlowConnectDists = useMemo(
    () => distributors.filter(d => d.status === 'on_flowconnect'),
    [distributors]
  );

  const invitedDists = useMemo(
    () => distributors.filter(d => d.status === 'invited'),
    [distributors]
  );

  const notInvitedDists = useMemo(
    () => distributors.filter(d => d.status === 'not_invited'),
    [distributors]
  );

  const filteredDists = useMemo(() => {
    return distributors.filter(dist => {
      const matchesSearch = dist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dist.domain.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'all' || dist.status === filterStatus;
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
      return matchesSearch && dist.membershipTier === directoryFilter;
    });
  }, [directory, directorySearch, directoryFilter]);

  const isInYourDistributors = useCallback((domain: string) => {
    return distributors.some(d => d.domain === domain);
  }, [distributors]);

  const handleFollowUp = useCallback((id: string) => {
    console.log('Follow up with distributor:', id);
  }, []);

  const handleInvite = useCallback((id: string) => {
    console.log('Invite distributor:', id);
  }, []);

  const handleRequestPosData = useCallback((id: string) => {
    console.log('Request POS data from distributor:', id);
  }, []);

  const handleAddToOutreach = useCallback((id: string) => {
    console.log('Add distributor to outreach:', id);
  }, []);

  const handleViewContacts = useCallback((name: string, contacts: Contact[]) => {
    setContactsModal({
      open: true,
      distributor: name,
      contacts,
    });
  }, []);

  const handleFilterChange = useCallback((filter: FilterStatus) => {
    setFilterStatus(filter);
  }, []);

  const suggestedDistributors = useMemo(() =>
    distributors
      .filter(d => d.status === 'not_invited')
      .slice(0, 3)
      .map(d => ({ id: d.id, name: d.name, domain: d.domain })),
    [distributors]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Distributors</h1>
          <p className="text-muted-foreground">Track and encourage distributors to join FlowConnect</p>
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

      {/* Explainer Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <ArrowRight className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">How POS Data Flows to You</p>
              <p className="text-sm text-muted-foreground mt-1">
                Distributors send POS data to manufacturers on FlowConnect. When your manufacturers receive this data,
                it flows through to you for your territories. More distributors on FlowConnect means more complete POS data for you.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <TabNavigation
        tabs={[
          { id: 'your-distributors', label: 'Distributor Outreach' },
          { id: 'directory', label: 'FlowConnect Directory' },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as Tab)}
      />

      {activeTab === 'your-distributors' && (
        <>
          <RepDistributorSummaryCards
            onFlowConnectCount={onFlowConnectDists.length}
            invitedCount={invitedDists.length}
            notInvitedCount={notInvitedDists.length}
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

          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredDists.map((dist) => (
                  <RepDistributorCard
                    key={dist.id}
                    distributor={dist}
                    onFollowUp={handleFollowUp}
                    onInvite={handleInvite}
                    onRequestPosData={handleRequestPosData}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {filteredDists.length === 0 && (
            <EmptyState
              icon={Building2}
              title="No distributors found"
              description="Try adjusting your search or filter"
            />
          )}

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Help grow the FlowConnect network</p>
                  <p className="text-sm text-blue-700">
                    When distributors join FlowConnect and connect with your manufacturers, you get more complete POS data for your territories.
                    Reach out to distributors not yet on the platform.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'directory' && (
        <>
          <DirectoryHeader
            title="FlowConnect Distributor Directory"
            description="Browse distributors on FlowConnect. See which ones are already connected with your manufacturers."
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
              <Card key={dist.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-0">
                  <RepDistributorDirectoryCard
                    distributor={dist}
                    isTracking={isInYourDistributors(dist.domain)}
                    onAddToOutreach={handleAddToOutreach}
                    onViewContacts={handleViewContacts}
                  />
                </CardContent>
              </Card>
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
        description="Track a distributor for outreach"
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
        onClose={() => setContactsModal({ open: false, distributor: '', contacts: [] })}
        entityName={contactsModal.distributor}
        contacts={contactsModal.contacts}
      />
    </div>
  );
}
