// ============================================================================
// Flow Submittals - State Management Hooks
// ============================================================================

import { useState, useCallback, useMemo } from 'react';
import type {
  Submittal,
  SubmittalItem,
  SpecSheet,
  HighlightDefinition,
  SubmittalSummary,
  SubmittalFilters,
  SpecSheetFilters,
  CreateSubmittalInput,
  CreateSubmittalItemInput,
  CreateSpecSheetInput,
  CreateHighlightInput,
  SpecSheetMatchStatus,
  SubmittalStatus,
} from '../types/submittals';
import { defaultSubmittalConfig } from '../types/submittals';
import {
  mockSubmittals,
  mockSpecSheets,
  mockHighlightDefinitions,
  getSubmittalSummaries,
  getSpecSheetsByManufacturer,
  getManufacturersWithSpecSheets,
  findHighlightDefinition,
  findSpecSheetWithHighlight,
  findSpecSheetByManufacturer,
} from '../data/submittals-mock';

// -----------------------------------------------------------------------------
// Submittals Hook
// -----------------------------------------------------------------------------

export function useSubmittals(filters?: SubmittalFilters) {
  const [submittals, setSubmittals] = useState<Submittal[]>(mockSubmittals);
  const [isLoading, setIsLoading] = useState(false);

  const filteredSubmittals = useMemo(() => {
    let result = [...submittals];

    if (filters?.status && filters.status.length > 0) {
      result = result.filter((s) => filters.status!.includes(s.status));
    }

    if (filters?.jobId) {
      result = result.filter((s) => s.jobId === filters.jobId);
    }

    if (filters?.customerId) {
      result = result.filter((s) =>
        s.customers.some((c) => c.contactId === filters.customerId)
      );
    }

    if (filters?.dateRange) {
      result = result.filter((s) => {
        const date = new Date(s.submittalDate);
        const start = new Date(filters.dateRange!.start);
        const end = new Date(filters.dateRange!.end);
        return date >= start && date <= end;
      });
    }

    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.jobName.toLowerCase().includes(query) ||
          s.items.some(
            (i) =>
              i.catalogNumber.toLowerCase().includes(query) ||
              i.manufacturer.toLowerCase().includes(query)
          )
      );
    }

    return result;
  }, [submittals, filters]);

  const summaries = useMemo((): SubmittalSummary[] => {
    return filteredSubmittals.map((s) => ({
      id: s.id,
      jobName: s.jobName,
      status: s.status,
      itemCount: s.items.length,
      currentRevision: s.currentRevision,
      submittalDate: s.submittalDate,
      updatedAt: s.updatedAt,
      customerName: s.customers[0]?.companyName,
      matchedCount: s.items.filter(
        (i) =>
          i.matchStatus === 'matched_with_highlight' ||
          i.matchStatus === 'matched_no_highlight'
      ).length,
      highlightedCount: s.items.filter(
        (i) => i.matchStatus === 'matched_with_highlight'
      ).length,
    }));
  }, [filteredSubmittals]);

  const createSubmittal = useCallback(
    (input: CreateSubmittalInput): Submittal => {
      const newSubmittal: Submittal = {
        id: `SUB-${String(submittals.length + 1).padStart(3, '0')}`,
        jobId: input.jobId,
        jobName: input.jobName,
        jobLocation: input.jobLocation,
        quoteIds: input.quoteIds || [],
        customers: input.customers || [],
        engineers: input.engineers || [],
        architects: input.architects || [],
        bidDate: input.bidDate,
        submittalDate: input.submittalDate || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'draft',
        currentRevision: 0,
        items: [],
        revisions: [],
        config: defaultSubmittalConfig,
        createdBy: 'Current User', // Would come from auth
        updatedBy: 'Current User',
      };

      setSubmittals((prev) => [...prev, newSubmittal]);
      return newSubmittal;
    },
    [submittals.length]
  );

  const updateSubmittal = useCallback(
    (id: string, updates: Partial<Submittal>): Submittal | undefined => {
      let updated: Submittal | undefined;
      setSubmittals((prev) =>
        prev.map((s) => {
          if (s.id === id) {
            updated = {
              ...s,
              ...updates,
              updatedAt: new Date().toISOString(),
              updatedBy: 'Current User',
            };
            return updated;
          }
          return s;
        })
      );
      return updated;
    },
    []
  );

  const deleteSubmittal = useCallback((id: string): boolean => {
    setSubmittals((prev) => prev.filter((s) => s.id !== id));
    return true;
  }, []);

  const updateSubmittalStatus = useCallback(
    (id: string, status: SubmittalStatus): void => {
      updateSubmittal(id, { status });
    },
    [updateSubmittal]
  );

  return {
    submittals: filteredSubmittals,
    summaries,
    isLoading,
    createSubmittal,
    updateSubmittal,
    deleteSubmittal,
    updateSubmittalStatus,
  };
}

