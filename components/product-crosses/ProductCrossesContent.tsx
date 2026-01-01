/**
 * Product Crosses Content Component
 * Manage known product crosses and track their usage
 */

'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import AdvancedFilters, { type ActiveFilter } from '../AdvancedFilters';
import { PRODUCT_CROSS_FILTER_OPTIONS } from './constants';
import {
  getKnownProductCrossesPaginated,
  createKnownProductCross,
  updateKnownProductCross,
  deleteKnownProductCross,
  type KnownProductCross,
  type KnownProductCrossFilters,
} from '../lib/graphql/product-crosses';

// Types
interface ProductCross {
  id: string;
  competitorManufacturer: string;
  competitorPartNumber: string;
  competitorDescription: string;
  ourManufacturer: string;
  ourPartNumber: string;
  ourDescription: string;
  timesUsed: number;
  lastUsed: string;
}

// Transform API response to local format
function transformApiResponse(cross: KnownProductCross): ProductCross {
  return {
    id: cross.id,
    competitorManufacturer: cross.competitorManufacturer,
    competitorPartNumber: cross.competitorPartNumber,
    competitorDescription: cross.competitorDescription || '',
    ourManufacturer: cross.ourManufacturer,
    ourPartNumber: cross.ourPartNumber,
    ourDescription: cross.ourDescription || '',
    timesUsed: cross.timesUsed,
    lastUsed: cross.lastUsed || '',
  };
}

// Helper to get usage badge color
function getUsageBadgeColor(timesUsed: number): string {
  if (timesUsed >= 30) return 'bg-green-100 text-green-700';
  if (timesUsed >= 10) return 'bg-yellow-100 text-yellow-700';
  if (timesUsed >= 5) return 'bg-orange-100 text-orange-700';
  return 'bg-red-100 text-red-700';
}

