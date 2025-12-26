'use client';

import { useState } from 'react';
import type { ColumnKey, SavedView } from '../types';
import { defaultSavedViews, defaultOverageViewColumns, defaultSimpleViewColumns } from '../config';

// Default column order for drag-and-drop reordering
const defaultColumnOrder: ColumnKey[] = [
  'partNumber', 'customerPartNumber', 'description', 'manufacturer', 'quantity', 'uom', 'divisor', 'unitPrice', 'endUser',
  'sellTotal', 'commissionPercent', 'commission', 'commissionTotal', 'linkedOrder',
  'overage', 'overageAmt',
  'commRate', 'baseComm', 'overageShare', 'overageComm', 'totalEarn', 'effRate', 'outsideReps',
  'l1', 'l2', 'l3',
  'commissionDiscountPercent', 'commissionDiscountAmount', 'lineDiscountPercent', 'lineDiscountAmount',
  'leadTime', 'trend', 'specSheet'
];

export function useColumnsState() {
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
    new Set(['partNumber', 'customerPartNumber', 'description', 'manufacturer', 'quantity', 'uom', 'divisor', 'unitPrice', 'sellTotal', 'commissionPercent', 'commission', 'commissionTotal', 'overage', 'overageAmt', 'commRate', 'baseComm', 'overageShare', 'overageComm', 'totalEarn', 'effRate', 'outsideReps'])
  );

  // Columns for Simple View (basic pricing only - no overage/commission columns)
  const [simpleViewColumns, setSimpleViewColumns] = useState<Set<ColumnKey>>(
    new Set(['partNumber', 'customerPartNumber', 'description', 'manufacturer', 'quantity', 'uom', 'divisor', 'unitPrice', 'sellTotal', 'commissionPercent', 'commission', 'commissionTotal', 'linkedOrder'])
  );

  // View mode
  const [quoteViewMode, setQuoteViewMode] = useState<'overage' | 'simple'>('simple');
  const [showViewModeDropdown, setShowViewModeDropdown] = useState(false);

  // Column order state for drag-and-drop reordering
  const [columnOrder, setColumnOrder] = useState<ColumnKey[]>([...defaultColumnOrder]);
  const [draggingColumn, setDraggingColumn] = useState<ColumnKey | null>(null);

  // Saved views
  const [savedViews, setSavedViews] = useState<SavedView[]>(defaultSavedViews);
  const [activeView, setActiveView] = useState('earnings');
  const [showSaveViewModal, setShowSaveViewModal] = useState(false);
  const [newViewName, setNewViewName] = useState('');

  // Menu visibility
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [showViewsMenu, setShowViewsMenu] = useState(false);

  // Effective visible columns based on view mode
  const effectiveVisibleColumns = quoteViewMode === 'simple' ? simpleViewColumns : visibleColumns;

  // Toggle column visibility
  const toggleColumn = (col: ColumnKey) => {
    if (quoteViewMode === 'simple') {
      // In simple view, toggle simpleViewColumns
      setSimpleViewColumns(prev => {
        const newSet = new Set(prev);
        if (newSet.has(col)) {
          newSet.delete(col);
        } else {
          newSet.add(col);
        }
        return newSet;
      });
    } else {
      // In overage view, toggle visibleColumns
      setVisibleColumns(prev => {
        const newSet = new Set(prev);
        if (newSet.has(col)) {
          newSet.delete(col);
        } else {
          newSet.add(col);
        }
        return newSet;
      });
    }
    setActiveView('custom');
  };

  // Drag and drop handlers for column reordering
  const handleColumnDragStart = (e: React.DragEvent, col: ColumnKey) => {
    setDraggingColumn(col);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleColumnDragOver = (e: React.DragEvent, targetCol: ColumnKey) => {
    e.preventDefault();
    if (!draggingColumn || draggingColumn === targetCol) return;

    const newOrder = [...columnOrder];
    const dragIndex = newOrder.indexOf(draggingColumn);
    const targetIndex = newOrder.indexOf(targetCol);

    if (dragIndex !== -1 && targetIndex !== -1) {
      newOrder.splice(dragIndex, 1);
      newOrder.splice(targetIndex, 0, draggingColumn);
      setColumnOrder(newOrder);
    }
  };

  const handleColumnDragEnd = () => {
    setDraggingColumn(null);
    setActiveView('custom');
  };

  // Get ordered columns that are visible
  const getOrderedVisibleColumns = (): ColumnKey[] => {
    return columnOrder.filter(col => effectiveVisibleColumns.has(col));
  };

  // Get CSS order value for a column based on columnOrder
  const getColumnOrder = (colKey: ColumnKey): number => {
    const index = columnOrder.indexOf(colKey);
    return index === -1 ? 999 : index;
  };

  // Apply a saved view
  const applyView = (viewId: string) => {
    const view = savedViews.find(v => v.id === viewId);
    if (view) {
      setVisibleColumns(new Set(view.columns));
      setActiveView(viewId);
    }
    setShowViewsMenu(false);
  };

  // Save the current view
  const saveCurrentView = () => {
    if (newViewName.trim()) {
      const newView: SavedView = {
        id: `custom-${Date.now()}`,
        name: newViewName.trim(),
        columns: Array.from(visibleColumns) as ColumnKey[],
      };
      setSavedViews(prev => [...prev, newView]);
      setActiveView(newView.id);
      setNewViewName('');
      setShowSaveViewModal(false);
    }
  };

  // Delete a saved view
  const deleteView = (viewId: string) => {
    if (['default', 'compact', 'pricing', 'approval'].includes(viewId)) return; // Can't delete built-in views
    setSavedViews(prev => prev.filter(v => v.id !== viewId));
    if (activeView === viewId) {
      applyView('default');
    }
  };

  return {
    // State
    visibleColumns,
    setVisibleColumns,
    simpleViewColumns,
    setSimpleViewColumns,
    effectiveVisibleColumns,
    quoteViewMode,
    setQuoteViewMode,
    showViewModeDropdown,
    setShowViewModeDropdown,
    columnOrder,
    setColumnOrder,
    draggingColumn,
    setDraggingColumn,
    savedViews,
    setSavedViews,
    activeView,
    setActiveView,
    showSaveViewModal,
    setShowSaveViewModal,
    newViewName,
    setNewViewName,
    showColumnsMenu,
    setShowColumnsMenu,
    showViewsMenu,
    setShowViewsMenu,

    // Functions
    toggleColumn,
    handleColumnDragStart,
    handleColumnDragOver,
    handleColumnDragEnd,
    getOrderedVisibleColumns,
    getColumnOrder,
    applyView,
    saveCurrentView,
    deleteView,
  };
}
