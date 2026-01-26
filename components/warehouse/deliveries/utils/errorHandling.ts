/**
 * Error handling utilities for warehouse deliveries
 */

export type ErrorSeverity = 'error' | 'warning' | 'info';

export interface DeliveryError {
  message: string;
  code?: string;
  severity: ErrorSeverity;
  timestamp: Date;
  context?: Record<string, unknown>;
}

/**
 * Parse GraphQL errors into user-friendly messages
 */
export function parseGraphQLError(error: unknown): DeliveryError {
  const timestamp = new Date();

  // Handle GraphQL errors
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String(error.message);

    // Check for common error patterns
    if (message.includes('Not found') || message.includes('not found')) {
      return {
        message: 'The requested delivery could not be found.',
        code: 'NOT_FOUND',
        severity: 'error',
        timestamp,
      };
    }

    if (message.includes('Unauthorized') || message.includes('unauthorized')) {
      return {
        message: 'You do not have permission to perform this action.',
        code: 'UNAUTHORIZED',
        severity: 'error',
        timestamp,
      };
    }

    if (message.includes('Network') || message.includes('network')) {
      return {
        message: 'Network error. Please check your connection and try again.',
        code: 'NETWORK_ERROR',
        severity: 'error',
        timestamp,
      };
    }

    if (message.includes('Validation') || message.includes('validation')) {
      return {
        message: 'Invalid data provided. Please check your input.',
        code: 'VALIDATION_ERROR',
        severity: 'warning',
        timestamp,
      };
    }

    // Return the original message if no pattern matches
    return {
      message,
      severity: 'error',
      timestamp,
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: error,
      severity: 'error',
      timestamp,
    };
  }

  // Fallback for unknown errors
  return {
    message: 'An unexpected error occurred. Please try again.',
    code: 'UNKNOWN_ERROR',
    severity: 'error',
    timestamp,
  };
}

/**
 * Format error message for display
 */
export function formatErrorMessage(error: DeliveryError): string {
  if (error.code) {
    return `${error.message} (${error.code})`;
  }
  return error.message;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: DeliveryError): boolean {
  const retryableCodes = ['NETWORK_ERROR', 'TIMEOUT', 'SERVICE_UNAVAILABLE'];
  return error.code ? retryableCodes.includes(error.code) : false;
}

/**
 * Get retry delay based on attempt number (exponential backoff)
 */
export function getRetryDelay(attemptNumber: number): number {
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds
  const delay = Math.min(baseDelay * Math.pow(2, attemptNumber), maxDelay);
  return delay;
}

/**
 * Log error to console in development
 */
export function logError(error: DeliveryError, context?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'development') {
    console.error('[Delivery Error]', {
      ...error,
      context,
    });
  }
}