export function ProductCrossesContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [crosses, setCrosses] = useState<ProductCross[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [editingCross, setEditingCross] = useState<ProductCross | null>(null);
  const [deletingCross, setDeletingCross] = useState<ProductCross | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Build filters from activeFilters
  const apiFilters = useMemo<KnownProductCrossFilters>(() => {
    const filters: KnownProductCrossFilters = {
      limit: 100,
      search: debouncedSearch || undefined,
    };

    for (const filter of activeFilters) {
      if (filter.values && filter.values.length > 0) {
        const value = filter.values[0];
        switch (filter.columnName) {
          case 'competitorManufacturer':
            filters.competitorManufacturer = value;
            break;
          case 'competitorPartNumber':
            filters.competitorPartNumber = value;
            break;
          case 'ourManufacturer':
            filters.ourManufacturer = value;
            break;
          case 'ourPartNumber':
            filters.ourPartNumber = value;
            break;
          case 'usageLevel':
            filters.usageLevel = value;
            break;
        }
      }
    }

    return filters;
  }, [debouncedSearch, activeFilters]);

  // Load data from API
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getKnownProductCrossesPaginated(apiFilters);
      setCrosses(result.crosses.map(transformApiResponse));
      setTotalCount(result.totalCount);
    } catch (err) {
      console.error('Failed to load product crosses:', err);
      setError(err instanceof Error ? err.message : 'Failed to load product crosses');
      setCrosses([]);
    } finally {
      setIsLoading(false);
    }
  }, [apiFilters]);

  // Load data on mount and when filters change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle edit
  const handleEdit = (cross: ProductCross) => {
    setEditingCross({ ...cross });
    setIsEditModalOpen(true);
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editingCross) return;

    setIsSaving(true);
    try {
      await updateKnownProductCross(editingCross.id, {
        competitorManufacturer: editingCross.competitorManufacturer,
        competitorPartNumber: editingCross.competitorPartNumber,
        competitorDescription: editingCross.competitorDescription,
        ourManufacturer: editingCross.ourManufacturer,
        ourPartNumber: editingCross.ourPartNumber,
        ourDescription: editingCross.ourDescription,
      });

      // Update local state
      setCrosses((prev) =>
        prev.map((c) => (c.id === editingCross.id ? editingCross : c))
      );
      setIsEditModalOpen(false);
      setEditingCross(null);
    } catch (err) {
      console.error('Failed to update product cross:', err);
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = (cross: ProductCross) => {
    setDeletingCross(cross);
    setIsDeleteModalOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!deletingCross) return;

    setIsSaving(true);
    try {
      await deleteKnownProductCross(deletingCross.id);

      // Update local state
      setCrosses((prev) => prev.filter((c) => c.id !== deletingCross.id));
      setTotalCount((prev) => prev - 1);
      setIsDeleteModalOpen(false);
      setDeletingCross(null);
    } catch (err) {
      console.error('Failed to delete product cross:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setIsSaving(false);
    }
  };

  // Server-side search is applied via API, so we just use crosses directly
  const filteredCrosses = crosses;

  // Calculate totals
  const totalCrosses = totalCount;
  const totalUses = crosses.reduce((sum, cross) => sum + cross.timesUsed, 0);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Crosses</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage known product crosses and track their usage
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download Template
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Upload Product Crosses
          </button>
        </div>
      </div>

      {/* Search and Filters Row */}
      <div className="flex items-center gap-4 mb-6">
        {/* Search Bar */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="9" cy="9" r="7" />
            <path d="M14 14l4 4" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by manufacturer, part number, or description..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        {/* Advanced Filters */}
        <AdvancedFilters
          filterOptions={PRODUCT_CROSS_FILTER_OPTIONS}
          activeFilters={activeFilters}
          onFiltersChange={setActiveFilters}
        />

        {/* Sort */}
        <button className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="6" x2="16" y2="6" />
            <line x1="4" y1="12" x2="12" y2="12" />
            <line x1="4" y1="18" x2="8" y2="18" />
            <polyline points="16 12 20 8 24 12" />
            <line x1="20" y1="8" x2="20" y2="20" />
          </svg>
          Sort
        </button>

        {/* Stats */}
        <div className="flex items-center gap-6 pl-4 border-l border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{totalCrosses}</p>
            <p className="text-xs text-gray-500">Total Crosses</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{totalUses}</p>
            <p className="text-xs text-gray-500">Total Uses</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Competitor Manufacturer
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Competitor Part #
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Competitor Description
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Our Manufacturer
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Our Part #
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Our Description
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Times Used
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Last Used
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!isLoading && !error && filteredCrosses.map((cross) => (
                <tr key={cross.id} className="hover:bg-gray-50 transition-colors">
                  {/* Competitor Manufacturer */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900">{cross.competitorManufacturer}</span>
                      <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                        Competitor
                      </span>
                    </div>
                  </td>

                  {/* Competitor Part # */}
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-600">{cross.competitorPartNumber}</span>
                  </td>

                  {/* Competitor Description */}
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-600">{cross.competitorDescription}</span>
                  </td>

                  {/* Our Manufacturer */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900">{cross.ourManufacturer}</span>
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                        Our Mfr
                      </span>
                    </div>
                  </td>

                  {/* Our Part # */}
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-600">{cross.ourPartNumber}</span>
                  </td>

                  {/* Our Description */}
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-900">{cross.ourDescription}</span>
                  </td>

                  {/* Times Used */}
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`inline-flex items-center justify-center min-w-[40px] px-2 py-1 text-sm font-medium rounded ${getUsageBadgeColor(
                        cross.timesUsed
                      )}`}
                    >
                      {cross.timesUsed}x
                    </span>
                  </td>

                  {/* Last Used */}
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-500">{formatDate(cross.lastUsed)}</span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(cross)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Edit"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(cross)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <svg className="animate-spin h-8 w-8 mb-3 text-orange-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm">Loading product crosses...</span>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <svg className="w-12 h-12 mb-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm text-red-500">{error}</span>
            <button
              onClick={loadData}
              className="mt-3 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredCrosses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <svg className="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
            <span className="text-sm">No product crosses found</span>
            <p className="text-xs text-gray-400 mt-1">Upload a template to get started</p>
          </div>
        )}
      </div>

      {/* Usage Indicator Legend */}
      <div className="flex items-center gap-6 mt-4 text-sm">
        <span className="text-gray-500 font-medium">Usage Indicator:</span>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">30+</span>
          <span className="text-gray-600">High Confidence</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded">10-29</span>
          <span className="text-gray-600">Medium Confidence</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded">5-9</span>
          <span className="text-gray-600">Low Confidence</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">&lt;5</span>
          <span className="text-gray-600">Very Low Confidence</span>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingCross && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Edit Product Cross</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Competitor Manufacturer</label>
                  <input
                    type="text"
                    value={editingCross.competitorManufacturer}
                    onChange={(e) => setEditingCross({ ...editingCross, competitorManufacturer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Competitor Part #</label>
                  <input
                    type="text"
                    value={editingCross.competitorPartNumber}
                    onChange={(e) => setEditingCross({ ...editingCross, competitorPartNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Competitor Description</label>
                <input
                  type="text"
                  value={editingCross.competitorDescription}
                  onChange={(e) => setEditingCross({ ...editingCross, competitorDescription: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Our Manufacturer</label>
                  <input
                    type="text"
                    value={editingCross.ourManufacturer}
                    onChange={(e) => setEditingCross({ ...editingCross, ourManufacturer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Our Part #</label>
                  <input
                    type="text"
                    value={editingCross.ourPartNumber}
                    onChange={(e) => setEditingCross({ ...editingCross, ourPartNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Our Description</label>
                <input
                  type="text"
                  value={editingCross.ourDescription}
                  onChange={(e) => setEditingCross({ ...editingCross, ourDescription: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && deletingCross && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Product Cross</h3>
              <p className="text-sm text-gray-600 text-center mb-4">
                Are you sure you want to delete this product cross?
              </p>
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium text-gray-900">{deletingCross.competitorPartNumber}</p>
                <p className="text-xs text-gray-500">{deletingCross.competitorManufacturer} → {deletingCross.ourManufacturer}</p>
              </div>
              <p className="text-xs text-gray-500 text-center">This action cannot be undone.</p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {isSaving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
