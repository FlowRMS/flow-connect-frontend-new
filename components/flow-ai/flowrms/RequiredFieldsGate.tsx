'use client';

import { useState, useMemo, useEffect } from 'react';
import { CheckCircle2, ChevronRight, ChevronLeft, Users, Check, Factory } from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/flow-ai/ui/dialog';
import { cn } from '@/lib/flow-ai/cn';
import { EntitySearchDropdown, type EntitySearchResult } from './EntitySearchDropdown';
import { toast } from 'sonner';

export interface LineItemEndUser {
  rowIndex: number;
  flowIndex: string | number | null;
  currentEndUserName: string | null;
  identifier: string;
  // Additional display fields
  itemNumber?: string | number | null;
  quantity?: string | number | null;
  unitPrice?: string | number | null;
}

export interface LineItemFactory {
  rowIndex: number;
  flowIndex: string | number | null;
  currentFactoryName: string | null;
  identifier: string;
  // Additional display fields
  itemNumber?: string | number | null;
  quantity?: string | number | null;
  unitPrice?: string | number | null;
}

interface RequiredFieldsGateProps {
  entityType: string | null;
  soldToCustomerName: string | null;
  onSoldToCustomerChange: (name: string, entityId: string) => void;
  lineItems: LineItemEndUser[];
  onEndUserNamesChange: (updates: Array<{ rowIndex: number; endUserName: string }>) => void;
  /** Search for customers (CUSTOMERS entity type) - used for Sold To Customer dropdown */
  onSearchCustomers: (query: string, limit?: number) => Promise<EntitySearchResult[]>;
  /** Search for end users (END_USERS entity type) - used for End User assignment */
  onSearchEndUsers: (query: string, limit?: number) => Promise<EntitySearchResult[]>;
  // Factory-related props (only used for QUOTES)
  /** Factory name from primary fields - required for QUOTES */
  factoryName?: string | null;
  /** Callback when factory is changed */
  onFactoryChange?: (name: string, entityId: string) => void;
  /** Line items for factory name assignment - only for QUOTES */
  factoryLineItems?: LineItemFactory[];
  /** Callback for factory name updates on line items */
  onFactoryNamesChange?: (updates: Array<{ rowIndex: number; factoryName: string }>) => void;
  /** Search for factories - used for Factory dropdown */
  onSearchFactories?: (query: string, limit?: number) => Promise<EntitySearchResult[]>;
}

type AssignmentMode = 'choose' | 'individual';

