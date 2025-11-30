/**
 * Error Utility Module
 * Provides user-friendly error message parsing
 */

/**
 * Parse API error and return a user-friendly message
 * Handles GraphQL errors, network errors, and generic errors
 */
export function parseApiError(error: unknown): string {
  if (!error) {
    return 'An unexpected error occurred. Please try again.';
  }

  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message;
    
    // Parse common GraphQL error patterns
    if (message.includes('UUID')) {
      return 'Invalid ID format. Please check your input and try again.';
    }
    
    if (message.includes('badly formed hexadecimal UUID string')) {
      return 'Invalid ID provided. Please select a valid item.';
    }
    
    if (message.includes('Variable') && message.includes('got invalid value')) {
      // Extract field name if possible
      const fieldMatch = message.match(/at 'input\.(\w+)'/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1]
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())
          .trim();
        return `Invalid value for ${fieldName}. Please check your input.`;
      }
      return 'Invalid input provided. Please check your form fields.';
    }
    
    if (message.includes('Network') || message.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    if (message.includes('401') || message.includes('Unauthorized')) {
      return 'Authentication failed. Please check your credentials.';
    }
    
    if (message.includes('403') || message.includes('Forbidden')) {
      return 'You don\'t have permission to perform this action.';
    }
    
    if (message.includes('404') || message.includes('Not Found')) {
      return 'The requested resource was not found.';
    }
    
    if (message.includes('500') || message.includes('Internal Server')) {
      return 'Server error. Please try again later.';
    }
    
    if (message.includes('timeout') || message.includes('Timeout')) {
      return 'Request timed out. Please try again.';
    }
    
    // If message is too technical (contains code-like patterns), simplify it
    if (message.includes('::') || message.includes('=>') || message.length > 100) {
      return 'An error occurred while processing your request. Please try again.';
    }
    
    // Return the original message if it's reasonably user-friendly
    return message;
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  // Handle objects with message property
  if (typeof error === 'object' && 'message' in error) {
    return parseApiError(new Error(String((error as { message: unknown }).message)));
  }
  
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('invalid value') || 
           error.message.includes('UUID') ||
           error.message.includes('required');
  }
  return false;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('Network') || 
           error.message.includes('fetch') ||
           error.message.includes('timeout');
  }
  return false;
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('401') || 
           error.message.includes('Unauthorized') ||
           error.message.includes('authentication');
  }
  return false;
}
