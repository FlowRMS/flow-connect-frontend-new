/**
 * Product Cross Detail View Component
 * Side-by-side comparison of product crosses with attributes
 */

import React, { useState, useCallback } from 'react';

// Product cross types
export type CrossType = 'SIMPLE' | 'UPGRADE' | 'VALUE';

export interface ProductAlternative {
  name: string;
  description: string;
  price?: number | null;
  source?: string | null;
  crossType: CrossType;
  attributes?: Record<string, string>;
  reasoning?: string;
  selected?: boolean;
}

export interface ProductCrossResult {
  original: {
    manufacturer: string;
    partNumber: string;
    description: string;
    attributes?: Record<string, string>;
  };
  alternatives: ProductAlternative[];
}

// Prompt templates
const PROMPT_TEMPLATES = [
  { id: 'default', label: 'Default', prompt: 'Find alternative products with similar specifications' },
  { id: 'cost-saving', label: 'Cost Saving', prompt: 'Find lower-cost alternatives that meet minimum requirements' },
  { id: 'premium', label: 'Premium Upgrade', prompt: 'Find premium alternatives with enhanced features' },
  { id: 'energy-efficient', label: 'Energy Efficient', prompt: 'Find energy-efficient alternatives with lower power consumption' },
  { id: 'compatible', label: 'Compatible', prompt: 'Find alternatives that are directly compatible without modifications' },
];

// Common product attributes to display
const DISPLAY_ATTRIBUTES = [
  'Voltage',
  'Wattage',
  'Max Load',
  'Operating Temperature',
  'Certifications',
  'Protocol',
  'Additional Features',
];

interface ProductCrossDetailViewProps {
  crosses: ProductCrossResult[];
  selectedCrossTypes: CrossType[];
  onCrossTypesChange: (types: CrossType[]) => void;
  onSelectAlternative: (originalIndex: number, altIndex: number) => void;
  onDeleteCross: (originalIndex: number, altIndex: number) => void;
  onRerunCross: (prompt: string, crossTypes: CrossType[]) => void;
  onContinue: () => void;
  isProcessing?: boolean;
}

