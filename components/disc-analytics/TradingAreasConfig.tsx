'use client';

import React, { useState, useRef, useEffect } from 'react';

type TradingArea = {
  id: string;
  name: string;
};

type LocationType = 'state' | 'county' | 'zipcode';

const sampleTradingAreas: TradingArea[] = [
  { id: '1', name: 'MSA Akron, OH' },
  { id: '2', name: 'MSA Albany-Schenectady-Troy, NY' },
  { id: '3', name: 'MSA Albuquerque, NM' },
  { id: '4', name: 'MSA Allentown-Bethlehem-Easton, PA' },
  { id: '5', name: 'MSA Amarillo, TX' },
  { id: '6', name: 'MSA Anaheim-Santa Ana-Irvine, CA' },
  { id: '7', name: 'MSA Anchorage, AK' },
  { id: '8', name: 'MSA Ann Arbor, MI' },
  { id: '9', name: 'MSA Appleton, WI' },
  { id: '10', name: 'MSA Asheville, NC' },
];

export default function TradingAreasConfig() {
  const [tradingAreas, setTradingAreas] = useState<TradingArea[]>(sampleTradingAreas);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<TradingArea | null>(null);
  const [showDefinitionModal, setShowDefinitionModal] = useState(false);

  const filteredAreas = tradingAreas.filter(area =>
    area.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateNew = () => {
    // Navigate to new trading area creation
    alert('Create new trading area functionality');
  };

  const handleDefineArea = (area: TradingArea) => {
    setSelectedArea(area);
    setShowDefinitionModal(true);
  };

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden p-6 bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Trading Areas List</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="px-4 py-2 bg-[var(--primary)] text-white rounded text-sm font-medium hover:opacity-90 transition-opacity"
        >
          New Trading Area
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search trading areas..."
          className="flex-1 px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded text-sm text-[var(--foreground)]"
        />
        <button className="px-4 py-2 bg-[var(--primary)] text-white rounded text-sm font-medium hover:opacity-90 transition-opacity">
          Search
        </button>
      </div>

      {/* Trading Areas List */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
        <div className="bg-[#3b5a7f] text-white px-4 py-3 font-semibold">
          Trading Area Name
        </div>
        <div className="divide-y divide-[var(--border)]">
          {filteredAreas.map((area, index) => (
            <div
              key={area.id}
              className={`px-4 py-3 hover:bg-[var(--muted)]/50 transition-colors cursor-pointer ${
                index % 2 === 0 ? 'bg-[var(--card)]' : 'bg-[#f5f5dc]/30'
              }`}
              onClick={() => handleDefineArea(area)}
            >
              <span className="text-[var(--primary)] hover:underline text-sm">
                {area.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Definition Modal */}
      {showDefinitionModal && selectedArea && (
        <TradingAreaDefinitionModal
          area={selectedArea}
          onClose={() => setShowDefinitionModal(false)}
        />
      )}
    </div>
  );
}

function TradingAreaDefinitionModal({ area, onClose }: { area: TradingArea; onClose: () => void }) {
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedCounties, setSelectedCounties] = useState<string[]>([]);
  const [selectedZipCodes, setSelectedZipCodes] = useState<string[]>([]);

  const [stateSearch, setStateSearch] = useState('');
  const [countySearch, setCountySearch] = useState('');
  const [zipSearch, setZipSearch] = useState('');

  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCountyDropdown, setShowCountyDropdown] = useState(false);
  const [showZipDropdown, setShowZipDropdown] = useState(false);

  const stateDropdownRef = useRef<HTMLDivElement>(null);
  const countyDropdownRef = useRef<HTMLDivElement>(null);
  const zipDropdownRef = useRef<HTMLDivElement>(null);

  const states = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa'];
  const counties = ['Adams County', 'Arapahoe County', 'Boulder County', 'Denver County', 'El Paso County', 'Jefferson County', 'Larimer County', 'Mesa County'];
  const zipCodes = ['12345', '23456', '34567', '45678', '56789', '67890', '78901', '89012', '90123', '01234'];

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (stateDropdownRef.current && !stateDropdownRef.current.contains(event.target as Node)) {
        setShowStateDropdown(false);
      }
      if (countyDropdownRef.current && !countyDropdownRef.current.contains(event.target as Node)) {
        setShowCountyDropdown(false);
      }
      if (zipDropdownRef.current && !zipDropdownRef.current.contains(event.target as Node)) {
        setShowZipDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredStates = states.filter(state =>
    state.toLowerCase().includes(stateSearch.toLowerCase())
  );

  const filteredCounties = counties.filter(county =>
    county.toLowerCase().includes(countySearch.toLowerCase())
  );

  const filteredZipCodes = zipCodes.filter(zip =>
    zip.includes(zipSearch)
  );

  const handleToggleState = (state: string) => {
    setSelectedStates(prev =>
      prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state]
    );
  };

  const handleToggleCounty = (county: string) => {
    setSelectedCounties(prev =>
      prev.includes(county) ? prev.filter(c => c !== county) : [...prev, county]
    );
  };

  const handleToggleZip = (zip: string) => {
    setSelectedZipCodes(prev =>
      prev.includes(zip) ? prev.filter(z => z !== zip) : [...prev, zip]
    );
  };

  const handleSave = () => {
    // Save the trading area definition
    alert(`Saved definition for ${area.name}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--background)] rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--foreground)]">Define Trading Area: {area.name}</h2>
          <button
            onClick={onClose}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* States Dropdown */}
            <div ref={stateDropdownRef}>
              <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">States</label>
              <div className="relative">
                <div
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded text-sm text-[var(--foreground)] cursor-pointer flex items-center justify-between"
                  onClick={() => setShowStateDropdown(!showStateDropdown)}
                >
                  <span className={selectedStates.length > 0 ? '' : 'text-[var(--muted-foreground)]'}>
                    {selectedStates.length > 0 ? `${selectedStates.length} selected` : 'Select states...'}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d={showStateDropdown ? "M3 7.5l3-3 3 3" : "M3 4.5l3 3 3-3"}/>
                  </svg>
                </div>
                {showStateDropdown && (
                  <div className="absolute z-20 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg">
                    <div className="p-2 border-b border-[var(--border)]">
                      <input
                        type="text"
                        value={stateSearch}
                        onChange={(e) => setStateSearch(e.target.value)}
                        placeholder="Search..."
                        className="w-full px-2 py-1 bg-[var(--background)] border border-[var(--border)] rounded text-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {filteredStates.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">No states found</div>
                      ) : (
                        filteredStates.map(state => (
                          <div
                            key={state}
                            onClick={() => handleToggleState(state)}
                            className={`px-3 py-2 cursor-pointer transition-colors hover:bg-[var(--muted)] flex items-center gap-2 ${
                              selectedStates.includes(state) ? 'bg-[#e6e6fa]' : ''
                            }`}
                          >
                            <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                              selectedStates.includes(state)
                                ? 'bg-[var(--primary)] border-[var(--primary)]'
                                : 'border-[var(--border)]'
                            }`}>
                              {selectedStates.includes(state) && (
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2">
                                  <path d="M2 5l2 2 4-4" />
                                </svg>
                              )}
                            </div>
                            <span className="text-sm">{state}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              {selectedStates.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedStates.map(state => (
                    <span
                      key={state}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded text-xs"
                    >
                      {state}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleState(state);
                        }}
                        className="hover:text-red-500 text-base leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Counties Dropdown */}
            <div ref={countyDropdownRef}>
              <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">Counties</label>
              <div className="relative">
                <div
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded text-sm text-[var(--foreground)] cursor-pointer flex items-center justify-between"
                  onClick={() => setShowCountyDropdown(!showCountyDropdown)}
                >
                  <span className={selectedCounties.length > 0 ? '' : 'text-[var(--muted-foreground)]'}>
                    {selectedCounties.length > 0 ? `${selectedCounties.length} selected` : 'Select counties...'}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d={showCountyDropdown ? "M3 7.5l3-3 3 3" : "M3 4.5l3 3 3-3"}/>
                  </svg>
                </div>
                {showCountyDropdown && (
                  <div className="absolute z-20 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg">
                    <div className="p-2 border-b border-[var(--border)]">
                      <input
                        type="text"
                        value={countySearch}
                        onChange={(e) => setCountySearch(e.target.value)}
                        placeholder="Search..."
                        className="w-full px-2 py-1 bg-[var(--background)] border border-[var(--border)] rounded text-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {filteredCounties.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">No counties found</div>
                      ) : (
                        filteredCounties.map(county => (
                          <div
                            key={county}
                            onClick={() => handleToggleCounty(county)}
                            className={`px-3 py-2 cursor-pointer transition-colors hover:bg-[var(--muted)] flex items-center gap-2 ${
                              selectedCounties.includes(county) ? 'bg-[#e6e6fa]' : ''
                            }`}
                          >
                            <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                              selectedCounties.includes(county)
                                ? 'bg-[var(--primary)] border-[var(--primary)]'
                                : 'border-[var(--border)]'
                            }`}>
                              {selectedCounties.includes(county) && (
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2">
                                  <path d="M2 5l2 2 4-4" />
                                </svg>
                              )}
                            </div>
                            <span className="text-sm">{county}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              {selectedCounties.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedCounties.map(county => (
                    <span
                      key={county}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded text-xs"
                    >
                      {county}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleCounty(county);
                        }}
                        className="hover:text-red-500 text-base leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Zip Codes Dropdown */}
            <div ref={zipDropdownRef}>
              <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">Zip Codes</label>
              <div className="relative">
                <div
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded text-sm text-[var(--foreground)] cursor-pointer flex items-center justify-between"
                  onClick={() => setShowZipDropdown(!showZipDropdown)}
                >
                  <span className={selectedZipCodes.length > 0 ? '' : 'text-[var(--muted-foreground)]'}>
                    {selectedZipCodes.length > 0 ? `${selectedZipCodes.length} selected` : 'Select zip codes...'}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d={showZipDropdown ? "M3 7.5l3-3 3 3" : "M3 4.5l3 3 3-3"}/>
                  </svg>
                </div>
                {showZipDropdown && (
                  <div className="absolute z-20 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg">
                    <div className="p-2 border-b border-[var(--border)]">
                      <input
                        type="text"
                        value={zipSearch}
                        onChange={(e) => setZipSearch(e.target.value)}
                        placeholder="Search..."
                        className="w-full px-2 py-1 bg-[var(--background)] border border-[var(--border)] rounded text-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {filteredZipCodes.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">No zip codes found</div>
                      ) : (
                        filteredZipCodes.map(zip => (
                          <div
                            key={zip}
                            onClick={() => handleToggleZip(zip)}
                            className={`px-3 py-2 cursor-pointer transition-colors hover:bg-[var(--muted)] flex items-center gap-2 ${
                              selectedZipCodes.includes(zip) ? 'bg-[#e6e6fa]' : ''
                            }`}
                          >
                            <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                              selectedZipCodes.includes(zip)
                                ? 'bg-[var(--primary)] border-[var(--primary)]'
                                : 'border-[var(--border)]'
                            }`}>
                              {selectedZipCodes.includes(zip) && (
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2">
                                  <path d="M2 5l2 2 4-4" />
                                </svg>
                              )}
                            </div>
                            <span className="text-sm">{zip}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              {selectedZipCodes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedZipCodes.map(zip => (
                    <span
                      key={zip}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded text-xs"
                    >
                      {zip}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleZip(zip);
                        }}
                        className="hover:text-red-500 text-base leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded text-sm font-medium hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Save Definition
          </button>
        </div>
      </div>
    </div>
  );
}
