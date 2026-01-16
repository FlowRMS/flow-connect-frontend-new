/**
 * Cross Results Table Component
 * Displays cross results in either transposed (enhanced) or normal view
 */

'use client';

import React from 'react';
import type { CrossResult, OriginalProduct } from './types';
import { SPEC_ROWS } from './utils';

interface CrossResultsTableProps {
  isTransposed: boolean;
  crossResults: CrossResult[];
  originalProduct: OriginalProduct;
  selectedResultIds: Set<string>;
  onSelectResult: (resultId: string) => void;
  onDeleteResult: (resultId: string) => void;
}

export function CrossResultsTable({
  isTransposed,
  crossResults,
  originalProduct,
  selectedResultIds,
  onSelectResult,
  onDeleteResult,
}: CrossResultsTableProps) {
  const specKeys = SPEC_ROWS;

  if (isTransposed) {
    return <TransposedTable
      crossResults={crossResults}
      originalProduct={originalProduct}
      selectedResultIds={selectedResultIds}
      onSelectResult={onSelectResult}
      onDeleteResult={onDeleteResult}
      specKeys={specKeys}
    />;
  }

  return <NormalTable
    crossResults={crossResults}
    originalProduct={originalProduct}
    selectedResultIds={selectedResultIds}
    onSelectResult={onSelectResult}
    onDeleteResult={onDeleteResult}
    specKeys={specKeys}
  />;
}

