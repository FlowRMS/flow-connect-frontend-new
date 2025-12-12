'use client';

import React, { useState, useMemo } from 'react';
import {
  mockWarehouses,
  mockSections,
  mockAisles,
  mockShelves,
  mockBays,
  mockRows,
  mockBins,
} from '@/lib/data/warehouse-mock';
import { Warehouse, Section, Aisle, Shelf, Bay, Row, Bin } from '@/lib/types/warehouse';

type ViewMode = 'hierarchy' | 'visual';
type SelectedLevel = 'warehouse' | 'section' | 'aisle' | 'shelf' | 'bay' | 'row' | 'bin';

interface BreadcrumbItem {
  level: SelectedLevel;
  id: string;
  name: string;
}

export default function WarehouseLayoutContent() {
  const [viewMode, setViewMode] = useState<ViewMode>('hierarchy');
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(mockWarehouses[0] || null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const stats = useMemo(() => {
    return {
      warehouses: mockWarehouses.length,
      sections: mockSections.length,
      aisles: mockAisles.length,
      shelves: mockShelves.length,
      bays: mockBays.length,
      rows: mockRows.length,
      bins: mockBins.length,
      totalCapacity: mockBins.reduce((sum, bin) => sum + bin.maxCapacity, 0),
      usedCapacity: mockBins.reduce((sum, bin) => sum + bin.currentQuantity, 0),
    };
  }, []);

  const capacityPercentage = stats.totalCapacity > 0
    ? Math.round((stats.usedCapacity / stats.totalCapacity) * 100)
    : 0;

  const getSectionsForWarehouse = (warehouseId: string) =>
    mockSections.filter(s => s.warehouseId === warehouseId);

  const getAislesForSection = (sectionId: string) =>
    mockAisles.filter(a => a.sectionId === sectionId);

  const getShelvesForAisle = (aisleId: string) =>
    mockShelves.filter(s => s.aisleId === aisleId);

  const getBaysForShelf = (shelfId: string) =>
    mockBays.filter(b => b.shelfId === shelfId);

  const getRowsForBay = (bayId: string) =>
    mockRows.filter(r => r.bayId === bayId);

  const getBinsForRow = (rowId: string) =>
    mockBins.filter(b => b.rowId === rowId);

  const renderHierarchyItem = (
    id: string,
    name: string,
    level: number,
    hasChildren: boolean,
    children: React.ReactNode,
    details?: string
  ) => {
    const isExpanded = expandedItems.has(id);
    const paddingLeft = level * 24;

    return (
      <div key={id}>
        <div
          className="flex items-center py-2 px-4 hover:bg-[var(--muted)]/30 cursor-pointer border-b border-[var(--border)]"
          style={{ paddingLeft: paddingLeft + 16 }}
          onClick={() => hasChildren && toggleExpand(id)}
        >
          {hasChildren ? (
            <svg
              className={`w-4 h-4 mr-2 text-[var(--muted-foreground)] transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6"/>
            </svg>
          ) : (
            <span className="w-4 h-4 mr-2" />
          )}
          <span className="flex-1 text-sm text-[var(--foreground)]">{name}</span>
          {details && (
            <span className="text-xs text-[var(--muted-foreground)]">{details}</span>
          )}
        </div>
        {isExpanded && children}
      </div>
    );
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Warehouse Layout</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Manage warehouse structure and bin locations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-[var(--border)] rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('hierarchy')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'hierarchy'
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)]'
              }`}
            >
              Hierarchy
            </button>
            <button
              onClick={() => setViewMode('visual')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'visual'
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)]'
              }`}
            >
              Visual
            </button>
          </div>
          <button className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Add Location
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="text-sm text-[var(--muted-foreground)]">Warehouses</div>
          <div className="text-2xl font-semibold text-[var(--foreground)] mt-1">{stats.warehouses}</div>
        </div>
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="text-sm text-[var(--muted-foreground)]">Sections</div>
          <div className="text-2xl font-semibold text-[var(--foreground)] mt-1">{stats.sections}</div>
        </div>
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="text-sm text-[var(--muted-foreground)]">Aisles</div>
          <div className="text-2xl font-semibold text-[var(--foreground)] mt-1">{stats.aisles}</div>
        </div>
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="text-sm text-[var(--muted-foreground)]">Total Bins</div>
          <div className="text-2xl font-semibold text-[var(--foreground)] mt-1">{stats.bins}</div>
        </div>
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="text-sm text-[var(--muted-foreground)]">Capacity Used</div>
          <div className="text-2xl font-semibold text-[var(--foreground)] mt-1">{capacityPercentage}%</div>
          <div className="mt-2 h-2 bg-[var(--muted)] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                capacityPercentage > 90 ? 'bg-red-500' :
                capacityPercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${capacityPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {viewMode === 'hierarchy' ? (
        /* Hierarchy View */
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Location Hierarchy</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setExpandedItems(new Set())}
                className="px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
              >
                Collapse All
              </button>
              <button
                onClick={() => {
                  const allIds = new Set<string>();
                  mockWarehouses.forEach(w => allIds.add(w.id));
                  mockSections.forEach(s => allIds.add(s.id));
                  mockAisles.forEach(a => allIds.add(a.id));
                  mockShelves.forEach(s => allIds.add(s.id));
                  mockBays.forEach(b => allIds.add(b.id));
                  mockRows.forEach(r => allIds.add(r.id));
                  setExpandedItems(allIds);
                }}
                className="px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
              >
                Expand All
              </button>
            </div>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {mockWarehouses.map((warehouse) => (
              renderHierarchyItem(
                warehouse.id,
                `🏭 ${warehouse.name}`,
                0,
                getSectionsForWarehouse(warehouse.id).length > 0,
                getSectionsForWarehouse(warehouse.id).map((section) => (
                  renderHierarchyItem(
                    section.id,
                    `📦 ${section.name}`,
                    1,
                    getAislesForSection(section.id).length > 0,
                    getAislesForSection(section.id).map((aisle) => (
                      renderHierarchyItem(
                        aisle.id,
                        `🛒 Aisle ${aisle.aisleNumber}`,
                        2,
                        getShelvesForAisle(aisle.id).length > 0,
                        getShelvesForAisle(aisle.id).map((shelf) => (
                          renderHierarchyItem(
                            shelf.id,
                            `📚 Shelf ${shelf.shelfNumber}`,
                            3,
                            getBaysForShelf(shelf.id).length > 0,
                            getBaysForShelf(shelf.id).map((bay) => (
                              renderHierarchyItem(
                                bay.id,
                                `🗄️ Bay ${bay.bayNumber}`,
                                4,
                                getRowsForBay(bay.id).length > 0,
                                getRowsForBay(bay.id).map((row) => (
                                  renderHierarchyItem(
                                    row.id,
                                    `📋 Row ${row.rowNumber}`,
                                    5,
                                    getBinsForRow(row.id).length > 0,
                                    getBinsForRow(row.id).map((bin) => (
                                      <div
                                        key={bin.id}
                                        className="flex items-center py-2 px-4 hover:bg-[var(--muted)]/30 border-b border-[var(--border)]"
                                        style={{ paddingLeft: 6 * 24 + 16 }}
                                      >
                                        <span className="w-4 h-4 mr-2" />
                                        <span className="flex-1 text-sm text-[var(--foreground)]">
                                          📍 Bin {bin.letterCode}
                                        </span>
                                        <span className={`text-xs font-medium ${
                                          bin.currentQuantity >= bin.maxCapacity ? 'text-red-600' :
                                          bin.currentQuantity > bin.maxCapacity * 0.8 ? 'text-yellow-600' :
                                          'text-green-600'
                                        }`}>
                                          {bin.currentQuantity}/{bin.maxCapacity}
                                        </span>
                                      </div>
                                    )),
                                    `${getBinsForRow(row.id).length} bins`
                                  )
                                )),
                                `${getRowsForBay(bay.id).length} rows`
                              )
                            )),
                            `${getBaysForShelf(shelf.id).length} bays`
                          )
                        )),
                        `${getShelvesForAisle(aisle.id).length} shelves`
                      )
                    )),
                    `${getAislesForSection(section.id).length} aisles`
                  )
                )),
                `${getSectionsForWarehouse(warehouse.id).length} sections`
              )
            ))}
          </div>
        </div>
      ) : (
        /* Visual View */
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
          <div className="px-6 py-4 border-b border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Visual Layout</h2>
          </div>
          <div className="p-6">
            {/* Warehouse Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Select Warehouse
              </label>
              <select
                value={selectedWarehouse?.id || ''}
                onChange={(e) => {
                  const wh = mockWarehouses.find(w => w.id === e.target.value);
                  setSelectedWarehouse(wh || null);
                }}
                className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              >
                {mockWarehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>{wh.name}</option>
                ))}
              </select>
            </div>

            {/* Visual Grid */}
            {selectedWarehouse && (
              <div className="space-y-6">
                {getSectionsForWarehouse(selectedWarehouse.id).map((section) => (
                  <div key={section.id} className="border border-[var(--border)] rounded-lg p-4">
                    <h3 className="font-medium text-[var(--foreground)] mb-4">{section.name}</h3>
                    <div className="grid grid-cols-4 gap-4">
                      {getAislesForSection(section.id).map((aisle) => (
                        <div
                          key={aisle.id}
                          className="bg-[var(--muted)]/30 rounded-lg p-3 hover:bg-[var(--muted)]/50 transition-colors cursor-pointer"
                        >
                          <div className="text-sm font-medium text-[var(--foreground)]">
                            Aisle {aisle.aisleNumber}
                          </div>
                          <div className="text-xs text-[var(--muted-foreground)] mt-1">
                            {getShelvesForAisle(aisle.id).length} shelves
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-1">
                            {getShelvesForAisle(aisle.id).slice(0, 4).map((shelf) => {
                              const bays = getBaysForShelf(shelf.id);
                              const totalBins = bays.reduce((sum, bay) => {
                                const rows = getRowsForBay(bay.id);
                                return sum + rows.reduce((s, row) => s + getBinsForRow(row.id).length, 0);
                              }, 0);
                              const usedBins = bays.reduce((sum, bay) => {
                                const rows = getRowsForBay(bay.id);
                                return sum + rows.reduce((s, row) => {
                                  return s + getBinsForRow(row.id).filter(b => b.currentQuantity > 0).length;
                                }, 0);
                              }, 0);
                              const usage = totalBins > 0 ? Math.round((usedBins / totalBins) * 100) : 0;

                              return (
                                <div
                                  key={shelf.id}
                                  className={`h-8 rounded flex items-center justify-center text-xs font-medium ${
                                    usage > 80 ? 'bg-red-100 text-red-700' :
                                    usage > 50 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                                  }`}
                                >
                                  S{shelf.shelfNumber}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Legend */}
            <div className="mt-6 flex items-center gap-6 text-xs text-[var(--muted-foreground)]">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-100" />
                <span>Low usage (&lt;50%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-100" />
                <span>Medium usage (50-80%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-100" />
                <span>High usage (&gt;80%)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
