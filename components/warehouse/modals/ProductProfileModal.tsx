'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useQuery } from '@apollo/client/react';
import Link from 'next/link';
import { GET_WAREHOUSE_LOCATIONS } from '@/app/graphql/warehouse';
import {
  Inventory,
  ProductBinLocation,
  ownershipTypeLabels,
  ownershipTypeColors,
} from '@/lib/types/warehouse';
import { useWarehouse } from '../WarehouseContext';

// Default options for dropdowns (can be extended by user)
const DEFAULT_ABC_CLASSES = ['A', 'B', 'C'];
const DEFAULT_MOVEMENT_OPTIONS = ['fast', 'medium', 'slow'];

interface ProductProfileModalProps {
  inventory: Inventory;
  onClose: () => void;
  onSave?: (data: {
    binLocations: ProductBinLocation[];
    settings: EditableSettings;
  }) => void;
}

interface EditableSettings {
  abcClass: string | undefined;
  ownershipType: string;
}

// Editable dropdown with ability to add custom values
function EditableSelect({
  value,
  options,
  onChange,
  onAddOption,
  placeholder,
  renderOption,
  className = '',
}: {
  value: string | undefined;
  options: string[];
  onChange: (value: string | undefined) => void;
  onAddOption: (option: string) => void;
  placeholder?: string;
  renderOption?: (option: string) => string;
  className?: string;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newOption, setNewOption] = useState('');

  const handleAddOption = () => {
    if (newOption.trim()) {
      onAddOption(newOption.trim().toLowerCase());
      onChange(newOption.trim().toLowerCase());
      setNewOption('');
      setIsAdding(false);
    }
  };

  if (isAdding) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={newOption}
          onChange={(e) => setNewOption(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddOption();
            if (e.key === 'Escape') {
              setIsAdding(false);
              setNewOption('');
            }
          }}
          className="w-20 px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
          placeholder="New..."
          autoFocus
        />
        <button
          onClick={handleAddOption}
          className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12l5 5L20 7" />
          </svg>
        </button>
        <button
          onClick={() => {
            setIsAdding(false);
            setNewOption('');
          }}
          className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className={`px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50 ${className}`}
      >
        <option value="">{placeholder || 'Select...'}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {renderOption ? renderOption(opt) : opt}
          </option>
        ))}
      </select>
      <button
        onClick={() => setIsAdding(true)}
        className="p-1 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--muted)] rounded"
        title="Add custom option"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  );
}