export function RequiredFieldsGate({
  entityType,
  soldToCustomerName,
  onSoldToCustomerChange,
  lineItems,
  onEndUserNamesChange,
  onSearchCustomers,
  onSearchEndUsers,
  // Factory-related props
  factoryName,
  onFactoryChange,
  factoryLineItems = [],
  onFactoryNamesChange,
  onSearchFactories,
}: RequiredFieldsGateProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSoldToDialogOpen, setIsSoldToDialogOpen] = useState(false);
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>('choose');
  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  const [pendingEndUserUpdates, setPendingEndUserUpdates] = useState<Map<number, { name: string; entityId: string }>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  // Track the original missing items when dialog opens (snapshot)
  const [originalMissingRowIndices, setOriginalMissingRowIndices] = useState<Set<number>>(new Set());
  // Track the last selected end user for "Set remaining to" functionality
  const [lastSelectedEndUser, setLastSelectedEndUser] = useState<{ name: string; entityId: string } | null>(null);

  // Factory-related state (for QUOTES only)
  const [isFactoryDialogOpen, setIsFactoryDialogOpen] = useState(false);
  const [isFactoryAssignmentDialogOpen, setIsFactoryAssignmentDialogOpen] = useState(false);
  const [factoryAssignmentMode, setFactoryAssignmentMode] = useState<AssignmentMode>('choose');
  const [currentFactoryRowIndex, setCurrentFactoryRowIndex] = useState(0);
  const [pendingFactoryUpdates, setPendingFactoryUpdates] = useState<Map<number, { name: string; entityId: string }>>(new Map());
  const [originalMissingFactoryRowIndices, setOriginalMissingFactoryRowIndices] = useState<Set<number>>(new Set());
  const [lastSelectedFactory, setLastSelectedFactory] = useState<{ name: string; entityId: string } | null>(null);

  // Sync selectedSoldToCustomer with soldToCustomerName prop
  const effectiveSoldToName = soldToCustomerName?.trim() || null;
  const effectiveFactoryName = factoryName?.trim() || null;

  // Check if this entity type requires validation
  const normalizedType = entityType?.toUpperCase();
  const requiresValidation = normalizedType === 'QUOTES' || normalizedType === 'ORDERS';
  const isQuote = normalizedType === 'QUOTES';

  // Validation states
  const isSoldToValid = Boolean(effectiveSoldToName);
  const isFactoryValid = !isQuote || Boolean(effectiveFactoryName);

  // Check which line items are missing end user names
  const lineItemsMissingEndUser = useMemo(() => {
    return lineItems.filter(item => {
      const pendingUpdate = pendingEndUserUpdates.get(item.rowIndex);
      const effectiveName = pendingUpdate?.name ?? item.currentEndUserName;
      return !effectiveName?.trim();
    });
  }, [lineItems, pendingEndUserUpdates]);

  // Check which line items are missing factory names (for QUOTES only)
  const lineItemsMissingFactory = useMemo(() => {
    if (!isQuote) return [];
    return factoryLineItems.filter(item => {
      const pendingUpdate = pendingFactoryUpdates.get(item.rowIndex);
      const effectiveName = pendingUpdate?.name ?? item.currentFactoryName;
      return !effectiveName?.trim();
    });
  }, [factoryLineItems, pendingFactoryUpdates, isQuote]);

  const allEndUsersValid = lineItemsMissingEndUser.length === 0;
  const allFactoriesValid = !isQuote || lineItemsMissingFactory.length === 0;
  const isFullyValid = isSoldToValid && allEndUsersValid && isFactoryValid && allFactoriesValid;

  // Reset dialog state ONLY when dialog opens (not when lineItems change)
  useEffect(() => {
    if (isDialogOpen) {
      setAssignmentMode('choose');
      setCurrentRowIndex(0);
      setPendingEndUserUpdates(new Map());
      setLastSelectedEndUser(null);
      // Capture which rows are missing when dialog opens
      const missingIndices = new Set(
        lineItems
          .filter(item => !item.currentEndUserName?.trim())
          .map(item => item.rowIndex)
      );
      setOriginalMissingRowIndices(missingIndices);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDialogOpen]); // Only depend on isDialogOpen, not lineItems

  // Reset factory assignment dialog state when it opens
  useEffect(() => {
    if (isFactoryAssignmentDialogOpen) {
      setFactoryAssignmentMode('choose');
      setCurrentFactoryRowIndex(0);
      setPendingFactoryUpdates(new Map());
      setLastSelectedFactory(null);
      // Capture which rows are missing factory when dialog opens
      const missingIndices = new Set(
        factoryLineItems
          .filter(item => !item.currentFactoryName?.trim())
          .map(item => item.rowIndex)
      );
      setOriginalMissingFactoryRowIndices(missingIndices);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFactoryAssignmentDialogOpen]); // Only depend on isFactoryAssignmentDialogOpen

  // Build a stable list of rows based on original missing indices (snapshot when dialog opened)
  // This must be before the early return to follow React hooks rules
  const originalMissingRows = useMemo(() => {
    return lineItems.filter(item => originalMissingRowIndices.has(item.rowIndex));
  }, [lineItems, originalMissingRowIndices]);

  // Build a stable list of factory rows based on original missing indices
  const originalMissingFactoryRows = useMemo(() => {
    return factoryLineItems.filter(item => originalMissingFactoryRowIndices.has(item.rowIndex));
  }, [factoryLineItems, originalMissingFactoryRowIndices]);

  // If validation not required, don't render
  if (!requiresValidation) {
    return null;
  }

  // Handle individual end user selection - immediately apply
  const handleEndUserSelect = (rowIndex: number, entityId: string | null, result: EntitySearchResult | null) => {
    if (result && result.name) {
      // Update pending state for visual feedback
      const newPendingUpdates = new Map(pendingEndUserUpdates);
      newPendingUpdates.set(rowIndex, { name: result.name, entityId: entityId || '' });
      setPendingEndUserUpdates(newPendingUpdates);

      // Track the last selected end user for "Set remaining to" functionality
      setLastSelectedEndUser({ name: result.name, entityId: entityId || '' });

      // Immediately apply the change
      onEndUserNamesChange([{ rowIndex, endUserName: result.name }]);
      toast.success(`Assigned "${result.name}" to row ${rowIndex + 1}`);

      // Auto-advance to next unassigned row after a brief delay
      setTimeout(() => {
        // Get the original missing items list (stable reference)
        const originalMissingList = lineItems.filter(item =>
          originalMissingRowIndices.has(item.rowIndex)
        );

        // Find next unassigned row
        let nextIndex = -1;
        for (let i = 0; i < originalMissingList.length; i++) {
          if (!newPendingUpdates.has(originalMissingList[i].rowIndex)) {
            nextIndex = i;
            break;
          }
        }

        if (nextIndex >= 0) {
          setCurrentRowIndex(nextIndex);
        }
      }, 800); // Brief delay to show success message
    }
  };

  // Apply "Same as Sold To" to all rows
  const handleSetAllSameAsSoldTo = () => {
    if (!effectiveSoldToName) {
      toast.error('Sold To Customer name is not set');
      return;
    }

    setIsSaving(true);

    // Get ALL line items that are missing end user (from the full list, not just remaining)
    const missingItems = lineItems.filter(item => !item.currentEndUserName?.trim());

    const updates: Array<{ rowIndex: number; endUserName: string }> = missingItems.map(item => ({
      rowIndex: item.rowIndex,
      endUserName: effectiveSoldToName,
    }));

    if (updates.length === 0) {
      toast.info('All rows already have end user names');
      setIsSaving(false);
      setIsDialogOpen(false);
      return;
    }

    // Update pending state for visual feedback
    const newPendingUpdates = new Map<number, { name: string; entityId: string }>();
    missingItems.forEach(item => {
      newPendingUpdates.set(item.rowIndex, { name: effectiveSoldToName, entityId: '' });
    });
    setPendingEndUserUpdates(newPendingUpdates);

    // Apply changes
    onEndUserNamesChange(updates);
    toast.success(`Assigned "${effectiveSoldToName}" to ${updates.length} rows`);

    setIsSaving(false);
    setIsDialogOpen(false);
    setAssignmentMode('choose');
  };

  // Set remaining rows to the last selected end user
  const handleSetRemainingToLastSelected = () => {
    if (!lastSelectedEndUser) {
      toast.error('No end user selected yet');
      return;
    }

    // Get items that haven't been assigned yet in this session
    const unassignedItems = lineItemsMissingEndUser.filter(
      item => !pendingEndUserUpdates.has(item.rowIndex)
    );

    if (unassignedItems.length === 0) {
      toast.info('All remaining rows already assigned');
      return;
    }

    const updates: Array<{ rowIndex: number; endUserName: string }> = unassignedItems.map(item => ({
      rowIndex: item.rowIndex,
      endUserName: lastSelectedEndUser.name,
    }));

    // Update pending state
    const newPendingUpdates = new Map(pendingEndUserUpdates);
    unassignedItems.forEach(item => {
      newPendingUpdates.set(item.rowIndex, { name: lastSelectedEndUser.name, entityId: lastSelectedEndUser.entityId });
    });
    setPendingEndUserUpdates(newPendingUpdates);

    // Apply changes
    onEndUserNamesChange(updates);
    toast.success(`Assigned "${lastSelectedEndUser.name}" to ${updates.length} remaining rows`);
  };

  // Close dialog
  const handleClose = () => {
    setIsDialogOpen(false);
    setAssignmentMode('choose');
    setCurrentRowIndex(0);
    setPendingEndUserUpdates(new Map());
  };

  // Navigate to next row in individual mode
  const handleNextRow = () => {
    if (currentRowIndex < originalMissingRowIndices.size - 1) {
      setCurrentRowIndex(prev => prev + 1);
    }
  };

  // Navigate to previous row in individual mode
  const handlePrevRow = () => {
    if (currentRowIndex > 0) {
      setCurrentRowIndex(prev => prev - 1);
    }
  };

  // Current row being edited (from the stable original list)
  const currentRow = originalMissingRows[currentRowIndex];
  const currentPendingValue = currentRow ? pendingEndUserUpdates.get(currentRow.rowIndex) : null;

  // Count assignments made from the original missing set
  const originalMissingCount = originalMissingRowIndices.size;
  const assignedCount = Array.from(pendingEndUserUpdates.keys()).filter(rowIndex =>
    originalMissingRowIndices.has(rowIndex)
  ).length;
  const remainingToAssign = originalMissingCount - assignedCount;

  // Check if all original missing items have been assigned
  const allAssigned = originalMissingCount > 0 && assignedCount >= originalMissingCount;

  // ============== Factory-related handlers (for QUOTES only) ==============

  // Handle individual factory selection - immediately apply
  const handleFactorySelect = (rowIndex: number, entityId: string | null, result: EntitySearchResult | null) => {
    if (result && result.name && onFactoryNamesChange) {
      // Update pending state for visual feedback
      const newPendingUpdates = new Map(pendingFactoryUpdates);
      newPendingUpdates.set(rowIndex, { name: result.name, entityId: entityId || '' });
      setPendingFactoryUpdates(newPendingUpdates);

      // Track the last selected factory for "Set remaining to" functionality
      setLastSelectedFactory({ name: result.name, entityId: entityId || '' });

      // Immediately apply the change
      onFactoryNamesChange([{ rowIndex, factoryName: result.name }]);
      toast.success(`Assigned "${result.name}" to row ${rowIndex + 1}`);

      // Auto-advance to next unassigned row after a brief delay
      setTimeout(() => {
        // Get the original missing items list (stable reference)
        const originalMissingList = factoryLineItems.filter(item =>
          originalMissingFactoryRowIndices.has(item.rowIndex)
        );

        // Find next unassigned row
        let nextIndex = -1;
        for (let i = 0; i < originalMissingList.length; i++) {
          if (!newPendingUpdates.has(originalMissingList[i].rowIndex)) {
            nextIndex = i;
            break;
          }
        }

        if (nextIndex >= 0) {
          setCurrentFactoryRowIndex(nextIndex);
        }
      }, 800);
    }
  };

  // Apply "Same as Factory" to all rows
  const handleSetAllSameAsFactory = () => {
    if (!effectiveFactoryName || !onFactoryNamesChange) {
      toast.error('Factory name is not set');
      return;
    }

    setIsSaving(true);

    // Get ALL line items that are missing factory (from the full list, not just remaining)
    const missingItems = factoryLineItems.filter(item => !item.currentFactoryName?.trim());

    const updates: Array<{ rowIndex: number; factoryName: string }> = missingItems.map(item => ({
      rowIndex: item.rowIndex,
      factoryName: effectiveFactoryName,
    }));

    if (updates.length === 0) {
      toast.info('All rows already have factory names');
      setIsSaving(false);
      setIsFactoryAssignmentDialogOpen(false);
      return;
    }

    // Update pending state for visual feedback
    const newPendingUpdates = new Map<number, { name: string; entityId: string }>();
    missingItems.forEach(item => {
      newPendingUpdates.set(item.rowIndex, { name: effectiveFactoryName, entityId: '' });
    });
    setPendingFactoryUpdates(newPendingUpdates);

    // Apply changes
    onFactoryNamesChange(updates);
    toast.success(`Assigned "${effectiveFactoryName}" to ${updates.length} rows`);

    setIsSaving(false);
    setIsFactoryAssignmentDialogOpen(false);
    setFactoryAssignmentMode('choose');
  };

  // Set remaining rows to the last selected factory
  const handleSetRemainingToLastSelectedFactory = () => {
    if (!lastSelectedFactory || !onFactoryNamesChange) {
      toast.error('No factory selected yet');
      return;
    }

    // Get items that haven't been assigned yet in this session
    const unassignedItems = lineItemsMissingFactory.filter(
      item => !pendingFactoryUpdates.has(item.rowIndex)
    );

    if (unassignedItems.length === 0) {
      toast.info('All remaining rows already assigned');
      return;
    }

    const updates: Array<{ rowIndex: number; factoryName: string }> = unassignedItems.map(item => ({
      rowIndex: item.rowIndex,
      factoryName: lastSelectedFactory.name,
    }));

    // Update pending state
    const newPendingUpdates = new Map(pendingFactoryUpdates);
    unassignedItems.forEach(item => {
      newPendingUpdates.set(item.rowIndex, { name: lastSelectedFactory.name, entityId: lastSelectedFactory.entityId });
    });
    setPendingFactoryUpdates(newPendingUpdates);

    // Apply changes
    onFactoryNamesChange(updates);
    toast.success(`Assigned "${lastSelectedFactory.name}" to ${updates.length} remaining rows`);
  };

  // Close factory assignment dialog
  const handleCloseFactoryDialog = () => {
    setIsFactoryAssignmentDialogOpen(false);
    setFactoryAssignmentMode('choose');
    setCurrentFactoryRowIndex(0);
    setPendingFactoryUpdates(new Map());
  };

  // Navigate to next factory row in individual mode
  const handleNextFactoryRow = () => {
    if (currentFactoryRowIndex < originalMissingFactoryRowIndices.size - 1) {
      setCurrentFactoryRowIndex(prev => prev + 1);
    }
  };

  // Navigate to previous factory row in individual mode
  const handlePrevFactoryRow = () => {
    if (currentFactoryRowIndex > 0) {
      setCurrentFactoryRowIndex(prev => prev - 1);
    }
  };

  // Current factory row being edited (from the stable original list)
  const currentFactoryRow = originalMissingFactoryRows[currentFactoryRowIndex];
  const currentPendingFactoryValue = currentFactoryRow ? pendingFactoryUpdates.get(currentFactoryRow.rowIndex) : null;

  // Count factory assignments made from the original missing set
  const originalMissingFactoryCount = originalMissingFactoryRowIndices.size;
  const factoryAssignedCount = Array.from(pendingFactoryUpdates.keys()).filter(rowIndex =>
    originalMissingFactoryRowIndices.has(rowIndex)
  ).length;
  const factoryRemainingToAssign = originalMissingFactoryCount - factoryAssignedCount;

  // Check if all original missing factory items have been assigned
  const allFactoriesAssigned = originalMissingFactoryCount > 0 && factoryAssignedCount >= originalMissingFactoryCount;

  return (
    <>
      {/* Required fields status card - only show when not fully valid */}
      {!isFullyValid && (
        <div className="rounded-lg border-2 border-amber-200 bg-amber-50/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <h3 className="font-semibold text-amber-900">Action Required</h3>
          </div>

          <p className="text-sm text-amber-800 mb-4">
            Complete the following before you can approve this document:
          </p>

          <div className="space-y-3">
            {/* Sold To Customer */}
            <div className={cn(
              "flex items-center justify-between p-3 rounded-md border",
              isSoldToValid
                ? "bg-green-50 border-green-200"
                : "bg-white border-amber-200"
            )}>
              <div className="flex items-center gap-3">
                {isSoldToValid ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-amber-400 flex-shrink-0" />
                )}
                <div>
                  <p className={cn("font-medium", isSoldToValid ? "text-green-800" : "text-gray-900")}>
                    Sold To Customer
                  </p>
                  {isSoldToValid ? (
                    <p className="text-sm text-green-700">{effectiveSoldToName}</p>
                  ) : (
                    <p className="text-sm text-amber-600">Not set - click to select a customer</p>
                  )}
                </div>
              </div>
              {!isSoldToValid && (
                <Button
                  size="sm"
                  onClick={() => setIsSoldToDialogOpen(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                >
                  Set Customer
                </Button>
              )}
            </div>

            {/* End Users */}
            <div className={cn(
              "flex items-center justify-between p-3 rounded-md border",
              allEndUsersValid
                ? "bg-green-50 border-green-200"
                : "bg-white border-amber-200"
            )}>
              <div className="flex items-center gap-3">
                {allEndUsersValid ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-amber-400 flex-shrink-0" />
                )}
                <div>
                  <p className={cn("font-medium", allEndUsersValid ? "text-green-800" : "text-gray-900")}>
                    End User Assignments
                  </p>
                  {allEndUsersValid ? (
                    <p className="text-sm text-green-700">All line items assigned</p>
                  ) : (
                    <p className="text-sm text-amber-600">
                      {lineItemsMissingEndUser.length} line item{lineItemsMissingEndUser.length !== 1 ? 's' : ''} need end user assignment
                    </p>
                  )}
                </div>
              </div>
              {!allEndUsersValid && isSoldToValid && (
                <Button
                  size="sm"
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                >
                  Assign End Users
                </Button>
              )}
              {!allEndUsersValid && !isSoldToValid && (
                <span className="text-xs text-muted-foreground italic">Set customer first</span>
              )}
            </div>

            {/* Factory (QUOTES only) */}
            {isQuote && onSearchFactories && (
              <div className={cn(
                "flex items-center justify-between p-3 rounded-md border",
                isFactoryValid
                  ? "bg-green-50 border-green-200"
                  : "bg-white border-amber-200"
              )}>
                <div className="flex items-center gap-3">
                  {isFactoryValid ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-amber-400 flex-shrink-0" />
                  )}
                  <div>
                    <p className={cn("font-medium", isFactoryValid ? "text-green-800" : "text-gray-900")}>
                      Factory
                    </p>
                    {isFactoryValid ? (
                      <p className="text-sm text-green-700">{effectiveFactoryName}</p>
                    ) : (
                      <p className="text-sm text-amber-600">Not set - click to select a factory</p>
                    )}
                  </div>
                </div>
                {!isFactoryValid && (
                  <Button
                    size="sm"
                    onClick={() => setIsFactoryDialogOpen(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    Set Factory
                  </Button>
                )}
              </div>
            )}

            {/* Factory Name Assignments (QUOTES only) */}
            {isQuote && onSearchFactories && (
              <div className={cn(
                "flex items-center justify-between p-3 rounded-md border",
                allFactoriesValid
                  ? "bg-green-50 border-green-200"
                  : "bg-white border-amber-200"
              )}>
                <div className="flex items-center gap-3">
                  {allFactoriesValid ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-amber-400 flex-shrink-0" />
                  )}
                  <div>
                    <p className={cn("font-medium", allFactoriesValid ? "text-green-800" : "text-gray-900")}>
                      Factory Name Assignments
                    </p>
                    {allFactoriesValid ? (
                      <p className="text-sm text-green-700">All line items assigned</p>
                    ) : (
                      <p className="text-sm text-amber-600">
                        {lineItemsMissingFactory.length} line item{lineItemsMissingFactory.length !== 1 ? 's' : ''} need factory name assignment
                      </p>
                    )}
                  </div>
                </div>
                {!allFactoriesValid && isFactoryValid && (
                  <Button
                    size="sm"
                    onClick={() => setIsFactoryAssignmentDialogOpen(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    Assign Factories
                  </Button>
                )}
                {!allFactoriesValid && !isFactoryValid && (
                  <span className="text-xs text-muted-foreground italic">Set factory first</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* End User Assignment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md overflow-visible p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Assign End Users
            </DialogTitle>
            <DialogDescription>
              {assignmentMode === 'choose'
                ? `${lineItemsMissingEndUser.length} line items need end user names.`
                : `Row ${currentRowIndex + 1} of ${originalMissingCount}`}
            </DialogDescription>
          </DialogHeader>

          {assignmentMode === 'choose' && (
            <div className="space-y-2 py-2">
              {effectiveSoldToName && (
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3 px-4 overflow-hidden"
                  onClick={handleSetAllSameAsSoldTo}
                  disabled={isSaving}
                >
                  <div className="text-left min-w-0 w-full overflow-hidden">
                    <p className="font-medium truncate">
                      Use &quot;{effectiveSoldToName.length > 30 ? effectiveSoldToName.substring(0, 30) + '...' : effectiveSoldToName}&quot; for all
                    </p>
                    <p className="text-xs text-muted-foreground">Same as Sold To Customer</p>
                  </div>
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3 px-4"
                onClick={() => setAssignmentMode('individual')}
              >
                <div className="text-left">
                  <p className="font-medium">Assign individually</p>
                  <p className="text-xs text-muted-foreground">Select different end users per row</p>
                </div>
              </Button>
            </div>
          )}

          {assignmentMode === 'individual' && (
            <div className="space-y-4 py-2 overflow-hidden">
              {/* Completion state - show when all assigned */}
              {allAssigned ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <p className="text-sm font-medium text-green-700">
                      All {originalMissingCount} rows assigned!
                    </p>
                  </div>
                  <Button
                    variant="default"
                    className="mt-3"
                    onClick={handleClose}
                  >
                    Done
                  </Button>
                </div>
              ) : currentRow ? (
                <>
                  {/* Success message when assigned */}
                  {currentPendingValue && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <p className="text-sm text-green-700">
                          Assigned &quot;{currentPendingValue.name}&quot; to this row
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Row Info */}
                  <div className="p-3 bg-muted rounded-lg space-y-1">
                    <p className="text-sm font-medium truncate">{currentRow.identifier}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {currentRow.itemNumber != null && currentRow.itemNumber !== '' && (
                        <span>Item #: <span className="text-foreground">{currentRow.itemNumber}</span></span>
                      )}
                      {currentRow.quantity != null && currentRow.quantity !== '' && (
                        <span>Qty: <span className="text-foreground">{currentRow.quantity}</span></span>
                      )}
                      {currentRow.unitPrice != null && currentRow.unitPrice !== '' && (
                        <span>Price: <span className="text-foreground">{currentRow.unitPrice}</span></span>
                      )}
                    </div>
                  </div>

                  {/* End User Search Dropdown */}
                  <EntitySearchDropdown
                    label="Select End User"
                    selectedId={currentPendingValue?.entityId ?? null}
                    selectedName={currentPendingValue?.name ?? null}
                    placeholder="Search end users..."
                    required
                    onSelect={(entityId, result) => handleEndUserSelect(currentRow.rowIndex, entityId, result)}
                    onSearch={onSearchEndUsers}
                  />

                  {/* Quick Action - Use Sold To Customer */}
                  {effectiveSoldToName && !currentPendingValue && (
                    <Button
                      variant="secondary"
                      className="w-full max-w-full overflow-hidden"
                      onClick={() => handleEndUserSelect(currentRow.rowIndex, '', {
                        entityId: '',
                        name: effectiveSoldToName
                      })}
                    >
                      <span className="block truncate w-full text-center">
                        Use &quot;{effectiveSoldToName.length > 25 ? effectiveSoldToName.substring(0, 25) + '...' : effectiveSoldToName}&quot; (Same as Sold To)
                      </span>
                    </Button>
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevRow}
                      disabled={currentRowIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Prev
                    </Button>

                    <span className="text-sm font-medium text-muted-foreground">
                      {assignedCount} of {originalMissingCount} assigned
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextRow}
                      disabled={currentRowIndex >= originalMissingRows.length - 1}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>

                  {/* Set Remaining Button - Only show after user has made a selection */}
                  {remainingToAssign > 0 && lastSelectedEndUser && (
                    <Button
                      variant="default"
                      className="w-full max-w-full bg-primary overflow-hidden"
                      onClick={handleSetRemainingToLastSelected}
                    >
                      <span className="block truncate w-full text-center">
                        Set remaining {remainingToAssign} to &quot;{lastSelectedEndUser.name.length > 20 ? lastSelectedEndUser.name.substring(0, 20) + '...' : lastSelectedEndUser.name}&quot;
                      </span>
                    </Button>
                  )}
                </>
              ) : null}
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={handleClose}>
              {assignmentMode === 'choose' ? 'Cancel' : 'Done'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sold To Customer Assignment Dialog */}
      <Dialog open={isSoldToDialogOpen} onOpenChange={setIsSoldToDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Set Sold To Customer</DialogTitle>
            <DialogDescription>
              Search and select the sold to customer for this document.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <EntitySearchDropdown
              label="Customer"
              selectedId={null}
              selectedName={null}
              placeholder="Search customers..."
              required
              onSelect={(entityId, result) => {
                if (result && result.name) {
                  onSoldToCustomerChange(result.name, entityId || '');
                  toast.success(`Set Sold To Customer to "${result.name}"`);
                  setIsSoldToDialogOpen(false);
                }
              }}
              onSearch={onSearchCustomers}
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsSoldToDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Factory Assignment Dialog (QUOTES only) */}
      {isQuote && onSearchFactories && onFactoryChange && (
        <Dialog open={isFactoryDialogOpen} onOpenChange={setIsFactoryDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Set Factory</DialogTitle>
              <DialogDescription>
                Search and select the factory for this document.
              </DialogDescription>
            </DialogHeader>

            <div className="py-2">
              <EntitySearchDropdown
                label="Factory"
                selectedId={null}
                selectedName={null}
                placeholder="Search factories..."
                required
                onSelect={(entityId, result) => {
                  if (result && result.name) {
                    onFactoryChange(result.name, entityId || '');
                    toast.success(`Set Factory to "${result.name}"`);
                    setIsFactoryDialogOpen(false);
                  }
                }}
                onSearch={onSearchFactories}
              />
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsFactoryDialogOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Factory Name Assignment Dialog (QUOTES only) */}
      {isQuote && onSearchFactories && (
        <Dialog open={isFactoryAssignmentDialogOpen} onOpenChange={setIsFactoryAssignmentDialogOpen}>
          <DialogContent className="max-w-md overflow-visible p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5" />
                Assign Factory Names
              </DialogTitle>
              <DialogDescription>
                {factoryAssignmentMode === 'choose'
                  ? `${lineItemsMissingFactory.length} line items need factory names.`
                  : `Row ${currentFactoryRowIndex + 1} of ${originalMissingFactoryCount}`}
              </DialogDescription>
            </DialogHeader>

            {factoryAssignmentMode === 'choose' && (
              <div className="space-y-2 py-2">
                {effectiveFactoryName && (
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto py-3 px-4 overflow-hidden"
                    onClick={handleSetAllSameAsFactory}
                    disabled={isSaving}
                  >
                    <div className="text-left min-w-0 w-full overflow-hidden">
                      <p className="font-medium truncate">
                        Use &quot;{effectiveFactoryName.length > 30 ? effectiveFactoryName.substring(0, 30) + '...' : effectiveFactoryName}&quot; for all
                      </p>
                      <p className="text-xs text-muted-foreground">Same as primary Factory</p>
                    </div>
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3 px-4"
                  onClick={() => setFactoryAssignmentMode('individual')}
                >
                  <div className="text-left">
                    <p className="font-medium">Assign individually</p>
                    <p className="text-xs text-muted-foreground">Select different factories per row</p>
                  </div>
                </Button>
              </div>
            )}

            {factoryAssignmentMode === 'individual' && (
              <div className="space-y-4 py-2 overflow-hidden">
                {/* Completion state - show when all assigned */}
                {allFactoriesAssigned ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <p className="text-sm font-medium text-green-700">
                        All {originalMissingFactoryCount} rows assigned!
                      </p>
                    </div>
                    <Button
                      variant="default"
                      className="mt-3"
                      onClick={handleCloseFactoryDialog}
                    >
                      Done
                    </Button>
                  </div>
                ) : currentFactoryRow ? (
                  <>
                    {/* Success message when assigned */}
                    {currentPendingFactoryValue && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <p className="text-sm text-green-700">
                            Assigned &quot;{currentPendingFactoryValue.name}&quot; to this row
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Row Info */}
                    <div className="p-3 bg-muted rounded-lg space-y-1">
                      <p className="text-sm font-medium truncate">{currentFactoryRow.identifier}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {currentFactoryRow.itemNumber != null && currentFactoryRow.itemNumber !== '' && (
                          <span>Item #: <span className="text-foreground">{currentFactoryRow.itemNumber}</span></span>
                        )}
                        {currentFactoryRow.quantity != null && currentFactoryRow.quantity !== '' && (
                          <span>Qty: <span className="text-foreground">{currentFactoryRow.quantity}</span></span>
                        )}
                        {currentFactoryRow.unitPrice != null && currentFactoryRow.unitPrice !== '' && (
                          <span>Price: <span className="text-foreground">{currentFactoryRow.unitPrice}</span></span>
                        )}
                      </div>
                    </div>

                    {/* Factory Search Dropdown */}
                    <EntitySearchDropdown
                      label="Select Factory"
                      selectedId={currentPendingFactoryValue?.entityId ?? null}
                      selectedName={currentPendingFactoryValue?.name ?? null}
                      placeholder="Search factories..."
                      required
                      onSelect={(entityId, result) => handleFactorySelect(currentFactoryRow.rowIndex, entityId, result)}
                      onSearch={onSearchFactories}
                    />

                    {/* Quick Action - Use primary Factory */}
                    {effectiveFactoryName && !currentPendingFactoryValue && (
                      <Button
                        variant="secondary"
                        className="w-full max-w-full overflow-hidden"
                        onClick={() => handleFactorySelect(currentFactoryRow.rowIndex, '', {
                          entityId: '',
                          name: effectiveFactoryName
                        })}
                      >
                        <span className="block truncate w-full text-center">
                          Use &quot;{effectiveFactoryName.length > 25 ? effectiveFactoryName.substring(0, 25) + '...' : effectiveFactoryName}&quot; (Same as Factory)
                        </span>
                      </Button>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevFactoryRow}
                        disabled={currentFactoryRowIndex === 0}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Prev
                      </Button>

                      <span className="text-sm font-medium text-muted-foreground">
                        {factoryAssignedCount} of {originalMissingFactoryCount} assigned
                      </span>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextFactoryRow}
                        disabled={currentFactoryRowIndex >= originalMissingFactoryRows.length - 1}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>

                    {/* Set Remaining Button - Only show after user has made a selection */}
                    {factoryRemainingToAssign > 0 && lastSelectedFactory && (
                      <Button
                        variant="default"
                        className="w-full max-w-full bg-primary overflow-hidden"
                        onClick={handleSetRemainingToLastSelectedFactory}
                      >
                        <span className="block truncate w-full text-center">
                          Set remaining {factoryRemainingToAssign} to &quot;{lastSelectedFactory.name.length > 20 ? lastSelectedFactory.name.substring(0, 20) + '...' : lastSelectedFactory.name}&quot;
                        </span>
                      </Button>
                    )}
                  </>
                ) : null}
              </div>
            )}

            <DialogFooter>
              <Button variant="ghost" onClick={handleCloseFactoryDialog}>
                {factoryAssignmentMode === 'choose' ? 'Cancel' : 'Done'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}









