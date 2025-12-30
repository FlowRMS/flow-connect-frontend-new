/**
 * Manufacturer Profiles Content Component
 * Clean, modular implementation for the manufacturer profiles page
 * Integrated with Factory GraphQL endpoints
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFactories, useDeleteFactory, type FactoryLandingPage } from './api/useFactoriesApi';
import DeleteFactoryModal from './modals/DeleteFactoryModal';

type SortField = 'title' | 'accountNumber' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export default function ManufacturerProfilesContent() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'unpublished'>('all');

  // Fetch factories from API
  const { data: factories = [], isLoading, error, refetch } = useFactories();
  const deleteFactoryMutation = useDeleteFactory();

  // Filter and sort factories
  const filteredFactories = useMemo(() => {
    let result = [...factories];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.title?.toLowerCase().includes(query) ||
          f.accountNumber?.toLowerCase().includes(query) ||
          f.email?.toLowerCase().includes(query) ||
          f.phone?.toLowerCase().includes(query)
      );
    }

    // Apply published filter
    if (filterPublished !== 'all') {
      result = result.filter((f) => (filterPublished === 'published' ? f.published : !f.published));
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
        case 'accountNumber':
          comparison = (a.accountNumber || '').localeCompare(b.accountNumber || '');
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [factories, searchQuery, sortField, sortDirection, filterPublished]);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  const handleFactoryClick = useCallback((factory: FactoryLandingPage) => {
    router.push(`/warehouse/manufacturer-profiles/${factory.id}/edit`);
  }, [router]);

  const handleDeleteFactory = useCallback(async (id: string) => {
    try {
      await deleteFactoryMutation.mutateAsync(id);
      setDeleteConfirmId(null);
      refetch();
    } catch (err) {
      console.error('Failed to delete factory:', err);
    }
  }, [deleteFactoryMutation, refetch]);

  const factoryToDelete = factories.find(f => f.id === deleteConfirmId);

  // Stats calculations
  const stats = useMemo(() => ({
    total: factories.length,
    published: factories.filter(f => f.published).length,
    unpublished: factories.filter(f => !f.published).length,
  }), [factories]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--background)]">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)]">Manufacturer Profiles</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Configure manufacturer settings, commission rates, and payment terms
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Status Filter */}
            <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-md">
              {(['all', 'published', 'unpublished'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterPublished(status)}
                  className={`px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors capitalize ${
                    filterPublished === status
                      ? 'bg-white dark:bg-[var(--card)] shadow-sm text-[var(--foreground)]'
                      : 'text-[var(--muted-foreground)] hover:bg-[var(--card)]'
                  }`}
                >
                  {status === 'all' ? 'All' : status}
                </button>
              ))}
            </div>

            <button
              onClick={() => router.push('/warehouse/manufacturer-profiles/new')}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-xs sm:text-sm hover:bg-[var(--primary-hover)] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
                <circle cx="10" cy="10" r="7"/>
                <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
              </svg>
              <span className="hidden sm:inline">New Manufacturer</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search manufacturers by name, account, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-[var(--muted-foreground)]">Total Manufacturers</div>
              <div className="text-2xl font-semibold text-[var(--foreground)]">{stats.total}</div>
            </div>
          </div>
        </div>
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-[var(--muted-foreground)]">Published</div>
              <div className="text-2xl font-semibold text-green-600">{stats.published}</div>
            </div>
          </div>
        </div>
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-[var(--muted-foreground)]">Unpublished</div>
              <div className="text-2xl font-semibold text-amber-600">{stats.unpublished}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <svg className="animate-spin h-10 w-10 text-[var(--primary)]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <p className="text-[var(--muted-foreground)]">Loading manufacturers...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <svg className="mx-auto mb-4 w-12 h-12 text-red-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">Failed to load manufacturers</h3>
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error instanceof Error ? error.message : 'An unexpected error occurred'}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Data Table */}
      {!isLoading && !error && (
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--muted)]/50 border-b border-[var(--border)]">
                  <th className="px-4 sm:px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('title')}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide hover:text-[var(--foreground)] transition-colors"
                    >
                      Manufacturer
                      <SortIcon field="title" />
                    </button>
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('accountNumber')}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide hover:text-[var(--foreground)] transition-colors"
                    >
                      Account #
                      <SortIcon field="accountNumber" />
                    </button>
                  </th>
                  <th className="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
                    Contact
                  </th>
                  <th className="hidden lg:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
                    Commission
                  </th>
                  <th className="hidden lg:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
                    Terms
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('createdAt')}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide hover:text-[var(--foreground)] transition-colors"
                    >
                      Created
                      <SortIcon field="createdAt" />
                    </button>
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredFactories.map((factory) => (
                  <tr
                    key={factory.id}
                    onClick={() => handleFactoryClick(factory)}
                    className="hover:bg-[var(--muted)]/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-[var(--foreground)] truncate">{factory.title || 'Untitled'}</div>
                          <div className="text-xs text-[var(--muted-foreground)] truncate">
                            {factory.createdBy || 'Unknown creator'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className="text-sm text-[var(--foreground)] font-mono">
                        {factory.accountNumber || '-'}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-4 sm:px-6 py-4">
                      <div className="space-y-1">
                        {factory.email && (
                          <div className="text-sm text-[var(--foreground)] truncate max-w-[200px]">{factory.email}</div>
                        )}
                        {factory.phone && (
                          <div className="text-xs text-[var(--muted-foreground)]">{factory.phone}</div>
                        )}
                        {!factory.email && !factory.phone && (
                          <span className="text-sm text-[var(--muted-foreground)]">-</span>
                        )}
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-4 sm:px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {factory.baseCommissionRate && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Base: {factory.baseCommissionRate}%
                          </span>
                        )}
                        {factory.overallDiscountRate && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            Disc: {factory.overallDiscountRate}%
                          </span>
                        )}
                        {!factory.baseCommissionRate && !factory.overallDiscountRate && (
                          <span className="text-sm text-[var(--muted-foreground)]">-</span>
                        )}
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-4 sm:px-6 py-4">
                      <div className="space-y-1">
                        {factory.paymentTerms !== undefined && factory.paymentTerms !== null && (
                          <div className="text-sm text-[var(--foreground)]">Net {factory.paymentTerms}</div>
                        )}
                        {factory.leadTime !== undefined && factory.leadTime !== null && (
                          <div className="text-xs text-[var(--muted-foreground)]">{factory.leadTime} days lead</div>
                        )}
                        {factory.paymentTerms === undefined && factory.leadTime === undefined && (
                          <span className="text-sm text-[var(--muted-foreground)]">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className="text-sm text-[var(--muted-foreground)]">
                        {factory.createdAt ? new Date(factory.createdAt).toLocaleDateString() : '-'}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      {factory.published ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFactoryClick(factory);
                          }}
                          className="p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(factory.id);
                          }}
                          className="p-2 text-[var(--muted-foreground)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredFactories.length === 0 && (
            <div className="px-6 py-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--muted)] flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-1">No manufacturers found</h3>
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                {searchQuery || filterPublished !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by adding your first manufacturer.'}
              </p>
              {!searchQuery && filterPublished === 'all' && (
                <button
                  onClick={() => router.push('/warehouse/manufacturer-profiles/new')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Manufacturer
                </button>
              )}
            </div>
          )}

          {/* Results count */}
          {filteredFactories.length > 0 && (
            <div className="px-6 py-3 border-t border-[var(--border)] bg-[var(--muted)]/30">
              <p className="text-sm text-[var(--muted-foreground)]">
                Showing {filteredFactories.length} of {factories.length} manufacturers
              </p>
            </div>
          )}
        </div>
      )}

      {/* Delete Modal */}
      {factoryToDelete && (
        <DeleteFactoryModal
          isOpen={!!deleteConfirmId}
          factory={factoryToDelete}
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={() => handleDeleteFactory(factoryToDelete.id)}
          isDeleting={deleteFactoryMutation.isPending}
        />
      )}
    </div>
  );
}
