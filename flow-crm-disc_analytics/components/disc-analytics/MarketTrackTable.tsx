'use client';

import React, { useState, useEffect, useCallback } from 'react';

type DataRow = {
  id: number;
  section: string;
  description: string;
  location: string;
  fips_code: string;
  category: string;
  year: number;
  value: number;
};

type FiltersType = {
  sections: string[];
  categories: string[];
  years: number[];
};

export default function MarketTrackTable() {
  const [data, setData] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'id', direction: 'asc' });
  const [filters, setFilters] = useState<FiltersType>({ sections: [], categories: [], years: [] });
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const pageSize = 25;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        sortBy: sortConfig.key,
        sortDir: sortConfig.direction,
      });

      if (selectedSection) params.append('section', selectedSection);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedYear) params.append('year', selectedYear);

      const response = await fetch(`/api/disc/market-track?${params}`);
      const result = await response.json();

      setData(result.data);
      setTotalPages(result.totalPages);
      setTotalRecords(result.total);
      setFilters(result.filters);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortConfig, selectedSection, selectedCategory, selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedSection('');
    setSelectedCategory('');
    setSelectedYear('');
    setCurrentPage(1);
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col p-6 bg-[var(--background)]">
      {/* Filter Bar */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 mb-4">
        <div className="flex items-center gap-6">
          {/* Calendar Icon & Label */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--primary)] rounded-lg flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <span className="font-medium text-[var(--foreground)]">Filter by Date Range</span>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-4 flex-1">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase">Section</label>
              <select
                value={selectedSection}
                onChange={(e) => { setSelectedSection(e.target.value); handleFilterChange(); }}
                className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm min-w-[140px] text-[var(--foreground)]"
              >
                <option value="">All Sections</option>
                {filters.sections.map(section => (
                  <option key={section} value={section}>{section}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); handleFilterChange(); }}
                className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm min-w-[140px] text-[var(--foreground)]"
              >
                <option value="">All Categories</option>
                {filters.categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => { setSelectedYear(e.target.value); handleFilterChange(); }}
                className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm min-w-[120px] text-[var(--foreground)]"
              >
                <option value="">All Years</option>
                {filters.years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Advanced Filters Button */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            <span>Advanced Filters</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 4.5l3 3 3-3"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-[var(--muted-foreground)]">
            ({totalRecords.toLocaleString()}) records
          </div>
          <div className="flex items-center gap-2">
            {/* Refresh */}
            <button
              onClick={() => fetchData()}
              className="p-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6"/>
                <path d="M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
            </button>

            {/* Expand */}
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
              </svg>
              <span>Expand</span>
            </button>

            {/* Save View */}
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              <span>Save View</span>
            </button>

            {/* Manage Views */}
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
              </svg>
              <span>Manage Views</span>
            </button>

            {/* Columns */}
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
              <span>Columns</span>
            </button>

            {/* Sort */}
            <button className="p-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5h10M11 9h7M11 13h4M3 17l3 3 3-3M6 18V4"/>
              </svg>
            </button>

            {/* Export */}
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors">
              <span>Export</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 4.5l3 3 3-3"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Data Table Card */}
      <div className="flex-1 bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden flex flex-col">
        {/* Table Title */}
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Market Track Report</h2>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-[var(--muted-foreground)]">Loading...</div>
          </div>
        ) : (
          <>
            <div className="overflow-auto flex-1">
              <table className="w-full">
                <thead className="sticky top-0 bg-[var(--muted)]">
                  <tr>
                    <th
                      onClick={() => handleSort('section')}
                      className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:text-[var(--foreground)] border-b border-[var(--border)]"
                    >
                      <div className="flex items-center gap-1">
                        Section
                        {sortConfig.key === 'section' && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                            {sortConfig.direction === 'asc' ? <path d="M6 3l4 6H2z"/> : <path d="M6 9l-4-6h8z"/>}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('description')}
                      className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:text-[var(--foreground)] border-b border-[var(--border)]"
                    >
                      <div className="flex items-center gap-1">
                        Description
                        {sortConfig.key === 'description' && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                            {sortConfig.direction === 'asc' ? <path d="M6 3l4 6H2z"/> : <path d="M6 9l-4-6h8z"/>}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('location')}
                      className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:text-[var(--foreground)] border-b border-[var(--border)]"
                    >
                      <div className="flex items-center gap-1">
                        Location
                        {sortConfig.key === 'location' && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                            {sortConfig.direction === 'asc' ? <path d="M6 3l4 6H2z"/> : <path d="M6 9l-4-6h8z"/>}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('fips_code')}
                      className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:text-[var(--foreground)] border-b border-[var(--border)]"
                    >
                      <div className="flex items-center gap-1">
                        FIPS Code
                        {sortConfig.key === 'fips_code' && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                            {sortConfig.direction === 'asc' ? <path d="M6 3l4 6H2z"/> : <path d="M6 9l-4-6h8z"/>}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('category')}
                      className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:text-[var(--foreground)] border-b border-[var(--border)]"
                    >
                      <div className="flex items-center gap-1">
                        Category
                        {sortConfig.key === 'category' && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                            {sortConfig.direction === 'asc' ? <path d="M6 3l4 6H2z"/> : <path d="M6 9l-4-6h8z"/>}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('year')}
                      className="px-6 py-3 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:text-[var(--foreground)] border-b border-[var(--border)]"
                    >
                      <div className="flex items-center justify-center gap-1">
                        Year
                        {sortConfig.key === 'year' && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                            {sortConfig.direction === 'asc' ? <path d="M6 3l4 6H2z"/> : <path d="M6 9l-4-6h8z"/>}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('value')}
                      className="px-6 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:text-[var(--foreground)] border-b border-[var(--border)]"
                    >
                      <div className="flex items-center justify-end gap-1">
                        Value
                        {sortConfig.key === 'value' && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                            {sortConfig.direction === 'asc' ? <path d="M6 3l4 6H2z"/> : <path d="M6 9l-4-6h8z"/>}
                          </svg>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, idx) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-[var(--muted)] transition-colors ${idx % 2 === 0 ? 'bg-[var(--card)]' : 'bg-[var(--background)]'}`}
                    >
                      <td className="px-6 py-4 text-sm text-[var(--foreground)] border-b border-[var(--border)]">{row.section}</td>
                      <td className="px-6 py-4 text-sm text-[var(--foreground)] border-b border-[var(--border)] max-w-[200px] truncate" title={row.description}>{row.description}</td>
                      <td className="px-6 py-4 text-sm text-[var(--foreground)] border-b border-[var(--border)]">{row.location}</td>
                      <td className="px-6 py-4 text-sm text-[var(--foreground)] border-b border-[var(--border)]">{row.fips_code}</td>
                      <td className="px-6 py-4 text-sm text-[var(--foreground)] border-b border-[var(--border)]">{row.category}</td>
                      <td className="px-6 py-4 text-sm text-[var(--foreground)] text-center border-b border-[var(--border)]">{row.year}</td>
                      <td className="px-6 py-4 text-sm text-[var(--foreground)] text-right border-b border-[var(--border)]">
                        {row.value.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)] bg-[var(--card)]">
              <div className="text-sm text-[var(--muted-foreground)]">
                Page {currentPage} of {totalPages.toLocaleString()}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm bg-[var(--muted)] rounded-lg disabled:opacity-50 hover:bg-[var(--border)] transition-colors"
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm bg-[var(--muted)] rounded-lg disabled:opacity-50 hover:bg-[var(--border)] transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm bg-[var(--muted)] rounded-lg disabled:opacity-50 hover:bg-[var(--border)] transition-colors"
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm bg-[var(--muted)] rounded-lg disabled:opacity-50 hover:bg-[var(--border)] transition-colors"
                >
                  Last
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
