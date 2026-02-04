'use client';

import { useState, useCallback } from 'react';
import type { HighlightRegion } from '../../../lib/types/submittals';

interface UseAiHighlightParams {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  addDrawingRegions: (regions: HighlightRegion[]) => void;
}

export function useAiHighlight({
  currentPage,
  setCurrentPage,
  addDrawingRegions,
}: UseAiHighlightParams) {
  const [aiHighlightPrompt, setAiHighlightPrompt] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleAiHighlight = useCallback(async () => {
    if (!aiHighlightPrompt.trim()) return;

    setIsAiProcessing(true);
    setAiError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const prompt = aiHighlightPrompt.toLowerCase();
      const newRegions: HighlightRegion[] = [];

      if (prompt.includes('wattage') || prompt.includes('watt') || prompt.includes('power')) {
        newRegions.push({
          id: `ai-${Date.now()}-1`,
          pageNumber: 1,
          x: 10, y: 55, width: 35, height: 8,
          shape: 'rectangle',
          color: '#FFEB3B',
          annotation: 'Wattage/Power specs',
        });
      }

      if (prompt.includes('dimension') || prompt.includes('size') || prompt.includes('measurement')) {
        newRegions.push({
          id: `ai-${Date.now()}-2`,
          pageNumber: 1,
          x: 52, y: 20, width: 45, height: 35,
          shape: 'rectangle',
          color: '#2196F3',
          annotation: 'Product dimensions',
        });
      }

      if (prompt.includes('lumen') || prompt.includes('output') || prompt.includes('brightness')) {
        newRegions.push({
          id: `ai-${Date.now()}-3`,
          pageNumber: 1,
          x: 10, y: 52, width: 35, height: 6,
          shape: 'rectangle',
          color: '#4CAF50',
          annotation: 'Lumen output',
        });
      }

      if (prompt.includes('cct') || prompt.includes('temperature') || prompt.includes('kelvin')) {
        newRegions.push({
          id: `ai-${Date.now()}-4`,
          pageNumber: 1,
          x: 52, y: 58, width: 25, height: 8,
          shape: 'rectangle',
          color: '#FF5722',
          annotation: 'Color temperature',
        });
      }

      if (prompt.includes('feature') || prompt.includes('specification') || prompt.includes('spec')) {
        newRegions.push({
          id: `ai-${Date.now()}-5`,
          pageNumber: 1,
          x: 10, y: 28, width: 35, height: 20,
          shape: 'rectangle',
          color: '#E91E63',
          annotation: 'Features section',
        });
      }

      if (prompt.includes('install') || prompt.includes('mounting')) {
        newRegions.push({
          id: `ai-${Date.now()}-6`,
          pageNumber: 1,
          x: 10, y: 42, width: 35, height: 10,
          shape: 'rectangle',
          color: '#9C27B0',
          annotation: 'Installation info',
        });
      }

      if (newRegions.length === 0) {
        newRegions.push({
          id: `ai-${Date.now()}-generic`,
          pageNumber: 1,
          x: 10, y: 15, width: 40, height: 15,
          shape: 'rectangle',
          color: '#FFEB3B',
          annotation: `AI found: "${aiHighlightPrompt}"`,
        });
      }

      addDrawingRegions(newRegions);
      setAiHighlightPrompt('');

      if (newRegions.length > 0 && newRegions[0].pageNumber !== currentPage) {
        setCurrentPage(newRegions[0].pageNumber);
      }
    } catch (error) {
      setAiError('Failed to process AI highlighting. Please try again.');
    } finally {
      setIsAiProcessing(false);
    }
  }, [aiHighlightPrompt, currentPage, setCurrentPage, addDrawingRegions]);

  return {
    aiHighlightPrompt,
    setAiHighlightPrompt,
    isAiProcessing,
    aiError,
    handleAiHighlight,
  };
}
