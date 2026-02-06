'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Briefcase,
  Plus,
  Search,
  X,
  Globe,
  Upload,
  Pencil,
  Save,
  Map,
} from 'lucide-react';
import {
  mockRepFirms,
  flowConnectRepDirectory,
  repFirmColors,
  type RepFirmForManufacturer,
  type RepFirmStatus,
} from '@/lib/nemra-pos-data';
import { cn } from '@/lib/utils';
import { RepFirmSummaryCards } from '@/components/rep-firms/rep-firm-summary-cards';
import { RepFirmCard } from '@/components/rep-firms/rep-firm-card';
import { RepFirmDirectoryCard } from '@/components/rep-firms/rep-firm-directory-card';

import {
  ComposableMap,
  Geographies,
  Geography,
} from 'react-simple-maps';

// US States TopoJSON URL
const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

// State name to abbreviation mapping
const STATE_NAME_TO_ABBREV: { [key: string]: string } = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
  'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
  'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
  'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
  'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
  'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
  'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
  'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
  'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC'
};

// Reverse mapping
const ABBREV_TO_NAME: { [key: string]: string } = {};
Object.entries(STATE_NAME_TO_ABBREV).forEach(([name, abbrev]) => {
  ABBREV_TO_NAME[abbrev] = name;
});

type Tab = 'your-rep-firms' | 'directory' | 'rep-map';

