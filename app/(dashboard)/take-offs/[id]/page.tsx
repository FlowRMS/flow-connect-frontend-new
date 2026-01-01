'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { TakeoffDetailView } from '@/components/takeoffs/views/TakeoffDetailView';
import { fetchTakeoff, updateTakeoffDocument, updateTakeoff } from '@/components/lib/graphql/takeoffs';
import type { Takeoff, TakeoffDocument, ParsedItem, TakeoffStep } from '@/components/takeoffs/types';
import { transformTakeoffResponse, statusApiMap } from '@/components/takeoffs/types';
import { getInitialStep } from '@/components/takeoffs/utils';

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
          const docs: TakeoffDocument[] = response.documents.map(doc => ({
            id: doc.id,
            name: doc.name,
            type: 'PDF' as const,
            size: doc.fileSize,
            pages: doc.pages || 0,
            classification: doc.classification || null,
            confidence: doc.confidence || null,
            status: doc.abridged ? 'abridged' : 'pending',
            abridgedPages: doc.abridgedPages || null,
            reductionPercentage: doc.reductionPercentage || null,
            documentUrl: doc.documentUrl || undefined,
            pageAnalyses: doc.pageAnalyses || undefined,
            parsedItems: (doc.parsedItems || []).map(item => ({
              id: item.id || crypto.randomUUID(),
              manufacturer: item.manufacturer,
              partNumber: item.partNumber,
              description: item.description,
              quantity: item.quantity,
              isOurManufacturer: item.isOurManufacturer || false,
              isCrossed: item.isCrossed || false,
            })),
          }));

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
      const apiStatus = statusApiMap[step];
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
      docs.map(d => d.id === docId ? { ...d, classification } : d)
    );
    try {
      await updateTakeoffDocument(docId, { classification });
    } catch (err) {
      console.error('Failed to persist classification:', err);
    }
  };

  const handleChangeDiscipline = async (docId: string, discipline: string | null) => {
    setDocuments(docs =>
      docs.map(d => d.id === docId ? { ...d, discipline } : d)
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
        onAbridge={() => {}}
        onAbridgeAll={() => {}}
        onParseSchedules={() => {}}
        onViewReport={() => {}}
        onCrossItem={() => {}}
        onCrossSelected={() => {}}
        onCrossAll={() => {}}
        onCreateQuote={() => {}}
        onDownloadDocument={() => {}}
        onDownloadAllDocuments={() => {}}
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
    </main>
  );
}
