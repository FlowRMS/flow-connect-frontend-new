'use client';

import React, { useState, useMemo } from 'react';
import { ManufacturerProfile } from '@/lib/types/warehouse';
import { mockManufacturerProfiles } from '@/lib/data/warehouse-mock';
import ManufacturerProfileModal from './ManufacturerProfileModal';

type SortField = 'vendorName' | 'vendorGroup' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

export default function ManufacturerProfilesContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<ManufacturerProfile | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [sortField, setSortField] = useState<SortField>('vendorName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterWarehousing, setFilterWarehousing] = useState<'all' | 'yes' | 'no'>('all');
  const [filterSuspended, setFilterSuspended] = useState<'all' | 'active' | 'suspended'>('all');

  // Filter and sort profiles
  const filteredProfiles = useMemo(() => {
    let result = [...mockManufacturerProfiles];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.vendorName.toLowerCase().includes(query) ||
          p.manufacturerName.toLowerCase().includes(query) ||
          p.vendorGroup?.toLowerCase().includes(query) ||
          p.repCode?.toLowerCase().includes(query)
      );
    }

    // Apply warehousing filter
    if (filterWarehousing !== 'all') {
      result = result.filter((p) => (filterWarehousing === 'yes' ? p.warehousing : !p.warehousing));
    }

    // Apply suspended filter
    if (filterSuspended !== 'all') {
      result = result.filter((p) => (filterSuspended === 'suspended' ? p.isSuspended : !p.isSuspended));
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'vendorName':
          comparison = a.vendorName.localeCompare(b.vendorName);
          break;
        case 'vendorGroup':
          comparison = (a.vendorGroup || '').localeCompare(b.vendorGroup || '');
          break;
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [searchQuery, sortField, sortDirection, filterWarehousing, filterSuspended]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleProfileClick = (profile: ManufacturerProfile) => {
    setSelectedProfile(profile);
    setShowModal(true);
  };

  const handleSaveProfile = (updatedProfile: ManufacturerProfile) => {
    // In a real app, this would update the backend
    console.log('Saving profile:', updatedProfile);
    setShowModal(false);
    setSelectedProfile(null);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Manufacturer Profiles</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Configure vendor settings, customer cross-references, and freight categories for your manufacturers
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="text-sm text-[var(--muted-foreground)]">Total Manufacturers</div>
          <div className="text-2xl font-semibold text-[var(--foreground)] mt-1">{mockManufacturerProfiles.length}</div>
        </div>
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="text-sm text-[var(--muted-foreground)]">Warehousing Enabled</div>
          <div className="text-2xl font-semibold text-green-600 mt-1">
            {mockManufacturerProfiles.filter((p) => p.warehousing).length}
          </div>
        </div>
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="text-sm text-[var(--muted-foreground)]">Buy/Sell</div>
          <div className="text-2xl font-semibold text-blue-600 mt-1">
            {mockManufacturerProfiles.filter((p) => p.isBuySell).length}
          </div>
        </div>
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="text-sm text-[var(--muted-foreground)]">Suspended</div>
          <div className="text-2xl font-semibold text-red-600 mt-1">
            {mockManufacturerProfiles.filter((p) => p.isSuspended).length}
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] mb-6">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search manufacturers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-64 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>

            {/* Warehousing Filter */}
            <select
              value={filterWarehousing}
              onChange={(e) => setFilterWarehousing(e.target.value as 'all' | 'yes' | 'no')}
              className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option value="all">All Warehousing</option>
              <option value="yes">Warehousing Enabled</option>
              <option value="no">No Warehousing</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterSuspended}
              onChange={(e) => setFilterSuspended(e.target.value as 'all' | 'active' | 'suspended')}
              className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="text-sm text-[var(--muted-foreground)]">
            Showing {filteredProfiles.length} of {mockManufacturerProfiles.length} manufacturers
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--muted)]/30">
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('vendorName')}
                    className="flex items-center gap-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide hover:text-[var(--foreground)]"
                  >
                    Vendor Name
                    <SortIcon field="vendorName" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('vendorGroup')}
                    className="flex items-center gap-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide hover:text-[var(--foreground)]"
                  >
                    Group
                    <SortIcon field="vendorGroup" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
                  Rep Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
                  Settings
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
                  Communication
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('updatedAt')}
                    className="flex items-center gap-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide hover:text-[var(--foreground)]"
                  >
                    Last Updated
                    <SortIcon field="updatedAt" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredProfiles.map((profile) => (
                <tr
                  key={profile.id}
                  onClick={() => handleProfileClick(profile)}
                  className="hover:bg-[var(--muted)]/30 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-[var(--foreground)]">{profile.vendorName}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">{profile.phone || 'No phone'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-[var(--foreground)]">{profile.vendorGroup || '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-[var(--foreground)]">{profile.repCode || '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      {profile.warehousing && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Warehousing
                        </span>
                      )}
                      {profile.isBuySell && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                          Buy/Sell
                        </span>
                      )}
                      {profile.alwaysFactoryBO && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                          Factory BO
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        Out: {profile.outboundCommunication}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        In: {profile.inboundCommunication}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-[var(--muted-foreground)]">
                      {new Date(profile.updatedAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {profile.isSuspended ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        Suspended
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProfileClick(profile);
                      }}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProfiles.length === 0 && (
          <div className="px-6 py-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-[var(--muted-foreground)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-[var(--foreground)]">No manufacturers found</h3>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedProfile && (
        <ManufacturerProfileModal
          profile={selectedProfile}
          onClose={() => {
            setShowModal(false);
            setSelectedProfile(null);
          }}
          onSave={handleSaveProfile}
        />
      )}
    </div>
  );
}

