'use client';

import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

type StateData = {
  name: string;
  abbr: string;
  cagr: number;
  marketSize: number;
  counties: number;
};

const stateDataMap: Record<string, StateData> = {
  'AL': { name: 'Alabama', abbr: 'AL', cagr: 1.2, marketSize: 89, counties: 12 },
  'AK': { name: 'Alaska', abbr: 'AK', cagr: 0.8, marketSize: 15, counties: 3 },
  'AZ': { name: 'Arizona', abbr: 'AZ', cagr: 4.4, marketSize: 34, counties: 5 },
  'AR': { name: 'Arkansas', abbr: 'AR', cagr: 1.5, marketSize: 45, counties: 8 },
  'CA': { name: 'California', abbr: 'CA', cagr: 3.2, marketSize: 892, counties: 58 },
  'CO': { name: 'Colorado', abbr: 'CO', cagr: 2.9, marketSize: 276, counties: 3 },
  'CT': { name: 'Connecticut', abbr: 'CT', cagr: 1.1, marketSize: 67, counties: 4 },
  'DE': { name: 'Delaware', abbr: 'DE', cagr: 1.8, marketSize: 23, counties: 2 },
  'FL': { name: 'Florida', abbr: 'FL', cagr: 3.8, marketSize: 456, counties: 42 },
  'GA': { name: 'Georgia', abbr: 'GA', cagr: 2.7, marketSize: 189, counties: 28 },
  'HI': { name: 'Hawaii', abbr: 'HI', cagr: 1.4, marketSize: 32, counties: 4 },
  'ID': { name: 'Idaho', abbr: 'ID', cagr: 5.2, marketSize: 28, counties: 6 },
  'IL': { name: 'Illinois', abbr: 'IL', cagr: 0.9, marketSize: 234, counties: 32 },
  'IN': { name: 'Indiana', abbr: 'IN', cagr: 1.6, marketSize: 112, counties: 18 },
  'IA': { name: 'Iowa', abbr: 'IA', cagr: 1.3, marketSize: 56, counties: 14 },
  'KS': { name: 'Kansas', abbr: 'KS', cagr: 1.4, marketSize: 48, counties: 12 },
  'KY': { name: 'Kentucky', abbr: 'KY', cagr: 1.7, marketSize: 78, counties: 16 },
  'LA': { name: 'Louisiana', abbr: 'LA', cagr: 0.6, marketSize: 82, counties: 14 },
  'ME': { name: 'Maine', abbr: 'ME', cagr: 1.9, marketSize: 24, counties: 5 },
  'MD': { name: 'Maryland', abbr: 'MD', cagr: 2.1, marketSize: 98, counties: 8 },
  'MA': { name: 'Massachusetts', abbr: 'MA', cagr: 2.4, marketSize: 145, counties: 10 },
  'MI': { name: 'Michigan', abbr: 'MI', cagr: 1.2, marketSize: 167, counties: 24 },
  'MN': { name: 'Minnesota', abbr: 'MN', cagr: 2.0, marketSize: 98, counties: 16 },
  'MS': { name: 'Mississippi', abbr: 'MS', cagr: 0.4, marketSize: 42, counties: 10 },
  'MO': { name: 'Missouri', abbr: 'MO', cagr: 1.5, marketSize: 102, counties: 18 },
  'MT': { name: 'Montana', abbr: 'MT', cagr: 3.1, marketSize: 18, counties: 4 },
  'NE': { name: 'Nebraska', abbr: 'NE', cagr: 1.8, marketSize: 34, counties: 8 },
  'NV': { name: 'Nevada', abbr: 'NV', cagr: 4.8, marketSize: 56, counties: 4 },
  'NH': { name: 'New Hampshire', abbr: 'NH', cagr: 2.2, marketSize: 28, counties: 4 },
  'NJ': { name: 'New Jersey', abbr: 'NJ', cagr: 1.6, marketSize: 178, counties: 14 },
  'NM': { name: 'New Mexico', abbr: 'NM', cagr: 2.5, marketSize: 32, counties: 6 },
  'NY': { name: 'New York', abbr: 'NY', cagr: 1.4, marketSize: 398, counties: 38 },
  'NC': { name: 'North Carolina', abbr: 'NC', cagr: 3.4, marketSize: 198, counties: 32 },
  'ND': { name: 'North Dakota', abbr: 'ND', cagr: 2.8, marketSize: 14, counties: 4 },
  'OH': { name: 'Ohio', abbr: 'OH', cagr: 1.1, marketSize: 212, counties: 28 },
  'OK': { name: 'Oklahoma', abbr: 'OK', cagr: 1.9, marketSize: 68, counties: 12 },
  'OR': { name: 'Oregon', abbr: 'OR', cagr: 2.6, marketSize: 78, counties: 10 },
  'PA': { name: 'Pennsylvania', abbr: 'PA', cagr: 1.0, marketSize: 245, counties: 34 },
  'RI': { name: 'Rhode Island', abbr: 'RI', cagr: 1.3, marketSize: 18, counties: 2 },
  'SC': { name: 'South Carolina', abbr: 'SC', cagr: 3.6, marketSize: 92, counties: 14 },
  'SD': { name: 'South Dakota', abbr: 'SD', cagr: 2.4, marketSize: 16, counties: 4 },
  'TN': { name: 'Tennessee', abbr: 'TN', cagr: 2.8, marketSize: 134, counties: 22 },
  'TX': { name: 'Texas', abbr: 'TX', cagr: 3.9, marketSize: 678, counties: 86 },
  'UT': { name: 'Utah', abbr: 'UT', cagr: 5.8, marketSize: 58, counties: 8 },
  'VT': { name: 'Vermont', abbr: 'VT', cagr: 1.6, marketSize: 12, counties: 3 },
  'VA': { name: 'Virginia', abbr: 'VA', cagr: 2.3, marketSize: 156, counties: 24 },
  'WA': { name: 'Washington', abbr: 'WA', cagr: 3.0, marketSize: 148, counties: 16 },
  'WV': { name: 'West Virginia', abbr: 'WV', cagr: -0.2, marketSize: 28, counties: 8 },
  'WI': { name: 'Wisconsin', abbr: 'WI', cagr: 1.4, marketSize: 98, counties: 18 },
  'WY': { name: 'Wyoming', abbr: 'WY', cagr: 2.1, marketSize: 10, counties: 3 },
  'DC': { name: 'District of Columbia', abbr: 'DC', cagr: 1.8, marketSize: 24, counties: 1 },
  'PR': { name: 'Puerto Rico', abbr: 'PR', cagr: 0.5, marketSize: 20, counties: 2 },
};

