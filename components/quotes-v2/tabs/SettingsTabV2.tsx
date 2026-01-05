'use client';

import React from 'react';
import type { QuoteSettingsV2, PriceLevelV2 } from '../types';

interface SettingsTabV2Props {
  settings: QuoteSettingsV2;
  onSettingsChange: (settings: QuoteSettingsV2) => void;
}

export function SettingsTabV2({ settings, onSettingsChange }: SettingsTabV2Props) {
  const handleToggle = (key: keyof QuoteSettingsV2) => {
    if (typeof settings[key] === 'boolean') {
      onSettingsChange({ ...settings, [key]: !settings[key] });
    }
  };

  const handlePriceLevelChange = (index: number, updates: Partial<PriceLevelV2>) => {
    const newLevels = [...settings.priceLevels];
    newLevels[index] = { ...newLevels[index], ...updates };
    onSettingsChange({ ...settings, priceLevels: newLevels });
  };

  const addPriceLevel = () => {
    const newLevel: PriceLevelV2 = {
      id: `l${settings.priceLevels.length + 1}`,
      name: `L${settings.priceLevels.length + 1}`,
      percent: 0,
      description: '',
    };
    onSettingsChange({ ...settings, priceLevels: [...settings.priceLevels, newLevel] });
  };

  const removePriceLevel = (index: number) => {
    const newLevels = settings.priceLevels.filter((_, i) => i !== index);
    onSettingsChange({ ...settings, priceLevels: newLevels });
  };

  return (
    <div className="h-full overflow-auto">
      <div className="px-6 py-4 pb-32">
        {/* Toggle Settings */}
        <div className="space-y-4 mb-8">
          {/* Specify End User Per Line */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleToggle('specifyEndUserPerLine')}
                className={`w-10 h-6 rounded-full transition-colors relative ${
                  settings.specifyEndUserPerLine ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                    settings.specifyEndUserPerLine ? 'left-5' : 'left-1'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-900">Specify end user per line item</span>
            </div>
          </div>

          {/* Outside Rep at Line Level */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleToggle('outsideRepAtLineLevel')}
                className={`w-10 h-6 rounded-full transition-colors relative ${
                  settings.outsideRepAtLineLevel ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                    settings.outsideRepAtLineLevel ? 'left-5' : 'left-1'
                  }`}
                />
              </button>
              <div>
                <span className="text-sm text-gray-900">Outside rep at line item level</span>
                <p className="text-xs text-gray-500">Set outside rep in header</p>
              </div>
            </div>
          </div>

          {/* Inside Rep at Line Level */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleToggle('insideRepAtLineLevel')}
                className={`w-10 h-6 rounded-full transition-colors relative ${
                  settings.insideRepAtLineLevel ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                    settings.insideRepAtLineLevel ? 'left-5' : 'left-1'
                  }`}
                />
              </button>
              <div>
                <span className="text-sm text-gray-900">Inside rep at line item level</span>
                <p className="text-xs text-gray-500">Set inside rep in header</p>
              </div>
            </div>
          </div>

          {/* Factory/Manufacturer Per Line Item */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleToggle('factoryPerLineItem')}
                className={`w-10 h-6 rounded-full transition-colors relative ${
                  settings.factoryPerLineItem ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                    settings.factoryPerLineItem ? 'left-5' : 'left-1'
                  }`}
                />
              </button>
              <div>
                <span className="text-sm text-gray-900">Manufacturer per line item</span>
                <p className="text-xs text-gray-500">{settings.factoryPerLineItem ? 'Set manufacturer on each line item' : 'Set manufacturer in header for all lines'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Part Number Source */}
        <div className="mb-8">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Customer Part Number Source</h4>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="cpnSource"
                checked={settings.customerPartNumberSource === 'sold_to'}
                onChange={() => onSettingsChange({ ...settings, customerPartNumberSource: 'sold_to' })}
                className="accent-indigo-600"
              />
              <span className="text-sm text-gray-700">Sold To Customer</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="cpnSource"
                checked={settings.customerPartNumberSource === 'end_user'}
                onChange={() => onSettingsChange({ ...settings, customerPartNumberSource: 'end_user' })}
                className="accent-indigo-600"
              />
              <span className="text-sm text-gray-700">End User</span>
            </label>
          </div>
        </div>

        {/* Price Levels - Coming Soon */}
        <div className="opacity-50 pointer-events-none">
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-sm font-medium text-gray-900">Price Levels</h4>
            <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded uppercase">Coming Soon</span>
          </div>
          <div className="space-y-3">
            {settings.priceLevels.map((level, index) => (
              <div key={level.id} className="flex items-center gap-3">
                <span className="w-8 text-sm font-medium text-gray-400">{level.name}</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={level.percent}
                    disabled
                    className="w-16 px-2 py-1.5 text-sm text-center border border-gray-200 rounded-md bg-gray-100 text-gray-400"
                  />
                  <span className="text-sm text-gray-400">%</span>
                </div>
                <input
                  type="text"
                  value={level.description}
                  disabled
                  placeholder="Description"
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-md bg-gray-100 text-gray-400"
                />
                <button
                  disabled
                  className="p-1.5 text-gray-300 rounded cursor-not-allowed"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <button
            disabled
            className="mt-4 flex items-center gap-2 text-sm text-gray-400 cursor-not-allowed"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 5v10M5 10h10" strokeLinecap="round" />
            </svg>
            Add price level
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsTabV2;