export default function ProductProfileModal({
  inventory,
  onClose,
  onSave,
}: ProductProfileModalProps) {
  const { isManagerView, selectedWarehouse } = useWarehouse();

  // Fetch real locations
  const { data: locationsData, loading: loadingLocations } = useQuery<any>(GET_WAREHOUSE_LOCATIONS, {
    variables: { warehouseId: selectedWarehouse?.id },
    skip: !selectedWarehouse?.id
  });

  const locations = useMemo(() => locationsData?.warehouseLocations || [], [locationsData]);

  // Build initial bin locations from inventory items
  const initialBinLocations = useMemo(() => {
    if (!inventory.items || inventory.items.length === 0) return [];

    return inventory.items.map((item, idx) => {
      return {
        id: item.id,
        binId: item.locationId,
        locationCode: item.locationName,
        locationName: item.locationName,
        fullPath: item.locationName,
        warehouseId: inventory.warehouseId,
        priority: idx + 1,
        currentQuantity: item.quantity,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt || item.createdAt,
      } as ProductBinLocation;
    });
  }, [inventory]);

  // Initial settings from inventory
  const initialSettings: EditableSettings = useMemo(() => ({
    abcClass: inventory.abcClass,
    ownershipType: inventory.ownershipType,
  }), [inventory]);

  const [binLocations, setBinLocations] = useState<ProductBinLocation[]>(initialBinLocations);
  const [settings, setSettings] = useState<EditableSettings>(initialSettings);
  const [showAddBin, setShowAddBin] = useState(false);
  const [newBinId, setNewBinId] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Custom dropdown options (can be extended by user)
  const [abcClassOptions, setAbcClassOptions] = useState<string[]>(DEFAULT_ABC_CLASSES);
  const [movementOptions, setMovementOptions] = useState<string[]>(DEFAULT_MOVEMENT_OPTIONS);

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const dragCounter = useRef(0);

  // Get available bins that aren't already assigned
  const availableBins = useMemo(() => {
    const assignedBinIds = new Set(binLocations.map((loc) => loc.binId));
    return locations.filter((bin: any) => !assignedBinIds.has(bin.id));
  }, [binLocations, locations]);

  // Update setting helper
  const updateSetting = <K extends keyof EditableSettings>(key: K, value: EditableSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleAddBinLocation = () => {
    if (!newBinId) return;

    const bin = locations.find((b: any) => b.id === newBinId);
    if (!bin) return;

    const newPriority = binLocations.length + 1;
    const now = new Date().toISOString();

    const newLocation: ProductBinLocation = {
      id: `BL-${Date.now()}-${newPriority}`,
      binId: bin.id,
      locationCode: bin.code || bin.name,
      locationName: bin.name,
      fullPath: bin.name, // TODO: construct full path if parentId exists
      warehouseId: inventory.warehouseId,
      warehouseName: 'Current Warehouse', // Could fetch from context if needed
      priority: newPriority,
      maxCapacity: 100, // Placeholder
      currentQuantity: 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    setBinLocations((prev) => [...prev, newLocation]);
    setNewBinId('');
    setShowAddBin(false);
    setHasChanges(true);
  };

  const handleRemoveBinLocation = (locationId: string) => {
    setBinLocations((prev) => {
      const filtered = prev.filter((loc) => loc.id !== locationId);
      // Re-assign priorities
      return filtered.map((loc, idx) => ({ ...loc, priority: idx + 1 }));
    });
    setHasChanges(true);
  };

  const handleSetAsMain = (locationId: string) => {
    setBinLocations((prev) => {
      const idx = prev.findIndex((loc) => loc.id === locationId);
      if (idx === -1 || idx === 0) return prev;

      // Move the selected item to the front
      const newLocations = [...prev];
      const [item] = newLocations.splice(idx, 1);
      newLocations.unshift(item);

      // Re-assign priorities
      return newLocations.map((loc, i) => ({ ...loc, priority: i + 1 }));
    });
    setHasChanges(true);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, locationId: string) => {
    setDraggedItem(locationId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', locationId);
    setTimeout(() => {
      const element = document.getElementById(`bin-${locationId}`);
      if (element) {
        element.style.opacity = '0.5';
      }
    }, 0);
  };

  const handleDragEnd = () => {
    const element = document.getElementById(`bin-${draggedItem}`);
    if (element) {
      element.style.opacity = '1';
    }
    setDraggedItem(null);
    setDragOverItem(null);
    dragCounter.current = 0;
  };

  const handleDragEnter = (e: React.DragEvent, locationId: string) => {
    e.preventDefault();
    dragCounter.current++;
    if (locationId !== draggedItem) {
      setDragOverItem(locationId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverItem(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetLocationId: string) => {
    e.preventDefault();
    dragCounter.current = 0;

    if (!draggedItem || draggedItem === targetLocationId) {
      setDragOverItem(null);
      return;
    }

    setBinLocations((prev) => {
      const dragIdx = prev.findIndex((loc) => loc.id === draggedItem);
      const targetIdx = prev.findIndex((loc) => loc.id === targetLocationId);

      if (dragIdx === -1 || targetIdx === -1) return prev;

      const newLocations = [...prev];
      const [draggedLocation] = newLocations.splice(dragIdx, 1);
      newLocations.splice(targetIdx, 0, draggedLocation);

      // Re-assign priorities
      return newLocations.map((loc, i) => ({ ...loc, priority: i + 1 }));
    });

    setDraggedItem(null);
    setDragOverItem(null);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (onSave) {
      onSave({ binLocations, settings });
    }
    setHasChanges(false);
  };

  const handleCancel = () => {
    setBinLocations(initialBinLocations);
    setSettings(initialSettings);
    setHasChanges(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getAbcClassColor = (abcClass?: string) => {
    switch (abcClass) {
      case 'A':
        return 'bg-green-100 text-green-700';
      case 'B':
        return 'bg-yellow-100 text-yellow-700';
      case 'C':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-purple-100 text-purple-700';
    }
  };

  const getVelocityColor = (velocity?: string) => {
    switch (velocity) {
      case 'fast':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'slow':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-purple-100 text-purple-700';
    }
  };

  const isLowStock = inventory.availableQuantity <= (inventory.reorderPoint || 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-[var(--foreground)] truncate">
                {inventory.productName}
              </h2>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${ownershipTypeColors[inventory.ownershipType]}`}>
                {ownershipTypeLabels[inventory.ownershipType]}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-sm text-[var(--muted-foreground)]">
                Part #: <span className="font-medium text-[var(--foreground)]">{inventory.partNumber}</span>
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                  {inventory.factoryName}
                </span>
              </p>
              <Link
                href={`/products/${inventory.productId}/edit`}
                className="text-sm text-[var(--primary)] hover:underline flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <path d="M15 3h6v6" />
                  <path d="M10 14L21 3" />
                </svg>
                View Product
              </Link>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors flex-shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Inventory Summary */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-[var(--muted)]/30 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-[var(--foreground)]">{inventory.totalQuantity}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">Total</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
              <p className={`text-2xl font-bold ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                {inventory.availableQuantity}
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">Available</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{inventory.reservedQuantity}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">Reserved</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{inventory.pickingQuantity || 0}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">Picking</p>
            </div>
          </div>

          {/* Low Stock Warning */}
          {isLowStock && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">Low Stock Warning</p>
                <p className="text-xs text-red-600 dark:text-red-300">
                  Available quantity ({inventory.availableQuantity}) is at or below reorder point ({inventory.reorderPoint})
                </p>
              </div>
            </div>
          )}

          {/* Bin Locations Section */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[var(--muted-foreground)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="font-medium text-[var(--foreground)]">Bin Locations</h3>
                <span className="text-xs text-[var(--muted-foreground)]">({binLocations.length} location{binLocations.length !== 1 ? 's' : ''})</span>
              </div>
              <span className="text-xs text-[var(--muted-foreground)]">Drag to reorder</span>
            </div>

            <div className="p-4">
              {binLocations.length === 0 ? (
                <div className="text-center py-8 text-[var(--muted-foreground)]">
                  <svg className="w-12 h-12 mx-auto mb-3 text-[var(--muted-foreground)]/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm">No bin locations assigned</p>
                  <button
                    onClick={() => setShowAddBin(true)}
                    className="mt-3 text-sm text-[var(--primary)] hover:underline"
                  >
                    Add a bin location
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {binLocations.map((location) => (
                    <div
                      key={location.id}
                      id={`bin-${location.id}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, location.id)}
                      onDragEnd={handleDragEnd}
                      onDragEnter={(e) => handleDragEnter(e, location.id)}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, location.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-grab active:cursor-grabbing transition-all ${dragOverItem === location.id
                        ? 'border-[var(--primary)] border-2 bg-[var(--primary)]/5'
                        : location.priority === 1
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                          : 'bg-[var(--muted)]/30 border-[var(--border)]'
                        } ${draggedItem === location.id ? 'opacity-50' : ''}`}
                    >
                      {/* Drag Handle */}
                      <div className="flex-shrink-0 text-[var(--muted-foreground)] cursor-grab active:cursor-grabbing">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm8-16a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
                        </svg>
                      </div>

                      {/* Priority Badge */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${location.priority === 1
                          ? 'bg-blue-600 text-white'
                          : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                          }`}
                      >
                        {location.priority}
                      </div>

                      {/* Location Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[var(--foreground)]">{location.locationCode}</span>
                          {location.priority === 1 && (
                            <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-semibold rounded">
                              MAIN
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)] truncate">{location.locationName}</p>
                      </div>

                      {/* Quantity Info */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-[var(--foreground)]">
                          {location.currentQuantity}
                          {location.maxCapacity && (
                            <span className="text-[var(--muted-foreground)] font-normal"> / {location.maxCapacity}</span>
                          )}
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)]">units</p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Set as Main Button - only show for non-main bins */}
                        {location.priority !== 1 && (
                          <button
                            onClick={() => handleSetAsMain(location.id)}
                            className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                            title="Set as Main Bin"
                          >
                            Set as Main
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveBinLocation(location.id)}
                          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded transition-colors"
                          title="Remove"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add Bin Button */}
                  {!showAddBin && (
                    <button
                      onClick={() => setShowAddBin(true)}
                      className="w-full py-2 border-2 border-dashed border-[var(--border)] rounded-lg text-sm text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      Add Bin Location
                    </button>
                  )}

                  {/* Add Bin Form */}
                  {showAddBin && (
                    <div className="p-3 border border-[var(--border)] rounded-lg bg-[var(--muted)]/20">
                      <div className="flex items-center gap-2">
                        <select
                          value={newBinId}
                          onChange={(e) => setNewBinId(e.target.value)}
                          className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                        >
                          <option value="">Select a bin location...</option>
                          {availableBins.map((bin: any) => (
                            <option key={bin.id} value={bin.id}>
                              {bin.name} {bin.code ? `(${bin.code})` : ''}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleAddBinLocation}
                          disabled={!newBinId}
                          className="px-3 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setShowAddBin(false);
                            setNewBinId('');
                          }}
                          className="px-3 py-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Product Details Grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* Inventory Settings */}
            {/* Inventory Settings */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
                <h3 className="font-medium text-[var(--foreground)]">Inventory Settings</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--muted-foreground)]">ABC Class</span>
                  <EditableSelect
                    value={settings.abcClass}
                    options={abcClassOptions}
                    onChange={(value) => updateSetting('abcClass', value)}
                    onAddOption={(opt) => setAbcClassOptions(prev => [...prev, opt.toUpperCase()])}
                    placeholder="-"
                    renderOption={(opt) => `Class ${opt.toUpperCase()}`}
                    className="w-28"
                  />
                </div>
              </div>
            </div>

            {/* Cycle Count Info */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
                <h3 className="font-medium text-[var(--foreground)]">Cycle Count</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--muted-foreground)]">Last Count</span>
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {formatDate(inventory.lastCycleCountDate)}
                  </span>
                </div>
                {isManagerView && inventory.ownershipType === 'CONSIGNMENT' && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[var(--muted-foreground)]">Commission</span>
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {inventory.commissionPercentage ? `${inventory.commissionPercentage}%` : '-'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {inventory.description && (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
                <h3 className="font-medium text-[var(--foreground)]">Description</h3>
              </div>
              <div className="p-4">
                <p className="text-sm text-[var(--muted-foreground)]">{inventory.description}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/20 flex justify-between flex-shrink-0">
          <div>
            {hasChanges && (
              <span className="text-xs text-amber-600 flex items-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" />
                </svg>
                Unsaved changes
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors"
                >
                  Save Changes
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              {hasChanges ? 'Cancel' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
