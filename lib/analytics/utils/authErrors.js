/**
 * Utility functions for handling authorization and permission errors
 */

/**
 * Check if an error is an authorization/permission error
 * @param {Error | any} error - The error object to check
 * @returns {boolean} - True if it's an authorization error
 */
export function isAuthorizationError(error) {
  if (!error) return false;

  // Check GraphQL errors array
  if (error.graphQLErrors && Array.isArray(error.graphQLErrors)) {
    return error.graphQLErrors.some((gqlError) => {
      // Check for UserNotAuthorizedError extension
      if (gqlError?.extensions?.exception === "UserNotAuthorizedError") {
        return true;
      }
      
      // Check for access denied in message
      if (gqlError?.message?.toLowerCase().includes("access denied")) {
        return true;
      }
      
      // Check for privilege/permission related messages
      if (gqlError?.message?.toLowerCase().includes("requires") && 
          gqlError?.message?.toLowerCase().includes("privilege")) {
        return true;
      }
      
      return false;
    });
  }

  // Check error message directly
  if (error.message) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("access denied") ||
      msg.includes("not authorized") ||
      msg.includes("requires") && msg.includes("privilege")
    );
  }

  return false;
}

/**
 * Extract required privileges from an authorization error
 * @param {Error | any} error - The error object
 * @returns {string[]} - Array of required privilege names
 */
export function extractRequiredPrivileges(error) {
  if (!error) return [];

  let message = "";

  // Get message from GraphQL errors
  if (error.graphQLErrors && Array.isArray(error.graphQLErrors)) {
    const authError = error.graphQLErrors.find((gqlError) =>
      gqlError?.extensions?.exception === "UserNotAuthorizedError" ||
      gqlError?.message?.toLowerCase().includes("access denied")
    );
    
    if (authError?.message) {
      message = authError.message;
    }
  }

  // Fallback to direct error message
  if (!message && error.message) {
    message = error.message;
  }

  // Extract privileges from message like:
  // "Access denied: User requires ALL privilege for the following resources: ORDER, INVOICE, EXPENSE, CHECK"
  const match = message.match(/following resources?:\s*([A-Z_, ]+)/i);
  if (match && match[1]) {
    return match[1]
      .split(",")
      .map((priv) => priv.trim())
      .filter(Boolean);
  }

  return [];
}

/**
 * Get a user-friendly error message for authorization errors
 * @param {Error | any} error - The error object
 * @param {string} resourceName - Name of the resource being accessed (e.g., "Orders Report")
 * @returns {string} - User-friendly error message
 */
export function getAuthorizationErrorMessage(error, resourceName = "this resource") {
  const privileges = extractRequiredPrivileges(error);
  
  if (privileges.length > 0) {
    const privilegeList = privileges.join(", ");
    return `You don't have permission to access ${resourceName}. Required privileges: ${privilegeList}`;
  }
  
  return `You don't have permission to access ${resourceName}. Please contact your administrator for access.`;
}
