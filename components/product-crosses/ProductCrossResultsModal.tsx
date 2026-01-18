/**
 * Product Cross Results Modal
 * Shows columnar comparison view with original product vs cross alternatives
 * Based on flowdemos Enhanced Product View design
 * Integrated with flow-ai backend for AI-powered cross search
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  crossProducts,
  createKnownProductCross,
  type ProductCrossTypeEnum,
  type CrossPromptTemplate,
  getCrossPromptTemplates,
  createCrossPromptTemplate,
  incrementCrossPromptTemplateUsage,
  deleteCrossPromptTemplate,
} from '../lib/graphql/product-crosses';
import {
  type CrossResult,
  type ProductCrossResultsModalProps,
  mapCrossTypeToApi,
  mapCrossTypeFromApi,
  parseSpecifications,
  extractPartNumber,
  CrossResultsTable,
  SavePromptModal,
  TemplatesModal,
  RerunSections,
} from './modal';

export function ProductCrossResultsModal({
  isOpen,
  cross,
  onClose,
  onSave,
  onDelete,
  onRefresh,
  isSaving = false,
}: ProductCrossResultsModalProps) {
  // View state
  const [isTransposed, setIsTransposed] = useState(true);
  const [crossTypes, setCrossTypes] = useState<string[]>(['direct', 'upgrade', 'value']);
  const [promptInstructions, setPromptInstructions] = useState('');
  const [selectedResultIds, setSelectedResultIds] = useState<Set<string>>(new Set());
  const [deletedAiIds, setDeletedAiIds] = useState<Set<string>>(new Set());
  const [isSavingSelected, setIsSavingSelected] = useState(false);
  const [isSearchingByPrompt, setIsSearchingByPrompt] = useState(false);
  const [isSearchingByFilters, setIsSearchingByFilters] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
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
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);

  const isSearching = isSearchingByPrompt || isSearchingByFilters;

  // Build cross results
  const crossResults: CrossResult[] = useMemo(() => {
    const results: CrossResult[] = [
      {
        id: cross.id,
        productName: cross.ourPartNumber,
        manufacturer: cross.ourManufacturer,
        partNumber: cross.ourPartNumber,
        description: cross.ourDescription,
        crossType: 'direct',
        source: 'known',
        reasoning: `Known cross from database. Used ${cross.timesUsed} times.`,
        isSelected: selectedResultIds.has(cross.id),
        specifications: parseSpecifications(cross.ourDescription),
      },
    ];
    results.push(...aiAlternatives
      .filter(alt => !deletedAiIds.has(alt.id))
      .map(alt => ({ ...alt, isSelected: selectedResultIds.has(alt.id) })));
    return results;
  }, [cross, selectedResultIds, aiAlternatives, deletedAiIds]);

  const selectedCount = selectedResultIds.size;

  const originalProduct = useMemo(() => ({
    name: cross.competitorPartNumber,
    manufacturer: cross.competitorManufacturer,
    partNumber: cross.competitorPartNumber,
    description: cross.competitorDescription,
    specifications: parseSpecifications(cross.competitorDescription),
  }), [cross]);

  // Handlers
  const handleToggleCrossType = useCallback((type: string) => {
    setCrossTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  }, []);

  const handleSelectResult = useCallback((resultId: string) => {
    setSelectedResultIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resultId)) newSet.delete(resultId);
      else newSet.add(resultId);
      return newSet;
    });
  }, []);

  const handleDeleteResult = useCallback((resultId: string) => {
    if (resultId.startsWith('ai-')) {
      setDeletedAiIds(prev => new Set([...prev, resultId]));
      if (selectedResultIds.has(resultId)) {
        setSelectedResultIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(resultId);
          return newSet;
        });
      }
    } else {
      onDelete?.(resultId);
    }
  }, [selectedResultIds, onDelete]);

  // Search handler
  const searchForCrosses = useCallback(async (types: string[], source: 'prompt' | 'filters', customPrompts?: string[]) => {
    if (source === 'prompt') setIsSearchingByPrompt(true);
    else setIsSearchingByFilters(true);
    setSearchError(null);
    // Clear selections when rerunning - old IDs won't exist in new results
    setSelectedResultIds(new Set());
    setDeletedAiIds(new Set());

    try {
      const productToSearch = {
        name: `${cross.competitorManufacturer} ${cross.competitorPartNumber}`.trim(),
        manufacturer: cross.competitorManufacturer,
        part_number: cross.competitorPartNumber,
        description: cross.competitorDescription,
      };
      const apiTypes: ProductCrossTypeEnum[] = types.map(mapCrossTypeToApi);
      const results = await crossProducts([productToSearch], apiTypes, customPrompts);

      const newAlternatives: CrossResult[] = [];
      for (const result of results) {
        for (const crossResult of result.crosses) {
          for (const alt of crossResult.alternatives) {
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
      setSearchError(error instanceof Error ? error.message : 'Failed to search for crosses');
    } finally {
      if (source === 'prompt') setIsSearchingByPrompt(false);
      else setIsSearchingByFilters(false);
    }
  }, [cross]);

  const handleRerunWithPrompt = useCallback(() => {
    if (!promptInstructions.trim()) return;
    searchForCrosses(crossTypes, 'prompt', [promptInstructions]);
  }, [promptInstructions, crossTypes, searchForCrosses]);

  const handleRerunWithFilters = useCallback(() => {
    if (crossTypes.length === 0) return;
    searchForCrosses(crossTypes, 'filters');
  }, [crossTypes, searchForCrosses]);

  // Template handlers
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

  const handleOpenTemplates = useCallback(() => {
    loadTemplates();
    setTemplateSearchQuery('');
    setShowTemplatesModal(true);
  }, [loadTemplates]);

  const filteredTemplates = useMemo(() => {
    if (!templateSearchQuery.trim()) return templates;
    const query = templateSearchQuery.toLowerCase();
    return templates.filter(t =>
      t.name.toLowerCase().includes(query) ||
      t.prompt.toLowerCase().includes(query) ||
      (t.description && t.description.toLowerCase().includes(query))
    );
  }, [templates, templateSearchQuery]);

  const handleSelectTemplate = useCallback(async (template: CrossPromptTemplate) => {
    setPromptInstructions(template.prompt);
    setShowTemplatesModal(false);
    try {
      await incrementCrossPromptTemplateUsage(template.id);
    } catch (error) {
      console.error('Error incrementing template usage:', error);
    }
  }, []);

  const handleDeleteTemplate = useCallback(async (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    setDeletingTemplateId(templateId);
    try {
      const success = await deleteCrossPromptTemplate(templateId);
      if (success) setTemplates(prev => prev.filter(t => t.id !== templateId));
      else setSearchError('Failed to delete template');
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Failed to delete template');
    } finally {
      setDeletingTemplateId(null);
    }
  }, []);

  const handleOpenSavePrompt = useCallback(() => {
    if (!promptInstructions.trim()) {
      setSearchError('Please enter a prompt before saving');
      return;
    }
    setSavePromptName('');
    setSavePromptDescription('');
    setShowSavePromptModal(true);
  }, [promptInstructions]);

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
      setSearchError(error instanceof Error ? error.message : 'Failed to save prompt template');
    } finally {
      setIsSavingPrompt(false);
    }
  }, [savePromptName, savePromptDescription, promptInstructions]);

  // Save selected
  const handleSaveSelected = useCallback(async () => {
    if (selectedCount === 0) return;
    setIsSavingSelected(true);
    let savedCount = 0;
    let failedCount = 0;

    const selectedResults = crossResults.filter(r => selectedResultIds.has(r.id));
    for (const result of selectedResults) {
      try {
        if (result.source === 'ai') {
          await createKnownProductCross({
            competitorManufacturer: cross.competitorManufacturer,
            competitorPartNumber: cross.competitorPartNumber,
            competitorDescription: cross.competitorDescription,
            ourManufacturer: result.manufacturer,
            ourPartNumber: result.partNumber,
            ourDescription: result.description,
          });
          savedCount++;
        } else {
          onSave({
            ...cross,
            ourManufacturer: result.manufacturer,
            ourPartNumber: result.partNumber,
            ourDescription: result.description,
          });
          savedCount++;
        }
      } catch (error) {
        console.error('Error saving cross:', error);
        failedCount++;
      }
    }

    setIsSavingSelected(false);
    if (failedCount === 0) {
      onRefresh?.();
      onClose();
    } else {
      setSearchError(`Saved ${savedCount}, failed ${failedCount}`);
    }
  }, [selectedCount, crossResults, selectedResultIds, cross, onSave, onRefresh, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Product Crosses</h2>
            <p className="text-sm text-gray-500 mt-1">Find direct, upgrade, and value-engineered crosses for your products</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Cross Results Card */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Cross Results</h3>
                <p className="text-sm text-gray-500">{crossResults.length} {crossResults.length === 1 ? 'cross found' : 'crosses found'} (plus original product)</p>
              </div>
              <ViewToggle isTransposed={isTransposed} onToggle={setIsTransposed} />
            </div>
            <div className="overflow-x-auto">
              <CrossResultsTable
                isTransposed={isTransposed}
                crossResults={crossResults}
                originalProduct={originalProduct}
                selectedResultIds={selectedResultIds}
                onSelectResult={handleSelectResult}
                onDeleteResult={handleDeleteResult}
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end bg-gray-50">
              <button
                onClick={handleSaveSelected}
                disabled={isSaving || isSavingSelected || selectedCount === 0}
                className="px-6 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isSavingSelected ? <LoadingSpinner /> : <SaveIcon />}
                {isSavingSelected ? 'Saving...' : `Save Selected${selectedCount > 0 ? ` (${selectedCount})` : ''}`}
              </button>
            </div>
          </div>

          {/* Error */}
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

          {/* Rerun Sections */}
          <RerunSections
            promptInstructions={promptInstructions}
            crossTypes={crossTypes}
            isSearching={isSearching}
            isSearchingByPrompt={isSearchingByPrompt}
            isSearchingByFilters={isSearchingByFilters}
            onPromptChange={setPromptInstructions}
            onToggleCrossType={handleToggleCrossType}
            onRerunWithPrompt={handleRerunWithPrompt}
            onRerunWithFilters={handleRerunWithFilters}
            onOpenSavePrompt={handleOpenSavePrompt}
            onOpenTemplates={handleOpenTemplates}
          />
        </div>

        {/* Modals */}
        <SavePromptModal
          isOpen={showSavePromptModal}
          promptInstructions={promptInstructions}
          savePromptName={savePromptName}
          savePromptDescription={savePromptDescription}
          isSavingPrompt={isSavingPrompt}
          onNameChange={setSavePromptName}
          onDescriptionChange={setSavePromptDescription}
          onSave={handleSavePrompt}
          onClose={() => setShowSavePromptModal(false)}
        />
        <TemplatesModal
          isOpen={showTemplatesModal}
          templates={templates}
          filteredTemplates={filteredTemplates}
          isLoadingTemplates={isLoadingTemplates}
          templateSearchQuery={templateSearchQuery}
          deletingTemplateId={deletingTemplateId}
          onSearchChange={setTemplateSearchQuery}
          onSelectTemplate={handleSelectTemplate}
          onDeleteTemplate={handleDeleteTemplate}
          onClose={() => setShowTemplatesModal(false)}
        />
      </div>
    </div>
  );
}

// Helper components
function ViewToggle({ isTransposed, onToggle }: { isTransposed: boolean; onToggle: (value: boolean) => void }) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => onToggle(true)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${isTransposed ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        Enhanced View
      </button>
      <button
        onClick={() => onToggle(false)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${!isTransposed ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
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
  );
}

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
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
  );
}
