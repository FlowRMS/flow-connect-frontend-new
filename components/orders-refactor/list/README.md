# Orders List - Refactored

This is the refactored version of the Orders listing page, split into modular components and custom hooks following modern React patterns.

## Overview

The original OrdersContent.tsx (1656 lines) has been broken down into:
- **4 custom hooks** for state management
- **15+ components** organized by functionality
- **Configuration files** for filters and columns
- **Utility functions** and type definitions

## Folder Structure

```
components/orders-refactor/list/
├── config/
│   ├── filterConfig.ts          # Advanced filters configuration
│   └── columnConfig.ts          # Table column definitions
├── hooks/
│   ├── useOrderFilters.ts       # Filtering, sorting, unique values
│   ├── useOrderSelection.ts     # Order selection state
│   ├── useOrderBulkActions.ts   # Bulk operations & modals
│   ├── useOrdersListState.ts    # Main integrator hook
│   └── index.ts
├── components/
│   ├── table/
│   │   ├── SortIcon.tsx              # Sort direction indicator
│   │   ├── OrdersEmptyState.tsx      # Empty state display
│   │   ├── ColumnFilterDropdown.tsx  # Column filter UI
│   │   ├── BulkActionsBar.tsx        # Bulk actions toolbar
│   │   ├── OrderRow.tsx              # Single order row
│   │   ├── OrdersTableHeader.tsx     # Table header with filters
│   │   └── OrdersTable.tsx           # Main table container
│   ├── sidebar/
│   │   ├── OrderDetailPanel.tsx      # Sidebar container
│   │   ├── OrderStatusSection.tsx    # Status badges
│   │   ├── OrderDetailsSection.tsx   # Order details
│   │   ├── OrderLineItemsSection.tsx # Line items display
│   │   ├── OrderSplitsSection.tsx    # Commission splits editor
│   │   ├── OrderTotalsSection.tsx    # Order totals
│   │   └── index.ts
│   ├── modals/
│   │   ├── CreateOrderModal.tsx      # 4-step order creation
│   │   ├── CreditModal.tsx           # Create credit modal
│   │   ├── AcknowledgementModal.tsx  # Add acknowledgement modal
│   │   └── index.ts
│   ├── QuickDateFilter.tsx      # Quick date preset filter
│   └── index.ts
├── types.ts                     # Local type definitions
├── constants.ts                 # Re-exports and constants
├── utils.ts                     # Utility functions
├── index.ts                     # Main exports
├── OrdersListContent.tsx        # Main component
└── README.md                    # This file
```

## Key Features Preserved

### Table Features
- ✅ Sortable columns (order number, customer, manufacturer, date, total, commission, status)
- ✅ Column-level filtering with dropdowns
- ✅ Quick date presets (All, Today, This Week, Last Week)
- ✅ Multi-select with checkboxes
- ✅ Bulk actions (set status, delete, create credit, add acknowledgement)
- ✅ Linked order detection and validation
- ✅ Empty state display
- ✅ Grid layout with fixed column widths

### Sidebar Features
- ✅ Order detail panel (480px fixed width)
- ✅ Status badges for order, fulfillment, billing, and commission
- ✅ Order details display
- ✅ Line items display with quantities
- ✅ Commission splits editing (add, remove, update percentages)
- ✅ Order totals section (subtotal, freight, total, commission)
- ✅ Notes display
- ✅ Action buttons (Edit Order, Go to Invoice)

### Modal Features
- ✅ **Create Order Modal** - 4-step wizard (customer/manufacturer, line items, splits, review)
- ✅ **Credit Modal** - Create credits for line items with commission calculations
- ✅ **Acknowledgement Modal** - Add acknowledgements with quantities per line item

### Data Management
- ✅ Mock data integration from `@/lib/data/rms-mock`
- ✅ Type safety with `@/lib/types/rms`
- ✅ State management with custom hooks
- ✅ Local state for filters, selections, and editing

## Usage

### Basic Import

```tsx
import OrdersListContent from '@/components/orders-refactor/list';

export default function OrdersPage() {
  return <OrdersListContent />;
}
```

