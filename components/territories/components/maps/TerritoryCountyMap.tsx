'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { countyGeoUrl, stateFipsMap, stateCoordinates, getStateName } from './mapConstants';
import { useLassoSelection, elementIntersectsSelection } from './useLassoSelection';

interface TerritoryCountyMapProps {
  stateCode: string;
  selectedCountyCodes: string[]; // FIPS codes
  onCountyToggle: (countyFips: string) => void;
  onMultiSelect: (countyFipsCodes: string[]) => void;
  onBack: () => void;
}

export function TerritoryCountyMap({
  stateCode,
  selectedCountyCodes,
  onCountyToggle,
  onMultiSelect,
  onBack,
}: TerritoryCountyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [hoveredCounty, setHoveredCounty] = useState<{ fips: string; name: string } | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<'select' | 'pan'>('select');

  // Get state-specific zoom config
  const stateFips = stateFipsMap[stateCode];
  const stateConfig = stateCoordinates[stateCode] || { center: [-98, 39], zoom: 4 };

  const [zoom, setZoom] = useState(stateConfig.zoom);
  const [center, setCenter] = useState<[number, number]>(stateConfig.center);

  // Reset view when state changes
  useEffect(() => {
    setCenter(stateConfig.center);
    setZoom(stateConfig.zoom);
  }, [stateCode, stateConfig.center, stateConfig.zoom]);

  // Track county elements for lasso selection
  const [countyElements, setCountyElements] = useState<
    Map<string, { fips: string; name: string; element: Element }>
  >(new Map());

  // Handle lasso selection completion
  const handleSelectionComplete = useCallback(
    (selectionRect: { left: number; right: number; top: number; bottom: number }) => {
      const selectedFips: string[] = [];
      countyElements.forEach((county) => {
        if (elementIntersectsSelection(county.element, selectionRect)) {
          selectedFips.push(county.fips);
        }
      });
      if (selectedFips.length > 0) {
        onMultiSelect(selectedFips);
      }
    },
    [countyElements, onMultiSelect]
  );

  const { isDragging, selectionRect, handlers } = useLassoSelection({
    enabled: mode === 'select',
    onSelectionComplete: handleSelectionComplete,
  });

  const handleCountyClick = useCallback(
    (countyFips: string) => {
      if (mode === 'select' && !isDragging) {
        onCountyToggle(countyFips);
      }
    },
    [mode, isDragging, onCountyToggle]
  );

  if (!stateFips) {
    return (
      <div className="text-center py-8 text-[var(--muted-foreground)]">
        <p>County data not available for {getStateName(stateCode)}.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)]"
        >
          Back to US Map
        </button>
      </div>
    );
  }

  return (
    <div ref={mapContainerRef} className="relative select-none" {...handlers}>
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to US Map
        </button>
        <div className="text-sm font-medium text-[var(--foreground)]">
          {getStateName(stateCode)} Counties
        </div>
      </div>

      {/* Mode toggle and zoom controls */}
      <div className="absolute top-14 right-2 z-10 flex flex-col gap-1">
        {/* Mode toggle */}
        <div className="flex bg-white border border-[var(--border)] rounded shadow-sm overflow-hidden mb-1">
          <button
            onClick={() => setMode('select')}
            className={`w-8 h-8 flex items-center justify-center transition-colors ${
              mode === 'select' ? 'bg-[var(--primary)] text-white' : 'hover:bg-[var(--muted)]'
            }`}
            title="Select mode - click or drag to select counties"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 3l14 9-8 4-2 7-4-20z" />
            </svg>
          </button>
          <button
            onClick={() => setMode('pan')}
            className={`w-8 h-8 flex items-center justify-center transition-colors ${
              mode === 'pan' ? 'bg-[var(--primary)] text-white' : 'hover:bg-[var(--muted)]'
            }`}
            title="Pan mode - drag to move the map"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20" />
            </svg>
          </button>
        </div>
        <button
          onClick={() => setZoom((z) => Math.min(z * 1.5, 20))}
          className="w-8 h-8 bg-white border border-[var(--border)] rounded shadow-sm flex items-center justify-center hover:bg-[var(--muted)] transition-colors"
          title="Zoom in"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z / 1.5, 1))}
          className="w-8 h-8 bg-white border border-[var(--border)] rounded shadow-sm flex items-center justify-center hover:bg-[var(--muted)] transition-colors"
          title="Zoom out"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button
          onClick={() => {
            setZoom(stateConfig.zoom);
            setCenter(stateConfig.center);
          }}
          className="w-8 h-8 bg-white border border-[var(--border)] rounded shadow-sm flex items-center justify-center hover:bg-[var(--muted)] transition-colors"
          title="Reset view"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </div>

      {/* Map */}
      <div
        className={`border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--muted)]/20 ${
          mode === 'select' ? 'cursor-crosshair' : 'cursor-grab'
        }`}
        style={{ height: '400px' }}
      >
        <ComposableMap projection="geoAlbersUsa" style={{ width: '100%', height: '100%' }}>
          <ZoomableGroup
            zoom={zoom}
            center={center}
            onMoveEnd={({ coordinates, zoom: newZoom }) => {
              if (mode === 'pan') {
                setCenter(coordinates as [number, number]);
                setZoom(newZoom);
              }
            }}
          >
            <Geographies geography={countyGeoUrl}>
              {({ geographies }) => {
                // Filter to only show counties for this state
                const stateCounties = geographies.filter((geo) => {
                  const fips = String(geo.id).padStart(5, '0');
                  return fips.startsWith(stateFips);
                });

                return stateCounties.map((geo) => {
                  const fips = String(geo.id).padStart(5, '0');
                  const countyName = geo.properties.name || 'Unknown';
                  const isSelected = selectedCountyCodes.includes(fips);
                  const isHovered = hoveredCounty?.fips === fips;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={isSelected ? 'var(--primary)' : '#e5e7eb'}
                      stroke={isHovered ? '#1f2937' : '#9ca3af'}
                      strokeWidth={isHovered ? 1.5 : 0.5}
                      style={{
                        default: {
                          outline: 'none',
                          opacity: isSelected ? 0.8 : 0.6,
                          transition: 'all 150ms',
                          cursor: mode === 'select' ? 'pointer' : 'grab',
                        },
                        hover: {
                          outline: 'none',
                          opacity: 1,
                          fill: isSelected ? 'var(--primary)' : '#d1d5db',
                        },
                        pressed: {
                          outline: 'none',
                        },
                      }}
                      onClick={() => handleCountyClick(fips)}
                      onMouseEnter={(e) => {
                        setHoveredCounty({ fips, name: countyName });
                        const rect = (e.target as Element).getBoundingClientRect();
                        const containerRect = mapContainerRef.current?.getBoundingClientRect();
                        if (containerRect) {
                          setTooltipPos({
                            x: rect.left - containerRect.left + rect.width / 2,
                            y: rect.top - containerRect.top - 10,
                          });
                        }
                        // Store element reference for lasso selection
                        setCountyElements((prev) => {
                          const newMap = new Map(prev);
                          newMap.set(fips, { fips, name: countyName, element: e.target as Element });
                          return newMap;
                        });
                      }}
                      onMouseLeave={() => setHoveredCounty(null)}
                    />
                  );
                });
              }}
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Tooltip */}
      {hoveredCounty && (
        <div
          className="absolute bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg px-3 py-2 pointer-events-none z-20 text-sm"
          style={{
            left: Math.max(10, Math.min(tooltipPos.x - 50, 300)),
            top: Math.max(50, tooltipPos.y - 45),
            transform: 'translateX(-50%)',
          }}
        >
          <div>
            <span className="font-medium">{hoveredCounty.name}</span>
            <span className="text-[var(--muted-foreground)] ml-1">County</span>
          </div>
          {selectedCountyCodes.includes(hoveredCounty.fips) ? (
            <div className="text-xs text-[var(--primary)] mt-0.5">Selected - click to remove</div>
          ) : (
            <div className="text-xs text-[var(--muted-foreground)] mt-0.5">Click to select</div>
          )}
        </div>
      )}

      {/* Selection rectangle overlay */}
      {selectionRect && selectionRect.width > 5 && selectionRect.height > 5 && (
        <div
          className="fixed border-2 border-[var(--primary)] bg-[var(--primary)]/10 pointer-events-none z-50"
          style={{
            left: selectionRect.left,
            top: selectionRect.top,
            width: selectionRect.width,
            height: selectionRect.height,
          }}
        />
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs text-[var(--muted-foreground)]">
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: 'var(--primary)', opacity: 0.8 }}
          />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-gray-200" />
          <span>Available</span>
        </div>
        <span className="ml-auto">
          {mode === 'select'
            ? 'Click county to select, drag to select multiple'
            : 'Drag to pan, use +/- to zoom'}
        </span>
      </div>
    </div>
  );
}
