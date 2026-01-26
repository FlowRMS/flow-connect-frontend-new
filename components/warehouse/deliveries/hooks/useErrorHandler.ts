import { useCallback, useState } from 'react';
import { parseGraphQLError, logError, type DeliveryError } from '../utils/errorHandling';

interface UseErrorHandlerOptions {
  onError?: (error: DeliveryError) => void;
  logErrors?: boolean;
}

/**
 * Hook to handle errors consistently across the deliveries module
 */
export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { onError, logErrors = true } = options;
  const [lastError, setLastError] = useState<DeliveryError | null>(null);

  const handleError = useCallback(
    (error: unknown, context?: Record<string, unknown>) => {
      const parsedError = parseGraphQLError(error);
      setLastError(parsedError);

      if (logErrors) {
        logError(parsedError, context);
      }

      if (onError) {
        onError(parsedError);
      }

      return parsedError;
    },
    [onError, logErrors]
  );

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  return {
    handleError,
    clearError,
    lastError,
  };
}
