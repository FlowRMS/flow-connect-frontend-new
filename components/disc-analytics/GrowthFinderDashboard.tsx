'use client';

import React, { useState, useRef, useEffect } from 'react';
import USMapHeatmap from './USMapHeatmap';

type FilterSection = 'geography' | 'sector' | 'general' | 'advanced';

// Data Source Tag Component
function DataSourceTag({ source }: { source: 'data-search' | 'market-track' }) {
  const isDataSearch = source === 'data-search';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
        isDataSearch
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
          : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
      }`}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        {isDataSearch ? (
          <><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></>
        ) : (
          <><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></>
        )}
      </svg>
      {isDataSearch ? 'Data Search' : 'Market Track'}
    </span>
  );
}

// Info Tooltip Component - shows calculation methodology on hover
function InfoTooltip({ content }: { content: string }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={(e) => {
          e.stopPropagation();
          setIsVisible(!isVisible);
        }}
        className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center text-[10px] font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-help"
        aria-label="More information"
      >
        ?
      </button>
      {isVisible && (
        <div className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg shadow-lg pointer-events-none">
          <div className="whitespace-pre-line">{content}</div>
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
}

// Requirements Tag Component - shows what data/config is required
type RequirementType = 'sales' | 'trading-areas' | 'territories' | 'products';

function RequiresTag({ requires }: { requires: RequirementType[] }) {
  const getConfig = (type: RequirementType) => {
    switch (type) {
      case 'sales':
        return { label: 'Sales', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' };
      case 'trading-areas':
        return { label: 'Trading Areas', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' };
      case 'territories':
        return { label: 'Territories', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' };
      case 'products':
        return { label: 'Products', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' };
    }
  };

  return (
    <div className="flex flex-wrap gap-1">
      {requires.map((req) => {
        const config = getConfig(req);
        return (
          <span
            key={req}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${config.color}`}
            title={`Requires ${config.label} data`}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d={config.icon} />
            </svg>
            {config.label}
          </span>
        );
      })}
    </div>
  );
}

type NAICSIndustry = {
  code: string;
  description: string;
};

type MetricOption = {
  value: string;
  label: string;
  description: string;
};