// Transposed view: attributes as rows, products as columns
function TransposedTable({
  crossResults,
  originalProduct,
  selectedResultIds,
  onSelectResult,
  onDeleteResult,
  specKeys,
}: {
  crossResults: CrossResult[];
  originalProduct: OriginalProduct;
  selectedResultIds: Set<string>;
  onSelectResult: (resultId: string) => void;
  onDeleteResult: (resultId: string) => void;
  specKeys: string[];
}) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="text-left p-4 bg-gray-50 sticky left-0 z-10 min-w-[150px] text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Attribute
          </th>
          <th className="text-left p-4 min-w-[200px]">
            <div className="text-sm font-medium text-gray-900">{originalProduct.partNumber}</div>
            <div className="text-xs text-gray-500">{originalProduct.manufacturer}</div>
            <div className="mt-1">
              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">Original</span>
            </div>
          </th>
          {crossResults.map((result) => (
            <th key={result.id} className="text-left p-4 min-w-[200px]">
              <div className="text-sm font-medium text-gray-900">{result.partNumber}</div>
              <div className="text-xs text-gray-500">{result.manufacturer}</div>
              <div className="flex items-center gap-2 mt-1">
                <CrossTypeBadge type={result.crossType} />
                <SourceIcon source={result.source} />
              </div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        <TableRow label="Product" originalValue={originalProduct.partNumber} results={crossResults} getValue={(r) => r.partNumber} />
        <TableRow label="Manufacturer" originalValue={originalProduct.manufacturer} results={crossResults} getValue={(r) => r.manufacturer} />
        <tr className="hover:bg-gray-50">
          <td className="p-4 bg-gray-50 sticky left-0 z-10 text-sm font-medium text-gray-700">Type</td>
          <td className="p-4"><span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">Original</span></td>
          {crossResults.map((result) => (
            <td key={result.id} className="p-4"><CrossTypeBadge type={result.crossType} /></td>
          ))}
        </tr>
        <tr className="hover:bg-gray-50">
          <td className="p-4 bg-gray-50 sticky left-0 z-10 text-sm font-medium text-gray-700">Source</td>
          <td className="p-4 text-sm text-gray-400">-</td>
          {crossResults.map((result) => (
            <td key={result.id} className="p-4">
              <div className="flex items-center gap-1.5">
                <SourceIcon source={result.source} />
                <span className="text-xs text-gray-600">{result.source === 'known' ? 'Known' : 'AI'}</span>
              </div>
            </td>
          ))}
        </tr>
        {specKeys.map((key) => (
          <tr key={key} className="hover:bg-gray-50">
            <td className="p-4 bg-gray-50 sticky left-0 z-10 text-sm font-medium text-gray-700">{key}</td>
            <td className="p-4 text-sm text-gray-600">{originalProduct.specifications?.[key] || '-'}</td>
            {crossResults.map((result) => (
              <td key={result.id} className="p-4 text-sm">
                <span className={originalProduct.specifications?.[key] !== result.specifications?.[key] ? 'font-medium text-blue-600' : 'text-gray-600'}>
                  {result.specifications?.[key] || '-'}
                </span>
              </td>
            ))}
          </tr>
        ))}
        <TableRow label="Reasoning" originalValue="-" results={crossResults} getValue={(r) => r.reasoning || '-'} />
        <tr className="hover:bg-gray-50">
          <td className="p-4 bg-gray-50 sticky left-0 z-10 text-sm font-medium text-gray-700">Select</td>
          <td className="p-4 text-sm text-gray-400">-</td>
          {crossResults.map((result) => (
            <td key={result.id} className="p-4">
              {result.source === 'ai' ? (
                <SelectButton isSelected={selectedResultIds.has(result.id)} onClick={() => onSelectResult(result.id)} />
              ) : <span className="text-sm text-gray-400">-</span>}
            </td>
          ))}
        </tr>
        <tr className="hover:bg-gray-50">
          <td className="p-4 bg-gray-50 sticky left-0 z-10 text-sm font-medium text-gray-700">Delete</td>
          <td className="p-4 text-sm text-gray-400">-</td>
          {crossResults.map((result) => (
            <td key={result.id} className="p-4">
              {result.source === 'ai' ? (
                <DeleteButton onClick={() => onDeleteResult(result.id)} />
              ) : <span className="text-sm text-gray-400">-</span>}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}

// Normal view: products as rows
function NormalTable({
  crossResults,
  originalProduct,
  selectedResultIds,
  onSelectResult,
  onDeleteResult,
  specKeys,
}: {
  crossResults: CrossResult[];
  originalProduct: OriginalProduct;
  selectedResultIds: Set<string>;
  onSelectResult: (resultId: string) => void;
  onDeleteResult: (resultId: string) => void;
  specKeys: string[];
}) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-200 bg-gray-50">
          <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
          <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
          <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</th>
          {specKeys.map(key => (
            <th key={key} className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{key}</th>
          ))}
          <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reasoning</th>
          <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        <tr className="bg-gray-50/50">
          <td className="p-4">
            <div className="text-sm font-medium text-gray-900">{originalProduct.partNumber}</div>
            <div className="text-xs text-gray-500">{originalProduct.manufacturer}</div>
          </td>
          <td className="p-4"><span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">Original</span></td>
          <td className="p-4 text-sm text-gray-400">-</td>
          {specKeys.map(key => (
            <td key={key} className="p-4 text-sm text-gray-600">{originalProduct.specifications?.[key] || '-'}</td>
          ))}
          <td className="p-4 text-sm text-gray-400">-</td>
          <td className="p-4 text-center text-gray-400">-</td>
        </tr>
        {crossResults.map((result) => (
          <tr key={result.id} className={`hover:bg-gray-50 ${selectedResultIds.has(result.id) ? 'bg-blue-50' : ''}`}>
            <td className="p-4">
              <div className="text-sm font-medium text-gray-900">{result.partNumber}</div>
              <div className="text-xs text-gray-500">{result.manufacturer}</div>
            </td>
            <td className="p-4"><CrossTypeBadge type={result.crossType} /></td>
            <td className="p-4">
              <div className="flex items-center gap-1.5">
                <SourceIcon source={result.source} />
                <span className="text-xs">{result.source === 'known' ? 'Known' : 'AI'}</span>
              </div>
            </td>
            {specKeys.map(key => (
              <td key={key} className="p-4 text-sm">
                <span className={originalProduct.specifications?.[key] !== result.specifications?.[key] ? 'font-medium text-blue-600' : 'text-gray-600'}>
                  {result.specifications?.[key] || '-'}
                </span>
              </td>
            ))}
            <td className="p-4 text-sm text-gray-500 max-w-xs">{result.reasoning || '-'}</td>
            <td className="p-4">
              {result.source === 'ai' ? (
                <div className="flex items-center justify-center gap-2">
                  <SelectButton isSelected={selectedResultIds.has(result.id)} onClick={() => onSelectResult(result.id)} compact />
                  <DeleteButton onClick={() => onDeleteResult(result.id)} compact />
                </div>
              ) : <span className="text-sm text-gray-400">-</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Helper components
function TableRow({ label, originalValue, results, getValue }: {
  label: string;
  originalValue: string;
  results: CrossResult[];
  getValue: (r: CrossResult) => string;
}) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="p-4 bg-gray-50 sticky left-0 z-10 text-sm font-medium text-gray-700">{label}</td>
      <td className="p-4 text-sm text-gray-600">{originalValue}</td>
      {results.map((result) => (
        <td key={result.id} className="p-4 text-sm text-gray-600">{getValue(result)}</td>
      ))}
    </tr>
  );
}

function CrossTypeBadge({ type }: { type: 'direct' | 'upgrade' | 'value' }) {
  const styles = {
    direct: 'bg-blue-100 text-blue-700',
    upgrade: 'bg-green-100 text-green-700',
    value: 'bg-purple-100 text-purple-700',
  };
  const labels = { direct: 'Direct', upgrade: 'Upgrade', value: 'Value' };
  return <span className={`px-2 py-0.5 text-xs font-medium rounded ${styles[type]}`}>{labels[type]}</span>;
}

function SourceIcon({ source }: { source: 'known' | 'ai' }) {
  if (source === 'known') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5v14a9 3 0 0018 0V5" />
        <path d="M3 12a9 3 0 0018 0" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
    </svg>
  );
}

function SelectButton({ isSelected, onClick, compact = false }: { isSelected: boolean; onClick: () => void; compact?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`${compact ? 'px-3 py-1' : 'px-4 py-1.5'} text-sm font-medium rounded-lg transition-colors ${
        isSelected ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
      }`}
    >
      {isSelected ? (compact ? 'Selected' : (
        <span className="flex items-center gap-1.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" />
            <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" fill="none" />
          </svg>
          Selected
        </span>
      )) : 'Select'}
    </button>
  );
}

function DeleteButton({ onClick, compact = false }: { onClick: () => void; compact?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`${compact ? 'p-1' : 'p-1.5'} text-gray-400 hover:text-red-600 transition-colors`}
      title="Remove from results"
    >
      <svg width={compact ? "16" : "18"} height={compact ? "16" : "18"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M15 9l-6 6M9 9l6 6" />
      </svg>
    </button>
  );
}
