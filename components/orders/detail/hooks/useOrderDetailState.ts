/**
 * useOrderDetailState Hook
 * Main state management hook for order detail
 * Integrates all sub-hooks and manages overall state
 */

import { useState, useMemo } from 'react';
import type { Order, OrderLineItem } from '@/lib/types/rms';
import type { FulfillmentOrder } from '@/lib/types/warehouse';
import type { TabType, LineItemAcknowledgement, LineItemCredit } from '../types';
import { mockOrders } from '@/lib/data/rms-mock';
import { mockFulfillmentOrders } from '@/lib/data/warehouse-mock';
import { DEFAULT_ACTIVE_TAB } from '../config/tabsConfig';
import { useOrderHeader } from './useOrderHeader';
import { useLineItemsTable } from './useLineItemsTable';
import { useLineItemBulkActions } from './useLineItemBulkActions';
import { toggleAllLineItems } from '../utils';

interface UseOrderDetailStateProps {
  orderId: string;
}

export function useOrderDetailState({ orderId }: UseOrderDetailStateProps) {
  // Orders data
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [fulfillmentOrders, setFulfillmentOrders] = useState<FulfillmentOrder[]>(
    mockFulfillmentOrders
  );

  // Get current order
  const order = useMemo(
    () => orders.find((o) => o.id === orderId),
    [orders, orderId]
  );

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>(DEFAULT_ACTIVE_TAB);

  // Line items selection
  const [selectedLineItems, setSelectedLineItems] = useState<Set<string>>(
    new Set()
  );

  // Settings state
  const [showEndUserPerLine, setShowEndUserPerLine] = useState(false);
  const [showOutsideRepPerLine, setShowOutsideRepPerLine] = useState(false);
  const [showInsideRepPerLine, setShowInsideRepPerLine] = useState(false);
  const [customerPartNumberSource, setCustomerPartNumberSource] = useState<
    'soldTo' | 'endUser'
  >('soldTo');

  // Sections state
  const [showSections, setShowSections] = useState(false);
  const [showSectionsModal, setShowSectionsModal] = useState(false);
  const [sectionDisplayMode, setSectionDisplayMode] = useState<
    'column' | 'lineShelf'
  >('column');

  // Quote lookup modal state
  const [showQuoteLookupModal, setShowQuoteLookupModal] = useState(false);
  const [quoteLookupPartNumber, setQuoteLookupPartNumber] = useState('');
  const [quoteLookupQuoteNumber, setQuoteLookupQuoteNumber] = useState('');
  const [quoteLookupStartDate, setQuoteLookupStartDate] = useState('12/2024');
  const [quoteLookupEndDate, setQuoteLookupEndDate] = useState('12/2025');
  const [quoteLookupOpenOnly, setQuoteLookupOpenOnly] = useState(false);
  const [quoteLookupBlanketOnly, setQuoteLookupBlanketOnly] = useState(false);

  // Save dropdown (header)
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);

  // Mock data for line item acknowledgements
  const [lineItemAcknowledgements] = useState<
    Record<string, LineItemAcknowledgement>
  >({
    // Order 001
    'OLI-001-1': {
      ackNumber: 'ACK-2024-010',
      shipDate: '2024-12-15',
      acknowledgedQty: 50,
    },
    // Order 002
    'OLI-002-1': {
      ackNumber: 'ACK-2024-011',
      shipDate: '2024-12-18',
      acknowledgedQty: 75,
    },
    'OLI-002-2': {
      ackNumber: 'ACK-2024-011',
      shipDate: '2024-12-18',
      acknowledgedQty: 30,
    },
    // Order 003
    'OLI-003-1': {
      ackNumber: 'ACK-2024-012',
      shipDate: '2024-12-20',
      acknowledgedQty: 100,
    },
    // Order 004
    'OLI-004-1': {
      ackNumber: 'ACK-2024-013',
      shipDate: '2024-12-22',
      acknowledgedQty: 200,
    },
    // Order 005
    'OLI-005-1': {
      ackNumber: 'ACK-2024-001',
      shipDate: '2024-12-20',
      acknowledgedQty: 100,
    },
    'OLI-005-2': {
      ackNumber: 'ACK-2024-004',
      shipDate: '2024-12-28',
      acknowledgedQty: 30,  // Partial: 30 of 45 acknowledged
    },
    'OLI-005-3': {
      ackNumber: 'ACK-2024-002',
      shipDate: '2024-12-22',
      acknowledgedQty: 200,
    },
    'OLI-005-4': {
      ackNumber: 'ACK-2024-003',
      shipDate: '2024-12-18',
      acknowledgedQty: 30,
    },
    // Order 006
    'OLI-006-1': {
      ackNumber: 'ACK-2024-014',
      shipDate: '2024-12-25',
      acknowledgedQty: 150,
    },
  });

  // Mock data for line item credits
  const [lineItemCredits] = useState<Record<string, LineItemCredit>>({
    // Order 001
    'OLI-001-2': {
      creditName: 'CR-2024-010',
      creditType: 'Short Ship',
      creditQty: 3,
      originalQty: 25,
      originalTotal: 4125,
    },
    // Order 003
    'OLI-003-2': {
      creditName: 'CR-2024-011',
      creditType: 'Cancel',
      creditQty: 10,
      originalQty: 40,
      originalTotal: 8800,
    },
    // Order 005 - quantities reflect post-credit values (original - credit)
    'OLI-005-2': {
      creditName: 'CR-2024-001',
      creditType: 'Return',
      creditQty: 5,
      originalQty: 50,
      originalTotal: 7250,  // Now shows 45 qty, $6,525
    },
    'OLI-005-5': {
      creditName: 'CR-2024-002',
      creditType: 'Damage',
      creditQty: 2,
      originalQty: 15,
      originalTotal: 6750,  // Now shows 13 qty, $5,850
    },
    // Order 006
    'OLI-006-2': {
      creditName: 'CR-2024-012',
      creditType: 'Return',
      creditQty: 25,
      originalQty: 80,
      originalTotal: 11200,
    },
  });

  // Check if order has freight line
  const hasFreightLine = useMemo(() => {
    return (
      order?.lineItems.some((item) => item.partNumber === 'FREIGHT') || false
    );
  }, [order]);

  // Toggle line item selection
  const toggleLineItemSelection = (lineItemId: string) => {
    setSelectedLineItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(lineItemId)) {
        newSet.delete(lineItemId);
      } else {
        newSet.add(lineItemId);
      }
      return newSet;
    });
  };

  // Select all line items
  const selectAllLineItems = () => {
    if (!order) return;
    setSelectedLineItems(toggleAllLineItems(order.lineItems, selectedLineItems));
  };

  // Clear selection
  const clearLineItemSelection = () => {
    setSelectedLineItems(new Set());
  };

  // Integrate header hook
  const headerState = useOrderHeader({
    order: order!,
    setOrders,
  });

  // Integrate table hook
  const tableState = useLineItemsTable();

  // Integrate bulk actions hook
  const bulkActionsState = useLineItemBulkActions({
    selectedLineItems,
    clearSelection: clearLineItemSelection,
  });

  if (!order) {
    return null;
  }

  return {
    // Order data
    order,
    orders,
    setOrders,
    fulfillmentOrders,
    setFulfillmentOrders,

    // Tab state
    activeTab,
    setActiveTab,

    // Line items selection
    selectedLineItems,
    toggleLineItemSelection,
    selectAllLineItems,
    clearLineItemSelection,

    // Settings
    showEndUserPerLine,
    setShowEndUserPerLine,
    showOutsideRepPerLine,
    setShowOutsideRepPerLine,
    showInsideRepPerLine,
    setShowInsideRepPerLine,
    customerPartNumberSource,
    setCustomerPartNumberSource,

    // Sections
    showSections,
    setShowSections,
    showSectionsModal,
    setShowSectionsModal,
    sectionDisplayMode,
    setSectionDisplayMode,

    // Quote lookup
    showQuoteLookupModal,
    setShowQuoteLookupModal,
    quoteLookupPartNumber,
    setQuoteLookupPartNumber,
    quoteLookupQuoteNumber,
    setQuoteLookupQuoteNumber,
    quoteLookupStartDate,
    setQuoteLookupStartDate,
    quoteLookupEndDate,
    setQuoteLookupEndDate,
    quoteLookupOpenOnly,
    setQuoteLookupOpenOnly,
    quoteLookupBlanketOnly,
    setQuoteLookupBlanketOnly,

    // Save dropdown
    showSaveDropdown,
    setShowSaveDropdown,

    // Mock data
    lineItemAcknowledgements,
    lineItemCredits,
    hasFreightLine,

    // Integrated hooks
    ...headerState,
    ...tableState,
    ...bulkActionsState,
  };
}
