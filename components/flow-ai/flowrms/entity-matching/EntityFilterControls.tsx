import { CheckCircle2, AlertCircle, Search, Loader2, Plus, Sparkles, Ban, SkipForward, FileText } from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import { Checkbox } from '@/components/flow-ai/ui/checkbox';
import { Label } from '@/components/flow-ai/ui/label';
import { Switch } from '@/components/flow-ai/ui/switch';
import type { FilterType, PendingEntityType } from '@/components/flow-ai/types/entity-matching';

interface EntityFilterControlsProps {
  activeFilters: Set<FilterType>;
  toggleFilter: (filter: FilterType) => void;
  createNewMode: boolean;
  setCreateNewMode: (mode: boolean) => void;
  selectedCount: number;
  selectableCount: number;
  entitiesCount: number;
  allSelected: boolean;
  onSelectAll: () => void;
  onBulkApprove: () => void;
  onBulkCreateNew: () => void;
  onBulkSkip?: () => void;
  onBulkSetForCreation?: () => void;
  onBulkDocSpecific?: () => void;
  isLoading?: boolean;
  currentEntityType?: PendingEntityType;
  isDelivery?: boolean;
}

export function EntityFilterControls({
  activeFilters,
  toggleFilter,
  createNewMode,
  setCreateNewMode,
  selectedCount,
  selectableCount,
  entitiesCount,
  allSelected,
  onSelectAll,
  onBulkApprove,
  onBulkCreateNew,
  onBulkSkip,
  onBulkSetForCreation,
  onBulkDocSpecific,
  isLoading = false,
  currentEntityType,
  isDelivery = false
}: EntityFilterControlsProps) {
  // Orders, Invoices, Credits, and Adjustments have different UI - no approve or create new, only skip and set for creation
  const isOrdersOrInvoices = currentEntityType === 'ORDERS' || currentEntityType === 'INVOICES' || currentEntityType === 'CREDITS' || currentEntityType === 'ADJUSTMENTS';
  // Products have skip functionality in addition to the regular approve/create new
  const isProducts = currentEntityType === 'PRODUCTS';

  return (
    <div className="p-4 bg-white border rounded-lg space-y-4">
      {/* Top Row: Select All, Filters, Create New Mode */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Select All Checkbox */}
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectableCount > 0 && allSelected}
            onCheckedChange={onSelectAll}
            id="select-all"
            disabled={selectableCount === 0}
          />
          <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer whitespace-nowrap">
            Select All ({selectableCount})
          </Label>
        </div>

        {/* Filter Buttons */}
        {!createNewMode && (
          <div className="flex flex-wrap items-center gap-2 pl-4 border-l">
            <Label className="text-sm text-muted-foreground mr-1">Show:</Label>
            {/* Auto Matched */}
            <Button
              variant={activeFilters.has('auto-matched') ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleFilter('auto-matched')}
              className="h-7 text-xs px-3"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Auto Matched
            </Button>
            {/* Needs Review */}
            <Button
              variant={(activeFilters.has('needs-review') || activeFilters.has('pending')) ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                // Toggle both needs review filters together
                const hasEither = activeFilters.has('needs-review') || activeFilters.has('pending');
                if (hasEither) {
                  if (activeFilters.has('needs-review')) toggleFilter('needs-review');
                  if (activeFilters.has('pending')) toggleFilter('pending');
                } else {
                  if (!activeFilters.has('needs-review')) toggleFilter('needs-review');
                  if (!activeFilters.has('pending')) toggleFilter('pending');
                }
              }}
              className="h-7 text-xs px-3"
            >
              <AlertCircle className="w-3 h-3 mr-1" />
              Needs Review
            </Button>
            {/* Confirmed */}
            <Button
              variant={activeFilters.has('confirmed') ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleFilter('confirmed')}
              className="h-7 text-xs px-3"
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Confirmed
            </Button>
            {/* Rejected / No Match */}
            <Button
              variant={activeFilters.has('no-match') ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleFilter('no-match')}
              className="h-7 text-xs px-3"
            >
              <Ban className="w-3 h-3 mr-1" />
              Rejected
            </Button>
            {/* Doc Specific - Products only (hidden for Deliveries) */}
            {isProducts && !isDelivery && (
              <Button
                variant={activeFilters.has('doc-specific') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleFilter('doc-specific')}
                className="h-7 text-xs px-3"
              >
                <FileText className="w-3 h-3 mr-1" />
                Doc Specific
              </Button>
            )}
          </div>
        )}

        {/* Create New Mode Toggle - Hide for Orders, Invoices, and Deliveries */}
        {!isOrdersOrInvoices && !isDelivery && (
          <div className="flex items-center gap-2 pl-4 border-l ml-auto">
            <Switch
              id="create-mode"
              checked={createNewMode}
              onCheckedChange={setCreateNewMode}
            />
            <Label htmlFor="create-mode" className="text-sm font-medium cursor-pointer whitespace-nowrap">
              Create New Mode
            </Label>
          </div>
        )}
      </div>

      {/* Bottom Row: Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-3 border-t">
        <Label className="text-sm text-muted-foreground mr-1">Actions:</Label>

        {/* Orders and Invoices: Only Skip and Set for Creation */}
        {isOrdersOrInvoices ? (
          <>
            {onBulkSkip && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkSkip}
                disabled={selectedCount === 0 || isLoading}
                className="h-8 px-4"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <SkipForward className="w-4 h-4 mr-2" />
                )}
                {selectedCount > 1 ? `Bulk Skip (${selectedCount})` : `Skip (${selectedCount})`}
              </Button>
            )}
            {onBulkSetForCreation && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkSetForCreation}
                disabled={selectedCount === 0 || isLoading}
                className="h-8 px-4"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                {selectedCount > 1 ? `Bulk Set for Creation (${selectedCount})` : `Set for Creation (${selectedCount})`}
              </Button>
            )}
          </>
        ) : !createNewMode ? (
          /* Standard entity types (Factories, Customers, etc.) */
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkApprove}
              disabled={selectedCount === 0 || isLoading}
              className="h-8 px-4"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              {selectedCount > 1 ? `Bulk Approve Matches (${selectedCount})` : `Approve Match (${selectedCount})`}
            </Button>
            {!isDelivery && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkCreateNew}
                disabled={selectedCount === 0 || isLoading}
                className="h-8 px-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                {selectedCount > 1 ? `Bulk Create New (${selectedCount})` : `Create New (${selectedCount})`}
              </Button>
            )}
            {/* Products tab: Add Bulk Skip and Bulk Doc Specific (hidden for Deliveries) */}
            {isProducts && !isDelivery && onBulkSkip && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkSkip}
                disabled={selectedCount === 0 || isLoading}
                className="h-8 px-4"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <SkipForward className="w-4 h-4 mr-2" />
                )}
                {selectedCount > 1 ? `Bulk Skip (${selectedCount})` : `Skip (${selectedCount})`}
              </Button>
            )}
            {isProducts && !isDelivery && onBulkDocSpecific && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkDocSpecific}
                disabled={selectedCount === 0 || isLoading}
                className="h-8 px-4"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                {selectedCount > 1 ? `Bulk Doc Specific (${selectedCount})` : `Doc Specific (${selectedCount})`}
              </Button>
            )}
          </>
        ) : (
          /* Create New Mode */
          <Button
            variant="default"
            size="sm"
            onClick={onBulkCreateNew}
            disabled={selectedCount === 0 || isLoading}
            className="h-8 px-4"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Create Selected ({selectedCount})
          </Button>
        )}
      </div>
    </div>
  );
}