// -----------------------------------------------------------------------------
// Single Submittal Hook
// -----------------------------------------------------------------------------

export function useSubmittal(id: string) {
  const [submittals, setSubmittals] = useState<Submittal[]>(mockSubmittals);
  const [isLoading, setIsLoading] = useState(false);

  const submittal = useMemo(
    () => submittals.find((s) => s.id === id),
    [submittals, id]
  );

  const addItem = useCallback(
    (input: CreateSubmittalItemInput): SubmittalItem | undefined => {
      if (!submittal) return undefined;

      // Auto-match spec sheet
      const match = findSpecSheetWithHighlight(input.manufacturer, input.catalogNumber);
      let matchStatus: SpecSheetMatchStatus = 'no_match';
      let specSheetId: string | undefined;
      let highlightDefinitionId: string | undefined;

      if (match) {
        matchStatus = 'matched_with_highlight';
        specSheetId = match.specSheet.id;
        highlightDefinitionId = match.highlight.id;
      } else {
        const specSheet = findSpecSheetByManufacturer(input.manufacturer);
        if (specSheet) {
          matchStatus = 'matched_no_highlight';
          specSheetId = specSheet.id;
        }
      }

      const newItem: SubmittalItem = {
        id: `SI-${Date.now()}`,
        submittalId: id,
        fixtureType: input.fixtureType,
        manufacturer: input.manufacturer,
        catalogNumber: input.catalogNumber,
        description: input.description,
        quantity: input.quantity,
        specSheetId,
        highlightDefinitionId,
        matchStatus,
        sortOrder: submittal.items.length + 1,
      };

      setSubmittals((prev) =>
        prev.map((s) => {
          if (s.id === id) {
            return {
              ...s,
              items: [...s.items, newItem],
              updatedAt: new Date().toISOString(),
            };
          }
          return s;
        })
      );

      return newItem;
    },
    [submittal, id]
  );

  const updateItem = useCallback(
    (itemId: string, updates: Partial<SubmittalItem>): void => {
      setSubmittals((prev) =>
        prev.map((s) => {
          if (s.id === id) {
            return {
              ...s,
              items: s.items.map((i) =>
                i.id === itemId ? { ...i, ...updates } : i
              ),
              updatedAt: new Date().toISOString(),
            };
          }
          return s;
        })
      );
    },
    [id]
  );

  const removeItem = useCallback(
    (itemId: string): void => {
      setSubmittals((prev) =>
        prev.map((s) => {
          if (s.id === id) {
            return {
              ...s,
              items: s.items.filter((i) => i.id !== itemId),
              updatedAt: new Date().toISOString(),
            };
          }
          return s;
        })
      );
    },
    [id]
  );

  const reorderItems = useCallback(
    (itemIds: string[]): void => {
      setSubmittals((prev) =>
        prev.map((s) => {
          if (s.id === id) {
            const itemMap = new Map(s.items.map((i) => [i.id, i]));
            const reorderedItems = itemIds
              .map((itemId, index) => {
                const item = itemMap.get(itemId);
                return item ? { ...item, sortOrder: index + 1 } : null;
              })
              .filter((i): i is SubmittalItem => i !== null);

            return {
              ...s,
              items: reorderedItems,
              updatedAt: new Date().toISOString(),
            };
          }
          return s;
        })
      );
    },
    [id]
  );

  const attachSpecSheet = useCallback(
    (itemId: string, specSheetId: string, highlightDefinitionId?: string): void => {
      const matchStatus: SpecSheetMatchStatus = highlightDefinitionId
        ? 'matched_with_highlight'
        : 'matched_no_highlight';

      updateItem(itemId, { specSheetId, highlightDefinitionId, matchStatus });
    },
    [updateItem]
  );

  return {
    submittal,
    isLoading,
    addItem,
    updateItem,
    removeItem,
    reorderItems,
    attachSpecSheet,
  };
}

// -----------------------------------------------------------------------------
// Spec Sheets Hook
// -----------------------------------------------------------------------------