const getCAGRColor = (cagr: number): string => {
  if (cagr < 0) return '#EF4444';
  if (cagr < 2) return '#F97316';
  if (cagr < 5) return '#EAB308';
  if (cagr < 10) return '#22C55E';
  return '#16A34A';
};

const getBorderWidth = (marketSize: number): number => {
  if (marketSize < 50) return 0.5;
  if (marketSize < 150) return 1;
  if (marketSize < 300) return 1.5;
  return 2;
};

// US States TopoJSON URL
const geoUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

// FIPS code to state abbreviation mapping
const fipsToAbbr: Record<string, string> = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA',
  '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL',
  '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN',
  '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME',
  '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS',
  '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
  '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND',
  '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI',
  '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT',
  '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI',
  '56': 'WY', '72': 'PR',
};

export default function USMapHeatmap() {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [tooltipContent, setTooltipContent] = useState<StateData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const topGrowthStates = Object.entries(stateDataMap)
    .filter(([abbr]) => abbr !== 'PR' && abbr !== 'DC')
    .sort((a, b) => b[1].cagr - a[1].cagr)
    .slice(0, 5);

  const largestMarkets = Object.entries(stateDataMap)
    .filter(([abbr]) => abbr !== 'PR' && abbr !== 'DC')
    .sort((a, b) => b[1].marketSize - a[1].marketSize)
    .slice(0, 5);

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 mb-6">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Where are the fastest-growing geographic markets?</h2>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
            </svg>
            Market Track
          </span>
        </div>
        <p className="text-sm text-[var(--muted-foreground)]">Color = CAGR % | Border thickness = Market size ($M)</p>
      </div>

      <div className="relative map-container">
        <ComposableMap
          projection="geoAlbersUsa"
          projectionConfig={{
            scale: 1000,
          }}
          style={{ width: '100%', height: 'auto', maxHeight: '400px' }}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const fips = geo.id;
                const abbr = fipsToAbbr[fips];
                const stateData = abbr ? stateDataMap[abbr] : null;

                if (!stateData) return null;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getCAGRColor(stateData.cagr)}
                    stroke={hoveredState === abbr ? '#1f2937' : '#6b7280'}
                    strokeWidth={hoveredState === abbr ? 2 : getBorderWidth(stateData.marketSize)}
                    style={{
                      default: {
                        outline: 'none',
                        opacity: hoveredState && hoveredState !== abbr ? 0.6 : 1,
                        transition: 'all 150ms',
                      },
                      hover: {
                        outline: 'none',
                        opacity: 1,
                        cursor: 'pointer',
                      },
                      pressed: {
                        outline: 'none',
                      },
                    }}
                    onMouseEnter={(e) => {
                      setHoveredState(abbr);
                      setTooltipContent(stateData);
                      const rect = (e.target as Element).getBoundingClientRect();
                      const parentRect = (e.target as Element).closest('.map-container')?.getBoundingClientRect();
                      if (parentRect) {
                        setTooltipPos({
                          x: rect.left - parentRect.left + rect.width / 2,
                          y: rect.top - parentRect.top,
                        });
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredState(null);
                      setTooltipContent(null);
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>

        {/* Tooltip */}
        {tooltipContent && (
          <div
            className="absolute bg-[var(--card)] dark:bg-gray-800 border border-[var(--border)] rounded-lg shadow-lg p-3 pointer-events-none z-20"
            style={{
              left: Math.min(Math.max(tooltipPos.x - 75, 10), 250),
              top: Math.max(tooltipPos.y - 90, 10),
            }}
          >
            <div className="font-semibold text-[var(--foreground)]">{tooltipContent.name}</div>
            <div className="text-sm text-[var(--muted-foreground)] mt-1 space-y-0.5">
              <div>CAGR: <span className="font-medium text-[var(--foreground)]">{tooltipContent.cagr.toFixed(1)}%</span></div>
              <div>Market Size: <span className="font-medium text-[var(--foreground)]">${tooltipContent.marketSize}M</span></div>
              <div>Counties: <span className="font-medium text-[var(--foreground)]">{tooltipContent.counties}</span></div>
            </div>
          </div>
        )}

        {/* CAGR Legend */}
        <div className="absolute left-4 bottom-4 bg-[var(--card)] dark:bg-gray-800 border border-[var(--border)] rounded-lg p-3 shadow-sm">
          <div className="text-sm font-semibold text-[var(--foreground)] mb-2">CAGR %</div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#EF4444' }}></div>
              <span className="text-xs text-[var(--muted-foreground)]">Negative</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F97316' }}></div>
              <span className="text-xs text-[var(--muted-foreground)]">0-2%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#EAB308' }}></div>
              <span className="text-xs text-[var(--muted-foreground)]">2-5%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#22C55E' }}></div>
              <span className="text-xs text-[var(--muted-foreground)]">5-10%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#16A34A' }}></div>
              <span className="text-xs text-[var(--muted-foreground)]">10%+</span>
            </div>
          </div>
        </div>

        {/* Market Size Legend */}
        <div className="absolute right-4 bottom-4 bg-[var(--card)] dark:bg-gray-800 border border-[var(--border)] rounded-lg p-3 shadow-sm">
          <div className="text-sm font-semibold text-[var(--foreground)] mb-2">Market Size</div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-3 border border-gray-400 rounded-sm" style={{ borderWidth: '1px' }}></div>
              <span className="text-xs text-[var(--muted-foreground)]">Small (&lt;$50M)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-3 border border-gray-400 rounded-sm" style={{ borderWidth: '2.5px' }}></div>
              <span className="text-xs text-[var(--muted-foreground)]">Large (&gt;$300M)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-2 gap-8 mt-6 pt-4 border-t border-[var(--border)]">
        <div>
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">Top Growth States</h3>
          <div className="space-y-1">
            {topGrowthStates.map(([abbr, data]) => (
              <div key={abbr} className="flex items-center justify-between text-sm">
                <span className="text-[var(--foreground)]">{data.name}</span>
                <span className="text-green-600 dark:text-green-400 font-medium">{data.cagr.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">Largest Markets</h3>
          <div className="space-y-1">
            {largestMarkets.map(([abbr, data]) => (
              <div key={abbr} className="flex items-center justify-between text-sm">
                <span className="text-[var(--foreground)]">{data.name}</span>
                <span className="text-[var(--muted-foreground)]">${data.marketSize}M</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
