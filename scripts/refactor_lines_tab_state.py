#!/usr/bin/env python3
"""
Refactor LinesTab to use internal state for UI-only props.
This will allow us to remove those states from QuotesContent.tsx.
"""

# States that can be internal to LinesTab (UI-only, not shared):
INTERNAL_STATES = [
    # Product search states
    'productSearchOpen',
    'productSearchField',
    'productSearchQuery',
    'showCreateProduct',
    'newProductData',
    'dropdownPosition',

    # Manufacturer dropdown
    'manufacturerDropdown',
    'manufacturerSearch',

    # Recipient dropdown
    'showRecipientDropdown',

    # Overage modal states
    'showSetOverageModal',
    'overageModalTab',
    'overageInputPercent',
    'overageInputTargetPrice',
    'overageInputTargetMargin',

    # Price modals
    'showCopyPriceModal',
    'showPriceLookupModal',
    'priceLookupTargetPrice',

    # Min overage
    'showMinOverageModal',
    'minOverageInput',

    # Auto calc
    'showAutoCalcModal',
    'autoCalcMode',
    'autoCalcTargetOverage',
    'autoCalcTargetCommission',

    # Expanded items
    'expandedLineItems',

    # End user modal
    'showSetEndUserModal',
    'selectedEndUser',

    # View mode dropdown
    'showViewModeDropdown',

    # Line item rep splits
    'lineItemRepDropdown',
    'lineItemRepSearch',
    'showLineItemRepSplitsModal',
    'lineItemRepSplitsTarget',
    'lineItemRepSplits',

    # Line item inside rep splits
    'lineItemInsideRepDropdown',
    'lineItemInsideRepSearch',
    'showLineItemInsideRepSplitsModal',
    'lineItemInsideRepSplitsTarget',
    'lineItemInsideRepSplits',

    # Bulk actions
    'showBulkActionsMenu',

    # Compare view
    'showCompareView',

    # Line details modal
    'showLineDetailsModal',
    'lineDetailsModalItem',

    # Create product modal
    'showCreateProductModal',
    'createProductForLineItem',
    'createProductInitialData',

    # Rep split modal
    'repSplitModalItem',

    # Commission splits modal
    'showCommissionSplitsModal',
    'commissionSplitsModalItem',

    # Views menu
    'showViewsMenu',
    'showColumnsMenu',
    'showSaveViewModal',
    'newViewName',

    # Editing
    'editingCell',
    'editValue',

    # Table state
    'sortColumn',
    'sortDirection',
    'columnFilters',
    'activeFilterColumn',

    # Dragging
    'draggingColumn',
]

print("States that can be moved inside LinesTab:")
for state in INTERNAL_STATES:
    print(f"  - {state}")

print(f"\nTotal: {len(INTERNAL_STATES)} states")
print("\nTo reduce QuotesContent.tsx size, we should move these states inside LinesTab.")
print("This would require removing them from LinesTabProps and adding useState calls inside LinesTab.")