// Searchable Multi-Select Component
function SearchableMultiSelect({
  label,
  placeholder,
  searchPlaceholder,
  options,
  selected,
  onChange,
  renderOption,
}: {
  label: string;
  placeholder: string;
  searchPlaceholder: string;
  options: string[] | NAICSIndustry[];
  selected: string[];
  onChange: (selected: string[]) => void;
  renderOption?: (option: NAICSIndustry) => React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isNAICS = options.length > 0 && typeof options[0] === 'object';

  const filteredOptions = isNAICS
    ? (options as NAICSIndustry[]).filter(opt =>
        opt.code.toLowerCase().includes(search.toLowerCase()) ||
        opt.description.toLowerCase().includes(search.toLowerCase())
      )
    : (options as string[]).filter(opt =>
        opt.toLowerCase().includes(search.toLowerCase())
      );

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const getDisplayText = () => {
    if (selected.length === 0) return placeholder;
    if (selected.length === 1) {
      if (isNAICS) {
        const opt = (options as NAICSIndustry[]).find(o => o.code === selected[0]);
        return opt ? `${opt.code} - ${opt.description}` : selected[0];
      }
      return selected[0];
    }
    return `${selected.length} selected`;
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm text-[var(--foreground)] mb-2">{label}</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-left flex items-center justify-between text-[var(--foreground)]"
      >
        <span className={`truncate ${selected.length === 0 ? 'text-[var(--muted-foreground)]' : ''}`}>{getDisplayText()}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg">
          <div className="p-2 border-b border-[var(--border)]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">No results found</div>
            ) : (
              filteredOptions.map((option) => {
                const value = isNAICS ? (option as NAICSIndustry).code : (option as string);
                const isSelected = selected.includes(value);

                return (
                  <button
                    key={value}
                    onClick={() => toggleOption(value)}
                    className={`w-full px-3 py-2.5 text-left text-sm hover:bg-[var(--muted)] flex items-start gap-3 ${
                      isSelected ? 'bg-[var(--muted)]' : ''
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                      isSelected ? 'bg-[var(--primary)] border-[var(--primary)]' : 'border-[var(--border)]'
                    }`}>
                      {isSelected && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                    {isNAICS && renderOption ? (
                      renderOption(option as NAICSIndustry)
                    ) : (
                      <span className="text-[var(--foreground)]">{option as string}</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selected.map(value => {
            let displayText = value;
            if (isNAICS) {
              const opt = (options as NAICSIndustry[]).find(o => o.code === value);
              displayText = opt ? opt.code : value;
            }
            return (
              <span key={value} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--muted)] rounded text-xs text-[var(--foreground)]">
                {displayText}
                <button onClick={() => toggleOption(value)} className="hover:text-red-500">×</button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Dropdown Select Component
function DropdownSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: MetricOption[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm text-[var(--foreground)] mb-2">{label}</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-left flex items-center justify-between text-[var(--foreground)]"
      >
        <span>{selectedOption?.label || 'Select...'}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2.5 text-left hover:bg-[var(--muted)] flex items-center justify-between ${
                value === option.value ? 'bg-[var(--muted)]' : ''
              }`}
            >
              <div>
                <div className="text-sm font-medium text-[var(--foreground)]">{option.label}</div>
                <div className="text-xs text-[var(--muted-foreground)]">{option.description}</div>
              </div>
              {value === option.value && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GrowthFinderDashboard() {
  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'ytd'>('ytd');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Collapsible sections
  const [expandedSections, setExpandedSections] = useState<Set<FilterSection>>(
    new Set(['geography', 'sector', 'general', 'advanced'])
  );

  // Geography filters
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedCounties, setSelectedCounties] = useState<string[]>([]);
  const [selectedZipCodes, setSelectedZipCodes] = useState<string[]>([]);
  const [selectedFipsCodes, setSelectedFipsCodes] = useState<string[]>([]);

  // Sector/Industries filters
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [industryFromCode, setIndustryFromCode] = useState('');
  const [industryToCode, setIndustryToCode] = useState('');
  const [industryRanges, setIndustryRanges] = useState<{ from: string; to: string }[]>([]);

  // General filters
  const [metricType, setMetricType] = useState('establishments');
  const [yearFrom, setYearFrom] = useState('2024');
  const [yearTo, setYearTo] = useState('2028');

  // Advanced filters
  const [minCagr, setMinCagr] = useState('0.0');
  const [minTam, setMinTam] = useState('0');
  const [purchasesPercentOrg, setPurchasesPercentOrg] = useState('0.0');
  const [purchasesEmployees, setPurchasesEmployees] = useState('0');
  const [establishments, setEstablishments] = useState('0');
  const [employeeRatio, setEmployeeRatio] = useState('0.00');
  const [establishmentsRangeMin, setEstablishmentsRangeMin] = useState(0);
  const [establishmentsRangeMax, setEstablishmentsRangeMax] = useState(1000);

  const toggleSection = (section: FilterSection) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const addIndustryRange = () => {
    if (industryFromCode && industryToCode) {
      setIndustryRanges([...industryRanges, { from: industryFromCode, to: industryToCode }]);
      setIndustryFromCode('');
      setIndustryToCode('');
    }
  };

  const removeIndustryRange = (index: number) => {
    setIndustryRanges(industryRanges.filter((_, i) => i !== index));
  };

  // Sample data
  const states = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
    'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
    'Wisconsin', 'Wyoming'
  ];

  const counties = [
    'Los Angeles County', 'Cook County', 'Harris County', 'Maricopa County', 'San Diego County',
    'Orange County', 'Miami-Dade County', 'Dallas County', 'Kings County', 'Riverside County'
  ];

  const zipCodes = [
    '10001', '10002', '10003', '10004', '10005', '90001', '90002', '90003', '90004', '90005',
    '60601', '60602', '60603', '77001', '77002', '77003'
  ];

  const fipsCodes = [
    '06037', '17031', '48201', '04013', '06073', '06059', '12086', '48113', '36047', '06065'
  ];

  const naicsIndustries: NAICSIndustry[] = [
    { code: '221121', description: 'Electric Bulk Power Transmission and Control Utilities' },
    { code: '221122', description: 'Electric Power Distribution Utilities' },
    { code: '221210', description: 'Natural Gas Distribution Utilities' },
    { code: '236115', description: 'New Single-Family Housing Construction' },
    { code: '236116', description: 'New Multifamily Housing Construction' },
    { code: '236117', description: 'New Housing For-Sale Builders' },
    { code: '236118', description: 'Residential Remodelers' },
    { code: '236210', description: 'Industrial Building Construction' },
    { code: '236220', description: 'Commercial and Institutional Building Construction' },
    { code: '237110', description: 'Water and Sewer Line Construction' },
    { code: '237120', description: 'Oil and Gas Pipeline Construction' },
    { code: '237130', description: 'Power and Communication Line Construction' },
    { code: '237210', description: 'Land Subdivision' },
    { code: '237310', description: 'Highway, Street, and Bridge Construction' },
    { code: '237990', description: 'Other Heavy and Civil Engineering Construction' },
  ];

  const metricOptions: MetricOption[] = [
    { value: 'establishments', label: 'Establishments', description: 'Number of business locations' },
    { value: 'employees', label: 'Employees', description: 'Total employment count' },
    { value: 'purchasing', label: 'Purchasing', description: 'Total purchasing volume' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Growth Finder</h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            <span className="font-medium">For Sales Leadership & Business Development</span> — Identify high-growth markets and untapped opportunities to prioritize resource allocation
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date Range Toggle */}
          <div className="flex bg-[var(--muted)] rounded-lg p-1">
            {(['month', 'quarter', 'ytd'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  dateRange === range
                    ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                {range === 'ytd' ? 'YTD' : range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>

          {/* Advanced Filters Button */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showAdvancedFilters
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            <span>Advanced Filters</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
              <path d={showAdvancedFilters ? "M3 7.5l3-3 3 3" : "M3 4.5l3 3 3-3"}/>
            </svg>
          </button>

          {/* Export Button */}
          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Geography Section */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
            <button
              onClick={() => toggleSection('geography')}
              className="flex items-center justify-between w-full mb-4"
            >
              <h3 className="font-semibold text-[var(--foreground)]">Geography</h3>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`transition-transform ${expandedSections.has('geography') ? '' : 'rotate-180'}`}
              >
                <path d="M18 15l-6-6-6 6"/>
              </svg>
            </button>

            {expandedSections.has('geography') && (
              <div className="space-y-4">
                <SearchableMultiSelect
                  label="States"
                  placeholder="Select states..."
                  searchPlaceholder="Search states..."
                  options={states}
                  selected={selectedStates}
                  onChange={setSelectedStates}
                />

                <SearchableMultiSelect
                  label="Counties"
                  placeholder="Select counties..."
                  searchPlaceholder="Search counties..."
                  options={counties}
                  selected={selectedCounties}
                  onChange={setSelectedCounties}
                />

                <SearchableMultiSelect
                  label="Zip Codes"
                  placeholder="Select zip codes..."
                  searchPlaceholder="Search zip codes..."
                  options={zipCodes}
                  selected={selectedZipCodes}
                  onChange={setSelectedZipCodes}
                />

                <SearchableMultiSelect
                  label="FIPS Codes"
                  placeholder="Select FIPS codes..."
                  searchPlaceholder="Search FIPS codes..."
                  options={fipsCodes}
                  selected={selectedFipsCodes}
                  onChange={setSelectedFipsCodes}
                />
              </div>
            )}
          </div>

          {/* Sector / Industries Section */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
            <button
              onClick={() => toggleSection('sector')}
              className="flex items-center justify-between w-full mb-4"
            >
              <h3 className="font-semibold text-[var(--foreground)]">Sector / Industries</h3>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`transition-transform ${expandedSections.has('sector') ? '' : 'rotate-180'}`}
              >
                <path d="M18 15l-6-6-6 6"/>
              </svg>
            </button>

            {expandedSections.has('sector') && (
              <div className="space-y-4">
                <SearchableMultiSelect
                  label="NAICS Industries"
                  placeholder="Select industries..."
                  searchPlaceholder="Search NAICS codes or descriptions..."
                  options={naicsIndustries}
                  selected={selectedIndustries}
                  onChange={setSelectedIndustries}
                  renderOption={(option) => (
                    <div className="flex-1">
                      <div className="font-medium text-[var(--foreground)]">{option.code}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{option.description}</div>
                    </div>
                  )}
                />

                {/* Industry Code Ranges */}
                <div>
                  <label className="block text-sm text-[var(--foreground)] mb-2">Industry Code Ranges</label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input
                      type="text"
                      value={industryFromCode}
                      onChange={(e) => setIndustryFromCode(e.target.value)}
                      placeholder="From code"
                      className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                    />
                    <input
                      type="text"
                      value={industryToCode}
                      onChange={(e) => setIndustryToCode(e.target.value)}
                      placeholder="To code"
                      className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                    />
                  </div>
                  <button
                    onClick={addIndustryRange}
                    className="w-full px-4 py-2.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
                  >
                    Add Range
                  </button>
                  {industryRanges.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {industryRanges.map((range, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--muted)] rounded text-xs text-[var(--foreground)]">
                          {range.from} - {range.to}
                          <button onClick={() => removeIndustryRange(idx)} className="hover:text-red-500">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* General Filters Section */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
            <button
              onClick={() => toggleSection('general')}
              className="flex items-center justify-between w-full mb-4"
            >
              <h3 className="font-semibold text-[var(--foreground)]">General Filters</h3>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`transition-transform ${expandedSections.has('general') ? '' : 'rotate-180'}`}
              >
                <path d="M18 15l-6-6-6 6"/>
              </svg>
            </button>

            {expandedSections.has('general') && (
              <div className="space-y-4">
                <DropdownSelect
                  label="Metric Type"
                  value={metricType}
                  onChange={setMetricType}
                  options={metricOptions}
                />

                {/* Time Range */}
                <div>
                  <label className="block text-sm text-[var(--foreground)] mb-2">Time Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={yearFrom}
                      onChange={(e) => setYearFrom(e.target.value)}
                      placeholder="2024"
                      className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)]"
                    />
                    <input
                      type="text"
                      value={yearTo}
                      onChange={(e) => setYearTo(e.target.value)}
                      placeholder="2028"
                      className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Advanced Section */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
            <button
              onClick={() => toggleSection('advanced')}
              className="flex items-center justify-between w-full mb-4"
            >
              <h3 className="font-semibold text-[var(--foreground)]">Advanced</h3>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`transition-transform ${expandedSections.has('advanced') ? '' : 'rotate-180'}`}
              >
                <path d="M18 15l-6-6-6 6"/>
              </svg>
            </button>

            {expandedSections.has('advanced') && (
              <div className="space-y-4">
                {/* Min CAGR & Min TAM */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-[var(--muted-foreground)] mb-1">Min CAGR %</label>
                    <input
                      type="text"
                      value={minCagr}
                      onChange={(e) => setMinCagr(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--muted-foreground)] mb-1">Min TAM</label>
                    <input
                      type="text"
                      value={minTam}
                      onChange={(e) => setMinTam(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)]"
                    />
                  </div>
                </div>

                {/* Purchases % Org & Purchases Employees */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-[var(--muted-foreground)] mb-1">Purchases % Org</label>
                    <input
                      type="text"
                      value={purchasesPercentOrg}
                      onChange={(e) => setPurchasesPercentOrg(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--muted-foreground)] mb-1">Purchases Employees</label>
                    <input
                      type="text"
                      value={purchasesEmployees}
                      onChange={(e) => setPurchasesEmployees(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)]"
                    />
                  </div>
                </div>

                {/* Establishments & Employee Ratio */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-[var(--muted-foreground)] mb-1">Establishments</label>
                    <input
                      type="text"
                      value={establishments}
                      onChange={(e) => setEstablishments(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--muted-foreground)] mb-1">Employee Ratio</label>
                    <input
                      type="text"
                      value={employeeRatio}
                      onChange={(e) => setEmployeeRatio(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)]"
                    />
                  </div>
                </div>

                {/* Establishments Range Slider */}
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-2">Establishments Range</label>
                  <div className="relative pt-1">
                    <div className="h-2 bg-[var(--muted)] rounded-full">
                      <div
                        className="absolute h-2 bg-[var(--primary)] rounded-full"
                        style={{
                          left: `${(establishmentsRangeMin / 1000) * 100}%`,
                          right: `${100 - (establishmentsRangeMax / 1000) * 100}%`
                        }}
                      />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      value={establishmentsRangeMin}
                      onChange={(e) => setEstablishmentsRangeMin(Math.min(Number(e.target.value), establishmentsRangeMax - 10))}
                      className="absolute w-full h-2 opacity-0 cursor-pointer top-1"
                    />
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      value={establishmentsRangeMax}
                      onChange={(e) => setEstablishmentsRangeMax(Math.max(Number(e.target.value), establishmentsRangeMin + 10))}
                      className="absolute w-full h-2 opacity-0 cursor-pointer top-1"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-[var(--muted-foreground)] mt-1">
                    <span>0</span>
                    <span>1,000</span>
                  </div>
                </div>

                {/* Min/Max Inputs */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-[var(--muted-foreground)] mb-1">Min</label>
                    <input
                      type="number"
                      value={establishmentsRangeMin}
                      onChange={(e) => setEstablishmentsRangeMin(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--muted-foreground)] mb-1">Max</label>
                    <input
                      type="number"
                      value={establishmentsRangeMax}
                      onChange={(e) => setEstablishmentsRangeMax(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <div className="text-sm text-[var(--muted-foreground)]">Total Market Value</div>
              <InfoTooltip content="Sum of annual revenue across all businesses in selected geography and industry filters. Sourced from Market Track data." />
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--foreground)]">$4.2B</div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-green-600 dark:text-green-400">+12.4% YoY</span>
            <DataSourceTag source="market-track" />
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <div className="text-sm text-[var(--muted-foreground)]">Avg Regional CAGR</div>
              <InfoTooltip content="Compound Annual Growth Rate averaged across all selected regions. Calculated as: ((End Value / Start Value)^(1/years) - 1) × 100" />
            </div>
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2">
                <path d="M23 6l-9.5 9.5-5-5L1 18"/>
                <path d="M17 6h6v6"/>
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--foreground)]">5.8%</div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-[var(--muted-foreground)]">2024-2028 projection</span>
            <DataSourceTag source="data-search" />
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <div className="text-sm text-[var(--muted-foreground)]">High-Growth Markets</div>
              <InfoTooltip content="Count of geographic markets where CAGR exceeds 10%. Filters: Selected geography, NAICS codes, and time period." />
            </div>
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--foreground)]">18</div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-[var(--muted-foreground)]">CAGR &gt; 10%</span>
            <DataSourceTag source="data-search" />
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <div className="text-sm text-[var(--muted-foreground)]">Total Establishments</div>
              <InfoTooltip content="Count of unique business establishments matching selected filters. Based on Census Bureau data and business registrations." />
            </div>
            <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="2">
                <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--foreground)]">142K</div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-green-600 dark:text-green-400">+3.2% vs last year</span>
            <DataSourceTag source="data-search" />
          </div>
        </div>
      </div>

      {/* US Map Heatmap */}
      <USMapHeatmap />

      {/* Growth vs Market Size and AI Takeaways */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Growth vs Market Size Bubble Chart */}
        <GrowthMarketBubbleChart />

        {/* AI Takeaways */}
        <AITakeaways />
      </div>

      {/* Industry Growth Matrix */}
      <div className="mt-6">
        <IndustryGrowthMatrix />
      </div>
    </div>
  );
}

// Mock data for the bubble chart
const bubbleChartData = [
  { name: 'Gila, AZ', cagr: 18.92, marketSize: 5, establishments: 12 },
  { name: 'Arapahoe, CO', cagr: 3.42, marketSize: 127, establishments: 95 },
  { name: 'Adams, CO', cagr: 1.8, marketSize: 75, establishments: 62 },
  { name: 'Boulder, CO', cagr: 3.3, marketSize: 74, establishments: 58 },
  { name: 'Jefferson, CO', cagr: -2.1, marketSize: 72, establishments: 45 },
  { name: 'Denver, CO', cagr: 5.8, marketSize: 115, establishments: 38 },
];

function GrowthMarketBubbleChart() {
  const [hoveredBubble, setHoveredBubble] = useState<typeof bubbleChartData[0] | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Chart dimensions and scaling
  const chartWidth = 450;
  const chartHeight = 300;
  const padding = { top: 30, right: 30, bottom: 40, left: 50 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Calculate min/max for scales
  const minCagr = Math.min(...bubbleChartData.map(d => d.cagr)) - 2;
  const maxCagr = Math.max(...bubbleChartData.map(d => d.cagr)) + 2;
  const maxMarketSize = Math.max(...bubbleChartData.map(d => d.marketSize)) + 10;
  const maxEstablishments = Math.max(...bubbleChartData.map(d => d.establishments));

  // Scale functions
  const xScale = (cagr: number) => padding.left + ((cagr - minCagr) / (maxCagr - minCagr)) * plotWidth;
  const yScale = (marketSize: number) => padding.top + plotHeight - (marketSize / maxMarketSize) * plotHeight;
  const sizeScale = (establishments: number) => 8 + (establishments / maxEstablishments) * 20;

  const getCAGRColor = (cagr: number): string => {
    if (cagr < 0) return '#EF4444';
    if (cagr < 2) return '#F97316';
    if (cagr < 5) return '#EAB308';
    if (cagr < 10) return '#22C55E';
    return '#16A34A';
  };

  // Generate axis ticks
  const xTicks = [-7, 0, 7, 14, 21].filter(t => t >= minCagr && t <= maxCagr);
  const yTicks = [2, 37, 72, 127];

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-[var(--foreground)]">Which markets offer the best growth-to-size ratio?</h3>
          <div className="flex items-center gap-2">
            <DataSourceTag source="data-search" />
          </div>
        </div>
        <p className="text-xs text-[var(--muted-foreground)]">X-axis: CAGR % | Y-axis: Market Size ($M) | Bubble Size: # Establishments</p>
      </div>

      <div className="relative">
        <svg
          width="100%"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="overflow-visible"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          }}
        >
          {/* Y-axis */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + plotHeight}
            stroke="var(--border)"
            strokeWidth="1"
          />

          {/* X-axis */}
          <line
            x1={padding.left}
            y1={padding.top + plotHeight}
            x2={padding.left + plotWidth}
            y2={padding.top + plotHeight}
            stroke="var(--border)"
            strokeWidth="1"
          />

          {/* Y-axis ticks and labels */}
          {yTicks.map(tick => (
            <g key={`y-${tick}`}>
              <line
                x1={padding.left - 5}
                y1={yScale(tick)}
                x2={padding.left}
                y2={yScale(tick)}
                stroke="var(--border)"
                strokeWidth="1"
              />
              <text
                x={padding.left - 10}
                y={yScale(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                className="text-[10px] fill-[var(--muted-foreground)]"
              >
                ${tick}
              </text>
              {/* Grid line */}
              <line
                x1={padding.left}
                y1={yScale(tick)}
                x2={padding.left + plotWidth}
                y2={yScale(tick)}
                stroke="var(--border)"
                strokeWidth="0.5"
                strokeDasharray="2,2"
                opacity="0.5"
              />
            </g>
          ))}

          {/* X-axis ticks and labels */}
          {xTicks.map(tick => (
            <g key={`x-${tick}`}>
              <line
                x1={xScale(tick)}
                y1={padding.top + plotHeight}
                x2={xScale(tick)}
                y2={padding.top + plotHeight + 5}
                stroke="var(--border)"
                strokeWidth="1"
              />
              <text
                x={xScale(tick)}
                y={padding.top + plotHeight + 18}
                textAnchor="middle"
                className="text-[10px] fill-[var(--muted-foreground)]"
              >
                {tick}%
              </text>
            </g>
          ))}

          {/* Bubbles */}
          {bubbleChartData.map((d, i) => (
            <circle
              key={i}
              cx={xScale(d.cagr)}
              cy={yScale(d.marketSize)}
              r={sizeScale(d.establishments)}
              fill={getCAGRColor(d.cagr)}
              fillOpacity="0.7"
              stroke={getCAGRColor(d.cagr)}
              strokeWidth="2"
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHoveredBubble(d)}
              onMouseLeave={() => setHoveredBubble(null)}
            />
          ))}
        </svg>

        {/* Tooltip */}
        {hoveredBubble && (
          <div
            className="absolute z-10 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg p-2 pointer-events-none"
            style={{
              left: Math.min(mousePos.x + 10, chartWidth - 150),
              top: mousePos.y - 60,
            }}
          >
            <div className="font-medium text-sm text-[var(--foreground)]">{hoveredBubble.name}</div>
            <div className="text-xs text-[var(--muted-foreground)]">CAGR: {hoveredBubble.cagr.toFixed(2)}%</div>
            <div className="text-xs text-[var(--muted-foreground)]">Market Size: ${hoveredBubble.marketSize}M</div>
            <div className="text-xs text-[var(--muted-foreground)]">Establishments: {hoveredBubble.establishments}</div>
          </div>
        )}
      </div>

      {/* Legends */}
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs">
        <div>
          <div className="font-medium text-[var(--muted-foreground)] mb-1">CAGR Performance</div>
          <div className="flex flex-wrap gap-3">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span> Negative</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#F97316]"></span> 0-2%</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#EAB308]"></span> 2-5%</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]"></span> 5-10%</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]"></span> 10%+</span>
          </div>
        </div>
        <div>
          <div className="font-medium text-[var(--muted-foreground)] mb-1">Establishments</div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400"></span> Few</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-400"></span> Some</span>
            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-gray-400"></span> Many</span>
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="mt-4 pt-4 border-t border-[var(--border)] grid grid-cols-2 gap-4 text-xs">
        <div>
          <div className="font-medium text-[var(--foreground)] mb-2">Highest Growth Counties</div>
          <div className="space-y-1">
            <div className="flex justify-between"><span className="text-[var(--muted-foreground)]">Gila, AZ</span><span className="font-medium">18.9%</span></div>
            <div className="flex justify-between"><span className="text-[var(--muted-foreground)]">Arapahoe, CO</span><span className="font-medium">3.4%</span></div>
            <div className="flex justify-between"><span className="text-[var(--muted-foreground)]">Boulder, CO</span><span className="font-medium">3.3%</span></div>
          </div>
        </div>
        <div>
          <div className="font-medium text-[var(--foreground)] mb-2">Largest Markets</div>
          <div className="space-y-1">
            <div className="flex justify-between"><span className="text-[var(--muted-foreground)]">Arapahoe, CO</span><span className="font-medium">$127</span></div>
            <div className="flex justify-between"><span className="text-[var(--muted-foreground)]">Adams, CO</span><span className="font-medium">$75</span></div>
            <div className="flex justify-between"><span className="text-[var(--muted-foreground)]">Boulder, CO</span><span className="font-medium">$74</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AITakeaways() {
  const takeaways = [
    'Top growth: Gila, AZ (18.92%).',
    'Runner-up: Arapahoe, CO (3.42%).',
    'Average CAGR across top locations: 3.65%.',
    'AZ leads with 3 of 6 high-growth locations.',
    'Total market size: 310 establishments.',
    '1 locations exceed average growth rate.',
  ];

  const analysis = `Gila, AZ represents the highest growth opportunity with 18.9% CAGR. The concentration in AZ suggests state-level factors are driving growth, making it an attractive expansion target. Focus resources on these high-growth markets for maximum ROI.`;

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
            <circle cx="7.5" cy="14.5" r="1.5"/>
            <circle cx="16.5" cy="14.5" r="1.5"/>
          </svg>
          <h3 className="font-semibold text-[var(--foreground)]">What are the key insights I should act on?</h3>
        </div>
        <DataSourceTag source="data-search" />
      </div>

      {/* Key Insights List */}
      <ul className="space-y-2 mb-4">
        {takeaways.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
            <span className="text-[var(--primary)] mt-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="4"/>
              </svg>
            </span>
            {item}
          </li>
        ))}
      </ul>

      {/* Analysis Paragraph */}
      <div className="bg-[var(--muted)] rounded-lg p-4">
        <p className="text-sm text-[var(--foreground)] leading-relaxed">
          {analysis}
        </p>
      </div>

      {/* Regenerate Button */}
      <button className="mt-4 flex items-center gap-2 px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 2v6h-6"/>
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
          <path d="M3 22v-6h6"/>
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
        </svg>
        Regenerate Insights
      </button>
    </div>
  );
}

// Industry Growth Matrix data - expanded with more states
const industryMatrixData = {
  regions: ['AZ', 'CO', 'TX', 'FL', 'CA', 'NV', 'UT', 'GA'],
  industries: [
    { code: '23', name: 'Construction', values: { AZ: 4.4, CO: 2.9, TX: 5.2, FL: 4.8, CA: 2.1, NV: 6.3, UT: 5.8, GA: 3.7 } },
    { code: '31-33', name: 'Manufacturing', values: { AZ: 3.8, CO: 2.3, TX: 4.1, FL: 2.9, CA: 1.8, NV: 3.2, UT: 4.5, GA: 3.4 } },
    { code: '42', name: 'Wholesale Trade', values: { AZ: 4.1, CO: 2.6, TX: 3.8, FL: 3.5, CA: 2.2, NV: 4.7, UT: 4.2, GA: 3.1 } },
    { code: '44-45', name: 'Retail Trade', values: { AZ: 4.7, CO: 3.2, TX: 4.3, FL: 4.1, CA: 2.5, NV: 5.4, UT: 4.9, GA: 3.6 } },
    { code: '48-49', name: 'Transportation', values: { AZ: 5.9, CO: 4.4, TX: 6.2, FL: 5.1, CA: 3.3, NV: 7.1, UT: 6.5, GA: 4.8 } },
    { code: '54', name: 'Professional Services', values: { AZ: 4.7, CO: 3.2, TX: 4.5, FL: 4.0, CA: 2.8, NV: 5.1, UT: 5.3, GA: 3.9 } },
    { code: '62', name: 'Health Care', values: { AZ: 4.1, CO: 2.6, TX: 3.9, FL: 4.5, CA: 2.4, NV: 4.3, UT: 4.0, GA: 3.5 } },
    { code: '72', name: 'Accommodation', values: { AZ: 4.1, CO: 2.6, TX: 3.7, FL: 5.2, CA: 2.0, NV: 5.8, UT: 4.4, GA: 3.3 } },
  ],
};

function IndustryGrowthMatrix() {
  const [hoveredCell, setHoveredCell] = useState<{ industry: string; region: string; value: number } | null>(null);

  const getGrowthColor = (value: number): string => {
    if (value < 0) return '#EF4444'; // Red - Negative
    if (value < 2) return '#F97316'; // Orange - 0-2%
    if (value < 5) return '#F59E0B'; // Amber - 2-5%
    if (value < 8) return '#84CC16'; // Lime - 5-8%
    if (value < 12) return '#22C55E'; // Green - 8-12%
    return '#16A34A'; // Dark Green - 12%+
  };

  const getTextColor = (value: number): string => {
    // Use white text for darker backgrounds
    if (value < 0 || value >= 5) return 'white';
    return 'white';
  };

  // Find top performing combinations
  const allCombinations: { industry: string; region: string; value: number }[] = [];
  industryMatrixData.industries.forEach(ind => {
    industryMatrixData.regions.forEach(region => {
      allCombinations.push({
        industry: ind.name,
        region,
        value: ind.values[region as keyof typeof ind.values],
      });
    });
  });
  const topPerformers = [...allCombinations].sort((a, b) => b.value - a.value).slice(0, 3);

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-[var(--foreground)]">Which industries are growing fastest in each region?</h3>
          <DataSourceTag source="market-track" />
        </div>
        <p className="text-xs text-[var(--muted-foreground)]">NAICS industry codes vs geographic regions — color indicates CAGR %</p>
      </div>

      <div className="flex gap-6">
        {/* Matrix Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr>
                <th className="text-left text-sm font-medium text-[var(--muted-foreground)] pb-3 pr-4 sticky left-0 bg-[var(--card)]">Industry</th>
                {industryMatrixData.regions.map(region => (
                  <th key={region} className="text-center text-sm font-medium text-[var(--muted-foreground)] pb-3 px-1">
                    {region}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {industryMatrixData.industries.map((industry) => (
                <tr key={industry.code}>
                  <td className="py-2 pr-4 sticky left-0 bg-[var(--card)]">
                    <div className="text-sm font-medium text-[var(--foreground)]">{industry.code}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">{industry.name}</div>
                  </td>
                  {industryMatrixData.regions.map(region => {
                    const value = industry.values[region as keyof typeof industry.values];
                    return (
                      <td key={region} className="py-1.5 px-1">
                        <div
                          className="w-12 h-9 rounded flex items-center justify-center text-xs font-medium cursor-pointer transition-transform hover:scale-105"
                          style={{
                            backgroundColor: getGrowthColor(value),
                            color: getTextColor(value),
                          }}
                          onMouseEnter={() => setHoveredCell({ industry: industry.name, region, value })}
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          {value.toFixed(1)}%
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top Performing Combinations */}
        <div className="w-52 flex-shrink-0 border-l border-[var(--border)] pl-6">
          <div className="text-sm font-medium text-[var(--foreground)] mb-3">Top Performing Combinations</div>
          <div className="space-y-2">
            {topPerformers.map((item, idx) => (
              <div key={idx} className="text-xs">
                <span className="text-[var(--muted-foreground)]">{item.industry} in {item.region}:</span>
                <span className="ml-1 font-medium text-[var(--foreground)]">{item.value.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-[var(--border)]">
        <div className="text-xs font-medium text-[var(--muted-foreground)] mb-2">Growth Rate (CAGR %)</div>
        <div className="flex flex-wrap gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded" style={{ backgroundColor: '#EF4444' }}></span>
            Negative
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded" style={{ backgroundColor: '#F97316' }}></span>
            0-2%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded" style={{ backgroundColor: '#F59E0B' }}></span>
            2-5%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded" style={{ backgroundColor: '#84CC16' }}></span>
            5-8%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded" style={{ backgroundColor: '#22C55E' }}></span>
            8-12%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded" style={{ backgroundColor: '#16A34A' }}></span>
            12%+
          </span>
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredCell && (
        <div className="mt-2 text-xs text-[var(--muted-foreground)]">
          {hoveredCell.industry} in {hoveredCell.region}: <span className="font-medium text-[var(--foreground)]">{hoveredCell.value.toFixed(2)}% CAGR</span>
        </div>
      )}
    </div>
  );
}
