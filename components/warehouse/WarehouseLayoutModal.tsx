'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WarehouseLocationLevelConfig, WarehouseLocationLevel } from '@/lib/types/warehouse';
import {
  mockSections,
  mockAisles,
  mockShelves,
  mockBays,
  mockRows,
  mockBins,
  mockInventoryItems,
  mockInventory,
} from '@/lib/data/warehouse-mock';

// Types
interface WarehouseLocation {
  id: string;
  name: string;
  type: 'section' | 'aisle' | 'shelf' | 'bay' | 'row' | 'bin';
  parentId?: string;
  children?: WarehouseLocation[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  description?: string;
  isActive: boolean;
  products?: ProductAssignment[];
}

// Visual position for canvas elements
interface VisualElement {
  id: string;
  locationId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  type: 'section' | 'aisle' | 'shelf' | 'bay' | 'row' | 'bin';
  name: string;
  parentId?: string;
  children?: VisualElement[];
}

interface ProductAssignment {
  id: string;
  productId: string;
  productName: string;
  partNumber: string;
  quantity: number;
}

// Icons (smaller)
const LevelIcons: Record<string, React.ReactNode> = {
  section: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  aisle: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  shelf: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  bay: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  row: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  bin: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  product: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
};

const levelColors: Record<string, { bg: string; text: string; border: string }> = {
  section: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
  aisle: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  shelf: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
  bay: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-800' },
  row: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
  bin: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
  product: { bg: 'bg-gray-50 dark:bg-gray-900/20', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-800' },
};

const levelLabels: Record<string, string> = {
  section: 'Section',
  aisle: 'Aisle',
  shelf: 'Shelf',
  bay: 'Bay',
  row: 'Row',
  bin: 'Bin',
};

interface WarehouseLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationLevels: WarehouseLocationLevelConfig[];
  onSave: (levels: WarehouseLocationLevelConfig[]) => void;
  warehouseName: string;
  warehouseId?: string;
}

export default function WarehouseLayoutModal({
  isOpen,
  onClose,
  locationLevels,
  onSave,
  warehouseName,
  warehouseId = 'WH-001',
}: WarehouseLayoutModalProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['SEC-001', 'SEC-002', 'AISLE-001', 'AISLE-002']));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductSearch, setShowProductSearch] = useState<string | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [draggedItem, setDraggedItem] = useState<WarehouseLocation | null>(null);
  const [locations, setLocations] = useState<WarehouseLocation[]>(() => buildLocationTree(warehouseId));

  // View mode: 'tree' or 'visual'
  const [viewMode, setViewMode] = useState<'tree' | 'visual'>('tree');

  // Visual builder state
  const [visualElements, setVisualElements] = useState<VisualElement[]>(() => buildVisualElements(buildLocationTree(warehouseId)));
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Warehouse dimensions in feet
  const [warehouseDimensions, setWarehouseDimensions] = useState({ width: 150, height: 100 });

  const enabledLevels = locationLevels.filter(l => l.enabled).map(l => l.level);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const toggleExpanded = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getNextLevelType = (currentType: string): string | null => {
    const typeOrder: WarehouseLocationLevel[] = ['section', 'aisle', 'shelf', 'bay', 'row', 'bin'];
    const currentIndex = typeOrder.indexOf(currentType as WarehouseLocationLevel);
    for (let i = currentIndex + 1; i < typeOrder.length; i++) {
      if (enabledLevels.includes(typeOrder[i])) return typeOrder[i];
    }
    return null;
  };

  const isBottomLevel = (type: string): boolean => getNextLevelType(type) === null;

  const handleAddChild = (parentId: string, parentType: string) => {
    const nextType = getNextLevelType(parentType);
    if (!nextType) return;

    const newEntity: WarehouseLocation = {
      id: `${nextType.toUpperCase()}-${Date.now()}`,
      name: `New ${levelLabels[nextType]}`,
      type: nextType as WarehouseLocation['type'],
      parentId,
      isActive: true,
      children: [],
      products: [],
    };

    setLocations(prev => {
      const addToParent = (items: WarehouseLocation[]): WarehouseLocation[] => {
        return items.map(item => {
          if (item.id === parentId) {
            return { ...item, children: [...(item.children || []), newEntity] };
          }
          if (item.children) {
            return { ...item, children: addToParent(item.children) };
          }
          return item;
        });
      };
      return addToParent(prev);
    });

    setExpandedNodes(prev => new Set([...prev, parentId]));
    setTimeout(() => setEditingId(newEntity.id), 50);
  };

  const handleAddSection = () => {
    const newSection: WarehouseLocation = {
      id: `SECTION-${Date.now()}`,
      name: 'New Section',
      type: 'section',
      isActive: true,
      children: [],
      products: [],
    };
    setLocations(prev => [...prev, newSection]);
    setTimeout(() => setEditingId(newSection.id), 50);
  };

  const handleAddSectionAtPosition = (x: number, y: number) => {
    const newSection: WarehouseLocation = {
      id: `SECTION-${Date.now()}`,
      name: 'New Section',
      type: 'section',
      isActive: true,
      x: x,
      y: y,
      width: 300,
      height: 200,
      children: [],
      products: [],
    };
    setLocations(prev => [...prev, newSection]);
    setSelectedElementId(newSection.id);
  };

  const handleRename = (id: string, newName: string) => {
    if (!newName.trim()) return;
    setLocations(prev => {
      const updateName = (items: WarehouseLocation[]): WarehouseLocation[] => {
        return items.map(item => {
          if (item.id === id) return { ...item, name: newName };
          if (item.children) return { ...item, children: updateName(item.children) };
          return item;
        });
      };
      return updateName(prev);
    });
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setLocations(prev => {
      const removeEntity = (items: WarehouseLocation[]): WarehouseLocation[] => {
        return items
          .filter(item => item.id !== id)
          .map(item => ({
            ...item,
            children: item.children ? removeEntity(item.children) : undefined,
          }));
      };
      return removeEntity(prev);
    });
  };

  const handleAddProduct = (binId: string, product: { id: string; name: string; partNumber: string }) => {
    setLocations(prev => {
      const addProduct = (items: WarehouseLocation[]): WarehouseLocation[] => {
        return items.map(item => {
          if (item.id === binId) {
            const newProduct: ProductAssignment = {
              id: `PROD-${Date.now()}`,
              productId: product.id,
              productName: product.name,
              partNumber: product.partNumber,
              quantity: 0,
            };
            return { ...item, products: [...(item.products || []), newProduct] };
          }
          if (item.children) return { ...item, children: addProduct(item.children) };
          return item;
        });
      };
      return addProduct(prev);
    });
    setShowProductSearch(null);
    setProductSearchQuery('');
  };

  const handleRemoveProduct = (binId: string, productAssignmentId: string) => {
    setLocations(prev => {
      const removeProduct = (items: WarehouseLocation[]): WarehouseLocation[] => {
        return items.map(item => {
          if (item.id === binId) {
            return { ...item, products: (item.products || []).filter(p => p.id !== productAssignmentId) };
          }
          if (item.children) return { ...item, children: removeProduct(item.children) };
          return item;
        });
      };
      return removeProduct(prev);
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const item = findLocationById(locations, event.active.id as string);
    setDraggedItem(item || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedItem(null);
    if (!over || active.id === over.id) return;

    const activeItem = findLocationById(locations, active.id as string);
    const overItem = findLocationById(locations, over.id as string);
    if (!activeItem || !overItem || activeItem.type !== overItem.type || activeItem.parentId !== overItem.parentId) return;

    setLocations(prev => {
      const reorder = (items: WarehouseLocation[]): WarehouseLocation[] => {
        const activeIndex = items.findIndex(i => i.id === active.id);
        const overIndex = items.findIndex(i => i.id === over.id);
        if (activeIndex !== -1 && overIndex !== -1) {
          const newItems = [...items];
          const [removed] = newItems.splice(activeIndex, 1);
          newItems.splice(overIndex, 0, removed);
          return newItems;
        }
        return items.map(item => ({ ...item, children: item.children ? reorder(item.children) : undefined }));
      };
      return reorder(prev);
    });
  };

  const handleSave = () => {
    onSave(locationLevels);
    onClose();
  };

  // Visual builder handlers
  const handleVisualElementMove = useCallback((elementId: string, newX: number, newY: number) => {
    setVisualElements(prev => {
      const updateElement = (elements: VisualElement[]): VisualElement[] => {
        return elements.map(el => {
          if (el.id === elementId) {
            return { ...el, x: newX, y: newY };
          }
          if (el.children) {
            return { ...el, children: updateElement(el.children) };
          }
          return el;
        });
      };
      return updateElement(prev);
    });
    // Sync back to locations
    setLocations(prev => {
      const updateLocation = (locs: WarehouseLocation[]): WarehouseLocation[] => {
        return locs.map(loc => {
          if (loc.id === elementId) {
            return { ...loc, x: newX, y: newY };
          }
          if (loc.children) {
            return { ...loc, children: updateLocation(loc.children) };
          }
          return loc;
        });
      };
      return updateLocation(prev);
    });
  }, []);

  const handleVisualElementResize = useCallback((elementId: string, newWidth: number, newHeight: number) => {
    setVisualElements(prev => {
      const updateElement = (elements: VisualElement[]): VisualElement[] => {
        return elements.map(el => {
          if (el.id === elementId) {
            return { ...el, width: Math.max(40, newWidth), height: Math.max(40, newHeight) };
          }
          if (el.children) {
            return { ...el, children: updateElement(el.children) };
          }
          return el;
        });
      };
      return updateElement(prev);
    });
    // Sync to locations
    setLocations(prev => {
      const updateLocation = (locs: WarehouseLocation[]): WarehouseLocation[] => {
        return locs.map(loc => {
          if (loc.id === elementId) {
            return { ...loc, width: Math.max(40, newWidth), height: Math.max(40, newHeight) };
          }
          if (loc.children) {
            return { ...loc, children: updateLocation(loc.children) };
          }
          return loc;
        });
      };
      return updateLocation(prev);
    });
  }, []);

  const handleVisualElementRotate = useCallback((elementId: string, newRotation: number) => {
    setVisualElements(prev => {
      const updateElement = (elements: VisualElement[]): VisualElement[] => {
        return elements.map(el => {
          if (el.id === elementId) {
            return { ...el, rotation: newRotation % 360 };
          }
          if (el.children) {
            return { ...el, children: updateElement(el.children) };
          }
          return el;
        });
      };
      return updateElement(prev);
    });
  }, []);

  const handleCanvasWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prev => Math.min(3, Math.max(0.25, prev * delta)));
    }
  }, []);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastPanPoint.x;
      const dy = e.clientY - lastPanPoint.y;
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  }, [isPanning, lastPanPoint]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Sync visual elements when locations change
  useEffect(() => {
    setVisualElements(buildVisualElements(locations));
  }, [locations]);

  const filteredLocations = searchQuery ? filterLocations(locations, searchQuery) : locations;

  const availableProducts = mockInventory.map(inv => ({
    id: inv.productId,
    name: inv.productName,
    partNumber: inv.partNumber,
    factoryName: inv.factoryName,
  }));

  const filteredProducts = productSearchQuery
    ? availableProducts.filter(p =>
        p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
        p.partNumber.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
        p.factoryName?.toLowerCase().includes(productSearchQuery.toLowerCase())
      )
    : availableProducts;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] w-full h-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] flex-shrink-0 bg-[var(--card)]">
          <div className="flex items-center gap-4">
            {/* Back Button */}
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            <div className="w-px h-6 bg-[var(--border)]" />
            <div>
              <h2 className="text-base font-semibold text-[var(--foreground)]">Warehouse Layout</h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                {warehouseName} • {viewMode === 'tree' ? 'Click names to edit, drag to reorder' : 'Drag from library, double-click to view hierarchy'}
              </p>
            </div>
            {/* View Mode Toggle - Bigger buttons */}
            <div className="flex items-center bg-[var(--muted)] rounded-lg p-1 ml-2">
              <button
                onClick={() => setViewMode('tree')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                  viewMode === 'tree'
                    ? 'bg-white dark:bg-gray-800 text-[var(--foreground)] shadow-sm'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Tree View
              </button>
              <button
                onClick={() => setViewMode('visual')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                  viewMode === 'visual'
                    ? 'bg-white dark:bg-gray-800 text-[var(--foreground)] shadow-sm'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                Visual Builder
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--muted-foreground)]">{countLocations(locations)} locations</span>
          </div>
        </div>

        {/* Tree View Toolbar */}
        {viewMode === 'tree' && (
          <div className="px-4 py-2 border-b border-[var(--border)] flex items-center gap-2">
            <div className="relative flex-1">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {enabledLevels.includes('section') && (
              <button
                onClick={handleAddSection}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Section
              </button>
            )}
          </div>
        )}

        {/* Tree View Content */}
        {viewMode === 'tree' && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex-1 overflow-y-auto p-2">
              {filteredLocations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-[var(--muted)] rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)]">No locations yet. Click "+ Section" to start.</p>
                </div>
              ) : (
                <SortableContext items={filteredLocations.map(l => l.id)} strategy={verticalListSortingStrategy}>
                  {filteredLocations.map((location) => (
                    <LocationNode
                      key={location.id}
                      location={location}
                      depth={0}
                      expandedNodes={expandedNodes}
                      editingId={editingId}
                      enabledLevels={enabledLevels}
                      showProductSearch={showProductSearch}
                      productSearchQuery={productSearchQuery}
                      filteredProducts={filteredProducts}
                      onToggle={toggleExpanded}
                      onStartEdit={setEditingId}
                      onRename={handleRename}
                      onDelete={handleDelete}
                      onAddChild={handleAddChild}
                      isBottomLevel={isBottomLevel}
                      getNextLevelType={getNextLevelType}
                      onShowProductSearch={setShowProductSearch}
                      onProductSearchChange={setProductSearchQuery}
                      onAddProduct={handleAddProduct}
                      onRemoveProduct={handleRemoveProduct}
                    />
                  ))}
                </SortableContext>
              )}
            </div>

            <DragOverlay>
              {draggedItem && (
                <div className={`px-3 py-1.5 rounded-lg border ${levelColors[draggedItem.type].bg} ${levelColors[draggedItem.type].border} shadow-lg`}>
                  <div className="flex items-center gap-2">
                    <span className={levelColors[draggedItem.type].text}>{LevelIcons[draggedItem.type]}</span>
                    <span className="text-xs font-medium">{draggedItem.name}</span>
                  </div>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}

        {/* Visual Builder Content */}
        {viewMode === 'visual' && (
          <VisualWarehouseBuilder
            elements={visualElements}
            locations={locations}
            selectedElementId={selectedElementId}
            zoom={zoom}
            panOffset={panOffset}
            enabledLevels={enabledLevels}
            warehouseDimensions={warehouseDimensions}
            onWarehouseDimensionsChange={(width, height) => setWarehouseDimensions({ width, height })}
            onElementSelect={setSelectedElementId}
            onElementMove={handleVisualElementMove}
            onElementResize={handleVisualElementResize}
            onElementRotate={handleVisualElementRotate}
            onAddChild={handleAddChild}
            onAddSection={handleAddSection}
            onAddSectionAtPosition={handleAddSectionAtPosition}
            onDelete={handleDelete}
            onWheel={handleCanvasWheel}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onZoomChange={setZoom}
            onResetView={resetView}
            onSave={handleSave}
            onClose={onClose}
            canvasRef={canvasRef}
            getNextLevelType={getNextLevelType}
            onRename={handleRename}
          />
        )}

        {/* Footer - only show for tree view */}
        {viewMode === 'tree' && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border)] bg-[var(--card)] flex-shrink-0">
            <div className="flex items-center gap-1">
              {enabledLevels.map((level) => (
                <span key={level} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${levelColors[level]?.bg} ${levelColors[level]?.text}`}>
                  {levelLabels[level]}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--accent)] rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Save Layout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Location Node with inline editing
function LocationNode({
  location,
  depth,
  expandedNodes,
  editingId,
  enabledLevels,
  showProductSearch,
  productSearchQuery,
  filteredProducts,
  onToggle,
  onStartEdit,
  onRename,
  onDelete,
  onAddChild,
  isBottomLevel,
  getNextLevelType,
  onShowProductSearch,
  onProductSearchChange,
  onAddProduct,
  onRemoveProduct,
}: {
  location: WarehouseLocation;
  depth: number;
  expandedNodes: Set<string>;
  editingId: string | null;
  enabledLevels: string[];
  showProductSearch: string | null;
  productSearchQuery: string;
  filteredProducts: { id: string; name: string; partNumber: string; factoryName?: string }[];
  onToggle: (id: string) => void;
  onStartEdit: (id: string | null) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string, parentType: string) => void;
  isBottomLevel: (type: string) => boolean;
  getNextLevelType: (type: string) => string | null;
  onShowProductSearch: (binId: string | null) => void;
  onProductSearchChange: (query: string) => void;
  onAddProduct: (binId: string, product: { id: string; name: string; partNumber: string }) => void;
  onRemoveProduct: (binId: string, productAssignmentId: string) => void;
}) {
  const [editValue, setEditValue] = useState(location.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const expanded = expandedNodes.has(location.id);
  const hasChildren = location.children && location.children.length > 0;
  const isEditing = editingId === location.id;
  const colors = levelColors[location.type];
  const atBottom = isBottomLevel(location.type);
  const nextType = getNextLevelType(location.type);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: location.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => { setEditValue(location.name); }, [location.name]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onRename(location.id, editValue);
    else if (e.key === 'Escape') { setEditValue(location.name); onStartEdit(null); }
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className="flex items-center gap-1 py-0.5 px-1 rounded hover:bg-[var(--accent)] group"
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        {/* Drag Handle */}
        <div {...attributes} {...listeners} className="p-0.5 cursor-grab text-[var(--muted-foreground)] opacity-0 group-hover:opacity-60 hover:opacity-100">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
          </svg>
        </div>

        {/* Expand/Collapse */}
        <button
          onClick={() => onToggle(location.id)}
          className={`p-0.5 rounded hover:bg-[var(--muted)] ${(hasChildren || !atBottom) ? '' : 'invisible'}`}
        >
          <svg className={`w-3 h-3 text-[var(--muted-foreground)] transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Icon */}
        <div className={`p-1 rounded ${colors.bg} ${colors.text}`}>{LevelIcons[location.type]}</div>

        {/* Name - Click to Edit */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => onRename(location.id, editValue)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-1.5 py-0.5 text-xs font-medium bg-white dark:bg-gray-800 border border-blue-500 rounded outline-none min-w-0"
          />
        ) : (
          <span
            onClick={() => onStartEdit(location.id)}
            className="text-xs font-medium text-[var(--foreground)] cursor-text hover:bg-[var(--muted)] px-1.5 py-0.5 rounded truncate"
          >
            {location.name}
          </span>
        )}

        {/* Product count */}
        {location.products && location.products.length > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
            {location.products.length}
          </span>
        )}

        {/* Action Buttons - Always close to name */}
        <div className="flex items-center gap-0.5 ml-1">
          {(nextType || atBottom) && (
            <button
              onClick={() => {
                if (atBottom) {
                  onShowProductSearch(location.id);
                  if (!expanded) onToggle(location.id);
                } else {
                  onAddChild(location.id, location.type);
                }
              }}
              className={`p-1 rounded transition-colors ${colors.text} hover:${colors.bg} opacity-60 group-hover:opacity-100`}
              title={atBottom ? 'Add Product' : `Add ${levelLabels[nextType!]}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
          <button
            onClick={() => onDelete(location.id)}
            className="p-1 rounded text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
            title="Delete"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Children and Products */}
      {expanded && (
        <div>
          {/* Product Search (for bottom level) */}
          {atBottom && showProductSearch === location.id && (
            <div className="mx-1 my-1 p-2 rounded-lg border border-[var(--border)] bg-[var(--background)]" style={{ marginLeft: `${(depth + 1) * 16 + 12}px` }}>
              <div className="relative mb-2">
                <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search product name, part #, manufacturer..."
                  value={productSearchQuery}
                  onChange={(e) => onProductSearchChange(e.target.value)}
                  className="w-full pl-7 pr-2 py-1.5 text-xs border border-[var(--border)] rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div className="max-h-32 overflow-y-auto space-y-0.5">
                {filteredProducts.slice(0, 8).map((product) => (
                  <button
                    key={product.id}
                    onClick={() => onAddProduct(location.id, product)}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-[var(--accent)] transition-colors"
                  >
                    <div className="text-xs font-medium text-[var(--foreground)]">{product.name}</div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">{product.partNumber} • {product.factoryName}</div>
                  </button>
                ))}
                {filteredProducts.length === 0 && <div className="text-xs text-[var(--muted-foreground)] text-center py-2">No products found</div>}
              </div>
              <button onClick={() => onShowProductSearch(null)} className="mt-2 w-full text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Cancel</button>
            </div>
          )}

          {/* Assigned Products */}
          {atBottom && location.products?.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-2 py-0.5 px-1 mx-1 rounded hover:bg-[var(--accent)] group"
              style={{ marginLeft: `${(depth + 1) * 16 + 8}px` }}
            >
              <div className="p-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">{LevelIcons.product}</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-[var(--foreground)] truncate">{product.productName}</div>
                <div className="text-[10px] text-[var(--muted-foreground)]">{product.partNumber}</div>
              </div>
              <button
                onClick={() => onRemoveProduct(location.id, product.id)}
                className="p-1 rounded text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          {/* Child Locations */}
          {hasChildren && (
            <SortableContext items={location.children!.map(c => c.id)} strategy={verticalListSortingStrategy}>
              {location.children!.map((child) => (
                <LocationNode
                  key={child.id}
                  location={child}
                  depth={depth + 1}
                  expandedNodes={expandedNodes}
                  editingId={editingId}
                  enabledLevels={enabledLevels}
                  showProductSearch={showProductSearch}
                  productSearchQuery={productSearchQuery}
                  filteredProducts={filteredProducts}
                  onToggle={onToggle}
                  onStartEdit={onStartEdit}
                  onRename={onRename}
                  onDelete={onDelete}
                  onAddChild={onAddChild}
                  isBottomLevel={isBottomLevel}
                  getNextLevelType={getNextLevelType}
                  onShowProductSearch={onShowProductSearch}
                  onProductSearchChange={onProductSearchChange}
                  onAddProduct={onAddProduct}
                  onRemoveProduct={onRemoveProduct}
                />
              ))}
            </SortableContext>
          )}
        </div>
      )}
    </div>
  );
}

// Pixels per foot for visual representation
const PIXELS_PER_FOOT = 10;

// Convert feet to pixels
const feetToPixels = (feet: number) => feet * PIXELS_PER_FOOT;
const pixelsToFeet = (pixels: number) => Math.round(pixels / PIXELS_PER_FOOT);

// Visual Warehouse Builder Component
interface VisualWarehouseBuilderProps {
  elements: VisualElement[];
  locations: WarehouseLocation[];
  selectedElementId: string | null;
  zoom: number;
  panOffset: { x: number; y: number };
  enabledLevels: string[];
  warehouseDimensions: { width: number; height: number };
  onWarehouseDimensionsChange: (width: number, height: number) => void;
  onElementSelect: (id: string | null) => void;
  onElementMove: (id: string, x: number, y: number) => void;
  onElementResize: (id: string, width: number, height: number) => void;
  onElementRotate: (id: string, rotation: number) => void;
  onAddChild: (parentId: string, parentType: string) => void;
  onAddSection: () => void;
  onAddSectionAtPosition: (x: number, y: number) => void;
  onDelete: (id: string) => void;
  onWheel: (e: React.WheelEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onZoomChange: (zoom: number) => void;
  onResetView: () => void;
  onSave: () => void;
  onClose: () => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  getNextLevelType: (type: string) => string | null;
  onRename: (id: string, name: string) => void;
}

function VisualWarehouseBuilder({
  elements,
  locations,
  selectedElementId,
  zoom,
  panOffset,
  enabledLevels,
  warehouseDimensions,
  onWarehouseDimensionsChange,
  onElementSelect,
  onElementMove,
  onElementResize,
  onElementRotate,
  onAddChild,
  onAddSection,
  onAddSectionAtPosition,
  onDelete,
  onWheel,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onZoomChange,
  onResetView,
  onSave,
  onClose,
  canvasRef,
  getNextLevelType,
  onRename,
}: VisualWarehouseBuilderProps) {
  const [draggingElement, setDraggingElement] = useState<{ id: string; startX: number; startY: number; elementX: number; elementY: number; parentId?: string } | null>(null);
  const [resizingElement, setResizingElement] = useState<{ id: string; startX: number; startY: number; startWidth: number; startHeight: number; handle: string } | null>(null);
  const [resizingWarehouse, setResizingWarehouse] = useState<{ startX: number; startY: number; startWidth: number; startHeight: number; handle: string } | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [draggingFromLibrary, setDraggingFromLibrary] = useState<{ type: string; id?: string } | null>(null);

  // Canvas dimensions based on warehouse size (with padding)
  const canvasWidth = feetToPixels(warehouseDimensions.width) + 100;
  const canvasHeight = feetToPixels(warehouseDimensions.height) + 100;

  // Get selected element and its location data (for hierarchy)
  const selectedElement = selectedElementId ? findVisualElementById(elements, selectedElementId) : null;
  const selectedLocation = selectedElementId ? findLocationById(locations, selectedElementId) : null;

  const handleElementMouseDown = (e: React.MouseEvent, element: VisualElement, parentId?: string) => {
    e.stopPropagation();
    onElementSelect(element.id);
    setDraggingElement({
      id: element.id,
      startX: e.clientX,
      startY: e.clientY,
      elementX: element.x,
      elementY: element.y,
      parentId,
    });
  };

  const handleResizeMouseDown = (e: React.MouseEvent, element: VisualElement, handle: string) => {
    e.stopPropagation();
    setResizingElement({
      id: element.id,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: element.width,
      startHeight: element.height,
      handle,
    });
  };

  const handleWarehouseResizeMouseDown = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    setResizingWarehouse({
      startX: e.clientX,
      startY: e.clientY,
      startWidth: warehouseDimensions.width,
      startHeight: warehouseDimensions.height,
      handle,
    });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (draggingElement) {
      const dx = (e.clientX - draggingElement.startX) / zoom;
      const dy = (e.clientY - draggingElement.startY) / zoom;

      // Find parent bounds if nested
      let maxX = feetToPixels(warehouseDimensions.width) - 20;
      let maxY = feetToPixels(warehouseDimensions.height) - 20;

      if (draggingElement.parentId) {
        const parent = findVisualElementById(elements, draggingElement.parentId);
        if (parent) {
          const draggedEl = findVisualElementById(elements, draggingElement.id);
          maxX = parent.width - (draggedEl?.width || 50) - 5;
          maxY = parent.height - (draggedEl?.height || 30) - 25; // Account for header
        }
      }

      const newX = Math.max(0, Math.min(maxX, draggingElement.elementX + dx));
      const newY = Math.max(0, Math.min(maxY, draggingElement.elementY + dy));
      onElementMove(draggingElement.id, newX, newY);
    } else if (resizingElement) {
      const dx = (e.clientX - resizingElement.startX) / zoom;
      const dy = (e.clientY - resizingElement.startY) / zoom;
      let newWidth = resizingElement.startWidth;
      let newHeight = resizingElement.startHeight;

      if (resizingElement.handle.includes('e')) newWidth = resizingElement.startWidth + dx;
      if (resizingElement.handle.includes('w')) newWidth = resizingElement.startWidth - dx;
      if (resizingElement.handle.includes('s')) newHeight = resizingElement.startHeight + dy;
      if (resizingElement.handle.includes('n')) newHeight = resizingElement.startHeight - dy;

      onElementResize(resizingElement.id, Math.max(30, newWidth), Math.max(30, newHeight));
    } else if (resizingWarehouse) {
      const dx = (e.clientX - resizingWarehouse.startX) / zoom / PIXELS_PER_FOOT;
      const dy = (e.clientY - resizingWarehouse.startY) / zoom / PIXELS_PER_FOOT;
      let newWidth = resizingWarehouse.startWidth;
      let newHeight = resizingWarehouse.startHeight;

      if (resizingWarehouse.handle.includes('e')) newWidth = resizingWarehouse.startWidth + dx;
      if (resizingWarehouse.handle.includes('s')) newHeight = resizingWarehouse.startHeight + dy;

      onWarehouseDimensionsChange(Math.max(50, Math.round(newWidth)), Math.max(50, Math.round(newHeight)));
    } else {
      onMouseMove(e);
    }
  };

  const handleCanvasMouseUp = () => {
    setDraggingElement(null);
    setResizingElement(null);
    setResizingWarehouse(null);
    onMouseUp();
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('canvas-grid')) {
      onElementSelect(null);
      setEditingName(null);
    }
  };

  // Handle drag over for library items
  const handleDragOver = (e: React.DragEvent) => {
    if (draggingFromLibrary) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  // Handle drop from library
  const handleDrop = (e: React.DragEvent) => {
    if (draggingFromLibrary && canvasRef.current) {
      e.preventDefault();

      // Calculate drop position relative to canvas (accounting for zoom and pan)
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const rawX = (e.clientX - canvasRect.left - panOffset.x) / zoom;
      const rawY = (e.clientY - canvasRect.top - panOffset.y) / zoom;

      // Adjust for warehouse floor offset (50px padding) and clamp to bounds
      const dropX = Math.max(0, Math.min(feetToPixels(warehouseDimensions.width) - 300, rawX - 50));
      const dropY = Math.max(0, Math.min(feetToPixels(warehouseDimensions.height) - 200, rawY - 50));

      if (draggingFromLibrary.id) {
        // Moving an existing element to a new position
        onElementMove(draggingFromLibrary.id, dropX, dropY);
        onElementSelect(draggingFromLibrary.id);
      } else if (draggingFromLibrary.type === 'section') {
        // Creating a new section at the drop position
        onAddSectionAtPosition(dropX, dropY);
      }

      setDraggingFromLibrary(null);
    }
  };

  // Render a draggable/resizable element with nested grid
  const renderElement = (element: VisualElement, depth: number = 0, parentId?: string) => {
    const isSelected = selectedElementId === element.id;
    const colors = levelColors[element.type];
    const nextType = getNextLevelType(element.type);
    const hasChildren = element.children && element.children.length > 0;

    const width = element.width;
    const height = element.height;

    // Grid size for this element (smaller for deeper levels)
    const gridSize = Math.max(5, 20 - depth * 5);

    return (
      <div
        key={element.id}
        className={`absolute transition-shadow ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
        style={{
          left: element.x,
          top: element.y,
          width: width,
          height: height,
          transform: `rotate(${element.rotation || 0}deg)`,
          zIndex: isSelected ? 100 : 10 - depth,
        }}
      >
        {/* Element body with internal grid */}
        <div
          className={`w-full h-full rounded-lg border-2 ${colors.bg} ${colors.border} shadow-sm overflow-hidden flex flex-col cursor-move`}
          onMouseDown={(e) => handleElementMouseDown(e, element, parentId)}
        >
          {/* Header - draggable handle */}
          <div className={`px-2 py-1 ${colors.bg} border-b ${colors.border} flex items-center gap-1.5 flex-shrink-0`}>
            <span className={colors.text}>{LevelIcons[element.type]}</span>
            {editingName === element.id ? (
              <input
                type="text"
                defaultValue={element.name}
                className="flex-1 text-[10px] font-medium bg-white dark:bg-gray-800 px-1 rounded border border-blue-500 outline-none min-w-0"
                autoFocus
                onBlur={(e) => {
                  onRename(element.id, e.target.value);
                  setEditingName(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onRename(element.id, (e.target as HTMLInputElement).value);
                    setEditingName(null);
                  } else if (e.key === 'Escape') {
                    setEditingName(null);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className={`text-[10px] font-medium ${colors.text} truncate cursor-text`}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingName(element.id);
                }}
              >
                {element.name}
              </span>
            )}
            <span className="text-[8px] text-[var(--muted-foreground)] ml-auto">
              {pixelsToFeet(width)}×{pixelsToFeet(height)} ft
            </span>
            {nextType && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild(element.id, element.type);
                }}
                className={`p-0.5 rounded hover:bg-white/50 ${colors.text}`}
                title={`Add ${levelLabels[nextType]}`}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
          </div>

          {/* Children container with internal grid */}
          <div
            className="flex-1 relative overflow-hidden"
            style={{
              backgroundImage: `
                linear-gradient(to right, ${colors.border.includes('purple') ? 'rgba(147,51,234,0.1)' : colors.border.includes('blue') ? 'rgba(59,130,246,0.1)' : colors.border.includes('green') ? 'rgba(34,197,94,0.1)' : 'rgba(0,0,0,0.05)'} 1px, transparent 1px),
                linear-gradient(to bottom, ${colors.border.includes('purple') ? 'rgba(147,51,234,0.1)' : colors.border.includes('blue') ? 'rgba(59,130,246,0.1)' : colors.border.includes('green') ? 'rgba(34,197,94,0.1)' : 'rgba(0,0,0,0.05)'} 1px, transparent 1px)
              `,
              backgroundSize: `${gridSize}px ${gridSize}px`,
            }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                handleElementMouseDown(e, element, parentId);
              }
            }}
          >
            {/* Render children as draggable elements within this container */}
            {hasChildren && element.children!.map((child) => renderChildElement(child, element.id, depth + 1))}
          </div>
        </div>

        {/* Resize handles (only when selected) */}
        {isSelected && (
          <>
            <div
              className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-8 bg-blue-500 rounded cursor-e-resize hover:bg-blue-600"
              onMouseDown={(e) => handleResizeMouseDown(e, element, 'e')}
            />
            <div
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-3 bg-blue-500 rounded cursor-s-resize hover:bg-blue-600"
              onMouseDown={(e) => handleResizeMouseDown(e, element, 's')}
            />
            <div
              className="absolute -right-1.5 -bottom-1.5 w-4 h-4 bg-blue-500 rounded cursor-se-resize hover:bg-blue-600"
              onMouseDown={(e) => handleResizeMouseDown(e, element, 'se')}
            />
            <div
              className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-8 bg-blue-500 rounded cursor-w-resize hover:bg-blue-600"
              onMouseDown={(e) => handleResizeMouseDown(e, element, 'w')}
            />
            <div
              className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-3 bg-blue-500 rounded cursor-n-resize hover:bg-blue-600"
              onMouseDown={(e) => handleResizeMouseDown(e, element, 'n')}
            />
          </>
        )}
      </div>
    );
  };

  // Render nested child element (draggable within parent)
  const renderChildElement = (child: VisualElement, parentId: string, depth: number) => {
    const isSelected = selectedElementId === child.id;
    const colors = levelColors[child.type];
    const nextType = getNextLevelType(child.type);
    const hasChildren = child.children && child.children.length > 0;
    const gridSize = Math.max(5, 15 - depth * 3);

    return (
      <div
        key={child.id}
        className={`absolute transition-shadow ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
        style={{
          left: child.x,
          top: child.y,
          width: child.width,
          height: child.height,
          transform: `rotate(${child.rotation || 0}deg)`,
          zIndex: isSelected ? 50 : 5,
        }}
      >
        <div
          className={`w-full h-full rounded border-2 ${colors.bg} ${colors.border} overflow-hidden flex flex-col cursor-move`}
          onMouseDown={(e) => handleElementMouseDown(e, child, parentId)}
        >
          {/* Child Header */}
          <div className={`px-1.5 py-0.5 ${colors.bg} border-b ${colors.border} flex items-center gap-1 flex-shrink-0`}>
            <span className={`${colors.text} scale-75`}>{LevelIcons[child.type]}</span>
            {editingName === child.id ? (
              <input
                type="text"
                defaultValue={child.name}
                className="flex-1 text-[8px] font-medium bg-white dark:bg-gray-800 px-1 rounded border border-blue-500 outline-none min-w-0"
                autoFocus
                onBlur={(e) => {
                  onRename(child.id, e.target.value);
                  setEditingName(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onRename(child.id, (e.target as HTMLInputElement).value);
                    setEditingName(null);
                  } else if (e.key === 'Escape') {
                    setEditingName(null);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className={`text-[8px] font-medium ${colors.text} truncate cursor-text`}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingName(child.id);
                }}
              >
                {child.name}
              </span>
            )}
            {nextType && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild(child.id, child.type);
                }}
                className={`ml-auto p-0.5 rounded hover:bg-white/50 ${colors.text}`}
                title={`Add ${levelLabels[nextType]}`}
              >
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
          </div>

          {/* Nested content area with grid */}
          {(hasChildren || nextType) && (
            <div
              className="flex-1 relative overflow-hidden"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)
                `,
                backgroundSize: `${gridSize}px ${gridSize}px`,
              }}
            >
              {hasChildren && child.children!.map((grandChild) => renderChildElement(grandChild, child.id, depth + 1))}
            </div>
          )}
        </div>

        {/* Resize handles for nested elements */}
        {isSelected && (
          <>
            <div
              className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-5 bg-blue-500 rounded cursor-e-resize hover:bg-blue-600"
              onMouseDown={(e) => handleResizeMouseDown(e, child, 'e')}
            />
            <div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-2 bg-blue-500 rounded cursor-s-resize hover:bg-blue-600"
              onMouseDown={(e) => handleResizeMouseDown(e, child, 's')}
            />
            <div
              className="absolute -right-1 -bottom-1 w-2.5 h-2.5 bg-blue-500 rounded cursor-se-resize hover:bg-blue-600"
              onMouseDown={(e) => handleResizeMouseDown(e, child, 'se')}
            />
          </>
        )}
      </div>
    );
  };

  // Find the root section containing the selected element
  const rootSectionForSelected = selectedElementId ? findRootSectionContaining(locations, selectedElementId) : null;
  // Get the path to the selected element (for highlighting ancestors)
  const pathToSelected = selectedElementId ? getPathToElement(locations, selectedElementId) : [];

  // Helper to render hierarchy tree - shows full tree with path to selected highlighted
  const renderHierarchy = (location: WarehouseLocation, depth: number = 0) => {
    const colors = levelColors[location.type];
    const hasChildren = location.children && location.children.length > 0;
    const hasProducts = location.products && location.products.length > 0;
    const isSelected = selectedElementId === location.id;
    const isInPath = pathToSelected.includes(location.id);

    return (
      <div key={location.id} className="text-[10px]">
        <div
          className={`flex items-center gap-1.5 py-1 px-1.5 rounded cursor-pointer transition-colors ${
            isSelected
              ? 'bg-blue-100 dark:bg-blue-900/30 ring-1 ring-blue-400'
              : isInPath
                ? 'bg-blue-50 dark:bg-blue-900/10'
                : 'hover:bg-[var(--accent)]'
          }`}
          style={{ paddingLeft: `${depth * 12 + 6}px` }}
          onClick={() => onElementSelect(location.id)}
        >
          <span className={colors.text}>{LevelIcons[location.type]}</span>
          <span className={`font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-[var(--foreground)]'}`}>
            {location.name}
          </span>
          {hasChildren && (
            <span className="text-[var(--muted-foreground)] ml-auto text-[9px]">
              {location.children!.length} {location.children!.length === 1 ? 'child' : 'children'}
            </span>
          )}
        </div>
        {hasChildren && location.children!.map(child => renderHierarchy(child, depth + 1))}
        {hasProducts && location.products!.map(product => (
          <div
            key={product.id}
            className="flex items-center gap-1.5 py-0.5 px-1.5 text-[var(--muted-foreground)] hover:bg-[var(--accent)] rounded"
            style={{ paddingLeft: `${(depth + 1) * 12 + 6}px` }}
          >
            <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="truncate flex-1">{product.productName}</span>
            <span className="text-[9px]">×{product.quantity}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Library Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)] bg-[var(--muted)]/50 flex-shrink-0">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase mr-2">Library:</span>
          {/* Existing elements from tree */}
          {locations.map(loc => (
            <div
              key={loc.id}
              draggable
              onDragStart={() => setDraggingFromLibrary({ type: loc.type, id: loc.id })}
              onDragEnd={() => setDraggingFromLibrary(null)}
              className={`flex items-center gap-1 px-2 py-1 rounded border cursor-grab active:cursor-grabbing ${levelColors[loc.type].bg} ${levelColors[loc.type].border} ${levelColors[loc.type].text}`}
            >
              {LevelIcons[loc.type]}
              <span className="text-[10px] font-medium">{loc.name}</span>
            </div>
          ))}
          <div className="w-px h-5 bg-[var(--border)] mx-1" />
          {/* Create new section - can be dragged or clicked */}
          {enabledLevels.includes('section') && (
            <div
              draggable
              onDragStart={() => setDraggingFromLibrary({ type: 'section' })}
              onDragEnd={() => setDraggingFromLibrary(null)}
              onClick={onAddSection}
              className="flex items-center gap-1 px-2 py-1 rounded border border-dashed border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors cursor-grab active:cursor-grabbing"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-[10px] font-medium">New Section</span>
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Zoom controls */}
        <div className="flex items-center gap-1 bg-[var(--background)] rounded-lg border border-[var(--border)] px-1">
          <button
            onClick={() => onZoomChange(Math.max(0.25, zoom - 0.1))}
            className="p-1 hover:bg-[var(--accent)] rounded transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="text-[10px] text-[var(--muted-foreground)] w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => onZoomChange(Math.min(3, zoom + 0.1))}
            className="p-1 hover:bg-[var(--accent)] rounded transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={onResetView}
            className="px-1.5 py-0.5 text-[10px] hover:bg-[var(--accent)] rounded transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Save/Close */}
        <div className="flex items-center gap-2 ml-2">
          <button onClick={onClose} className="px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--accent)] rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={onSave} className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Save Layout
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Canvas */}
        <div
          ref={canvasRef}
          className={`flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900 relative ${draggingFromLibrary ? 'ring-2 ring-inset ring-blue-400 ring-opacity-50' : ''}`}
          onWheel={onWheel}
          onMouseDown={onMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onClick={handleCanvasClick}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          style={{ cursor: draggingElement ? 'grabbing' : resizingElement || resizingWarehouse ? 'nwse-resize' : draggingFromLibrary ? 'copy' : 'default' }}
        >
          {/* Canvas with grid */}
          <div
            className="absolute origin-top-left canvas-grid"
            style={{
              width: canvasWidth,
              height: canvasHeight,
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              backgroundImage: `
                linear-gradient(to right, var(--border) 1px, transparent 1px),
                linear-gradient(to bottom, var(--border) 1px, transparent 1px)
              `,
              backgroundSize: `${PIXELS_PER_FOOT}px ${PIXELS_PER_FOOT}px`,
              backgroundColor: 'var(--background)',
            }}
            onClick={handleCanvasClick}
          >
            {/* Warehouse outline - resizable */}
            <div
              className="absolute border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50"
              style={{
                left: 50,
                top: 50,
                width: feetToPixels(warehouseDimensions.width),
                height: feetToPixels(warehouseDimensions.height),
              }}
            >
              <div className="absolute -top-5 left-4 px-2 py-0.5 bg-[var(--background)] rounded text-[10px] text-[var(--foreground)] font-medium border border-[var(--border)]">
                Warehouse Floor ({warehouseDimensions.width} × {warehouseDimensions.height} ft)
              </div>

              {/* Warehouse resize handles */}
              <div
                className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-10 bg-gray-400 dark:bg-gray-600 rounded cursor-e-resize hover:bg-gray-500"
                onMouseDown={(e) => handleWarehouseResizeMouseDown(e, 'e')}
              />
              <div
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-4 bg-gray-400 dark:bg-gray-600 rounded cursor-s-resize hover:bg-gray-500"
                onMouseDown={(e) => handleWarehouseResizeMouseDown(e, 's')}
              />
              <div
                className="absolute -right-2 -bottom-2 w-5 h-5 bg-gray-400 dark:bg-gray-600 rounded cursor-se-resize hover:bg-gray-500"
                onMouseDown={(e) => handleWarehouseResizeMouseDown(e, 'se')}
              />

              {/* Render all top-level elements within warehouse bounds */}
              <div className="absolute inset-0 overflow-hidden">
                {elements.map(element => renderElement(element, 0))}
              </div>
            </div>

            {/* Scale reference */}
            <div className="absolute bottom-2 left-[50px] flex items-center gap-1 text-[9px] text-[var(--muted-foreground)]">
              <div className="w-[100px] h-1 bg-gray-400 dark:bg-gray-600 rounded" />
              <span>10 ft</span>
            </div>

            {/* Empty state */}
            {elements.length === 0 && (
              <div
                className="absolute flex items-center justify-center"
                style={{
                  left: 50,
                  top: 50,
                  width: feetToPixels(warehouseDimensions.width),
                  height: feetToPixels(warehouseDimensions.height),
                }}
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-[var(--muted)] rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-[var(--foreground)] mb-1">Start Building</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Drag sections from the library or create new ones</p>
                </div>
              </div>
            )}
          </div>

          {/* Mini-map */}
          <div className="absolute bottom-3 left-3 w-36 h-28 bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden shadow-lg">
            <div className="absolute inset-0 p-1.5">
              <div className="relative w-full h-full bg-[var(--background)] rounded overflow-hidden">
                {elements.map(element => (
                  <div
                    key={element.id}
                    className={`absolute rounded-sm ${levelColors[element.type].bg} border ${levelColors[element.type].border}`}
                    style={{
                      left: `${(element.x / feetToPixels(warehouseDimensions.width)) * 100}%`,
                      top: `${(element.y / feetToPixels(warehouseDimensions.height)) * 100}%`,
                      width: `${(element.width / feetToPixels(warehouseDimensions.width)) * 100}%`,
                      height: `${(element.height / feetToPixels(warehouseDimensions.height)) * 100}%`,
                    }}
                  />
                ))}
                <div
                  className="absolute border-2 border-blue-500 bg-blue-500/10 rounded-sm"
                  style={{
                    left: `${Math.max(0, (-panOffset.x / zoom - 50) / feetToPixels(warehouseDimensions.width)) * 100}%`,
                    top: `${Math.max(0, (-panOffset.y / zoom - 50) / feetToPixels(warehouseDimensions.height)) * 100}%`,
                    width: `${Math.min(100, (100 / zoom))}%`,
                    height: `${Math.min(100, (100 / zoom))}%`,
                  }}
                />
              </div>
            </div>
            <div className="absolute bottom-1 right-1.5 text-[8px] text-[var(--muted-foreground)]">Overview</div>
          </div>

          {/* Help overlay */}
          <div className="absolute top-3 left-3 px-2 py-1 bg-[var(--card)]/90 backdrop-blur-sm border border-[var(--border)] rounded-lg">
            <div className="flex items-center gap-2 text-[10px] text-[var(--muted-foreground)]">
              <span>Drag to move</span>
              <span className="w-px h-3 bg-[var(--border)]" />
              <span>Double-click to edit</span>
              <span className="w-px h-3 bg-[var(--border)]" />
              <span>Alt+Drag pan</span>
              <span className="w-px h-3 bg-[var(--border)]" />
              <span>Scroll zoom</span>
            </div>
          </div>
        </div>

        {/* Collapsible Properties Panel */}
        <div className={`${isPanelCollapsed ? 'w-10' : 'w-72'} border-l border-[var(--border)] bg-[var(--card)] flex flex-col overflow-hidden transition-all duration-200`}>
          {/* Panel Header with collapse toggle */}
          <div className="flex items-center justify-between px-2 py-2 border-b border-[var(--border)]">
            {!isPanelCollapsed && <h3 className="text-xs font-semibold text-[var(--foreground)]">Properties</h3>}
            <button
              onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
              className="p-1 hover:bg-[var(--accent)] rounded transition-colors"
              title={isPanelCollapsed ? 'Expand panel' : 'Collapse panel'}
            >
              <svg className={`w-4 h-4 text-[var(--muted-foreground)] transition-transform ${isPanelCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {!isPanelCollapsed && (
            <div className="flex-1 overflow-y-auto">
              {/* Warehouse Dimensions */}
              <div className="p-3 border-b border-[var(--border)]">
                <label className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Warehouse Size</label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-[var(--muted-foreground)]">Width (ft)</label>
                    <input
                      type="number"
                      value={warehouseDimensions.width}
                      onChange={(e) => onWarehouseDimensionsChange(parseInt(e.target.value) || 100, warehouseDimensions.height)}
                      className="w-full mt-0.5 px-2 py-1 text-xs border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--muted-foreground)]">Height (ft)</label>
                    <input
                      type="number"
                      value={warehouseDimensions.height}
                      onChange={(e) => onWarehouseDimensionsChange(warehouseDimensions.width, parseInt(e.target.value) || 100)}
                      className="w-full mt-0.5 px-2 py-1 text-xs border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)]"
                    />
                  </div>
                </div>
              </div>

              {/* Selected Element Properties & Hierarchy */}
              {selectedElement && selectedLocation ? (
                <div className="p-3 space-y-3">
                  {/* Element Header */}
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded ${levelColors[selectedElement.type].bg}`}>
                      <span className={levelColors[selectedElement.type].text}>{LevelIcons[selectedElement.type]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-[var(--foreground)] truncate">{selectedElement.name}</div>
                      <div className="text-[10px] text-[var(--muted-foreground)]">{levelLabels[selectedElement.type]}</div>
                    </div>
                    <button
                      onClick={() => onDelete(selectedElement.id)}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 rounded transition-colors"
                      title="Delete"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Position & Size */}
                  <div className="grid grid-cols-4 gap-1.5">
                    <div>
                      <label className="text-[9px] text-[var(--muted-foreground)]">X (ft)</label>
                      <input
                        type="number"
                        value={pixelsToFeet(selectedElement.x)}
                        onChange={(e) => onElementMove(selectedElement.id, feetToPixels(parseInt(e.target.value) || 0), selectedElement.y)}
                        className="w-full mt-0.5 px-1.5 py-1 text-[10px] border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-[var(--muted-foreground)]">Y (ft)</label>
                      <input
                        type="number"
                        value={pixelsToFeet(selectedElement.y)}
                        onChange={(e) => onElementMove(selectedElement.id, selectedElement.x, feetToPixels(parseInt(e.target.value) || 0))}
                        className="w-full mt-0.5 px-1.5 py-1 text-[10px] border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-[var(--muted-foreground)]">W (ft)</label>
                      <input
                        type="number"
                        value={pixelsToFeet(selectedElement.width)}
                        onChange={(e) => onElementResize(selectedElement.id, feetToPixels(parseInt(e.target.value) || 10), selectedElement.height)}
                        className="w-full mt-0.5 px-1.5 py-1 text-[10px] border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-[var(--muted-foreground)]">H (ft)</label>
                      <input
                        type="number"
                        value={pixelsToFeet(selectedElement.height)}
                        onChange={(e) => onElementResize(selectedElement.id, selectedElement.width, feetToPixels(parseInt(e.target.value) || 10))}
                        className="w-full mt-0.5 px-1.5 py-1 text-[10px] border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)]"
                      />
                    </div>
                  </div>

                  {/* Rotation */}
                  <div>
                    <label className="text-[9px] text-[var(--muted-foreground)]">Rotation</label>
                    <div className="flex items-center gap-2 mt-0.5">
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={selectedElement.rotation}
                        onChange={(e) => onElementRotate(selectedElement.id, parseInt(e.target.value))}
                        className="flex-1 h-1 bg-[var(--muted)] rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-[10px] text-[var(--foreground)] w-8 text-right">{selectedElement.rotation}°</span>
                    </div>
                  </div>

                  {/* Add Child button */}
                  {getNextLevelType(selectedElement.type) && (
                    <button
                      onClick={() => onAddChild(selectedElement.id, selectedElement.type)}
                      className={`w-full py-1.5 text-[10px] font-medium rounded border-2 border-dashed ${levelColors[getNextLevelType(selectedElement.type)!].border} ${levelColors[getNextLevelType(selectedElement.type)!].text} hover:${levelColors[getNextLevelType(selectedElement.type)!].bg} transition-colors`}
                    >
                      + Add {levelLabels[getNextLevelType(selectedElement.type)!]}
                    </button>
                  )}

                  {/* Hierarchy View - Shows full tree from root section */}
                  <div className="pt-3 border-t border-[var(--border)]">
                    <label className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                      Full Hierarchy {rootSectionForSelected && `(${rootSectionForSelected.name})`}
                    </label>
                    <div className="mt-2 max-h-64 overflow-y-auto rounded border border-[var(--border)] bg-[var(--background)] p-1">
                      {rootSectionForSelected ? renderHierarchy(rootSectionForSelected) : renderHierarchy(selectedLocation)}
                    </div>
                    <p className="mt-1.5 text-[9px] text-[var(--muted-foreground)]">
                      Click any item to select it. Selected item highlighted in blue.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <div className="w-10 h-10 bg-[var(--muted)] rounded-lg flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)]">Double-click an element to view its hierarchy</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Functions
function buildVisualElements(locations: WarehouseLocation[]): VisualElement[] {
  let xOffset = 50;
  let yOffset = 50;

  return locations.map((location, index) => {
    const element: VisualElement = {
      id: location.id,
      locationId: location.id,
      x: location.x ?? xOffset + (index % 3) * 350,
      y: location.y ?? yOffset + Math.floor(index / 3) * 250,
      width: location.width ?? 300,
      height: location.height ?? 200,
      rotation: location.rotation ?? 0,
      type: location.type,
      name: location.name,
      parentId: location.parentId,
      children: location.children ? buildChildVisualElements(location.children, location.id) : [],
    };
    return element;
  });
}

function buildChildVisualElements(children: WarehouseLocation[], parentId: string): VisualElement[] {
  return children.map((child, index) => ({
    id: child.id,
    locationId: child.id,
    x: child.x ?? 10 + (index % 4) * 70,
    y: child.y ?? 30 + Math.floor(index / 4) * 35,
    width: child.width ?? 60,
    height: child.height ?? 30,
    rotation: child.rotation ?? 0,
    type: child.type,
    name: child.name,
    parentId: parentId,
    children: child.children ? buildChildVisualElements(child.children, child.id) : [],
  }));
}

function findVisualElementById(elements: VisualElement[], id: string): VisualElement | null {
  for (const el of elements) {
    if (el.id === id) return el;
    if (el.children) {
      const found = findVisualElementById(el.children, id);
      if (found) return found;
    }
  }
  return null;
}

function buildLocationTree(warehouseId: string): WarehouseLocation[] {
  return mockSections
    .filter(s => s.warehouseId === warehouseId)
    .map(section => ({
      id: section.id,
      name: section.name,
      type: 'section' as const,
      description: section.description,
      isActive: section.isActive,
      products: [],
      children: mockAisles
        .filter(a => a.sectionId === section.id)
        .map(aisle => ({
          id: aisle.id,
          name: aisle.name,
          type: 'aisle' as const,
          parentId: section.id,
          isActive: aisle.isActive,
          products: [],
          children: mockShelves
            .filter(s => s.aisleId === aisle.id)
            .map(shelf => ({
              id: shelf.id,
              name: shelf.name,
              type: 'shelf' as const,
              parentId: aisle.id,
              isActive: shelf.isActive,
              products: [],
              children: mockBays
                .filter(b => b.shelfId === shelf.id)
                .map(bay => ({
                  id: bay.id,
                  name: bay.code,
                  type: 'bay' as const,
                  parentId: shelf.id,
                  isActive: bay.isActive,
                  products: [],
                  children: mockRows
                    .filter(r => r.bayId === bay.id)
                    .map(row => ({
                      id: row.id,
                      name: `Row ${row.rowNumber}`,
                      type: 'row' as const,
                      parentId: bay.id,
                      isActive: row.isActive,
                      products: [],
                      children: mockBins
                        .filter(b => b.rowId === row.id)
                        .map(bin => ({
                          id: bin.id,
                          name: `Bin ${bin.letterCode}`,
                          type: 'bin' as const,
                          parentId: row.id,
                          isActive: bin.isActive,
                          products: mockInventoryItems
                            .filter(i => i.binId === bin.id)
                            .map(i => ({
                              id: i.id,
                              productId: i.inventoryId,
                              productName: i.binLocation || 'Product',
                              partNumber: i.barcode || '',
                              quantity: i.quantity,
                            })),
                        })),
                    })),
                })),
            })),
        })),
    }));
}

function filterLocations(locations: WarehouseLocation[], query: string): WarehouseLocation[] {
  const lowerQuery = query.toLowerCase();
  const filterNode = (node: WarehouseLocation): WarehouseLocation | null => {
    const matchesSelf = node.name.toLowerCase().includes(lowerQuery);
    const filteredChildren = node.children?.map(filterNode).filter((c): c is WarehouseLocation => c !== null);
    if (matchesSelf || (filteredChildren && filteredChildren.length > 0)) {
      return { ...node, children: filteredChildren || [] };
    }
    return null;
  };
  return locations.map(filterNode).filter((loc): loc is WarehouseLocation => loc !== null);
}

function countLocations(locations: WarehouseLocation[]): number {
  return locations.reduce((count, loc) => count + 1 + (loc.children ? countLocations(loc.children) : 0), 0);
}

function findLocationById(locations: WarehouseLocation[], id: string): WarehouseLocation | null {
  for (const loc of locations) {
    if (loc.id === id) return loc;
    if (loc.children) {
      const found = findLocationById(loc.children, id);
      if (found) return found;
    }
  }
  return null;
}

// Find the root section that contains a given element ID
function findRootSectionContaining(locations: WarehouseLocation[], targetId: string): WarehouseLocation | null {
  for (const section of locations) {
    if (section.id === targetId) return section;
    if (containsId(section, targetId)) return section;
  }
  return null;
}

// Check if a location or any of its descendants has the given ID
function containsId(location: WarehouseLocation, targetId: string): boolean {
  if (location.id === targetId) return true;
  if (location.children) {
    return location.children.some(child => containsId(child, targetId));
  }
  return false;
}

// Get the path from root to a specific element
function getPathToElement(locations: WarehouseLocation[], targetId: string, path: string[] = []): string[] {
  for (const loc of locations) {
    if (loc.id === targetId) {
      return [...path, loc.id];
    }
    if (loc.children) {
      const childPath = getPathToElement(loc.children, targetId, [...path, loc.id]);
      if (childPath.length > 0) return childPath;
    }
  }
  return [];
}