export function useSpecSheets(filters?: SpecSheetFilters) {
  const [specSheets, setSpecSheets] = useState<SpecSheet[]>(mockSpecSheets);
  const [isLoading, setIsLoading] = useState(false);

  const filteredSpecSheets = useMemo(() => {
    let result = [...specSheets];

    if (filters?.manufacturer) {
      result = result.filter((s) => s.manufacturer === filters.manufacturer);
    }

    if (filters?.categories && filters.categories.length > 0) {
      result = result.filter((s) =>
        s.categories.some((c) => filters.categories!.includes(c))
      );
    }

    if (filters?.needsReview !== undefined) {
      result = result.filter((s) => s.needsReview === filters.needsReview);
    }

    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.displayName.toLowerCase().includes(query) ||
          s.fileName.toLowerCase().includes(query) ||
          s.manufacturer.toLowerCase().includes(query)
      );
    }

    return result;
  }, [specSheets, filters]);

  const groupedByManufacturer = useMemo(() => {
    const grouped: Record<string, SpecSheet[]> = {};
    filteredSpecSheets.forEach((sheet) => {
      if (!grouped[sheet.manufacturer]) {
        grouped[sheet.manufacturer] = [];
      }
      grouped[sheet.manufacturer].push(sheet);
    });
    return grouped;
  }, [filteredSpecSheets]);

  const manufacturers = useMemo(
    () => Array.from(new Set(specSheets.map((s) => s.manufacturer))).sort(),
    [specSheets]
  );

  const createSpecSheet = useCallback(
    (input: CreateSpecSheetInput): SpecSheet => {
      const newSpecSheet: SpecSheet = {
        id: `SS-${String(specSheets.length + 1).padStart(3, '0')}`,
        manufacturer: input.manufacturer,
        fileName: input.file?.name || `spec-sheet-${Date.now()}.pdf`,
        displayName: input.displayName || input.file?.name || 'New Spec Sheet',
        categories: input.categories,
        tags: [],
        uploadSource: input.uploadSource,
        sourceUrl: input.sourceUrl,
        fileUrl: `/spec-sheets/${input.file?.name || `spec-sheet-${Date.now()}.pdf`}`,
        fileSize: input.file?.size || 0,
        pageCount: 1, // Would be determined by actual PDF processing
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'Current User',
        needsReview: false,
        usageCount: 0,
        highlightCount: 0,
      };

      setSpecSheets((prev) => [...prev, newSpecSheet]);
      return newSpecSheet;
    },
    [specSheets.length]
  );

  const updateSpecSheet = useCallback(
    (id: string, updates: Partial<SpecSheet>): void => {
      setSpecSheets((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      );
    },
    []
  );

  const deleteSpecSheet = useCallback((id: string): boolean => {
    setSpecSheets((prev) => prev.filter((s) => s.id !== id));
    return true;
  }, []);

  const updateCategories = useCallback(
    (ids: string[], categories: SpecSheet['categories']): void => {
      setSpecSheets((prev) =>
        prev.map((s) => (ids.includes(s.id) ? { ...s, categories } : s))
      );
    },
    []
  );

  return {
    specSheets: filteredSpecSheets,
    groupedByManufacturer,
    manufacturers,
    isLoading,
    createSpecSheet,
    updateSpecSheet,
    deleteSpecSheet,
    updateCategories,
  };
}

// -----------------------------------------------------------------------------
// Highlight Definitions Hook
// -----------------------------------------------------------------------------

