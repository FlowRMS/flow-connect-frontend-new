'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, X, Factory, Loader2, Check, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  searchOrganizations,
  createOrganization,
  createConnection,
  inviteConnection,
  type OrganizationLiteResponse,
  type ConnectionStatus,
} from '@/lib/graphql/index';

interface ManufacturerSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onManufacturerAdded?: (manufacturer: OrganizationLiteResponse) => void;
  onInviteSent?: (manufacturerId: string) => void;
}

/**
 * Modal for searching and adding manufacturers.
 * Uses the connectionSearch GraphQL query for real-time search
 * and createOrganization/createConnection mutations for adding.
 */
export function ManufacturerSearchModal({
  isOpen,
  onClose,
  onManufacturerAdded,
  onInviteSent,
}: ManufacturerSearchModalProps) {
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<OrganizationLiteResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Manual add form state
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualDomain, setManualDomain] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Action states
  const [connectingId, setConnectingId] = useState<string | null>(null);

  // Debounce ref
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSearchResults([]);
      setHasSearched(false);
      setShowManualForm(false);
      setManualName('');
      setManualDomain('');
      setManualEmail('');
      setIsSubmitting(false);
      setConnectingId(null);
    }
  }, [isOpen]);

  // Debounced search
  const handleSearch = useCallback(async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchOrganizations({
        searchTerm: term,
        limit: 10,
      });
      setSearchResults(results);
      setHasSearched(true);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Failed to search manufacturers');
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle input change with debounce
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      handleSearch(value);
    }, 300);
  }, [handleSearch]);

  // Connect to existing manufacturer
  const handleConnect = useCallback(async (manufacturer: OrganizationLiteResponse) => {
    setConnectingId(manufacturer.id);
    try {
      // Create connection as draft first
      await createConnection(manufacturer.id, true);
      // Then send the invite
      await inviteConnection(manufacturer.id);

      toast.success(`Invitation sent to ${manufacturer.name}`);
      onInviteSent?.(manufacturer.id);
      onManufacturerAdded?.(manufacturer);
      onClose();
    } catch (error) {
      console.error('Failed to connect:', error);
      toast.error('Failed to send invitation');
    } finally {
      setConnectingId(null);
    }
  }, [onClose, onManufacturerAdded, onInviteSent]);

  // Create new manufacturer
  const handleCreateOrganization = useCallback(async () => {
    if (!manualName.trim() || !manualDomain.trim()) {
      toast.error('Name and domain are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const newManufacturer = await createOrganization({
        name: manualName.trim(),
        domain: manualDomain.trim(),
        contact: manualEmail.trim() ? { email: manualEmail.trim() } : null,
      });

      // Create and send connection invitation
      await createConnection(newManufacturer.id, true);
      await inviteConnection(newManufacturer.id);

      toast.success(`${newManufacturer.name} added and invitation sent`);
      onManufacturerAdded?.(newManufacturer);
      onClose();
    } catch (error) {
      console.error('Failed to create manufacturer:', error);
      toast.error('Failed to add manufacturer');
    } finally {
      setIsSubmitting(false);
    }
  }, [manualName, manualDomain, manualEmail, onClose, onManufacturerAdded]);

  // Get connection status badge
  const getStatusBadge = (status: ConnectionStatus | null) => {
    if (!status) return null;

    const variants: Record<ConnectionStatus, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      DRAFT: { label: 'Draft', variant: 'outline' },
      PENDING: { label: 'Pending', variant: 'secondary' },
      ACCEPTED: { label: 'Connected', variant: 'default' },
      DECLINED: { label: 'Declined', variant: 'outline' },
    };

    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Add Manufacturer</CardTitle>
              <CardDescription>
                Search for manufacturers or add a new one
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 overflow-y-auto flex-1">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or domain..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Found {searchResults.length} manufacturer{searchResults.length !== 1 ? 's' : ''}
              </p>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {searchResults.map((manufacturer) => (
                  <div
                    key={manufacturer.id}
                    className="flex items-center justify-between gap-3 p-3 border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Factory className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{manufacturer.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {manufacturer.domain || 'No domain'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getStatusBadge(manufacturer.connectionStatus)}
                      {manufacturer.flowConnectMember && (
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          FlowConnect
                        </Badge>
                      )}
                      {!manufacturer.connectionStatus || manufacturer.connectionStatus === 'DECLINED' ? (
                        <Button
                          size="sm"
                          onClick={() => handleConnect(manufacturer)}
                          disabled={connectingId === manufacturer.id}
                        >
                          {connectingId === manufacturer.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-1" />
                              Connect
                            </>
                          )}
                        </Button>
                      ) : manufacturer.connectionStatus === 'ACCEPTED' ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results State */}
          {hasSearched && searchResults.length === 0 && searchTerm.length >= 2 && (
            <div className="text-center py-6">
              <Factory className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">No manufacturers found</p>
              <Button
                variant="link"
                onClick={() => setShowManualForm(true)}
                className="mt-2"
              >
                Add manufacturer manually
              </Button>
            </div>
          )}

          {/* Manual Add Form */}
          {showManualForm && (
            <div className="pt-4 border-t space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Add New Manufacturer</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowManualForm(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Company Name *</Label>
                  <Input
                    placeholder="e.g., Acme Manufacturing"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Company Domain *</Label>
                  <Input
                    placeholder="e.g., acme-mfg.com"
                    value={manualDomain}
                    onChange={(e) => setManualDomain(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contact Email (Optional)</Label>
                  <Input
                    type="email"
                    placeholder="e.g., pos@acme-mfg.com"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleCreateOrganization}
                  disabled={isSubmitting || !manualName.trim() || !manualDomain.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add & Send Invite
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Show Manual Form Button */}
          {!showManualForm && (
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowManualForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Manufacturer Manually
              </Button>
            </div>
          )}
        </CardContent>

        <div className="flex-shrink-0 border-t p-4">
          <Button variant="outline" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}
