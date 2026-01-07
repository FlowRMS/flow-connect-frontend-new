/**
 * Product Cross Results Modal
 * Shows columnar comparison view with original product vs cross alternatives
 * Based on flowdemos Enhanced Product View design
 * Integrated with flow-ai backend for AI-powered cross search
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import type { ProductCross } from './ProductCrossesContent';
import {
  crossProducts,
  type ProductCrossTypeEnum,
  type ParsedProductCross,
  type CrossPromptTemplate,
  getCrossPromptTemplates,
  createCrossPromptTemplate,
  incrementCrossPromptTemplateUsage,
} from '../lib/graphql/product-crosses';

// Cross result with additional metadata
interface CrossResult {
  id: string;
  productName: string;
  manufacturer: string;
  partNumber: string;
  description: string;
  crossType: 'direct' | 'upgrade' | 'value';
  source: 'known' | 'ai';
  reasoning?: string;
  isSelected: boolean;
  specifications?: Record<string, string>;
}

interface ProductCrossResultsModalProps {
  isOpen: boolean;
  cross: ProductCross;
  onClose: () => void;
  onSave: (cross: ProductCross) => void;
  onDelete?: (id: string) => void;
  isSaving?: boolean;
}

// Map UI cross types to API enum values
function mapCrossTypeToApi(uiType: string): ProductCrossTypeEnum {
  switch (uiType) {
    case 'direct': return 'SIMPLE';
    case 'upgrade': return 'UPGRADE';
    case 'value': return 'VALUE';
    default: return 'SIMPLE';
  }
}

// Map API cross types to UI values
function mapCrossTypeFromApi(apiType: ProductCrossTypeEnum): 'direct' | 'upgrade' | 'value' {
  switch (apiType) {
    case 'SIMPLE': return 'direct';
    case 'UPGRADE': return 'upgrade';
    case 'VALUE': return 'value';
    default: return 'direct';
  }
}

export function ProductCrossResultsModal({
  isOpen,
  cross,
  onClose,
  onSave,
  onDelete,
  isSaving = false,
}: ProductCrossResultsModalProps) {
  // View state
  const [isTransposed, setIsTransposed] = useState(true); // Default to transposed (columns for products)

  // Cross type filters
  const [crossTypes, setCrossTypes] = useState<string[]>(['direct', 'upgrade', 'value']);

  // Prompt refinement
  const [promptInstructions, setPromptInstructions] = useState('');

  // Selected cross result
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

  // Deleted AI result IDs (to filter them out)
  const [deletedAiIds, setDeletedAiIds] = useState<Set<string>>(new Set());

  // Loading state for AI search (separate states for each rerun button)
  const [isSearchingByPrompt, setIsSearchingByPrompt] = useState(false);
  const [isSearchingByFilters, setIsSearchingByFilters] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Combined searching state for disabling other buttons
  const isSearching = isSearchingByPrompt || isSearchingByFilters;

  // AI-generated alternatives
  const [aiAlternatives, setAiAlternatives] = useState<CrossResult[]>([]);

  // Prompt templates state
  const [showSavePromptModal, setShowSavePromptModal] = useState(false);
  const [savePromptName, setSavePromptName] = useState('');
  const [savePromptDescription, setSavePromptDescription] = useState('');
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [templates, setTemplates] = useState<CrossPromptTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');

  // Build cross results from the current cross + AI alternatives
  const crossResults: CrossResult[] = useMemo(() => {
    // Start with the known cross as the first result
    const results: CrossResult[] = [
      {
        id: cross.id,
        productName: cross.ourPartNumber,
        manufacturer: cross.ourManufacturer,
        partNumber: cross.ourPartNumber,
        description: cross.ourDescription,
        crossType: 'direct', // Default to direct for known crosses
        source: 'known',
        reasoning: `Known cross from database. Used ${cross.timesUsed} times.`,
        isSelected: selectedResultId === cross.id,
        specifications: parseSpecifications(cross.ourDescription),
      },
    ];

    // Add AI-generated alternatives (excluding deleted ones)
    results.push(...aiAlternatives
      .filter(alt => !deletedAiIds.has(alt.id))
      .map(alt => ({
        ...alt,
        isSelected: selectedResultId === alt.id,
      })));

    return results;
  }, [cross, selectedResultId, aiAlternatives, deletedAiIds]);

  // Original product (competitor)
  const originalProduct = {
    name: cross.competitorPartNumber,
    manufacturer: cross.competitorManufacturer,
    partNumber: cross.competitorPartNumber,
    description: cross.competitorDescription,
    specifications: parseSpecifications(cross.competitorDescription),
  };

  // Get all specification keys from all products
  const specKeys = useMemo(() => {
    const allKeys = new Set<string>();
    if (originalProduct.specifications) {
      Object.keys(originalProduct.specifications).forEach(k => allKeys.add(k));
    }
    crossResults.forEach(r => {
      if (r.specifications) {
        Object.keys(r.specifications).forEach(k => allKeys.add(k));
      }
    });
    // Default specs if none found
    if (allKeys.size === 0) {
      return ['Part Number', 'Description'];
    }
    return Array.from(allKeys);
  }, [originalProduct.specifications, crossResults]);

  // Handle cross type toggle
  const handleToggleCrossType = (type: string) => {
    setCrossTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // Handle select result
  const handleSelectResult = (resultId: string) => {
    setSelectedResultId(prev => (prev === resultId ? null : resultId));
  };

  // Handle delete result
  const handleDeleteResult = (resultId: string) => {
    // Check if it's an AI-generated alternative (id starts with 'ai-')
    if (resultId.startsWith('ai-')) {
      // Add to deleted set to filter it out
      setDeletedAiIds(prev => new Set([...prev, resultId]));
      // Clear selection if this was selected
      if (selectedResultId === resultId) {
        setSelectedResultId(null);
      }
    } else {
      // It's a known cross - call the onDelete prop
      onDelete?.(resultId);
    }
  };

  // Search for crosses using the backend API
  const searchForCrosses = useCallback(async (
    types: string[],
    source: 'prompt' | 'filters',
    customPrompts?: string[]
  ) => {
    // Set loading state for the specific button
    if (source === 'prompt') {
      setIsSearchingByPrompt(true);
    } else {
      setIsSearchingByFilters(true);
    }
    setSearchError(null);

    try {
      // Build the product object for the API (using snake_case as expected by backend)
      const productToSearch = {
        name: `${cross.competitorManufacturer} ${cross.competitorPartNumber}`.trim(),
        manufacturer: cross.competitorManufacturer,
        part_number: cross.competitorPartNumber,
        description: cross.competitorDescription,
      };

      // Map UI types to API enum
      const apiTypes: ProductCrossTypeEnum[] = types.map(mapCrossTypeToApi);

      // Call the backend API
      const results = await crossProducts([productToSearch], apiTypes, customPrompts);

      // Transform results to CrossResult format
      const newAlternatives: CrossResult[] = [];

      for (const result of results) {
        for (const crossResult of result.crosses) {
          for (const alt of crossResult.alternatives) {
            // Use attributes from API if available, otherwise parse from description
            const specifications = alt.attributes && Object.keys(alt.attributes).length > 0
              ? alt.attributes
              : parseSpecifications(alt.description || '');

            newAlternatives.push({
              id: `ai-${crypto.randomUUID()}`,
              productName: alt.name,
              manufacturer: alt.source || 'FlowRMS',
              partNumber: extractPartNumber(alt.name),
              description: alt.description || alt.name,
              crossType: mapCrossTypeFromApi(alt.crossType),
              source: 'ai',
              reasoning: crossResult.notes || crossResult.promptUsed,
              isSelected: false,
              specifications,
            });
          }
        }
      }

      setAiAlternatives(newAlternatives);
    } catch (error) {
      console.error('Error searching for crosses:', error);
      setSearchError(error instanceof Error ? error.message : 'Failed to search for crosses');
    } finally {
      // Clear loading state for the specific button
      if (source === 'prompt') {
        setIsSearchingByPrompt(false);
      } else {
        setIsSearchingByFilters(false);
      }
    }
  }, [cross]);

  // Handle rerun with prompt
  const handleRerunWithPrompt = useCallback(() => {
    if (!promptInstructions.trim()) return;
    searchForCrosses(crossTypes, 'prompt', [promptInstructions]);
  }, [promptInstructions, crossTypes, searchForCrosses]);

  // Handle rerun with filters
  const handleRerunWithFilters = useCallback(() => {
    if (crossTypes.length === 0) return;
    searchForCrosses(crossTypes, 'filters');
  }, [crossTypes, searchForCrosses]);

  // Load prompt templates
  const loadTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);
    try {
      const result = await getCrossPromptTemplates({ limit: 20, sortBy: 'times_used', sortOrder: 'desc' });
      setTemplates(result);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setIsLoadingTemplates(false);
    }
  }, []);

  // Handle opening templates modal
  const handleOpenTemplates = useCallback(() => {
    loadTemplates();
    setTemplateSearchQuery('');
    setShowTemplatesModal(true);
  }, [loadTemplates]);

  // Filter templates by search query
  const filteredTemplates = useMemo(() => {
    if (!templateSearchQuery.trim()) return templates;
    const query = templateSearchQuery.toLowerCase();
    return templates.filter(t =>
      t.name.toLowerCase().includes(query) ||
      t.prompt.toLowerCase().includes(query) ||
      (t.description && t.description.toLowerCase().includes(query))
    );
  }, [templates, templateSearchQuery]);

  // Handle selecting a template
  const handleSelectTemplate = useCallback(async (template: CrossPromptTemplate) => {
    setPromptInstructions(template.prompt);
    setShowTemplatesModal(false);
    // Increment usage in background
    try {
      await incrementCrossPromptTemplateUsage(template.id);
    } catch (error) {
      console.error('Error incrementing template usage:', error);
    }
  }, []);

  // Handle opening save prompt modal
  const handleOpenSavePrompt = useCallback(() => {
    if (!promptInstructions.trim()) {
      setSearchError('Please enter a prompt before saving');
      return;
    }
    setSavePromptName('');
    setSavePromptDescription('');
    setShowSavePromptModal(true);
  }, [promptInstructions]);

  // Handle saving prompt as template
  const handleSavePrompt = useCallback(async () => {
    if (!savePromptName.trim() || !promptInstructions.trim()) return;

    setIsSavingPrompt(true);
    try {
      await createCrossPromptTemplate({
        name: savePromptName.trim(),
        prompt: promptInstructions.trim(),
        description: savePromptDescription.trim() || null,
      });
      setShowSavePromptModal(false);
      setSavePromptName('');
      setSavePromptDescription('');
    } catch (error) {
      console.error('Error saving prompt template:', error);
      setSearchError(error instanceof Error ? error.message : 'Failed to save prompt template');
    } finally {
      setIsSavingPrompt(false);
    }
  }, [savePromptName, savePromptDescription, promptInstructions]);

  // Handle continue (save selected cross)
  const handleContinue = () => {
    const selectedResult = crossResults.find(r => r.id === selectedResultId);
    if (selectedResult) {
      onSave({
        ...cross,
        ourManufacturer: selectedResult.manufacturer,
        ourPartNumber: selectedResult.partNumber,
        ourDescription: selectedResult.description,
      });
    }
    onClose();
  };

  // Extract part number from product name
  function extractPartNumber(name: string): string {
    const match = name.match(/[A-Z0-9]+-?[A-Z0-9]+/i);
    return match ? match[0] : name.split(' ')[0] || name;
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Product Crosses</h2>
            <p className="text-sm text-gray-500 mt-1">
              Find direct, upgrade, and value-engineered crosses for your products
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Cross Results Card */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Results Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Cross Results</h3>
                <p className="text-sm text-gray-500">
                  {crossResults.length} {crossResults.length === 1 ? 'cross found' : 'crosses found'} (plus original product)
                </p>
              </div>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setIsTransposed(true)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    isTransposed
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                  Enhanced View
                </button>
                <button
                  onClick={() => setIsTransposed(false)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    !isTransposed
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M8 16H3v5" />
                  </svg>
                  Normal View
                </button>
              </div>
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto">
              {isTransposed ? (
                // Transposed view: attributes as rows, products as columns
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-4 bg-gray-50 sticky left-0 z-10 min-w-[150px] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Attribute
                      </th>
                      {/* Original Product Column */}
                      <th className="text-left p-4 min-w-[200px]">
                        <div className="text-sm font-medium text-gray-900">{originalProduct.partNumber}</div>
                        <div className="text-xs text-gray-500">{originalProduct.manufacturer}</div>
                        <div className="mt-1">
                          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                            Original
                          </span>
                        </div>
                      </th>
                      {/* Cross Result Columns */}
                      {crossResults.map((result) => (
                        <th key={result.id} className="text-left p-4 min-w-[200px]">
                          <div className="text-sm font-medium text-gray-900">{result.partNumber}</div>
                          <div className="text-xs text-gray-500">{result.manufacturer}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                              result.crossType === 'direct' ? 'bg-blue-100 text-blue-700' :
                              result.crossType === 'upgrade' ? 'bg-green-100 text-green-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {result.crossType === 'direct' ? 'Direct' :
                               result.crossType === 'upgrade' ? 'Upgrade' : 'Value'}
                            </span>
                            {result.source === 'known' ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                                <ellipse cx="12" cy="5" rx="9" ry="3" />
                                <path d="M3 5v14a9 3 0 0018 0V5" />
                                <path d="M3 12a9 3 0 0018 0" />
                              </svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                                <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
                                <path d="M5 19l1 3 1-3M18 19l1 3 1-3" />
                              </svg>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {/* Product Row */}
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 bg-gray-50 sticky left-0 z-10 text-sm font-medium text-gray-700">Product</td>
                      <td className="p-4 text-sm font-medium text-gray-900">{originalProduct.partNumber}</td>
                      {crossResults.map((result) => (
                        <td key={result.id} className="p-4 text-sm font-medium text-gray-900">{result.partNumber}</td>
                      ))}
                    </tr>
                    {/* Manufacturer Row */}
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 bg-gray-50 sticky left-0 z-10 text-sm font-medium text-gray-700">Manufacturer</td>
                      <td className="p-4 text-sm text-gray-600">{originalProduct.manufacturer}</td>
                      {crossResults.map((result) => (
                        <td key={result.id} className="p-4 text-sm text-gray-600">{result.manufacturer}</td>
                      ))}
                    </tr>
                    {/* Type Row */}
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 bg-gray-50 sticky left-0 z-10 text-sm font-medium text-gray-700">Type</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">Original</span>
                      </td>
                      {crossResults.map((result) => (
                        <td key={result.id} className="p-4">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                            result.crossType === 'direct' ? 'bg-blue-100 text-blue-700' :
                            result.crossType === 'upgrade' ? 'bg-green-100 text-green-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {result.crossType === 'direct' ? 'Direct' :
                             result.crossType === 'upgrade' ? 'Upgrade' : 'Value'}
                          </span>
                        </td>
                      ))}
                    </tr>
                    {/* Source Row */}
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 bg-gray-50 sticky left-0 z-10 text-sm font-medium text-gray-700">Source</td>
                      <td className="p-4 text-sm text-gray-400">-</td>
                      {crossResults.map((result) => (
                        <td key={result.id} className="p-4">
                          <div className="flex items-center gap-1.5">
                            {result.source === 'known' ? (
                              <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                                  <path d="M3 5v14a9 3 0 0018 0V5" />
                                  <path d="M3 12a9 3 0 0018 0" />
                                </svg>
                                <span className="text-xs text-gray-600">Known</span>
                              </>
                            ) : (
                              <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                                  <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
                                </svg>
                                <span className="text-xs text-gray-600">AI</span>
                              </>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                    {/* Specification Rows */}
                    {specKeys.map((key) => (
                      <tr key={key} className="hover:bg-gray-50">
                        <td className="p-4 bg-gray-50 sticky left-0 z-10 text-sm font-medium text-gray-700">{key}</td>
                        <td className="p-4 text-sm text-gray-600">
                          {originalProduct.specifications?.[key] || '-'}
                        </td>
                        {crossResults.map((result) => (
                          <td key={result.id} className="p-4 text-sm">
                            <span className={
                              originalProduct.specifications?.[key] !== result.specifications?.[key]
                                ? 'font-medium text-blue-600'
                                : 'text-gray-600'
                            }>
                              {result.specifications?.[key] || '-'}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                    {/* Reasoning Row */}
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 bg-gray-50 sticky left-0 z-10 text-sm font-medium text-gray-700">Reasoning</td>
                      <td className="p-4 text-sm text-gray-400">-</td>
                      {crossResults.map((result) => (
                        <td key={result.id} className="p-4 text-sm text-gray-500 max-w-xs">
                          {result.reasoning || '-'}
                        </td>
                      ))}
                    </tr>
                    {/* Select Row */}
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 bg-gray-50 sticky left-0 z-10 text-sm font-medium text-gray-700">Select</td>
                      <td className="p-4 text-sm text-gray-400">-</td>
                      {crossResults.map((result) => (
                        <td key={result.id} className="p-4">
                          <button
                            onClick={() => handleSelectResult(result.id)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                              selectedResultId === result.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {selectedResultId === result.id ? (
                              <span className="flex items-center gap-1.5">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                  <circle cx="12" cy="12" r="10" />
                                  <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" fill="none" />
                                </svg>
                                Selected
                              </span>
                            ) : (
                              'Select'
                            )}
                          </button>
                        </td>
                      ))}
                    </tr>
                    {/* Delete Row */}
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 bg-gray-50 sticky left-0 z-10 text-sm font-medium text-gray-700">Delete</td>
                      <td className="p-4 text-sm text-gray-400">-</td>
                      {crossResults.map((result) => (
                        <td key={result.id} className="p-4">
                          <button
                            onClick={() => handleDeleteResult(result.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                            title="Remove from results"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M15 9l-6 6M9 9l6 6" />
                            </svg>
                          </button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              ) : (
                // Normal view: products as rows
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
                    {/* Original Product Row */}
                    <tr className="bg-gray-50/50">
                      <td className="p-4">
                        <div className="text-sm font-medium text-gray-900">{originalProduct.partNumber}</div>
                        <div className="text-xs text-gray-500">{originalProduct.manufacturer}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">Original</span>
                      </td>
                      <td className="p-4 text-sm text-gray-400">-</td>
                      {specKeys.map(key => (
                        <td key={key} className="p-4 text-sm text-gray-600">
                          {originalProduct.specifications?.[key] || '-'}
                        </td>
                      ))}
                      <td className="p-4 text-sm text-gray-400">-</td>
                      <td className="p-4 text-center text-gray-400">-</td>
                    </tr>
                    {/* Cross Result Rows */}
                    {crossResults.map((result) => (
                      <tr key={result.id} className={`hover:bg-gray-50 ${selectedResultId === result.id ? 'bg-blue-50' : ''}`}>
                        <td className="p-4">
                          <div className="text-sm font-medium text-gray-900">{result.partNumber}</div>
                          <div className="text-xs text-gray-500">{result.manufacturer}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                            result.crossType === 'direct' ? 'bg-blue-100 text-blue-700' :
                            result.crossType === 'upgrade' ? 'bg-green-100 text-green-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {result.crossType === 'direct' ? 'Direct' :
                             result.crossType === 'upgrade' ? 'Upgrade' : 'Value'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            {result.source === 'known' ? (
                              <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                                  <path d="M3 5v14a9 3 0 0018 0V5" />
                                </svg>
                                <span className="text-xs">Known</span>
                              </>
                            ) : (
                              <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                                  <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
                                </svg>
                                <span className="text-xs">AI</span>
                              </>
                            )}
                          </div>
                        </td>
                        {specKeys.map(key => (
                          <td key={key} className="p-4 text-sm">
                            <span className={
                              originalProduct.specifications?.[key] !== result.specifications?.[key]
                                ? 'font-medium text-blue-600'
                                : 'text-gray-600'
                            }>
                              {result.specifications?.[key] || '-'}
                            </span>
                          </td>
                        ))}
                        <td className="p-4 text-sm text-gray-500 max-w-xs">{result.reasoning || '-'}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleSelectResult(result.id)}
                              className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                                selectedResultId === result.id
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {selectedResultId === result.id ? 'Selected' : 'Select'}
                            </button>
                            <button
                              onClick={() => handleDeleteResult(result.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Remove from results"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M15 9l-6 6M9 9l6 6" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Continue Button */}
            {selectedResultId && (
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end bg-gray-50">
                <button
                  onClick={handleContinue}
                  disabled={isSaving}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Continue
                </button>
              </div>
            )}
          </div>

          {/* Error Message */}
          {searchError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M15 9l-6 6M9 9l6 6" />
                </svg>
                <span className="text-sm font-medium">Error: {searchError}</span>
              </div>
            </div>
          )}

          {/* Rerun Sections - Two Column Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Rerun Product Crosses by Prompt */}
            <div className="border border-gray-200 rounded-lg overflow-visible">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Rerun Product Crosses by Prompt</h3>
                <p className="text-sm text-gray-500">Refine your search by providing additional instructions</p>
              </div>
              <div className="p-6 space-y-4">
                <textarea
                  placeholder="Type your instructions to refine the search..."
                  value={promptInstructions}
                  onChange={(e) => setPromptInstructions(e.target.value)}
                  rows={3}
                  disabled={isSearching}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none disabled:opacity-50"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleRerunWithPrompt}
                    disabled={!promptInstructions.trim() || isSearching}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isSearchingByPrompt && (
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    {isSearchingByPrompt ? 'Searching...' : 'Rerun'}
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenSavePrompt}
                    disabled={!promptInstructions.trim() || isSearching}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    Save as Prompt
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenTemplates}
                    disabled={isSearching}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <ellipse cx="12" cy="5" rx="9" ry="3" />
                      <path d="M3 5v14a9 3 0 0018 0V5" />
                      <path d="M3 12a9 3 0 0018 0" />
                    </svg>
                    Prompt Templates
                  </button>
                </div>
              </div>
            </div>

            {/* Rerun Product Crosses */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Rerun Product Crosses</h3>
                <p className="text-sm text-gray-500">Select cross types and rerun the search</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'direct', label: 'Direct', bgActive: 'bg-blue-100', textActive: 'text-blue-800', borderActive: 'border-blue-400' },
                    { value: 'upgrade', label: 'Upgrade', bgActive: 'bg-green-100', textActive: 'text-green-800', borderActive: 'border-green-400' },
                    { value: 'value', label: 'Value', bgActive: 'bg-purple-100', textActive: 'text-purple-800', borderActive: 'border-purple-400' },
                  ].map((type) => (
                    <button
                      type="button"
                      key={type.value}
                      onClick={() => handleToggleCrossType(type.value)}
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
                  onClick={handleRerunWithFilters}
                  disabled={crossTypes.length === 0 || isSearching}
                  className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isSearchingByFilters ? (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                    </svg>
                  )}
                  {isSearchingByFilters ? 'Searching...' : 'Rerun'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Save Prompt Modal */}
        {showSavePromptModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Save as Prompt</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Save this prompt to reuse it later
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={savePromptName}
                    onChange={(e) => setSavePromptName(e.target.value)}
                    placeholder="e.g., LED Driver Cross Search"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={savePromptDescription}
                    onChange={(e) => setSavePromptDescription(e.target.value)}
                    placeholder="Brief description of what this prompt does"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prompt
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 max-h-24 overflow-y-auto">
                    {promptInstructions}
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowSavePromptModal(false)}
                  disabled={isSavingPrompt}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePrompt}
                  disabled={!savePromptName.trim() || isSavingPrompt}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isSavingPrompt && (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {isSavingPrompt ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Templates Modal */}
        {showTemplatesModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Prompt Templates</h3>
                  <p className="text-sm text-gray-500">Browse and apply saved search prompt templates</p>
                </div>
                <button
                  onClick={() => setShowTemplatesModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 flex-1 overflow-y-auto">
                {/* Search Input */}
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={templateSearchQuery}
                  onChange={(e) => setTemplateSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 mb-4"
                />

                {isLoadingTemplates ? (
                  <div className="py-12 text-center text-gray-500">
                    <svg className="animate-spin h-8 w-8 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Loading templates...
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 text-gray-300">
                      <ellipse cx="12" cy="5" rx="9" ry="3" />
                      <path d="M3 5v14a9 3 0 0018 0V5" />
                      <path d="M3 12a9 3 0 0018 0" />
                    </svg>
                    <p className="text-sm font-medium">No templates found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {templateSearchQuery ? 'Try a different search term' : 'Create your first template using "Save as Prompt"'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Saved Templates</h4>
                    {filteredTemplates.map(template => (
                      <div
                        key={template.id}
                        onClick={() => handleSelectTemplate(template)}
                        className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">{template.name}</div>
                            {template.description && (
                              <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                            )}
                            <div className="text-xs text-gray-400 mt-2 line-clamp-2">{template.prompt}</div>
                          </div>
                          <div className="text-xs text-gray-400 ml-4 flex-shrink-0">
                            Used {template.timesUsed} times
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0">
                <button
                  onClick={() => {
                    setShowTemplatesModal(false);
                    setShowSavePromptModal(true);
                  }}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Create New Template
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to parse specifications from description
function parseSpecifications(description: string): Record<string, string> {
  const specs: Record<string, string> = {};

  if (!description) return specs;

  // Try to extract common specifications from the description
  const patterns = [
    { key: 'Voltage', pattern: /(\d+V?\s*(?:AC|DC)?)/i },
    { key: 'Wattage', pattern: /(\d+W(?:\s*per\s*zone)?)/i },
    { key: 'Protocol', pattern: /(DALI|0-10V|DMX|PWM|Bluetooth|WiFi|Zigbee|RS-485|Modbus)/i },
    { key: 'Zones', pattern: /(\d+)\s*zones?/i },
    { key: 'Color Temperature', pattern: /(\d+K(?:\s*\([^)]+\))?)/i },
    { key: 'Dimming Range', pattern: /(?:dimming\s*(?:range)?:?\s*)?(0?-?\d+%?\s*(?:to|-)\s*100%?)/i },
    { key: 'Max Load', pattern: /(?:max\s*load:?\s*)?(\d+(?:\.\d+)?\s*(?:A|W|VA))/i },
    { key: 'Operating Temperature', pattern: /(?:operating\s*temp(?:erature)?:?\s*)?(-?\d+°?[CF]?\s*(?:to|-)\s*-?\d+°?[CF]?)/i },
    { key: 'Certifications', pattern: /(UL|ETL|CE|FCC|RoHS|Energy\s*Star|DLC|Title\s*24|JA8)/gi },
    { key: 'Additional Features', pattern: /(?:features?:?\s*)(.+)/i },
  ];

  for (const { key, pattern } of patterns) {
    if (key === 'Certifications') {
      // For certifications, collect all matches
      const matches = description.match(pattern);
      if (matches && matches.length > 0) {
        specs[key] = [...new Set(matches.map(m => m.toUpperCase()))].join(', ');
      }
    } else {
      const match = description.match(pattern);
      if (match) {
        specs[key] = match[1];
      }
    }
  }

  // Add description as a fallback
  if (Object.keys(specs).length === 0) {
    specs['Description'] = description;
  }

  return specs;
}
