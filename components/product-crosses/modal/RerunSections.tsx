/**
 * Rerun Sections Component
 * Controls for rerunning product cross searches
 */

'use client';

import React from 'react';

interface RerunSectionsProps {
  promptInstructions: string;
  crossTypes: string[];
  isSearching: boolean;
  isSearchingByPrompt: boolean;
  isSearchingByFilters: boolean;
  onPromptChange: (value: string) => void;
  onToggleCrossType: (type: string) => void;
  onRerunWithPrompt: () => void;
  onRerunWithFilters: () => void;
  onOpenSavePrompt: () => void;
  onOpenTemplates: () => void;
}

export function RerunSections({
  promptInstructions,
  crossTypes,
  isSearching,
  isSearchingByPrompt,
  isSearchingByFilters,
  onPromptChange,
  onToggleCrossType,
  onRerunWithPrompt,
  onRerunWithFilters,
  onOpenSavePrompt,
  onOpenTemplates,
}: RerunSectionsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <RerunByPrompt
        promptInstructions={promptInstructions}
        isSearching={isSearching}
        isSearchingByPrompt={isSearchingByPrompt}
        onPromptChange={onPromptChange}
        onRerun={onRerunWithPrompt}
        onOpenSavePrompt={onOpenSavePrompt}
        onOpenTemplates={onOpenTemplates}
      />
      <RerunByFilters
        crossTypes={crossTypes}
        isSearching={isSearching}
        isSearchingByFilters={isSearchingByFilters}
        onToggleCrossType={onToggleCrossType}
        onRerun={onRerunWithFilters}
      />
    </div>
  );
}

function RerunByPrompt({
  promptInstructions,
  isSearching,
  isSearchingByPrompt,
  onPromptChange,
  onRerun,
  onOpenSavePrompt,
  onOpenTemplates,
}: {
  promptInstructions: string;
  isSearching: boolean;
  isSearchingByPrompt: boolean;
  onPromptChange: (value: string) => void;
  onRerun: () => void;
  onOpenSavePrompt: () => void;
  onOpenTemplates: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-visible">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">Rerun Product Crosses by Prompt</h3>
        <p className="text-sm text-gray-500">Refine your search by providing additional instructions</p>
      </div>
      <div className="p-6 space-y-4">
        <textarea
          placeholder="Type your instructions to refine the search..."
          value={promptInstructions}
          onChange={(e) => onPromptChange(e.target.value)}
          rows={3}
          disabled={isSearching}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none disabled:opacity-50"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRerun}
            disabled={!promptInstructions.trim() || isSearching}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isSearchingByPrompt && <LoadingSpinner />}
            {isSearchingByPrompt ? 'Searching...' : 'Rerun'}
          </button>
          <button
            type="button"
            onClick={onOpenSavePrompt}
            disabled={!promptInstructions.trim() || isSearching}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <SaveIcon />
            Save as Prompt
          </button>
          <button
            type="button"
            onClick={onOpenTemplates}
            disabled={isSearching}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <DatabaseIcon />
            Prompt Templates
          </button>
        </div>
      </div>
    </div>
  );
}

function RerunByFilters({
  crossTypes,
  isSearching,
  isSearchingByFilters,
  onToggleCrossType,
  onRerun,
}: {
  crossTypes: string[];
  isSearching: boolean;
  isSearchingByFilters: boolean;
  onToggleCrossType: (type: string) => void;
  onRerun: () => void;
}) {
  const typeConfigs = [
    { value: 'direct', label: 'Direct', bgActive: 'bg-blue-100', textActive: 'text-blue-800', borderActive: 'border-blue-400' },
    { value: 'upgrade', label: 'Upgrade', bgActive: 'bg-green-100', textActive: 'text-green-800', borderActive: 'border-green-400' },
    { value: 'value', label: 'Value', bgActive: 'bg-purple-100', textActive: 'text-purple-800', borderActive: 'border-purple-400' },
  ];

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">Rerun Product Crosses</h3>
        <p className="text-sm text-gray-500">Select cross types and rerun the search</p>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          {typeConfigs.map((type) => (
            <button
              type="button"
              key={type.value}
              onClick={() => onToggleCrossType(type.value)}
              disabled={isSearching}
              className={`px-4 py-2 rounded-lg border-2 font-medium text-sm transition-all disabled:opacity-50 ${
                crossTypes.includes(type.value)
                  ? `${type.bgActive} ${type.textActive} ${type.borderActive}`
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onRerun}
          disabled={crossTypes.length === 0 || isSearching}
          className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isSearchingByFilters ? <LoadingSpinner /> : <RefreshIcon />}
          {isSearchingByFilters ? 'Searching...' : 'Rerun'}
        </button>
      </div>
    </div>
  );
}

// Icons
function LoadingSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14a9 3 0 0018 0V5" />
      <path d="M3 12a9 3 0 0018 0" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}
