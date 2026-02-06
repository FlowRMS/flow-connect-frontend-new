import { ReactNode, useState, useCallback } from 'react';
import { Search, X, LucideIcon, Loader2 } from 'lucide-react';
import { type ManufacturerInput } from '@/lib/organizationsGqlSdk';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SuggestedEntity {
  id: string;
  name: string;
  domain: string;
}

interface SearchResult {
  id: string;
  name: string;
  domain?: string;
}

interface AddEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  entityIcon: LucideIcon;
  suggestedEntities: SuggestedEntity[];
  domainLabel: string;
  domainPlaceholder: string;
  onAdd?: (input: ManufacturerInput) => void | Promise<void>;
  // Search props
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchResults?: SearchResult[];
  isSearching?: boolean;
  onSelectSearchResult?: (result: SearchResult) => Promise<void>;
}

export function AddEntityModal({
  isOpen,
  onClose,
  title,
  description,
  entityIcon: EntityIcon,
  suggestedEntities,
  domainLabel,
  domainPlaceholder,
  onAdd,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search or enter domain...',
  searchResults = [],
  isSearching = false,
  onSelectSearchResult,
}: AddEntityModalProps) {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);

  const [internalLoading, setInternalLoading] = useState(false);
  const handleSubmit = useCallback(async () => {
    setInternalLoading(true);
    try {
      await onAdd?.({
        name,
        domain,
        contact: contactEmail ? { email: contactEmail } : null,
      });
      setName('');
      setDomain('');
      setContactEmail('');
      onClose();
    } finally {
      setInternalLoading(false);
    }
  }, [name, domain, contactEmail, onAdd, onClose]);

  const handleSelectResult = useCallback(async (result: SearchResult) => {
    setSelectingId(result.id);
    try {
      await onSelectSearchResult?.(result);
      onClose();
    } finally {
      setSelectingId(null);
    }
  }, [onSelectSearchResult, onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-10 w-full"
            />
          </div>

          {/* Search Results */}
          {isSearching && (
            <div className="text-sm text-muted-foreground animate-pulse">Searching...</div>
          )}
          {!isSearching && searchResults.length > 0 && (
            <div className="max-h-40 overflow-y-auto border rounded-md divide-y">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2 disabled:opacity-50"
                  onClick={() => handleSelectResult(result)}
                  disabled={selectingId === result.id}
                >
                  <EntityIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{result.name}</span>
                  {result.domain && <span className="text-xs text-muted-foreground">({result.domain})</span>}
                  {selectingId === result.id && <Loader2 className="w-4 h-4 animate-spin ml-auto" />}
                </button>
              ))}
            </div>
          )}

          <div className="pt-4 border-t space-y-3">
            <p className="text-sm font-medium">Or add by domain:</p>
            <div className="flex flex-col gap-2">
              <Label className="text-gray-900 dark:text-gray-100">Manufacturer Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Acme Lighting" />
              <Label className="text-gray-900 dark:text-gray-100">{domainLabel}</Label>
              <Input value={domain} onChange={e => setDomain(e.target.value)} placeholder={domainPlaceholder} />
              <Label className="text-gray-900 dark:text-gray-100">Contact Email (Optional)</Label>
              <Input value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="e.g., pos@company.com" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={internalLoading}>{internalLoading ? 'Adding...' : 'Add & Send Invite'}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
