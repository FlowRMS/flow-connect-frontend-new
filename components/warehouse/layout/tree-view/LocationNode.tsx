'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { WarehouseLocation, WarehouseLocationLevel, AvailableProduct } from '../types';
import { LevelIcons, levelColors, levelLabels } from '../constants';
import ProductAssignment from './ProductAssignment';

interface LocationNodeProps {
  location: WarehouseLocation;
  depth: number;
  expandedNodes: Set<string>;
  editingId: string | null;
  showProductSearch: string | null;
  productSearchQuery: string;
  filteredProducts: AvailableProduct[];
  isSearchingProducts?: boolean;
  onToggle: (id: string) => void;
  onStartEdit: (id: string | null) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string, parentType: string) => void;
  isBottomLevel: (type: string) => boolean;
  getNextLevelType: (type: string) => WarehouseLocationLevel | null;
  onShowProductSearch: (binId: string | null) => void;
  onProductSearchChange: (query: string) => void;
  onAddProduct: (binId: string, product: AvailableProduct) => void;
  onRemoveProduct: (binId: string, productAssignmentId: string) => void;
}

export default function LocationNode({
  location,
  depth,
  expandedNodes,
  editingId,
  showProductSearch,
  productSearchQuery,
  filteredProducts,
  isSearchingProducts = false,
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
}: LocationNodeProps) {
  const [editValue, setEditValue] = useState(location.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const expanded = expandedNodes.has(location.id);
  const hasChildren = location.children && location.children.length > 0;
  const isEditing = editingId === location.id;
  const colors = levelColors[location.type];
  const atBottom = isBottomLevel(location.type);
  const nextType = getNextLevelType(location.type);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: location.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  // Auto-focus input when editing
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Sync edit value with location name
  useEffect(() => {
    setEditValue(location.name);
  }, [location.name]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onRename(location.id, editValue);
    } else if (e.key === 'Escape') {
      setEditValue(location.name);
      onStartEdit(null);
    }
  };

  const handleAddButtonClick = () => {
    if (atBottom) {
      onShowProductSearch(location.id);
      if (!expanded) onToggle(location.id);
    } else {
      onAddChild(location.id, location.type);
    }
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* Location Row */}
      <div
        className="flex items-center gap-1 py-0.5 px-1 rounded hover:bg-[var(--accent)] group"
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="p-0.5 cursor-grab text-[var(--muted-foreground)] opacity-0 group-hover:opacity-60 hover:opacity-100"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
          </svg>
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={() => onToggle(location.id)}
          className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasChildren || !atBottom ? '' : 'invisible'}`}
        >
          <svg
            className={`w-3 h-3 text-[var(--muted-foreground)] transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
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

        {/* Product Count Badge */}
        {location.products && location.products.length > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
            {location.products.length}
          </span>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-0.5 ml-1">
          {/* Add Child / Add Product Button */}
          {(nextType || atBottom) && (
            <button
              onClick={handleAddButtonClick}
              className={`p-1 rounded transition-colors ${colors.text} hover:${colors.bg} opacity-60 group-hover:opacity-100`}
              title={atBottom ? 'Add Product' : `Add ${levelLabels[nextType!]}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}

          {/* Delete Button */}
          <button
            onClick={() => onDelete(location.id)}
            className="p-1 rounded text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
            title="Delete"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div>
          {/* Product Assignment for Bottom Level */}
          {atBottom && (
            <ProductAssignment
              locationId={location.id}
              depth={depth}
              isExpanded={expanded}
              showProductSearch={showProductSearch === location.id}
              productSearchQuery={productSearchQuery}
              filteredProducts={filteredProducts}
              assignedProducts={location.products}
              isSearching={isSearchingProducts}
              onToggleExpand={() => onToggle(location.id)}
              onShowProductSearch={(show) => onShowProductSearch(show ? location.id : null)}
              onProductSearchChange={onProductSearchChange}
              onAddProduct={(product) => onAddProduct(location.id, product)}
              onRemoveProduct={(productId) => onRemoveProduct(location.id, productId)}
            />
          )}

          {/* Child Locations */}
          {hasChildren && (
            <SortableContext items={location.children!.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              {location.children!.map((child) => (
                <LocationNode
                  key={child.id}
                  location={child}
                  depth={depth + 1}
                  expandedNodes={expandedNodes}
                  editingId={editingId}
                  showProductSearch={showProductSearch}
                  productSearchQuery={productSearchQuery}
                  filteredProducts={filteredProducts}
                  isSearchingProducts={isSearchingProducts}
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
