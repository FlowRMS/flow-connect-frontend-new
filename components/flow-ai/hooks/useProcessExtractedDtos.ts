"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSubscription } from '@apollo/client/react';
import { SUB_PROCESS_EXTRACTED_DTOS } from '@/lib/flow-ai/gql';
// Note: We use the default Apollo client from context (not flowrmsApolloClient)
// because it has WebSocket support for subscriptions configured in @/lib/apollo.ts

export type ProcessingProgress = {
  action: string;
  isFinal: boolean;
};

export type ProcessingState = {
  isProcessing: boolean;
  isComplete: boolean;
  progress: ProcessingProgress | null;
  error: string | null;
};

// Type for subscription data
type ProcessExtractedDtosData = {
  processExtractedDtos: ProcessingProgress | null;
};

export function useProcessExtractedDtos(pendingDocumentId: string | null) {
  const [state, setState] = useState<ProcessingState>({
    isProcessing: false,
    isComplete: false,
    progress: null,
    error: null,
  });

  const [shouldSubscribe, setShouldSubscribe] = useState(false);
  const onCompleteCallbackRef = useRef<(() => void) | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Use the subscription hook with the default Apollo client (has WebSocket support)
  useSubscription<ProcessExtractedDtosData>(SUB_PROCESS_EXTRACTED_DTOS, {
    variables: pendingDocumentId ? { pendingDocumentId } : undefined,
    skip: !shouldSubscribe || !pendingDocumentId,
    shouldResubscribe: true,
    onData: ({ data }) => {
      console.log('🔄 API Response [processExtractedDtos]:', data);

      // Check for errors in the subscription data (comes as { data: null, errors: [...] })
      // Apollo's useSubscription doesn't always route these to onError
      const subscriptionErrors = (data as unknown as { errors?: Array<{ message: string }> })?.errors;
      if (subscriptionErrors && subscriptionErrors.length > 0) {
        const errorMessage = subscriptionErrors.map(e => e.message).join('; ');
        console.error('❌ API Error in subscription data [processExtractedDtos]:', errorMessage);
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error: errorMessage,
        }));
        setShouldSubscribe(false);

        // Clear timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        // Still call completion callback - we want to continue to entity matching even on error
        if (onCompleteCallbackRef.current) {
          onCompleteCallbackRef.current();
          onCompleteCallbackRef.current = null;
        }
        return;
      }

      const progress = data.data?.processExtractedDtos;

      // Handle null data gracefully
      if (!progress) {
        console.warn('processExtractedDtos returned null, continuing anyway');
        setState(prev => ({
          ...prev,
          isProcessing: false,
          isComplete: true,
        }));
        setShouldSubscribe(false);

        // Clear timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        // Call completion callback
        if (onCompleteCallbackRef.current) {
          onCompleteCallbackRef.current();
          onCompleteCallbackRef.current = null;
        }
        return;
      }

      console.log(`Processing action: ${progress.action}, isFinal: ${progress.isFinal}`);

      setState(prev => ({
        ...prev,
        progress,
      }));

      // Check if processing is complete
      if (progress.isFinal) {
        console.log('✅ processExtractedDtos completed');
        setState(prev => ({
          ...prev,
          isProcessing: false,
          isComplete: true,
        }));
        setShouldSubscribe(false);

        // Clear timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        // Call completion callback
        if (onCompleteCallbackRef.current) {
          onCompleteCallbackRef.current();
          onCompleteCallbackRef.current = null;
        }
      }
    },
    onError: (error) => {
      console.error('❌ API Error [processExtractedDtos]:', error);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error.message,
      }));
      setShouldSubscribe(false);

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Still call completion callback - we want to continue to entity matching even on error
      if (onCompleteCallbackRef.current) {
        onCompleteCallbackRef.current();
        onCompleteCallbackRef.current = null;
      }
    },
  });

  const startProcessing = useCallback((onComplete?: () => void) => {
    if (!pendingDocumentId) {
      console.error('Cannot start processing: no pendingDocumentId');
      return;
    }

    console.log('🚀 Starting processExtractedDtos subscription for:', pendingDocumentId);

    // Store completion callback
    if (onComplete) {
      onCompleteCallbackRef.current = onComplete;
    }

    setState({
      isProcessing: true,
      isComplete: false,
      progress: null,
      error: null,
    });

    // Start subscription
    setShouldSubscribe(true);

    // Set timeout for 60 seconds
    timeoutRef.current = setTimeout(() => {
      console.warn('⚠️ processExtractedDtos timed out after 60 seconds, continuing anyway');
      setState(prev => ({
        ...prev,
        isProcessing: false,
        isComplete: true,
      }));
      setShouldSubscribe(false);

      // Call completion callback
      if (onCompleteCallbackRef.current) {
        onCompleteCallbackRef.current();
        onCompleteCallbackRef.current = null;
      }
    }, 60000);
  }, [pendingDocumentId]);

  const reset = useCallback(() => {
    setShouldSubscribe(false);
    setState({
      isProcessing: false,
      isComplete: false,
      progress: null,
      error: null,
    });
    onCompleteCallbackRef.current = null;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    ...state,
    startProcessing,
    reset,
  };
}





