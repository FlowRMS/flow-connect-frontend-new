/**
 * useLineItemsTable Hook
 * Manages line items table state: columns, views, sorting, tooltips
 * Applies column configuration from user settings (cached in UserSettingsContext)
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { OrderLineItem, Invoice } from '@/lib/types/rms';
import type { ColumnKey, InvoiceTooltipState } from '../types';
import { DEFAULT_VISIBLE_COLUMNS } from '../constants';
import { SAVED_VIEWS, getDefaultView } from '../config/viewsConfig';
import { useOrderSettings } from '@/contexts/UserSettingsContext';
import { useLineItemsColumnConfig } from '@/components/shared/hooks/useLineItemsColumnConfig';
import { defaultOrderColumnConfig, defaultOrderSettings } from '../config/defaultColumnConfig';
import type { OrderColumnConfig } from '@/components/lib/graphql/settings';

export function useLineItemsTable() {
  // Get saved order settings from context (already cached, no extra API calls)
  const { settings: savedOrderSettings, isInitialized: settingsInitialized, saveSettings } = useOrderSettings();

  // Column configuration - managed by generic hook with Settings API persistence
  const { columnConfig, setColumnConfig } = useLineItemsColumnConfig({
    settings: savedOrderSettings,
    isInitialized: settingsInitialized,
    saveSettings,
    defaultColumnConfig: defaultOrderColumnConfig,
    defaultSettings: defaultOrderSettings,
    getColumnConfig: (s) => s.columnConfig,
    setColumnConfig: (s, config) => ({ ...s, columnConfig: config }),
  });

  // Derive visibleColumns and pinnedColumns from columnConfig
  const visibleColumns = useMemo(() => {
    return new Set<ColumnKey>(
      columnConfig.filter(col => col.visible).map(col => col.key as ColumnKey)
    );
  }, [columnConfig]);

  const pinnedColumns = useMemo(() => {
    return new Set<ColumnKey>(
      columnConfig.filter(col => col.visible && col.pinned).map(col => col.key as ColumnKey)
    );
  }, [columnConfig]);

  // Views
  const [showViewsMenu, setShowViewsMenu] = useState(false);
  const [activeView, setActiveView] = useState(getDefaultView().id);

  // Columns modal
  const [showColumnsModal, setShowColumnsModal] = useState(false);

  // Invoice tooltip
  const [invoiceTooltip, setInvoiceTooltip] = useState<InvoiceTooltipState>({
    visible: false,
    x: 0,
    y: 0,
    invoices: [],
  });

  // Actions dropdown (in table header)
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);

  // Toggle column visibility
  const toggleColumn = useCallback((column: ColumnKey) => {
    setColumnConfig(
      columnConfig.map((col) =>
        col.key === column ? { ...col, visible: !col.visible, pinned: !col.visible ? false : col.pinned } : col
      )
    );
  }, [columnConfig, setColumnConfig]);

  // Toggle column pinning
  const togglePinColumn = useCallback((column: ColumnKey) => {
    setColumnConfig(
      columnConfig.map((col) => {
        if (col.key === column) {
          // If pinning, ensure it's also visible
          return { ...col, pinned: !col.pinned, visible: !col.pinned || col.visible };
        }
        return col;
      })
    );
  }, [columnConfig, setColumnConfig]);

  // Apply view
  const applyView = useCallback((viewId: string) => {
    const view = SAVED_VIEWS.find((v) => v.id === viewId);
    if (view) {
      // Update columnConfig to match view columns
      setColumnConfig(
        columnConfig.map((col) => ({
          ...col,
          visible: view.columns.includes(col.key as ColumnKey),
        }))
      );
      setActiveView(viewId);
      setShowViewsMenu(false);
    }
  }, [columnConfig, setColumnConfig]);

  // Reset to default view
  const resetToDefaultView = useCallback(() => {
    const defaultView = getDefaultView();
    // Reset to default column config
    setColumnConfig(
      defaultOrderColumnConfig.map((col) => ({
        ...col,
        visible: defaultView.columns.includes(col.key as ColumnKey),
        pinned: false,
      }))
    );
    setActiveView(defaultView.id);
  }, [setColumnConfig]);

  // Show invoice tooltip
  const showInvoiceTooltip = useCallback(
    (x: number, y: number, invoices: Invoice[]) => {
      setInvoiceTooltip({
        visible: true,
        x,
        y,
        invoices,
      });
    },
    []
  );

  // Hide invoice tooltip
  const hideInvoiceTooltip = useCallback(() => {
    setInvoiceTooltip({
      visible: false,
      x: 0,
      y: 0,
      invoices: [],
    });
  }, []);

  // Open columns modal
  const openColumnsModal = useCallback(() => {
    setShowColumnsModal(true);
  }, []);

  // Close columns modal
  const closeColumnsModal = useCallback(() => {
    setShowColumnsModal(false);
  }, []);

  // Get visible columns array (for rendering)
  const visibleColumnsArray = useMemo(() => {
    return Array.from(visibleColumns);
  }, [visibleColumns]);

  // Get pinned columns array
  const pinnedColumnsArray = useMemo(() => {
    return Array.from(pinnedColumns);
  }, [pinnedColumns]);

  // Check if a column is pinned
  const isPinned = (colKey: ColumnKey) => pinnedColumns.has(colKey);

  // Get pinned column styles (for sticky positioning)
  const getPinnedColumnStyle = (colKey: ColumnKey): React.CSSProperties => {
    if (!pinnedColumns.has(colKey)) return {};

    // Calculate left offset based on which columns are pinned before this one
    // Fixed columns: checkbox (40px) + icons (variable)
    const fixedLeftOffset = 40; // checkbox width
    const iconColWidth = (visibleColumns.has('iconAcknowledgement') || visibleColumns.has('iconDocumentSpecific') || visibleColumns.has('iconWarehouse') || visibleColumns.has('iconCredit')) ? 120 : 0;

    // Get ordered list of visible pinned columns
    const allColumns: ColumnKey[] = [
      'partNumber', 'custPartNumber', 'description', 'uom', 'divisor', 'unitPrice',
      'quantity', 'shippedQty', 'lineStatus', 'linkedQuote', 'linkedInvoice',
      'linkedCheck', 'linkedFulfillment', 'sellTotal', 'commissionPercent',
      'commission', 'commissionTotal', 'invoiced', 'percentOver', 'commissionAmount',
      'ovgPercent', 'ovgAmount', 'earnPercent', 'earnAmount',
      'iconAcknowledgement', 'iconDocumentSpecific', 'iconWarehouse', 'iconCredit'
    ];
    const visiblePinnedColumns = allColumns.filter(col => visibleColumns.has(col) && pinnedColumns.has(col));

    // Calculate offset
    const indexInPinned = visiblePinnedColumns.indexOf(colKey);
    if (indexInPinned === -1) return {};

    // Width for each column type (simplified - in real app would calculate dynamically)
    const columnWidths: Record<string, number> = {
      partNumber: 120,
      custPartNumber: 120,
      description: 300,
      uom: 80,
      divisor: 80,
      unitPrice: 100,
      quantity: 80,
      shippedQty: 120,
      lineStatus: 120,
    };

    let leftOffset = 0 // fixedLeftOffset + iconColWidth;
    for (let i = 0; i < indexInPinned; i++) {
      const prevCol = visiblePinnedColumns[i];
      leftOffset += columnWidths[prevCol] || 100; // default 100px
    }

    return {
      position: 'sticky',
      left: `${leftOffset}px`,
      zIndex: 10,
      backgroundColor: 'var(--card)',
    };
  };

  return {
    // Columns
    columnConfig,
    setColumnConfig,
    visibleColumns,
    visibleColumnsArray,
    toggleColumn,
    pinnedColumns,
    pinnedColumnsArray,
    togglePinColumn,

    // Views
    savedViews: SAVED_VIEWS,
    showViewsMenu,
    setShowViewsMenu,
    activeView,
    setActiveView,
    applyView,
    resetToDefaultView,

    // Columns modal
    showColumnsModal,
    openColumnsModal,
    closeColumnsModal,

    // Invoice tooltip
    invoiceTooltip,
    showInvoiceTooltip,
    hideInvoiceTooltip,
    setInvoiceTooltip,

    // Actions dropdown
    showActionsDropdown,
    setShowActionsDropdown,

    // Helper functions
    isPinned,
    getPinnedColumnStyle,
  };
}