### Accessing from Route

The refactored version is available at:
```
/orders-refactor
```

The original version remains at:
```
/orders
```

## Architecture

### State Management Pattern

The component uses a **composition of custom hooks** pattern:

```tsx
// Main state hook integrates all sub-hooks
export function useOrdersListState() {
  const filterState = useOrderFilters(orders);
  const selectionState = useOrderSelection();
  const bulkActionsState = useOrderBulkActions({...});

  return {
    ...filterState,
    ...selectionState,
    ...bulkActionsState,
    // ... plus local state
  };
}
```

### Component Composition

Components follow a **presentational pattern**:
- Receive all props from parent
- No internal data fetching
- Focus on UI rendering
- Emit events via callbacks

### Type Safety

All components and hooks are fully typed:
- Props interfaces for all components
- Type definitions in `types.ts`
- Re-exports from `@/lib/types/rms`

## Custom Hooks

### useOrderFilters
Manages filtering and sorting logic:
- Quick date presets
- Column-level filters
- Multi-field sorting
- Unique value extraction

### useOrderSelection
Manages order selection state:
- Multi-select with Set
- Select all functionality
- Linked order validation
- Selection clearing

### useOrderBulkActions
Manages bulk operations:
- Bulk status updates
- Bulk delete with confirmation
- Credit modal state
- Acknowledgement modal state

### useOrdersListState
Main integrator hook:
- Combines all sub-hooks
- Manages orders data
- Sidebar state
- Commission splits editing
- Create order modal

## Utilities

### formatCurrency
Formats numbers as USD currency:
```tsx
formatCurrency(1234.56) // "$1,234.56"
```

### formatDate
Formats ISO dates to readable format:
```tsx
formatDate("2024-01-15") // "Jan 15, 2024"
```

### isOrderLinked
Checks if order is linked (invoiced or commission paid):
```tsx
isOrderLinked(order) // true/false
```

### getQuickDateRange
Converts preset to date range:
```tsx
getQuickDateRange('today', 'orderDate')
// { start: "2024-01-15", end: "2024-01-15" }
```

## Configuration

### Filter Options
Defined in `config/filterConfig.ts`:
- Text filters
- Dropdown filters
- Date range filters

### Column Configuration
Defined in `config/columnConfig.ts`:
- Column IDs and labels
- Column widths
- Sortable/filterable flags

## Testing Route

Access the refactored version at:
```
http://localhost:3000/orders-refactor
```

Compare with original at:
```
http://localhost:3000/orders
```

Both pages should have identical functionality and appearance.

## Next Steps

### Phase 1: Testing (Current)
- ✅ Visual comparison with original
- ✅ Functional testing of all features
- ✅ Edge case testing

### Phase 2: Integration (Future)
- Replace mock data with TanStack Query
- Add API mutations for CRUD operations
- Implement real-time updates
- Add optimistic updates

### Phase 3: Enhancement (Future)
- Add unit tests for hooks
- Add component tests
- Performance optimization
- Accessibility improvements

### Phase 4: Migration (Future)
- Update `/orders` route to use refactored version
- Remove original OrdersContent.tsx
- Update navigation and links
- Archive old code

## Maintenance Notes

- **Utils**: Currently local to orders-refactor, can be centralized later
- **Types**: Some duplication with lib/types/rms, can be consolidated
- **Mock Data**: Using same mock data as original for consistency
- **Styling**: Using same CSS variables and Tailwind classes as original

## Technical Debt

1. **TODO Comments**: Several TODOs in useOrderBulkActions for save logic
2. **Duplicate Utils**: formatCurrency and formatDate exist in multiple places
3. **Type Duplication**: Some types overlap with lib/types/rms
4. **Hard-coded Values**: Some values like sidebar width (480px) could be constants

## Contributing

When modifying this code:
1. Keep components small and focused
2. Use TypeScript for all new code
3. Follow existing naming conventions
4. Update this README if adding major features
5. Test against original `/orders` page for consistency

## Questions?

For questions or issues with this refactored version, contact the development team or create an issue in the project repository.