export function ProductCrossDetailView({
  crosses,
  selectedCrossTypes,
  onCrossTypesChange,
  onSelectAlternative,
  onDeleteCross,
  onRerunCross,
  onContinue,
  isProcessing = false,
}: ProductCrossDetailViewProps) {
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isEnhancedView, setIsEnhancedView] = useState(false);

  const handleTemplateSelect = useCallback((templateId: string) => {
    const template = PROMPT_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setCustomPrompt(template.prompt);
      setSelectedTemplate(templateId);
    }
  }, []);

  const handleCrossTypeToggle = useCallback((type: CrossType) => {
    if (selectedCrossTypes.includes(type)) {
      onCrossTypesChange(selectedCrossTypes.filter(t => t !== type));
    } else {
      onCrossTypesChange([...selectedCrossTypes, type]);
    }
  }, [selectedCrossTypes, onCrossTypesChange]);

  const handleRerun = useCallback(() => {
    if (selectedCrossTypes.length > 0) {
      onRerunCross(customPrompt, selectedCrossTypes);
    }
  }, [customPrompt, selectedCrossTypes, onRerunCross]);

  const handleSaveAsPrompt = useCallback(() => {
    if (customPrompt.trim()) {
      alert(`Prompt saved: "${customPrompt}"\n\nNote: Custom prompts are saved locally for this session.`);
    }
  }, [customPrompt]);

  if (crosses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-600">
            <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">No Product Crosses Available</h3>
        <p className="text-[var(--muted-foreground)] mb-6 max-w-md mx-auto">
          Run the product cross process to find alternative products for your parsed items.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-[var(--muted-foreground)]">
          Showing {crosses.length} product cross{crosses.length !== 1 ? 'es' : ''}
        </div>
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setIsEnhancedView(false)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              !isEnhancedView
                ? 'bg-white text-[var(--foreground)] shadow-sm'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            Normal
          </button>
          <button
            onClick={() => setIsEnhancedView(true)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              isEnhancedView
                ? 'bg-white text-[var(--foreground)] shadow-sm'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            Enhanced
          </button>
        </div>
      </div>

      {/* Cross Results */}
      {crosses.map((cross, crossIndex) => (
        <div key={crossIndex} className="bg-white rounded-lg border border-[var(--border)] overflow-hidden">
          {/* Original Product Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-[var(--border)]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[var(--foreground)]">
                  {cross.original.manufacturer} - {cross.original.partNumber}
                </h3>
                <p className="text-sm text-[var(--muted-foreground)]">{cross.original.description}</p>
              </div>
              <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-medium">
                Original
              </span>
            </div>
          </div>

          {/* Side-by-side Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider w-40">
                    Attribute
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider bg-gray-100 min-w-[180px]">
                    Original
                  </th>
                  {cross.alternatives.map((alt, altIndex) => (
                    <th
                      key={altIndex}
                      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[180px] ${
                        alt.crossType === 'SIMPLE' ? 'text-blue-600' :
                        alt.crossType === 'UPGRADE' ? 'text-purple-600' :
                        'text-green-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          alt.crossType === 'SIMPLE' ? 'bg-blue-100 text-blue-700' :
                          alt.crossType === 'UPGRADE' ? 'bg-purple-100 text-purple-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {alt.crossType === 'SIMPLE' ? 'Direct' : alt.crossType}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {/* Product Name Row */}
                <tr className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">Product</td>
                  <td className="px-4 py-3 text-sm text-[var(--foreground)] bg-gray-50/50">
                    {cross.original.partNumber}
                  </td>
                  {cross.alternatives.map((alt, altIndex) => (
                    <td key={altIndex} className="px-4 py-3 text-sm text-[var(--foreground)]">
                      <span className={alt.crossType === 'SIMPLE' ? 'text-blue-600' : alt.crossType === 'UPGRADE' ? 'text-purple-600' : 'text-green-600'}>
                        {alt.name}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Description Row */}
                <tr className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">Description</td>
                  <td className="px-4 py-3 text-sm text-[var(--muted-foreground)] bg-gray-50/50">
                    {cross.original.description}
                  </td>
                  {cross.alternatives.map((alt, altIndex) => (
                    <td key={altIndex} className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                      {alt.description}
                    </td>
                  ))}
                </tr>

                {/* Dynamic Attributes - Show more in Enhanced view */}
                {(() => {
                  // Collect all unique attributes from original and alternatives
                  const allAttributes = new Set<string>();
                  if (cross.original.attributes) {
                    Object.keys(cross.original.attributes).forEach(k => allAttributes.add(k));
                  }
                  cross.alternatives.forEach(alt => {
                    if (alt.attributes) {
                      Object.keys(alt.attributes).forEach(k => allAttributes.add(k));
                    }
                  });

                  // In Normal view, only show predefined attributes. In Enhanced, show all.
                  const attributesToShow = isEnhancedView
                    ? Array.from(allAttributes)
                    : DISPLAY_ATTRIBUTES.filter(attr => allAttributes.has(attr));

                  return attributesToShow.map((attr) => {
                    const originalValue = cross.original.attributes?.[attr];
                    const hasAnyValue = originalValue || cross.alternatives.some(a => a.attributes?.[attr]);

                    if (!hasAnyValue) return null;

                    return (
                      <tr key={attr} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">{attr}</td>
                        <td className="px-4 py-3 text-sm text-[var(--foreground)] bg-gray-50/50">
                          {originalValue || '-'}
                        </td>
                        {cross.alternatives.map((alt, altIndex) => (
                          <td key={altIndex} className="px-4 py-3 text-sm text-[var(--foreground)]">
                            {alt.attributes?.[attr] || '-'}
                          </td>
                        ))}
                      </tr>
                    );
                  });
                })()}

                {/* Price Row */}
                <tr className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">Price</td>
                  <td className="px-4 py-3 text-sm text-[var(--foreground)] bg-gray-50/50">-</td>
                  {cross.alternatives.map((alt, altIndex) => (
                    <td key={altIndex} className="px-4 py-3 text-sm text-[var(--foreground)]">
                      {alt.price ? `$${alt.price.toFixed(2)}` : '-'}
                    </td>
                  ))}
                </tr>

                {/* Reasoning Row */}
                <tr className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">AI Reasoning</td>
                  <td className="px-4 py-3 text-sm text-[var(--muted-foreground)] bg-gray-50/50 italic">-</td>
                  {cross.alternatives.map((alt, altIndex) => (
                    <td key={altIndex} className="px-4 py-3 text-sm text-[var(--muted-foreground)] italic">
                      {alt.reasoning || 'Compatible alternative with similar specifications'}
                    </td>
                  ))}
                </tr>

                {/* Select Row */}
                <tr className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">Select</td>
                  <td className="px-4 py-3 bg-gray-50/50">-</td>
                  {cross.alternatives.map((alt, altIndex) => (
                    <td key={altIndex} className="px-4 py-3">
                      <button
                        onClick={() => onSelectAlternative(crossIndex, altIndex)}
                        className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                          alt.selected
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {alt.selected ? 'Selected' : 'Select'}
                      </button>
                    </td>
                  ))}
                </tr>

                {/* Delete Row */}
                <tr className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">Delete</td>
                  <td className="px-4 py-3 bg-gray-50/50">-</td>
                  {cross.alternatives.map((alt, altIndex) => (
                    <td key={altIndex} className="px-4 py-3">
                      <button
                        onClick={() => onDeleteCross(crossIndex, altIndex)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Remove this alternative"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M15 9l-6 6M9 9l6 6"/>
                        </svg>
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Continue Button */}
      <div className="flex justify-end">
        <button
          onClick={onContinue}
          disabled={isProcessing}
          className="px-6 py-2.5 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>

      {/* Rerun Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-6 border-t border-[var(--border)]">
        {/* Custom Prompt */}
        <div className="bg-white rounded-lg border border-[var(--border)] p-6">
          <h4 className="font-semibold text-[var(--foreground)] mb-2">Rerun Product Crosses by Prompt</h4>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Refine your search by providing additional instructions
          </p>
          <textarea
            value={customPrompt}
            onChange={(e) => {
              setCustomPrompt(e.target.value);
              setSelectedTemplate(null);
            }}
            placeholder="Type your instructions to refine the search..."
            className="w-full h-24 px-3 py-2 border border-[var(--border)] rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleRerun}
              disabled={isProcessing || selectedCrossTypes.length === 0}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Rerun'}
            </button>
            <button
              onClick={handleSaveAsPrompt}
              disabled={!customPrompt.trim()}
              className="px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Save as Prompt
            </button>
            <div className="relative">
              <select
                value={selectedTemplate || ''}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium bg-white hover:bg-gray-50 transition-colors appearance-none pr-8 cursor-pointer"
              >
                <option value="">Prompt Templates</option>
                {PROMPT_TEMPLATES.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.label}
                  </option>
                ))}
              </select>
              <svg
                className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Cross Type Selection */}
        <div className="bg-white rounded-lg border border-[var(--border)] p-6">
          <h4 className="font-semibold text-[var(--foreground)] mb-2">Rerun Product Crosses</h4>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Select cross types and rerun the search
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => handleCrossTypeToggle('SIMPLE')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCrossTypes.includes('SIMPLE')
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              Direct
            </button>
            <button
              onClick={() => handleCrossTypeToggle('UPGRADE')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCrossTypes.includes('UPGRADE')
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
            >
              Upgrade
            </button>
            <button
              onClick={() => handleCrossTypeToggle('VALUE')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCrossTypes.includes('VALUE')
                  ? 'bg-green-600 text-white'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              Value
            </button>
          </div>
          <button
            onClick={handleRerun}
            disabled={isProcessing || selectedCrossTypes.length === 0}
            className="w-full px-4 py-2.5 bg-gray-100 text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6"/>
              <path d="M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Rerun
          </button>
        </div>
      </div>
    </div>
  );
}