export function useHighlightDefinitions(specSheetId?: string) {
  const [highlights, setHighlights] = useState<HighlightDefinition[]>(
    mockHighlightDefinitions
  );
  const [isLoading, setIsLoading] = useState(false);

  const filteredHighlights = useMemo(() => {
    if (!specSheetId) return highlights;
    return highlights.filter((h) => h.specSheetId === specSheetId);
  }, [highlights, specSheetId]);

  const findByCatalogNumber = useCallback(
    (manufacturer: string, catalogNumber: string): HighlightDefinition | undefined => {
      return highlights.find(
        (h) => h.manufacturer === manufacturer && h.catalogNumber === catalogNumber
      );
    },
    [highlights]
  );

  const createHighlight = useCallback(
    (input: CreateHighlightInput): HighlightDefinition => {
      const newHighlight: HighlightDefinition = {
        id: `HD-${String(highlights.length + 1).padStart(3, '0')}`,
        specSheetId: input.specSheetId,
        catalogNumber: input.catalogNumber,
        manufacturer: input.manufacturer,
        regions: input.regions.map((r, i) => ({
          ...r,
          id: `HR-${Date.now()}-${i}`,
        })),
        createdAt: new Date().toISOString(),
        createdBy: 'Current User',
        updatedAt: new Date().toISOString(),
        updatedBy: 'Current User',
      };

      setHighlights((prev) => [...prev, newHighlight]);
      return newHighlight;
    },
    [highlights.length]
  );

  const updateHighlight = useCallback(
    (id: string, updates: Partial<HighlightDefinition>): void => {
      setHighlights((prev) =>
        prev.map((h) =>
          h.id === id
            ? {
                ...h,
                ...updates,
                updatedAt: new Date().toISOString(),
                updatedBy: 'Current User',
              }
            : h
        )
      );
    },
    []
  );

  const deleteHighlight = useCallback((id: string): boolean => {
    setHighlights((prev) => prev.filter((h) => h.id !== id));
    return true;
  }, []);

  // Learn All - save highlights for multiple items at once
  const learnAll = useCallback(
    (
      items: Array<{
        specSheetId: string;
        catalogNumber: string;
        manufacturer: string;
        regions: CreateHighlightInput['regions'];
      }>
    ): { created: number; updated: number } => {
      let created = 0;
      let updated = 0;

      items.forEach((item) => {
        const existing = findByCatalogNumber(item.manufacturer, item.catalogNumber);
        if (existing) {
          updateHighlight(existing.id, { regions: item.regions.map((r, i) => ({ ...r, id: `HR-${Date.now()}-${i}` })) });
          updated++;
        } else {
          createHighlight(item);
          created++;
        }
      });

      return { created, updated };
    },
    [findByCatalogNumber, createHighlight, updateHighlight]
  );

  return {
    highlights: filteredHighlights,
    isLoading,
    findByCatalogNumber,
    createHighlight,
    updateHighlight,
    deleteHighlight,
    learnAll,
  };
}

// -----------------------------------------------------------------------------
// Submittal from Quote Hook
// -----------------------------------------------------------------------------

interface QuoteLineItem {
  id: string;
  productNumber: string;
  description: string;
  quantity: number;
  manufacturers: Array<{ name: string }>;
  sectionName?: string;
}

interface Quote {
  id: string;
  name: string;
  jobId?: string;
  jobName?: string;
  soldToCustomer?: string;
  expirationDate?: string;
}

export function useSubmittalFromQuote() {
  const { createSubmittal } = useSubmittals();

  const createFromQuote = useCallback(
    (
      quote: Quote,
      selectedLineItems: QuoteLineItem[],
      jobLocation?: string
    ): Submittal => {
      // Create the submittal
      const submittal = createSubmittal({
        jobId: quote.jobId,
        jobName: quote.jobName || quote.name,
        jobLocation,
        quoteIds: [quote.id],
        bidDate: quote.expirationDate,
      });

      // Add items from quote line items
      // Note: In a real implementation, this would be handled atomically
      // For now, items are added through the useSubmittal hook separately

      return submittal;
    },
    [createSubmittal]
  );

  const autoMatchItems = useCallback(
    (
      lineItems: QuoteLineItem[]
    ): Array<{
      lineItem: QuoteLineItem;
      matchStatus: SpecSheetMatchStatus;
      specSheet?: SpecSheet;
      highlight?: HighlightDefinition;
    }> => {
      return lineItems.map((lineItem) => {
        const manufacturer = lineItem.manufacturers[0]?.name || '';
        const match = findSpecSheetWithHighlight(manufacturer, lineItem.productNumber);

        if (match) {
          return {
            lineItem,
            matchStatus: 'matched_with_highlight' as const,
            specSheet: match.specSheet,
            highlight: match.highlight,
          };
        }

        const specSheet = findSpecSheetByManufacturer(manufacturer);
        if (specSheet) {
          return {
            lineItem,
            matchStatus: 'matched_no_highlight' as const,
            specSheet,
          };
        }

        return {
          lineItem,
          matchStatus: 'no_match' as const,
        };
      });
    },
    []
  );

  return {
    createFromQuote,
    autoMatchItems,
  };
}

// -----------------------------------------------------------------------------
// Submittals for Quote Hook (get submittals linked to a specific quote)
// -----------------------------------------------------------------------------

export function useSubmittalsForQuote(quoteId: string) {
  const { submittals, summaries } = useSubmittals();

  const quoteSubmittals = useMemo(
    () => submittals.filter((s) => s.quoteIds.includes(quoteId)),
    [submittals, quoteId]
  );

  const quoteSummaries = useMemo(
    () => summaries.filter((s) => quoteSubmittals.some((qs) => qs.id === s.id)),
    [summaries, quoteSubmittals]
  );

  return {
    submittals: quoteSubmittals,
    summaries: quoteSummaries,
  };
}
