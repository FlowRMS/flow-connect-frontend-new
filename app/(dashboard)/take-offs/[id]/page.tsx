'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { TakeoffDetailView } from '@/components/takeoffs/views/TakeoffDetailView';
import { fetchTakeoff, updateTakeoffDocument, updateTakeoff, abridgeDocument as abridgeDocumentAPI } from '@/components/lib/graphql/takeoffs';
import type { Takeoff, TakeoffDocument, ParsedItem, TakeoffStep, PageAnalysis } from '@/components/takeoffs/types';
import { transformTakeoffResponse, stepToApiStatus, transformDocumentResponse } from '@/components/takeoffs/types';
import { getInitialStep } from '@/components/takeoffs/utils';
import { AbridgmentReportModal } from '@/components/takeoffs/modals/AbridgmentReportModal';

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

  const handleDownloadDocument = (doc: TakeoffDocument) => {
    if (!doc.documentUrl) {
      console.error('Document URL not available');
      return;
    }
    window.open(doc.documentUrl, '_blank');
  };

  const handleDownloadAllDocuments = () => {
    const docsWithUrls = documents.filter(d => d.documentUrl);
    if (docsWithUrls.length === 0) {
      console.warn('No documents available for download');
      return;
    }
    // Download each document with a small delay to avoid browser blocking
    docsWithUrls.forEach((doc, index) => {
      setTimeout(() => {
        window.open(doc.documentUrl, '_blank');
      }, index * 300);
    });
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
                  abridgedUrl: result.abridgedUrl || undefined,
                  pageAnalyses: result.pageAnalyses as PageAnalysis[] || undefined,
                }
              : d
          )
        );

        // Persist to backend
        await updateTakeoffDocument(docId, {
          pages: result.originalPages || undefined,
          abridged: true,
          abridgedPages: result.abridgedPages,
          reductionPercentage: result.reductionPercentage,
          pageAnalyses: result.pageAnalyses,
        });

        // Clear processing state on success
        setDocumentAbridgeState(prev => ({
          ...prev,
          [docId]: { isProcessing: false },
        }));
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
    const unabridgedDocs = documents.filter(d => !d.abridged && d.documentUrl && d.pages > 0);
    for (const doc of unabridgedDocs) {
      await handleAbridgeDocument(doc.id);
    }
  };

  // View abridgment report for a document
  const handleViewReport = (doc: TakeoffDocument) => {
    setSelectedDocumentForReport(doc);
    setShowAbridgmentReport(true);
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
        onParseSchedules={() => {}}
        onViewReport={handleViewReport}
        documentAbridgeState={documentAbridgeState}
        onCrossItem={() => {}}
        onCrossSelected={() => {}}
        onCrossAll={() => {}}
        onCreateQuote={() => {}}
        onDownloadDocument={handleDownloadDocument}
        onDownloadAllDocuments={handleDownloadAllDocuments}
        productCrossResults={[]}
        selectedCrossTypes={['SIMPLE', 'UPGRADE', 'VALUE']}
        isProductCrossProcessing={false}
        isParsingProcessing={false}
        parsingProgress={0}
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
    </main>
  );
}
