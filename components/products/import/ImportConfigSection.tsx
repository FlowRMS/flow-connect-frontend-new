'use client';

import { useRef } from 'react';
import type { FactorySearchResult, ProductUom } from '../api';

interface ImportConfigSectionProps {
  factorySearchTerm: string;
  setFactorySearchTerm: (term: string) => void;
  selectedFactory: FactorySearchResult | null;
  setSelectedFactory: (factory: FactorySearchResult | null) => void;
  isFactoryDropdownOpen: boolean;
  setIsFactoryDropdownOpen: (open: boolean) => void;
  factories: FactorySearchResult[];
  isLoadingFactories: boolean;
  selectedUom: ProductUom | null;
  setSelectedUom: (uom: ProductUom | null) => void;
  isUomDropdownOpen: boolean;
  setIsUomDropdownOpen: (open: boolean) => void;
  uoms: ProductUom[];
}

const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400";
const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

export function ImportConfigSection({
  factorySearchTerm,
  setFactorySearchTerm,
  selectedFactory,
  setSelectedFactory,
  isFactoryDropdownOpen,
  setIsFactoryDropdownOpen,
  factories,
  isLoadingFactories,
  selectedUom,
  setSelectedUom,
  isUomDropdownOpen,
  setIsUomDropdownOpen,
  uoms,
}: ImportConfigSectionProps) {
  const factoryInputRef = useRef<HTMLInputElement>(null);

  const handleFactorySelect = (factory: FactorySearchResult) => {
    setSelectedFactory(factory);
    setFactorySearchTerm(factory.title);
    setIsFactoryDropdownOpen(false);
  };

  const handleUomSelect = (uom: ProductUom) => {
    setSelectedUom(uom);
    setIsUomDropdownOpen(false);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Factory Selection */}
        <div>
          <label className={labelClass}>Factory *</label>
          <div className="relative">
            <input
              ref={factoryInputRef}
              type="text"
              value={factorySearchTerm}
              onChange={(e) => {
                setFactorySearchTerm(e.target.value);
                setIsFactoryDropdownOpen(true);
                if (!e.target.value) {
                  setSelectedFactory(null);
                }
              }}
              onFocus={() => setIsFactoryDropdownOpen(true)}
              className={inputClass}
              placeholder="Search factories..."
            />
            {isFactoryDropdownOpen && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {isLoadingFactories ? (
                  <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
                ) : factories.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    {factorySearchTerm ? 'No factories found' : 'Start typing to search'}
                  </div>
                ) : (
                  factories.map((factory) => (
                    <button
                      key={factory.id}
                      type="button"
                      onClick={() => handleFactorySelect(factory)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                        selectedFactory?.id === factory.id ? 'bg-blue-50 text-blue-700' : ''
                      }`}
                    >
                      {factory.title}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* UOM Selection */}
        <div>
          <label className={labelClass}>Default Unit of Measure *</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUomDropdownOpen(!isUomDropdownOpen)}
              className={`${inputClass} text-left flex items-center justify-between`}
            >
              <span className={selectedUom ? 'text-gray-900' : 'text-gray-400'}>
                {selectedUom?.title || 'Select UOM...'}
              </span>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isUomDropdownOpen && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {uoms.map((uom) => (
                  <button
                    key={uom.id}
                    type="button"
                    onClick={() => handleUomSelect(uom)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                      selectedUom?.id === uom.id ? 'bg-blue-50 text-blue-700' : ''
                    }`}
                  >
                    {uom.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
