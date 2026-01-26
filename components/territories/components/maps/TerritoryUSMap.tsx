'use client';

import React, { useState, useCallback, useRef } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { stateGeoUrl, fipsToStateAbbr, US_STATES, getStateName } from './mapConstants';
import { useLassoSelection, elementIntersectsSelection } from './useLassoSelection';

interface TerritoryUSMapProps {
  selectedStateCodes: string[];
  onStateToggle: (stateCode: string) => void;
  onMultiSelect: (stateCodes: string[]) => void;
  onDrillDown?: (stateCode: string) => void;
}

export function TerritoryUSMap({
  selectedStateCodes,
  onStateToggle,
  onMultiSelect,
  onDrillDown,
}: TerritoryUSMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([-96, 38]);
  const [mode, setMode] = useState<'select' | 'pan'>('select');

  // Track state elements for lasso selection
  const [stateElements, setStateElements] = useState<Map<string, { code: string; element: Element }>>(
    new Map()
  );

  // Handle lasso selection completion
  const handleSelectionComplete = useCallback(
    (selectionRect: { left: number; right: number; top: number; bottom: number }) => {
      const selectedCodes: string[] = [];
      stateElements.forEach((state) => {
        if (elementIntersectsSelection(state.element, selectionRect)) {
          selectedCodes.push(state.code);
        }
      });
      if (selectedCodes.length > 0) {
        onMultiSelect(selectedCodes);
      }
    },
    [stateElements, onMultiSelect]
  );

  const { isDragging, selectionRect, handlers } = useLassoSelection({
    enabled: mode === 'select',
    onSelectionComplete: handleSelectionComplete,
  });

  const handleStateClick = useCallback(
    (stateCode: string) => {
      if (mode === 'select' && !isDragging) {
        onStateToggle(stateCode);
      }
    },
    [mode, isDragging, onStateToggle]
  );

  const handleStateDoubleClick = useCallback(
    (e: React.MouseEvent, stateCode: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (onDrillDown) {
        onDrillDown(stateCode);
      }
    },
    [onDrillDown]
  );

  return (
    <div
      ref={mapContainerRef}
      className="relative select-none"
      {...handlers}
    >
      {/* Mode toggle and zoom controls */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
        {/* Mode toggle */}
        <div className="flex bg-white border border-[var(--border)] rounded shadow-sm overflow-hidden mb-1">
          <button
            onClick={() => setMode('select')}
            className={`w-8 h-8 flex items-center justify-center transition-colors ${
              mode === 'select' ? 'bg-[var(--primary)] text-white' : 'hover:bg-[var(--muted)]'
            }`}
            title="Select mode - click or drag to select states"
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
          onClick={() => setZoom((z) => Math.min(z * 1.5, 8))}
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
            setZoom(1);
            setCenter([-96, 38]);
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
        style={{ height: '450px' }}
      >
        <ComposableMap
          projection="geoAlbersUsa"
          projectionConfig={{ scale: 1000 }}
          style={{ width: '100%', height: '100%' }}
        >
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
            <Geographies geography={stateGeoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const fips = String(geo.id).padStart(2, '0');
                  const stateCode = fipsToStateAbbr[fips];
                  if (!stateCode) return null;

                  const isSelected = selectedStateCodes.includes(stateCode);
                  const isHovered = hoveredState === stateCode;

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
                      onClick={() => handleStateClick(stateCode)}
                      onDoubleClick={(e) => handleStateDoubleClick(e, stateCode)}
                      onMouseEnter={(e) => {
                        setHoveredState(stateCode);
                        const rect = (e.target as Element).getBoundingClientRect();
                        const containerRect = mapContainerRef.current?.getBoundingClientRect();
                        if (containerRect) {
                          setTooltipPos({
                            x: rect.left - containerRect.left + rect.width / 2,
                            y: rect.top - containerRect.top - 10,
                          });
                        }
                        // Store element reference for lasso selection
                        setStateElements((prev) => {
                          const newMap = new Map(prev);
                          newMap.set(fips, { code: stateCode, element: e.target as Element });
                          return newMap;
                        });
                      }}
                      onMouseLeave={() => setHoveredState(null)}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Tooltip */}
      {hoveredState && (
        <div
          className="absolute bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg px-3 py-2 pointer-events-none z-20 text-sm"
          style={{
            left: Math.max(10, Math.min(tooltipPos.x - 50, 300)),
            top: Math.max(10, tooltipPos.y - 45),
            transform: 'translateX(-50%)',
          }}
        >
          <div>
            <span className="font-medium">{getStateName(hoveredState)}</span>
            <span className="text-[var(--muted-foreground)] ml-1">({hoveredState})</span>
          </div>
          {selectedStateCodes.includes(hoveredState) ? (
            <div className="text-xs text-[var(--primary)] mt-0.5">Selected - click to remove</div>
          ) : (
            <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Click to select{onDrillDown ? ', double-click for counties' : ''}
            </div>
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
            ? 'Click state to select, drag to select multiple'
            : 'Drag to pan, use +/- to zoom'}
        </span>
      </div>
    </div>
  );
}
