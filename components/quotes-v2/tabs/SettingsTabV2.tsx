'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { QuoteSettingsV2, PriceLevelV2 } from '../types';
import { useQuoteSettings } from '@/contexts/UserSettingsContext';
import type { OutsideRepSource, QuoteSettingsValue } from '@/components/lib/graphql/settings';
import { showSuccessToast, showErrorToast } from '@/components/lib/toast';
import { defaultColumnConfigV2 } from '../data/mockData';

interface SettingsTabV2Props {
  settings: QuoteSettingsV2;
  onSettingsChange: (settings: QuoteSettingsV2) => void;
}

export function SettingsTabV2({ settings, onSettingsChange }: SettingsTabV2Props) {
  const { settings: quoteSettings, tenantSettings, saveSettings } = useQuoteSettings();
  const [outsideRepSource, setOutsideRepSource] = useState<OutsideRepSource>('end_user');
  const [isSavingRepSource, setIsSavingRepSource] = useState(false);
  const [isSavingPriceLevels, setIsSavingPriceLevels] = useState(false);

  // Sync outsideRepSource from tenant settings
  useEffect(() => {
    const tenantSource = (tenantSettings as any)?.outsideRepSource;
    if (tenantSource) {
      setOutsideRepSource(tenantSource);
    } else if (quoteSettings?.outsideRepSource) {
      setOutsideRepSource(quoteSettings.outsideRepSource);
    }
  }, [quoteSettings, tenantSettings]);

  // Also keep local settings in sync so the auto-populate logic reads the correct value
  useEffect(() => {
    if (settings.outsideRepSource !== outsideRepSource) {
      onSettingsChange({ ...settings, outsideRepSource });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outsideRepSource]);

  // Save outsideRepSource directly to tenant settings
  const handleOutsideRepSourceChange = async (value: OutsideRepSource) => {
    setOutsideRepSource(value);
    onSettingsChange({ ...settings, outsideRepSource: value });
    setIsSavingRepSource(true);
    try {
      const currentTenantSettings = tenantSettings || quoteSettings || {};
      const success = await saveSettings(
        { ...currentTenantSettings, outsideRepSource: value } as any,
        'tenant'
      );
      if (success) {
        showSuccessToast('Outside rep source saved');
      } else {
        showErrorToast('Failed to save outside rep source');
      }
    } catch {
      showErrorToast('Failed to save outside rep source');
    } finally {
      setIsSavingRepSource(false);
    }
  };

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
    savePriceLevelsToBackend(newLevels);
  };

  // Save price levels to backend (tenant settings)
  const savePriceLevelsToBackend = useCallback(async (priceLevels: PriceLevelV2[]) => {
    setIsSavingPriceLevels(true);
    try {
      const currentTenantSettings = tenantSettings || quoteSettings || {};
      const updatedSettings: QuoteSettingsValue = {
        ...currentTenantSettings,
        columnConfig: (currentTenantSettings as QuoteSettingsValue).columnConfig || defaultColumnConfigV2,
        specifyEndUserPerLine: (currentTenantSettings as QuoteSettingsValue).specifyEndUserPerLine ?? true,
        outsideRepAtLineLevel: (currentTenantSettings as QuoteSettingsValue).outsideRepAtLineLevel ?? false,
        insideRepAtLineLevel: (currentTenantSettings as QuoteSettingsValue).insideRepAtLineLevel ?? false,
        factoryPerLineItem: (currentTenantSettings as QuoteSettingsValue).factoryPerLineItem ?? false,
        customerPartNumberSource: (currentTenantSettings as QuoteSettingsValue).customerPartNumberSource ?? 'sold_to',
        priceLevels: priceLevels.map(level => ({
          id: level.id,
          name: level.name,
          percent: level.percent,
          description: level.description,
        })),
      };
      const success = await saveSettings(updatedSettings, 'tenant');
      if (success) {
        showSuccessToast('Price levels saved');
      } else {
        showErrorToast('Failed to save price levels');
      }
    } catch {
      showErrorToast('Failed to save price levels');
    } finally {
      setIsSavingPriceLevels(false);
    }
  }, [tenantSettings, quoteSettings, saveSettings]);

  // Handle price level change with debounced save
  const handlePriceLevelChangeWithSave = (index: number, updates: Partial<PriceLevelV2>) => {
    handlePriceLevelChange(index, updates);
    const newLevels = [...settings.priceLevels];
    newLevels[index] = { ...newLevels[index], ...updates };
    savePriceLevelsToBackend(newLevels);
  };

  const handleAddPriceLevel = () => {
    addPriceLevel();
    const newLevel: PriceLevelV2 = {
      id: `l${settings.priceLevels.length + 1}`,
      name: `L${settings.priceLevels.length + 1}`,
      percent: 0,
      description: '',
    };
    savePriceLevelsToBackend([...settings.priceLevels, newLevel]);
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

        {/* Outside Rep Population Source - Tenant Wide */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-sm font-medium text-gray-900">Outside Rep Population Source</h4>
            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">Tenant Wide</span>
            {isSavingRepSource && (
              <span className="text-xs text-gray-400">Saving...</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-3">Choose which customer&apos;s outside reps auto-populate when selected</p>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="outsideRepSource"
                checked={outsideRepSource === 'end_user'}
                onChange={() => handleOutsideRepSourceChange('end_user')}
                disabled={isSavingRepSource}
                className="accent-indigo-600"
              />
              <span className="text-sm text-gray-700">End User</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="outsideRepSource"
                checked={outsideRepSource === 'sold_to'}
                onChange={() => handleOutsideRepSourceChange('sold_to')}
                disabled={isSavingRepSource}
                className="accent-indigo-600"
              />
              <span className="text-sm text-gray-700">Sold To Customer</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="outsideRepSource"
                checked={outsideRepSource === 'bill_to'}
                onChange={() => handleOutsideRepSourceChange('bill_to')}
                disabled={isSavingRepSource}
                className="accent-indigo-600"
              />
              <span className="text-sm text-gray-700">Bill To Customer</span>
            </label>
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

        {/* Price Levels */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-sm font-medium text-gray-900">Price Levels</h4>
            {isSavingPriceLevels && (
              <span className="text-xs text-gray-400">Saving...</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-3">Configure pricing tiers for different customer types</p>
          <div className="space-y-3">
            {settings.priceLevels.map((level, index) => (
              <div key={level.id} className="flex items-center gap-3">
                <input
                  type="text"
                  value={level.name}
                  onChange={(e) => handlePriceLevelChangeWithSave(index, { name: e.target.value })}
                  className="w-16 px-2 py-1.5 text-sm text-center border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Name"
                />
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={level.percent}
                    onChange={(e) => handlePriceLevelChangeWithSave(index, { percent: parseFloat(e.target.value) || 0 })}
                    className="w-20 px-2 py-1.5 text-sm text-center border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="0"
                    step="0.1"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
                <input
                  type="text"
                  value={level.description}
                  onChange={(e) => handlePriceLevelChangeWithSave(index, { description: e.target.value })}
                  placeholder="Description"
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {settings.priceLevels.length > 1 && (
                  <button
                    onClick={() => removePriceLevel(index)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100 transition-colors"
                    title="Remove price level"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleAddPriceLevel}
            className="mt-4 flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
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
