'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import { TakeoffDetailView } from '@/components/takeoffs/views/TakeoffDetailView';
import { fetchTakeoff, updateTakeoffDocument, updateTakeoff, abridgeDocument as abridgeDocumentAPI, parseScheduleDocument } from '@/components/lib/graphql/takeoffs';
import { crossProducts, createKnownProductCross } from '@/components/lib/graphql/product-crosses';
import type { Takeoff, TakeoffDocument, ParsedItem, TakeoffStep, PageAnalysis } from '@/components/takeoffs/types';
import { transformTakeoffResponse, stepToApiStatus, transformDocumentResponse } from '@/components/takeoffs/types';
import { getInitialStep } from '@/components/takeoffs/utils';
import { AbridgmentReportModal } from '@/components/takeoffs/modals/AbridgmentReportModal';
import { CreateQuoteFromTakeoffModal } from '@/components/takeoffs/modals/CreateQuoteFromTakeoffModal';
import { showWarningToast, showInfoToast } from '@/components/lib/toast';
import JSZip from 'jszip';

// Abridgement state per document
interface DocumentAbridgeState {
  isProcessing: boolean;
  error?: string;
}

export default function TakeoffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const takeoffId = params.id as string;

  const [takeoff, setTakeoff] = useState<Takeoff | null>(null);
  const [documents, setDocuments] = useState<TakeoffDocument[]>([]);
  const documentsRef = useRef<TakeoffDocument[]>([]); // Ref to always have latest documents
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [currentStep, setCurrentStep] = useState<TakeoffStep>('classification');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Abridgement state per document
  const [documentAbridgeState, setDocumentAbridgeState] = useState<Record<string, DocumentAbridgeState>>({});

  // Modal state for viewing abridgment report
  const [showAbridgmentReport, setShowAbridgmentReport] = useState(false);
  const [selectedDocumentForReport, setSelectedDocumentForReport] = useState<TakeoffDocument | null>(null);

  // Modal state for creating quote from takeoff
  const [showCreateQuoteModal, setShowCreateQuoteModal] = useState(false);

  // Parsing state
  const [isParsingProcessing, setIsParsingProcessing] = useState(false);
  const isParsingRef = useRef(false); // Ref to track parsing state
  const [parsingProgress, setParsingProgress] = useState(0);
  const [parsingMessage, setParsingMessage] = useState<string | null>(null);
  const parsedItemsRef = useRef<ParsedItem[]>([]); // Ref to track parsed items

  // Per-item crossing state (tracks which items are being crossed)
  const [itemCrossingState, setItemCrossingState] = useState<Record<string, { isProcessing: boolean; error?: string }>>({});

  // Cross All processing state (separate from individual item states)
  const [isCrossAllProcessing, setIsCrossAllProcessing] = useState(false);

  const loadTakeoff = useCallback(async () => {
    if (!takeoffId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchTakeoff(takeoffId);
      if (response) {
        const transformed = transformTakeoffResponse(response);
        setTakeoff(transformed);
        setCurrentStep(getInitialStep(transformed.status));

        if (response.documents && response.documents.length > 0) {
          const docs: TakeoffDocument[] = response.documents.map(transformDocumentResponse);
          setDocuments(docs);

          const allParsedItems: ParsedItem[] = [];
          docs.forEach(doc => {
            if (doc.parsedItems && doc.parsedItems.length > 0) {
              allParsedItems.push(...doc.parsedItems);
            }
          });
          setParsedItems(allParsedItems);
        }
      }
    } catch (err) {
      console.error('Failed to fetch takeoff:', err);
      setError(err instanceof Error ? err.message : 'Failed to load takeoff');
    } finally {
      setIsLoading(false);
    }
  }, [takeoffId]);

  useEffect(() => {
    loadTakeoff();
  }, [loadTakeoff]);

  // Keep refs in sync with state
  useEffect(() => {
    documentsRef.current = documents;
  }, [documents]);

  useEffect(() => {
    parsedItemsRef.current = parsedItems;
  }, [parsedItems]);

  useEffect(() => {
    isParsingRef.current = isParsingProcessing;
  }, [isParsingProcessing]);

  const handleBack = () => {
    router.push('/take-offs');
  };

  const handleStepChange = async (step: TakeoffStep) => {
    setCurrentStep(step);
    if (takeoff) {
      const apiStatus = stepToApiStatus[step];
      if (apiStatus) {
        try {
          await updateTakeoff(takeoff.id, { status: apiStatus });
        } catch (err) {
          console.error('Failed to update status:', err);
        }
      }
    }
  };

  // Handler specifically for "Proceed to Parsing" button - changes step AND triggers parsing
  const handleProceedToParsing = async () => {
    setCurrentStep('parsing');
    if (takeoff) {
      try {
        await updateTakeoff(takeoff.id, { status: 'PARSING' });
      } catch (err) {
        console.warn('Failed to update takeoff status:', err);
      }
    }
    // Auto-trigger parsing when proceeding from classification (use refs for latest values)
    const currentParsedItems = parsedItemsRef.current;
    const currentIsProcessing = isParsingRef.current;

    if (currentParsedItems.length === 0 && !currentIsProcessing) {
      // Call directly instead of setTimeout to avoid closure issues
      handleParseSchedules();
    }
  };

  const handleClassify = async (docId: string, classification: string | null) => {
    setDocuments(docs =>
      docs.map(d => d.id === docId ? { ...d, classification: (classification || '') as TakeoffDocument['classification'] } : d)
    );
    try {
      await updateTakeoffDocument(docId, { classification });
    } catch (err) {
      console.error('Failed to persist classification:', err);
    }
  };

  const handleChangeDiscipline = async (docId: string, discipline: string | null) => {
    setDocuments(docs =>
      docs.map(d => d.id === docId ? { ...d, discipline: (discipline || '') as TakeoffDocument['discipline'] } : d)
    );
    try {
      await updateTakeoffDocument(docId, { discipline });
    } catch (err) {
      console.error('Failed to persist discipline:', err);
    }
  };

  const handleToggleSelect = (itemId: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleSelectAll = (select: boolean) => {
    if (select) {
      setSelectedItems(new Set(parsedItems.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleDownloadDocument = async (doc: TakeoffDocument) => {
    // Use abridged URL if available, otherwise use original
    const urlToDownload = doc.abridgedUrl || doc.documentUrl;
    if (!urlToDownload) {
      console.error('Document URL not available');
      return;
    }
    try {
      const proxyUrl = `/api/document-proxy?url=${encodeURIComponent(urlToDownload)}&filename=${encodeURIComponent(doc.name)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        console.error('Proxy failed, opening in new tab');
        window.open(urlToDownload, '_blank');
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.name;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(urlToDownload, '_blank');
    }
  };

  const handleDownloadAllDocuments = async () => {
    const docsWithUrls = documents.filter(d => d.documentUrl || d.abridgedUrl);
    if (docsWithUrls.length === 0) {
      console.warn('No documents available for download');
      return;
    }

    // Create ZIP file with all documents
    const zip = new JSZip();
    const takeoffName = takeoff?.title || 'takeoff';

    // Track progress
    let downloaded = 0;
    const total = docsWithUrls.length;

    // Download each document through our proxy API
    const downloadPromises = docsWithUrls.map(async (doc) => {
      try {
        // Use abridged URL if available, otherwise use original
        const urlToDownload = doc.abridgedUrl || doc.documentUrl!;
        // Use our proxy API to avoid CORS issues
        const proxyUrl = `/api/document-proxy?url=${encodeURIComponent(urlToDownload)}`;
        const response = await fetch(proxyUrl);

        if (!response.ok) {
          console.error(`Failed to download ${doc.name}: ${response.status}`);
          return;
        }

        const blob = await response.blob();

        // Get file extension from URL or default to .pdf
        const urlPath = new URL(urlToDownload).pathname;
        const extension = urlPath.includes('.') ? urlPath.substring(urlPath.lastIndexOf('.')) : '.pdf';
        const fileName = doc.name.endsWith(extension) ? doc.name : `${doc.name}${extension}`;

        // Add to ZIP
        zip.file(fileName, blob);
        downloaded++;
      } catch (error) {
        console.error(`Error downloading ${doc.name}:`, error);
      }
    });

    // Wait for all downloads to complete
    await Promise.all(downloadPromises);

    if (downloaded === 0) {
      console.error('No documents were successfully downloaded');
      return;
    }

    // Generate ZIP and trigger download
    const content = await zip.generateAsync({ type: 'blob' });

    // Create download link
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${takeoffName.replace(/[^a-zA-Z0-9-_]/g, '_')}_documents.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Abridge a single document using AI
  const handleAbridgeDocument = async (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc || !doc.documentUrl) {
      console.error('Document not found or has no URL');
      return;
    }

    // Set processing state
    setDocumentAbridgeState(prev => ({
      ...prev,
      [docId]: { isProcessing: true, error: undefined },
    }));

    try {
      const result = await abridgeDocumentAPI(
        doc.documentUrl,
        doc.name,
        ['Extract relevant product and fixture information', 'Keep pages with specifications and schedules']
      );

      if (result.success) {
        const actualPages = result.originalPages || doc.pages;
        // Only use abridgedUrl if a new PDF was actually generated
        const effectiveAbridgedUrl = result.wasAbridged ? result.abridgedUrl : undefined;

        // Update document with abridgement results
        setDocuments(docs =>
          docs.map(d =>
            d.id === docId
              ? {
                  ...d,
                  pages: actualPages,
                  abridged: true,
                  abridgedPages: result.abridgedPages || actualPages,
                  reductionPercentage: result.reductionPercentage || 0,
                  abridgedUrl: effectiveAbridgedUrl || undefined,
                  pageAnalyses: result.pageAnalyses as PageAnalysis[] || undefined,
                }
              : d
          )
        );

        // Persist to backend - only save abridgedUrl if a new PDF was generated
        // Use same fallback values as state update to ensure DB consistency
        const persistAbridgedPages = result.abridgedPages || actualPages;
        await updateTakeoffDocument(docId, {
          pages: actualPages,
          abridged: true,
          abridgedPages: persistAbridgedPages,
          abridgedUrl: effectiveAbridgedUrl || null,
          reductionPercentage: result.reductionPercentage,
          pageAnalyses: result.pageAnalyses,
        });

        // Clear processing state on success
        setDocumentAbridgeState(prev => ({
          ...prev,
          [docId]: { isProcessing: false },
        }));

        // Update takeoff status to Abridgment when document is successfully processed
        // This ensures status reflects actual work done (shown in UI as abridgement results)
        if (takeoff && takeoff.status !== 'Complete' && takeoff.status !== 'Abridgment') {
          try {
            await updateTakeoff(takeoff.id, { status: 'ABRIDGMENT' });
            setTakeoff(prev => prev ? { ...prev, status: 'Abridgment' } : null);
          } catch (statusErr) {
            console.error('[page.tsx handleAbridgeDocument] Failed to update status:', statusErr);
          }
        }
      } else {
        // Set error state
        setDocumentAbridgeState(prev => ({
          ...prev,
          [docId]: { isProcessing: false, error: result.error || 'Abridgement failed' },
        }));
      }
    } catch (err) {
      console.error('Failed to abridge document:', err);
      setDocumentAbridgeState(prev => ({
        ...prev,
        [docId]: { isProcessing: false, error: err instanceof Error ? err.message : 'Abridgement failed' },
      }));
    }
  };

  // Abridge all documents that haven't been abridged yet
  const handleAbridgeAll = async () => {
    // Only process documents that haven't been abridged yet
    const unabridgedDocs = documents.filter(d => d.documentUrl && d.pages > 0 && !d.abridged);
    for (const doc of unabridgedDocs) {
      await handleAbridgeDocument(doc.id);
    }
    // Status update is handled in handleAbridgeDocument when each document succeeds
  };

  // View abridgment report for a document
  const handleViewReport = (doc: TakeoffDocument) => {
    setSelectedDocumentForReport(doc);
    setShowAbridgmentReport(true);
  };

  // Parse schedule documents to extract product items
  const handleParseSchedules = async () => {
    // Use ref to get the latest documents (avoid stale closure)
    const currentDocs = documentsRef.current;

    // Get all documents with URLs
    const scheduleDocs = currentDocs.filter(d =>
      d.abridgedUrl || d.documentUrl
    );

    if (scheduleDocs.length === 0) {
      console.warn('No documents available for parsing');
      setParsingMessage('No documents available. Please upload documents first.');
      return;
    }

    setIsParsingProcessing(true);
    setParsingProgress(0);
    setParsingMessage(null);

    const allParsedItems: ParsedItem[] = [];

    for (let i = 0; i < scheduleDocs.length; i++) {
      const doc = scheduleDocs[i];
      try {
        // Use abridged URL if available, otherwise use original
        const urlToUse = doc.abridgedUrl || doc.documentUrl;
        if (!urlToUse) continue;

        const items = await parseScheduleDocument(urlToUse, doc.name, doc.id);
        allParsedItems.push(...items);

        // Persist parsed items to the document in backend
        if (items.length > 0) {
          try {
            await updateTakeoffDocument(doc.id, { parsedItems: items });
          } catch (persistErr) {
            console.error(`Failed to persist parsed items for ${doc.name}:`, persistErr);
          }
        }
      } catch (err) {
        console.error(`Failed to parse ${doc.name}:`, err);
      }
      setParsingProgress(Math.round(((i + 1) / scheduleDocs.length) * 100));
    }

    setParsedItems(allParsedItems);
    setIsParsingProcessing(false);

    // Set message if no items were found after parsing
    if (allParsedItems.length === 0) {
      setParsingMessage(`Parsed ${scheduleDocs.length} document(s) but no product items were found. Product extraction works with Schedule documents (Fixture Schedules, Panel Schedules, Lighting Schedules) that contain structured product tables.`);
    }
  };

  // Cross a single parsed item using AI (allows re-crossing)
  const handleCrossItem = async (itemId: string) => {
    const item = parsedItems.find(i => i.id === itemId);
    if (!item || item.isOurManufacturer) {
      return;
    }

    // Set processing state for this item
    setItemCrossingState(prev => ({
      ...prev,
      [itemId]: { isProcessing: true, error: undefined },
    }));

    try {
      // Prepare product data for crossing (using snake_case as expected by backend)
      const productToMatch = {
        name: `${item.manufacturer} ${item.partNumber}`.trim(),
        manufacturer: item.manufacturer,
        part_number: item.partNumber,
        description: item.description,
        quantity: item.quantity,
      };

      // Call the cross products API
      const results = await crossProducts(
        [productToMatch],
        ['SIMPLE', 'UPGRADE', 'VALUE']
      );

      if (results && results.length > 0 && results[0].crosses && results[0].crosses.length > 0) {
        const cross = results[0].crosses[0];
        const alternative = cross.alternatives?.[0];

        if (alternative) {
          // Update the parsed item with crossed information
          // alternative has: name, description, price, source, crossType
          const crossedItem = {
            ...item,
            isCrossed: true,
            crossedManufacturer: 'Our Company',
            crossedPartNumber: alternative.name || '',
            crossedDescription: alternative.description || `${item.description} (Crossed)`,
          };

          // Update local state
          setParsedItems(items =>
            items.map(i => i.id === itemId ? crossedItem : i)
          );

          // Persist to known_product_crosses silently (no toast)
          createKnownProductCross({
            competitorManufacturer: item.manufacturer,
            competitorPartNumber: item.partNumber,
            competitorDescription: item.description || '',
            ourManufacturer: crossedItem.crossedManufacturer || 'Our Company',
            ourPartNumber: crossedItem.crossedPartNumber || '',
            ourDescription: crossedItem.crossedDescription || '',
          }).catch(err => console.error('Failed to persist cross:', err));

          // Persist to backend if we have a documentId
          if (item.documentId) {
            try {
              // Get all items for this document and update
              const updatedItems = parsedItems.map(i =>
                i.id === itemId ? crossedItem : i
              ).filter(i => i.documentId === item.documentId);

              await updateTakeoffDocument(item.documentId, {
                parsedItems: updatedItems,
              });
            } catch (persistErr) {
              console.error('Failed to persist crossed item:', persistErr);
            }
          }
        } else {
          // No alternatives found
          setItemCrossingState(prev => ({
            ...prev,
            [itemId]: { isProcessing: false, error: 'No cross found' },
          }));
          return;
        }
      } else {
        // No results found
        setItemCrossingState(prev => ({
          ...prev,
          [itemId]: { isProcessing: false, error: 'No cross found' },
        }));
        return;
      }

      // Clear processing state on success
      setItemCrossingState(prev => ({
        ...prev,
        [itemId]: { isProcessing: false },
      }));

      // Check if all crossable items are now crossed - update status to Complete
      const crossableItems = parsedItems.filter(i => !i.isOurManufacturer);
      const allCrossed = crossableItems.every(i => i.id === itemId || i.isCrossed);

      if (allCrossed && takeoff) {
        try {
          await updateTakeoff(takeoff.id, { status: 'COMPLETE' });
          setTakeoff(prev => prev ? { ...prev, status: 'Complete' } : null);
        } catch (statusErr) {
          console.error('[page.tsx handleCrossItem] Failed to update status:', statusErr);
        }
      }
    } catch (err) {
      console.error('Failed to cross item:', err);
      setItemCrossingState(prev => ({
        ...prev,
        [itemId]: { isProcessing: false, error: err instanceof Error ? err.message : 'Cross failed' },
      }));
    }
  };

  // Cross all competitor items in a single batch API call - allows re-crossing
  const handleCrossAll = async () => {
    const itemsToCross = parsedItems.filter(i => !i.isOurManufacturer);

    if (itemsToCross.length === 0) {
      showInfoToast('No items to cross', { description: 'All items are from our manufacturers.' });
      return;
    }

    // Set Cross All button processing state (separate from individual item states)
    setIsCrossAllProcessing(true);

    // Set processing state for each individual item (shows spinner per row)
    const processingState: Record<string, { isProcessing: boolean; error?: string }> = {};
    itemsToCross.forEach(item => {
      processingState[item.id] = { isProcessing: true };
    });
    setItemCrossingState(prev => ({ ...prev, ...processingState }));

    try {
      // Prepare all products for batch API call (using snake_case as expected by backend)
      const productsToMatch = itemsToCross.map(item => ({
        name: `${item.manufacturer} ${item.partNumber}`.trim(),
        manufacturer: item.manufacturer,
        part_number: item.partNumber,
        description: item.description,
        quantity: item.quantity,
      }));

      // Single batch API call for all products
      const results = await crossProducts(
        productsToMatch,
        ['SIMPLE', 'UPGRADE', 'VALUE']
      );

      // Process results and update items
      const updatedItems = [...parsedItems];

      for (let i = 0; i < itemsToCross.length; i++) {
        const item = itemsToCross[i];
        const result = results?.[i];

        if (result?.crosses?.length > 0) {
          const cross = result.crosses[0];
          const alternative = cross.alternatives?.[0];

          if (alternative) {
            // Find and update the item
            const itemIndex = updatedItems.findIndex(ui => ui.id === item.id);
            if (itemIndex !== -1) {
              updatedItems[itemIndex] = {
                ...updatedItems[itemIndex],
                isCrossed: true,
                crossedManufacturer: 'Our Company',
                crossedPartNumber: alternative.name || '',
                crossedDescription: alternative.description || `${item.description} (Crossed)`,
              };
              // Persist to known_product_crosses silently (no toast)
              createKnownProductCross({
                competitorManufacturer: item.manufacturer,
                competitorPartNumber: item.partNumber,
                competitorDescription: item.description || '',
                ourManufacturer: 'Our Company',
                ourPartNumber: alternative.name || '',
                ourDescription: alternative.description || '',
              }).catch(err => console.error('Failed to persist cross:', err));
            }
          }
        }
      }

      // Update all items at once and clear individual processing states
      setParsedItems(updatedItems);
      const clearState: Record<string, { isProcessing: boolean; error?: string }> = {};
      itemsToCross.forEach(item => {
        clearState[item.id] = { isProcessing: false };
      });
      setItemCrossingState(prev => ({ ...prev, ...clearState }));

      // Persist updated items to backend for each document
      // Items may not have documentId set, so we need to match them by checking document.parsedItems
      for (const doc of documents) {
        if (!doc.parsedItems || doc.parsedItems.length === 0) continue;

        // Find updated items that belong to this document by matching IDs
        const docItemIds = new Set(doc.parsedItems.map(i => i.id));
        const updatedItemsForDoc = updatedItems.filter(i => docItemIds.has(i.id));

        if (updatedItemsForDoc.length > 0) {
          try {
            await updateTakeoffDocument(doc.id, { parsedItems: updatedItemsForDoc });
          } catch (persistErr) {
            console.error(`Failed to persist items for document ${doc.id}:`, persistErr);
          }
        }
      }

      // Update takeoff status to COMPLETE
      if (takeoff) {
        try {
          await updateTakeoff(takeoff.id, { status: 'COMPLETE' });
          setTakeoff(prev => prev ? { ...prev, status: 'Complete' } : null);
        } catch (statusErr) {
          console.error('[handleCrossAll] Failed to update status:', statusErr);
        }
      }

      // Clear Cross All button processing state
      setIsCrossAllProcessing(false);

    } catch (err) {
      console.error('[handleCrossAll] Batch cross failed:', err);
      // Clear processing state on error for each individual item
      const errorState: Record<string, { isProcessing: boolean; error?: string }> = {};
      itemsToCross.forEach(item => {
        errorState[item.id] = { isProcessing: false, error: 'Cross failed' };
      });
      setItemCrossingState(prev => ({ ...prev, ...errorState }));
      // Clear Cross All button processing state on error
      setIsCrossAllProcessing(false);
    }
  };

  // Handle Create Quote button click with status validation
  const handleCreateQuote = () => {
    // Check if takeoff status is Complete
    if (takeoff?.status !== 'Complete') {
      showWarningToast('Cannot Create Quote', {
        description: 'The takeoff must be completed (all items crossed) before creating a quote.'
      });
      return;
    }

    const crossedItems = parsedItems.filter(item => item.isCrossed);
    if (crossedItems.length === 0) {
      showWarningToast('No Items to Quote', {
        description: 'Please cross some products first to create a quote.'
      });
      return;
    }
    setShowCreateQuoteModal(true);
  };

  if (isLoading) {
    return (
      <main className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-500">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <span>Loading takeoff...</span>
        </div>
      </main>
    );
  }

  if (error || !takeoff) {
    return (
      <main className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Takeoff not found'}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Back to Take-Offs
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
      <TakeoffDetailView
        takeoff={takeoff}
        currentStep={currentStep}
        documents={documents}
        parsedItems={parsedItems}
        selectedItems={selectedItems}
        onBack={handleBack}
        onStepChange={handleStepChange}
        onClassify={handleClassify}
        onChangeDiscipline={handleChangeDiscipline}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        onAbridge={handleAbridgeDocument}
        onAbridgeAll={handleAbridgeAll}
        onParseSchedules={handleParseSchedules}
        onProceedToParsing={handleProceedToParsing}
        onViewReport={handleViewReport}
        documentAbridgeState={documentAbridgeState}
        onCrossItem={handleCrossItem}
        onCrossSelected={() => {}}
        onCrossAll={handleCrossAll}
        itemCrossingState={itemCrossingState}
        onCreateQuote={handleCreateQuote}
        onDownloadDocument={handleDownloadDocument}
        onDownloadAllDocuments={handleDownloadAllDocuments}
        productCrossResults={[]}
        selectedCrossTypes={['SIMPLE', 'UPGRADE', 'VALUE']}
        isProductCrossProcessing={isCrossAllProcessing}
        isParsingProcessing={isParsingProcessing}
        parsingProgress={parsingProgress}
        parsingMessage={parsingMessage}
        isAbridgementProcessing={false}
        abridgementProgress={0}
        documentAbridgementProgress={{}}
        onCrossTypesChange={() => {}}
        onSelectAlternative={() => {}}
        onDeleteCrossAlternative={() => {}}
        onRerunCross={() => {}}
      />

      {/* Abridgment Report Modal */}
      <AbridgmentReportModal
        isOpen={showAbridgmentReport}
        document={selectedDocumentForReport}
        onClose={() => {
          setShowAbridgmentReport(false);
          setSelectedDocumentForReport(null);
        }}
      />

      {/* Create Quote from Takeoff Modal */}
      <CreateQuoteFromTakeoffModal
        isOpen={showCreateQuoteModal}
        takeoffId={takeoffId}
        takeoffName={takeoff?.title || 'Takeoff'}
        clientName={takeoff?.metadata?.clientName}
        crossedItems={parsedItems.filter(item => item.isCrossed)}
        onClose={() => setShowCreateQuoteModal(false)}
        onSuccess={() => {}}
      />
    </main>
  );
}
