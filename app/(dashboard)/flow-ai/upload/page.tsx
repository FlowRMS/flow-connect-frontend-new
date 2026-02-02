'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useNavigationMorph, morphEase } from '@/contexts/NavigationMorphContext';
import { HeaderIconAnimation } from '@/components/ui/HeaderIconAnimations';
import { iconMap } from '@/components/Sidebar';
import type { RefObject } from 'react';
import {
  Upload,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { CombinedUploadPane, type DocumentType } from '@/components/flow-ai/flowrms/CombinedUploadPane';
import { AdminSettingsDialog } from '@/components/flow-ai/flowrms/AdminSettingsDialog';
import { useMutation } from '@apollo/client/react';
import { M_BATCH_PROCESS_DOCUMENTS } from '@/lib/flow-ai/gql';
import { flowrmsApolloClient } from '@/lib/flow-ai/flowrms-apollo';
import { toast } from 'sonner';

// FlowAI facts and tips to show during loading (same as other pages)
const FLOWAI_FACTS = [
  { title: "Smart Extraction", fact: "FlowAI uses advanced AI to automatically extract data from invoices, quotes, and orders with over 95% accuracy." },
  { title: "Template Learning", fact: "Save time by creating templates - FlowAI learns your document patterns and applies them to future uploads automatically." },
  { title: "Entity Matching", fact: "Our intelligent matching system connects extracted data to your existing customers, products, and contacts." },
  { title: "Multi-Format Support", fact: "FlowAI handles PDFs, Excel files, CSVs, and even scanned documents with OCR technology." },
  { title: "Real-Time Collaboration", fact: "Multiple team members can review and approve documents simultaneously with live updates." },
  { title: "Audit Trail", fact: "Every change is tracked with version history, so you can always see who modified what and when." },
  { title: "Custom Instructions", fact: "Give FlowAI natural language instructions like 'increase all prices by 10%' and watch it apply changes instantly." },
  { title: "Batch Processing", fact: "Upload multiple documents at once - FlowAI processes them in parallel for maximum efficiency." },
  { title: "Smart Suggestions", fact: "FlowAI learns from your corrections and suggests improvements for future document processing." },
  { title: "Data Validation", fact: "Built-in validation rules catch errors before they reach your system, ensuring data quality." },
];

// Valid document types that can be passed via URL
const VALID_DOCUMENT_TYPES: DocumentType[] = ['quotes', 'orders', 'order_acknowledgements', 'invoices', 'checks', 'statements', 'products', 'factories', 'customers', 'deliveries'];

export default function UploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [currentFactIndex, setCurrentFactIndex] = useState(() => Math.floor(Math.random() * FLOWAI_FACTS.length));
  const [isFactVisible, setIsFactVisible] = useState(true);

  // Navigation morph hooks
  const { registerHeaderTarget, floatingIcon } = useNavigationMorph();
  const headerIconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (headerIconRef.current) {
      registerHeaderTarget(headerIconRef.current);
    }
    return () => {
      registerHeaderTarget(null);
    };
  }, [registerHeaderTarget]);

  const isReceivingAnimation = floatingIcon?.itemId === 'flow-ai-upload';

  // Get initial document type from URL query parameter
  const typeParam = searchParams.get('type');
  const initialDocumentType: DocumentType | undefined = typeParam && VALID_DOCUMENT_TYPES.includes(typeParam as DocumentType)
    ? (typeParam as DocumentType)
    : undefined;

  // Rotate facts every 5 seconds with fade animation when batch processing
  useEffect(() => {
    if (!isBatchProcessing) return;

    const factInterval = setInterval(() => {
      setIsFactVisible(false);
      setTimeout(() => {
        setCurrentFactIndex(prev => (prev + 1) % FLOWAI_FACTS.length);
        setIsFactVisible(true);
      }, 300);
    }, 5000);

    return () => clearInterval(factInterval);
  }, [isBatchProcessing]);

  const currentFact = useMemo(() => FLOWAI_FACTS[currentFactIndex] || FLOWAI_FACTS[0], [currentFactIndex]);

  const [batchProcessMutation] = useMutation(M_BATCH_PROCESS_DOCUMENTS, {
    client: flowrmsApolloClient,
  });

  const handleDocumentUploaded = (
    documentId: string,
    _documentType: string,
    instructions?: string,
    contextFileIds?: string[]
  ) => {
    // Store data in localStorage for the main page to pick up
    localStorage.setItem('flowrms_document_id', documentId);
    localStorage.setItem('flowrms_mode', 'document'); // Mode must be 'document' for the hook to work

    if (instructions) {
      localStorage.setItem('flowrms_initial_instructions', instructions);
    } else {
      localStorage.removeItem('flowrms_initial_instructions');
    }

    if (contextFileIds && contextFileIds.length > 0) {
      localStorage.setItem('flowrms_context_files', JSON.stringify(contextFileIds));
    } else {
      localStorage.removeItem('flowrms_context_files');
    }

    // Mark that we should skip the initial instructions prompt since user already provided them
    localStorage.setItem('flowrms_skip_instructions_prompt', 'true');

    // Navigate to the main FlowScan page - use window.location for full page load
    // This ensures the usePendingReview hook re-initializes with the new localStorage values
    window.location.href = `/flow-ai?documentId=${documentId}`;
  };

  const handleBatchDocumentsUploaded = async (
    documentIds: string[],
    _documentType: string,
    instructions?: string,
    contextFileIds?: string[]
  ) => {
    setIsBatchProcessing(true);

    try {
      await batchProcessMutation({
        variables: {
          documentIds,
          contextFiles: contextFileIds || [],
          initialInstructions: instructions ? [instructions] : [],
        },
      });

      toast.success(`${documentIds.length} documents submitted for batch processing`);

      // Wait 30 seconds before redirecting to queue page
      // Facts rotation is handled by the useEffect when isBatchProcessing is true
      await new Promise(resolve => setTimeout(resolve, 20000));

      // Redirect to queue page
      router.push('/flow-ai/queue');
    } catch (error) {
      console.error('Batch processing error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to submit documents for batch processing'
      );
      setIsBatchProcessing(false);
    }
  };

  return (
    <div className="h-full overflow-auto bg-background">
      {/* Page Header */}
      <div className="border-b bg-card/50 px-6 py-4 overflow-visible">
        <div className="flex items-center justify-between overflow-visible">
          <div className="flex items-center gap-3 overflow-visible">
            {/* Morphing Icon Target - Upload Arrow Animation */}
            <HeaderIconAnimation
              isReceivingAnimation={isReceivingAnimation}
              animationStyle="upload-arrow"
              headerIconRef={headerIconRef as RefObject<HTMLDivElement>}
            >
              {iconMap['flow-ai-upload']}
            </HeaderIconAnimation>
            <div className="overflow-hidden">
              <motion.h1
                className="text-xl font-bold"
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.35, delay: 0.1, ease: morphEase }}
              >
                Upload Documents
              </motion.h1>
              <motion.p
                className="text-sm text-muted-foreground"
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.3, delay: 0.2, ease: morphEase }}
              >
                Upload documents for AI processing
              </motion.p>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.25, ease: morphEase }}
          >
            <AdminSettingsDialog />
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative">
        {isBatchProcessing && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-6 max-w-lg text-center px-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Processing documents...</p>

              {/* FlowAI Facts Section */}
              <div className={`w-full p-6 bg-primary/5 border border-primary/20 rounded-xl transition-opacity duration-300 ${isFactVisible ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">Did you know?</span>
                </div>
                <p className="text-sm font-medium text-foreground mb-2">{currentFact.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{currentFact.fact}</p>
                <div className="flex justify-center gap-1 mt-4">
                  {FLOWAI_FACTS.map((_, index) => (
                    <div
                      key={index}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        index === currentFactIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        <CombinedUploadPane
          onDocumentUploaded={handleDocumentUploaded}
          onBatchDocumentsUploaded={handleBatchDocumentsUploaded}
          initialDocumentType={initialDocumentType}
        />
      </main>
    </div>
  );
}