// All US state abbreviations
const ALL_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL',
  'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME',
  'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH',
  'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI',
  'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export default function RepFirmsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('your-rep-firms');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | RepFirmStatus>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryFilter, setDirectoryFilter] = useState<'all' | 'nemra' | 'flowconnect'>('all');
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [hoveredRepFirm, setHoveredRepFirm] = useState<string | null>(null);
  const [editingTerritories, setEditingTerritories] = useState<string[]>([]);
  const [showTerritoryModal, setShowTerritoryModal] = useState(false);
  const [selectedRepForEdit, setSelectedRepForEdit] = useState<RepFirmForManufacturer | null>(null);
  const [repFirmTerritories, setRepFirmTerritories] = useState<Record<string, string[]>>(() => {
    // Initialize from mock data
    const territories: Record<string, string[]> = {};
    mockRepFirms.forEach(rep => {
      territories[rep.id] = [...rep.territories];
    });
    return territories;
  });
  const [showZipModal, setShowZipModal] = useState(false);
  const [zipOverrides] = useState<Record<string, { repFirmId: string; zips: string[] }>>({});

  // Get territories for a rep firm (from state or default)
  const getRepTerritories = (repId: string): string[] => {
    return repFirmTerritories[repId] || [];
  };

  // Open territory edit modal
  const openTerritoryEdit = (rep: RepFirmForManufacturer) => {
    setSelectedRepForEdit(rep);
    setEditingTerritories([...getRepTerritories(rep.id)]);
    setShowTerritoryModal(true);
  };

  // Save territory changes
  const saveTerritoryChanges = () => {
    if (selectedRepForEdit) {
      setRepFirmTerritories(prev => ({
        ...prev,
        [selectedRepForEdit.id]: [...editingTerritories],
      }));
      setShowTerritoryModal(false);
      setSelectedRepForEdit(null);
    }
  };

  // Toggle state in editing territories
  const toggleStateInEdit = (state: string) => {
    setEditingTerritories(prev =>
      prev.includes(state)
        ? prev.filter(s => s !== state)
        : [...prev, state]
    );
  };

  // Get color for a state based on current assignments
  const getDynamicStateColor = useCallback((stateCode: string) => {
    // Find which rep firm has this state
    for (const [repId, territories] of Object.entries(repFirmTerritories)) {
      if (territories.includes(stateCode)) {
        if (hoveredRepFirm && hoveredRepFirm !== repId) {
          return '#e5e7eb'; // gray out other states
        }
        return repFirmColors[repId] || '#d1d5db';
      }
    }
    return '#f3f4f6'; // unassigned
  }, [repFirmTerritories, hoveredRepFirm]);

  // Get rep firm for a state dynamically
  const getDynamicRepFirmForState = useCallback((stateCode: string) => {
    for (const [repId, territories] of Object.entries(repFirmTerritories)) {
      if (territories.includes(stateCode)) {
        return mockRepFirms.find(r => r.id === repId);
      }
    }
    return null;
  }, [repFirmTerritories]);

  // Memoized filtered lists
  const activeReps = useMemo(
    () => mockRepFirms.filter(r => r.status === 'active'),
    []
  );
  const pendingReps = useMemo(
    () => mockRepFirms.filter(r => r.status === 'pending'),
    []
  );
  const notConnectedReps = useMemo(
    () => mockRepFirms.filter(r => r.status === 'not_connected'),
    []
  );

  const filteredReps = useMemo(() => {
    return mockRepFirms.filter(rep => {
      const matchesSearch = rep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rep.contactEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rep.territories.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFilter = filterStatus === 'all' || rep.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, filterStatus]);

  const filteredDirectory = useMemo(() => {
    return flowConnectRepDirectory.filter(rep => {
      const searchLower = directorySearch.toLowerCase();
      const matchesSearch = rep.name.toLowerCase().includes(searchLower) ||
        rep.contactEmail.toLowerCase().includes(searchLower) ||
        rep.territories.some(t => t.toLowerCase().includes(searchLower)) ||
        (rep.contactName && rep.contactName.toLowerCase().includes(searchLower));

      if (directoryFilter === 'all') {
        return matchesSearch;
      }
      return matchesSearch && rep.membershipTier === directoryFilter;
    });
  }, [directorySearch, directoryFilter]);

  const isInYourRepFirms = useCallback((name: string) => {
    return mockRepFirms.some(r => r.name === name);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rep Firms</h1>
          <p className="text-muted-foreground">Manage your rep firm network and territory assignments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowUploadModal(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload List
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Rep Firm
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('your-rep-firms')}
            className={cn(
              "pb-3 px-1 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'your-rep-firms'
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Your Rep Firms
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={cn(
              "pb-3 px-1 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'directory'
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Rep Directory
          </button>
          <button
            onClick={() => setActiveTab('rep-map')}
            className={cn(
              "pb-3 px-1 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'rep-map'
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Rep Map
          </button>
        </div>
      </div>

      {activeTab === 'your-rep-firms' && (
        <>
          {/* Summary Cards */}
          <RepFirmSummaryCards
            connectedCount={activeReps.length}
            pendingCount={pendingReps.length}
            notConnectedCount={notConnectedReps.length}
            onFilterChange={setFilterStatus}
          />

          {/* Search and Filter */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search rep firms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-1">
              {(['all', 'active', 'pending', 'not_connected'] as const).map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                >
                  {status === 'all' ? 'All' : status === 'not_connected' ? 'Not Connected' : status === 'active' ? 'Connected' : 'Pending'}
                </Button>
              ))}
            </div>
          </div>

          {/* Rep Firms List */}
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredReps.map((rep) => (
                  <RepFirmCard
                    key={rep.id}
                    repFirm={rep}
                    territories={getRepTerritories(rep.id)}
                    repFirmColor={repFirmColors[rep.id] || '#d1d5db'}
                    onEditTerritories={() => openTerritoryEdit(rep)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {filteredReps.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="font-medium">No rep firms found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your search or filter</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {activeTab === 'directory' && (
        <>
          {/* Directory Header */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">FlowConnect Rep Firm Directory</p>
                <p className="text-sm text-muted-foreground">
                  Browse rep firms on FlowConnect. Connect with them to share POS data for their territories.
                </p>
              </div>
            </div>
          </div>

          {/* Directory Search and Filter */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, territory, or contact..."
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-1">
              <Button
                variant={directoryFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDirectoryFilter('all')}
              >
                All
              </Button>
              <Button
                variant={directoryFilter === 'nemra' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDirectoryFilter('nemra')}
              >
                NEMRA
              </Button>
              <Button
                variant={directoryFilter === 'flowconnect' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDirectoryFilter('flowconnect')}
              >
                FlowConnect Member
              </Button>
            </div>
          </div>

          {/* Directory Grid */}
          <div className="grid grid-cols-3 gap-4">
            {filteredDirectory.map((rep) => (
              <RepFirmDirectoryCard
                key={rep.id}
                repFirm={rep}
                isInYourNetwork={isInYourRepFirms(rep.name)}
              />
            ))}
          </div>

          {filteredDirectory.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="font-medium">No rep firms found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your search or filter</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {activeTab === 'rep-map' && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Territory Map</CardTitle>
                  <CardDescription>
                    Click on a state to assign it to a rep firm, or click on a rep firm below to edit their territories.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6">
                {/* Map */}
                <div className="flex-1 relative" style={{ height: '500px' }}>
                  <ComposableMap
                    projection="geoAlbersUsa"
                    projectionConfig={{ scale: 1000 }}
                    width={800}
                    height={500}
                    style={{ width: '100%', height: '100%' }}
                  >
                    <Geographies geography={GEO_URL}>
                      {({ geographies }: { geographies: Array<{ rsmKey: string; properties: { name: string } }> }) =>
                        geographies.map((geo: { rsmKey: string; properties: { name: string } }) => {
                          // Get state abbreviation from geography properties
                          const stateName = geo.properties?.name || '';
                          const stateAbbrev = STATE_NAME_TO_ABBREV[stateName] || '';
                          const isHovered = hoveredState === stateAbbrev;

                          // Use dynamic state color
                          const fillColor = getDynamicStateColor(stateAbbrev);

                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill={fillColor}
                              stroke={isHovered ? '#1f2937' : '#9ca3af'}
                              strokeWidth={isHovered ? 2 : 0.5}
                              style={{
                                default: {
                                  outline: 'none',
                                  cursor: 'pointer',
                                },
                                hover: {
                                  outline: 'none',
                                  fill: fillColor,
                                  stroke: '#1f2937',
                                  strokeWidth: 2,
                                },
                                pressed: {
                                  outline: 'none',
                                },
                              }}
                              onMouseEnter={() => {
                                if (stateAbbrev) {
                                  setHoveredState(stateAbbrev);
                                }
                              }}
                              onMouseLeave={() => {
                                setHoveredState(null);
                              }}
                            />
                          );
                        })
                      }
                    </Geographies>
                  </ComposableMap>

                  {/* Tooltip */}
                  {hoveredState && (
                    <div className="absolute bottom-4 left-4 right-4 p-3 bg-white border rounded-lg shadow-lg">
                      {(() => {
                        const repFirm = getDynamicRepFirmForState(hoveredState);
                        const stateName = ABBREV_TO_NAME[hoveredState] || hoveredState;
                        return repFirm ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: repFirmColors[repFirm.id] }}
                              />
                              <div>
                                <p className="font-medium">{stateName} ({hoveredState})</p>
                                <p className="text-sm text-muted-foreground">
                                  Assigned to: <span className="font-medium text-foreground">{repFirm.name}</span>
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openTerritoryEdit(repFirm)}
                            >
                              <Pencil className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{stateName} ({hoveredState})</p>
                              <p className="text-sm text-muted-foreground">No rep firm assigned</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Show modal to assign state to a rep firm
                                setShowTerritoryModal(true);
                                setSelectedRepForEdit(null);
                                setEditingTerritories([hoveredState]);
                              }}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Assign
                            </Button>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Legend with edit buttons */}
                <div className="w-72 shrink-0">
                  <p className="font-medium mb-3">Rep Firms</p>
                  <div className="space-y-2">
                    {mockRepFirms.map((rep) => {
                      const territories = getRepTerritories(rep.id);
                      return (
                        <div
                          key={rep.id}
                          className={cn(
                            "p-3 rounded-lg border transition-colors",
                            hoveredRepFirm === rep.id ? "bg-muted border-primary" : "hover:bg-muted/50"
                          )}
                          onMouseEnter={() => setHoveredRepFirm(rep.id)}
                          onMouseLeave={() => setHoveredRepFirm(null)}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div
                              className="w-4 h-4 rounded shrink-0"
                              style={{ backgroundColor: repFirmColors[rep.id] || '#d1d5db' }}
                            />
                            <p className="text-sm font-medium truncate flex-1">{rep.name}</p>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {territories.length > 0 ? (
                              territories.map(state => (
                                <Badge
                                  key={state}
                                  variant="secondary"
                                  className="text-xs"
                                  style={{
                                    backgroundColor: `${repFirmColors[rep.id] || '#d1d5db'}20`,
                                    color: repFirmColors[rep.id] || '#666',
                                  }}
                                >
                                  {state}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">No states</span>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-7 text-xs"
                            onClick={() => openTerritoryEdit(rep)}
                          >
                            <Pencil className="w-3 h-3 mr-1" />
                            Edit Territories
                          </Button>
                        </div>
                      );
                    })}
                    <div className="flex items-center gap-3 p-2 mt-2">
                      <div className="w-4 h-4 rounded shrink-0 bg-gray-100 border border-gray-300" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Unassigned</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setShowZipModal(true)}
                    >
                      <Map className="w-4 h-4 mr-2" />
                      Manage ZIP Code Overrides
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      ZIP code overrides allow you to assign specific ZIP codes to a different rep firm than their state default.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Add Rep Firm Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Add Rep Firm</CardTitle>
                  <CardDescription>Search our directory or add manually</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search rep firms..." className="pl-10" />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Suggested Rep Firms</p>
                {flowConnectRepDirectory.slice(0, 3).map((rep) => (
                  <button
                    key={rep.id}
                    className="w-full flex items-center gap-3 p-3 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left"
                  >
                    <Briefcase className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{rep.name}</p>
                      <p className="text-sm text-muted-foreground">{rep.territories.join(', ')}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t space-y-3">
                <p className="text-sm font-medium">Or add manually:</p>
                <div className="space-y-2">
                  <Label>Rep Firm Name</Label>
                  <Input placeholder="e.g., Eastern Sales Associates" />
                </div>
                <div className="space-y-2">
                  <Label>Territories (comma-separated state codes)</Label>
                  <Input placeholder="e.g., NY, NJ, PA" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Contact Name</Label>
                    <Input placeholder="e.g., John Smith" />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Email</Label>
                    <Input placeholder="e.g., john@repfirm.com" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button>Add Rep Firm</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upload List Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Upload Rep Firm List</CardTitle>
                  <CardDescription>Upload a CSV with rep firm details</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowUploadModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium">Click to upload or drag and drop</p>
                <p className="text-sm text-muted-foreground">CSV with columns: Name, Territories, Contact Name, Contact Email</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowUploadModal(false)}>Cancel</Button>
                <Button>Upload</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Territory Edit Modal */}
      {showTerritoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {selectedRepForEdit ? `Edit Territories: ${selectedRepForEdit.name}` : 'Assign State to Rep Firm'}
                  </CardTitle>
                  <CardDescription>
                    {selectedRepForEdit
                      ? 'Select which states this rep firm covers'
                      : 'Choose a rep firm to assign the selected state(s) to'}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => {
                  setShowTerritoryModal(false);
                  setSelectedRepForEdit(null);
                  setEditingTerritories([]);
                }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 overflow-y-auto flex-1">
              {selectedRepForEdit ? (
                <>
                  {/* State selection grid */}
                  <div>
                    <p className="text-sm font-medium mb-3">Select States</p>
                    <div className="grid grid-cols-8 gap-2">
                      {ALL_STATES.map(state => {
                        const isSelected = editingTerritories.includes(state);
                        // Check if another rep firm has this state
                        const otherRepFirm = Object.entries(repFirmTerritories).find(
                          ([repId, territories]) => repId !== selectedRepForEdit.id && territories.includes(state)
                        );
                        const isAssignedElsewhere = !!otherRepFirm;
                        const otherRepName = isAssignedElsewhere
                          ? mockRepFirms.find(r => r.id === otherRepFirm[0])?.name
                          : null;

                        return (
                          <button
                            key={state}
                            onClick={() => toggleStateInEdit(state)}
                            className={cn(
                              "p-2 rounded border text-sm font-medium transition-colors relative",
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : isAssignedElsewhere
                                  ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                  : "border-gray-200 hover:border-primary hover:bg-primary/5"
                            )}
                            title={isAssignedElsewhere ? `Currently assigned to ${otherRepName}` : undefined}
                          >
                            {state}
                            {isAssignedElsewhere && !isSelected && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      <span className="inline-block w-2 h-2 bg-amber-500 rounded-full mr-1" />
                      States with amber indicator are currently assigned to another rep firm
                    </p>
                  </div>

                  {/* Selected states summary */}
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Selected States ({editingTerritories.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {editingTerritories.length > 0 ? (
                        editingTerritories.map(state => (
                          <Badge
                            key={state}
                            className="cursor-pointer"
                            style={{
                              backgroundColor: repFirmColors[selectedRepForEdit.id],
                            }}
                            onClick={() => toggleStateInEdit(state)}
                          >
                            {state}
                            <X className="w-3 h-3 ml-1" />
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">No states selected</span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Assign unassigned state to a rep firm */}
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">States to assign:</p>
                    <div className="flex flex-wrap gap-1">
                      {editingTerritories.map(state => (
                        <Badge key={state} variant="secondary">{state}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-3">Select Rep Firm</p>
                    <div className="space-y-2">
                      {mockRepFirms.map(rep => (
                        <button
                          key={rep.id}
                          onClick={() => {
                            // Add states to this rep firm
                            setRepFirmTerritories(prev => ({
                              ...prev,
                              [rep.id]: [...(prev[rep.id] || []), ...editingTerritories.filter(s => !prev[rep.id]?.includes(s))],
                            }));
                            setShowTerritoryModal(false);
                            setEditingTerritories([]);
                          }}
                          className="w-full flex items-center gap-3 p-3 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left"
                        >
                          <div
                            className="w-4 h-4 rounded shrink-0"
                            style={{ backgroundColor: repFirmColors[rep.id] || '#d1d5db' }}
                          />
                          <div>
                            <p className="font-medium">{rep.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {getRepTerritories(rep.id).length} states assigned
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            {selectedRepForEdit && (
              <div className="p-4 border-t flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setShowTerritoryModal(false);
                  setSelectedRepForEdit(null);
                  setEditingTerritories([]);
                }}>
                  Cancel
                </Button>
                <Button onClick={saveTerritoryChanges}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ZIP Code Override Modal */}
      {showZipModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>ZIP Code Overrides</CardTitle>
                  <CardDescription>
                    Assign specific ZIP codes to a different rep firm than their state default
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowZipModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">How ZIP overrides work</p>
                <p className="text-sm text-muted-foreground">
                  When routing data, ZIP code overrides take priority over state assignments.
                  For example, if Texas is assigned to Rep Firm A, but ZIP codes 75001-75099 are overridden to Rep Firm B,
                  any data with those ZIP codes will route to Rep Firm B.
                </p>
              </div>

              {/* Current overrides */}
              <div>
                <p className="text-sm font-medium mb-2">Current Overrides</p>
                {Object.keys(zipOverrides).length === 0 ? (
                  <p className="text-sm text-muted-foreground p-3 border border-dashed rounded-lg text-center">
                    No ZIP code overrides configured
                  </p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(zipOverrides).map(([key, override]) => {
                      const rep = mockRepFirms.find(r => r.id === override.repFirmId);
                      return (
                        <div key={key} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="text-sm font-medium">{override.zips.join(', ')}</p>
                            <p className="text-xs text-muted-foreground">→ {rep?.name}</p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add new override */}
              <div className="space-y-3 pt-3 border-t">
                <p className="text-sm font-medium">Add Override</p>
                <div className="space-y-2">
                  <Label>ZIP Codes (comma-separated or range like 75001-75099)</Label>
                  <Input placeholder="e.g., 75001, 75002 or 75001-75099" />
                </div>
                <div className="space-y-2">
                  <Label>Assign to Rep Firm</Label>
                  <select className="w-full border rounded-md px-3 py-2 text-sm">
                    <option value="">Select rep firm...</option>
                    {mockRepFirms.map(rep => (
                      <option key={rep.id} value={rep.id}>{rep.name}</option>
                    ))}
                  </select>
                </div>
                <Button variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Override
                </Button>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowZipModal(false)}>Close</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
