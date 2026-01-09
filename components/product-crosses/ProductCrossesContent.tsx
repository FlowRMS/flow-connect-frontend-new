/**
 * Product Crosses Content Component
 * Manage known product crosses and track their usage
 */

'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import AdvancedFilters, { type ActiveFilter } from '../advancedFilters/AdvancedFilters';
import { PRODUCT_CROSS_FILTER_OPTIONS } from './constants';
import {
  getKnownProductCrossesPaginated,
  createKnownProductCross,
  updateKnownProductCross,
  deleteKnownProductCross,
  bulkCreateKnownProductCrosses,
  type KnownProductCross,
  type KnownProductCrossFilters,
  type BulkKnownProductCrossInput,
} from '../lib/graphql/product-crosses';
import * as XLSX from 'xlsx';
import { ProductCrossResultsModal } from './ProductCrossResultsModal';

// Types
export interface ProductCross {
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

// Helper to get usage badge color (matching staging-v6 style)
function getUsageBadgeColor(timesUsed: number): string {
  if (timesUsed >= 30) return 'bg-green-100 text-green-700';
  if (timesUsed >= 10) return 'bg-blue-100 text-blue-700';
  if (timesUsed >= 5) return 'bg-yellow-100 text-yellow-700';
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
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sort state
  const [sortField, setSortField] = useState<keyof ProductCross>('timesUsed');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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
      // Get value from either values array (dropdowns) or value (text inputs)
      const value = filter.values && filter.values.length > 0
        ? filter.values[0]
        : filter.value;

      if (value) {
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
          case 'createdAt':
            filters.dateFrom = value;
            break;
          case 'lastUsed':
            filters.dateTo = value;
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

  // Handle file selection for upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  // Handle file upload and parsing
  const handleUpload = async () => {
    if (!uploadedFile) return;

    setIsUploading(true);
    try {
      const data = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet);

      // Map Excel columns to our format
      const crossesToCreate: BulkKnownProductCrossInput[] = jsonData.map((row) => ({
        competitorManufacturer: row['Competitor Manufacturer'] || row['competitor_manufacturer'] || '',
        competitorPartNumber: row['Competitor Part Number'] || row['Competitor Part #'] || row['competitor_part_number'] || '',
        competitorDescription: row['Competitor Description'] || row['competitor_description'] || null,
        ourManufacturer: row['Our Manufacturer'] || row['our_manufacturer'] || '',
        ourPartNumber: row['Our Part Number'] || row['Our Part #'] || row['our_part_number'] || '',
        ourDescription: row['Our Description'] || row['our_description'] || null,
        timesUsed: 0,
      })).filter(cross => cross.competitorManufacturer && cross.competitorPartNumber && cross.ourManufacturer && cross.ourPartNumber);

      if (crossesToCreate.length === 0) {
        throw new Error('No valid product crosses found in the file. Please check the column headers.');
      }

      // Create crosses in bulk
      await bulkCreateKnownProductCrosses(crossesToCreate);

      // Reload data
      await loadData();

      // Close modal and reset
      setIsUploadModalOpen(false);
      setUploadedFile(null);
    } catch (err) {
      console.error('Failed to upload product crosses:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload product crosses');
    } finally {
      setIsUploading(false);
    }
  };

  // Download template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Competitor Manufacturer': 'Example Competitor',
        'Competitor Part #': 'COMP-12345',
        'Competitor Description': 'Example competitor product description',
        'Our Manufacturer': 'Our Company',
        'Our Part #': 'OUR-98765',
        'Our Description': 'Our equivalent product description',
      },
    ];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Product Crosses');
    XLSX.writeFile(workbook, 'product_crosses_template.xlsx');
  };

  // Server-side search is applied via API, then we sort client-side
  const filteredCrosses = useMemo(() => {
    const sorted = [...crosses].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      // Handle numeric sorting
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle string sorting
      const aStr = String(aValue || '').toLowerCase();
      const bStr = String(bValue || '').toLowerCase();

      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
    return sorted;
  }, [crosses, sortField, sortDirection]);

  // Calculate totals
  const totalCrosses = totalCount;
  const totalUses = crosses.reduce((sum, cross) => sum + cross.timesUsed, 0);

  // Handle header sort click
  const handleSort = (field: keyof ProductCross) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'timesUsed' ? 'desc' : 'asc');
    }
  };

  // Sort indicator component
  const SortIndicator = ({ field }: { field: keyof ProductCross }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 ml-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4 ml-1 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {sortDirection === 'asc' ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        )}
      </svg>
    );
  };

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
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download Template
          </button>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
          >
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
                <th
                  onClick={() => handleSort('competitorManufacturer')}
                  className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group"
                >
                  <div className="flex items-center">
                    Competitor Manufacturer
                    <SortIndicator field="competitorManufacturer" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('competitorPartNumber')}
                  className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group"
                >
                  <div className="flex items-center">
                    Competitor Part #
                    <SortIndicator field="competitorPartNumber" />
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Competitor Description
                </th>
                <th
                  onClick={() => handleSort('ourManufacturer')}
                  className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group"
                >
                  <div className="flex items-center">
                    Our Manufacturer
                    <SortIndicator field="ourManufacturer" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('ourPartNumber')}
                  className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group"
                >
                  <div className="flex items-center">
                    Our Part #
                    <SortIndicator field="ourPartNumber" />
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Our Description
                </th>
                <th
                  onClick={() => handleSort('timesUsed')}
                  className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group"
                >
                  <div className="flex items-center justify-center">
                    Times Used
                    <SortIndicator field="timesUsed" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('lastUsed')}
                  className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group"
                >
                  <div className="flex items-center">
                    Last Used
                    <SortIndicator field="lastUsed" />
                  </div>
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
          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">10-29</span>
          <span className="text-gray-600">Medium Confidence</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded">5-9</span>
          <span className="text-gray-600">Low Confidence</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">&lt;5</span>
          <span className="text-gray-600">Very Low Confidence</span>
        </div>
      </div>

      {/* Product Cross Results Modal */}
      {editingCross && (
        <ProductCrossResultsModal
          isOpen={isEditModalOpen}
          cross={editingCross}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingCross(null);
          }}
          onSave={async (updatedCross) => {
            await handleSaveEdit();
          }}
          onDelete={(id) => {
            setDeletingCross(editingCross);
            setIsDeleteModalOpen(true);
            setIsEditModalOpen(false);
          }}
          onRefresh={loadData}
          isSaving={isSaving}
        />
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

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Upload Product Crosses</h2>
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadedFile(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Upload an Excel or CSV file containing your product crosses. The file should include columns for:
                Competitor Manufacturer, Competitor Part #, Competitor Description, Our Manufacturer, Our Part #, and Our Description.
              </p>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-400 transition-colors">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-orange-500 hover:text-orange-600 font-medium">
                      Choose file
                    </span>
                    <span className="text-gray-500"> or drag and drop</span>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileSelect}
                      className="sr-only"
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Excel (.xlsx, .xls) or CSV files only
                </p>
              </div>

              {uploadedFile && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span className="text-sm text-gray-900">{uploadedFile.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(uploadedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    onClick={() => setUploadedFile(null)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadedFile(null);
                }}
                disabled={isUploading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!uploadedFile || isUploading}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isUploading && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
