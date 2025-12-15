'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  description?: string;
  isActive: boolean;
  products?: ProductAssignment[];
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] w-full max-w-4xl h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-[var(--foreground)]">Warehouse Layout</h2>
            <p className="text-xs text-[var(--muted-foreground)]">{warehouseName} • Click names to edit, drag to reorder</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-[var(--accent)] rounded-lg transition-colors">
            <svg className="w-4 h-4 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search + Add Section */}
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

        {/* Content */}
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

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)] bg-[var(--card)] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--muted-foreground)]">{countLocations(locations)} locations</span>
            <div className="flex items-center gap-1">
              {enabledLevels.map((level) => (
                <span key={level} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${levelColors[level]?.bg} ${levelColors[level]?.text}`}>
                  {levelLabels[level]}
                </span>
              ))}
            </div>
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

// Helper Functions
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
