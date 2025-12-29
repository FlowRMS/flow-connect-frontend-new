"use client";

import React from "react";
import { ShieldAlert, Lock, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "./card";
import { extractRequiredPrivileges } from "@/lib/analytics/utils/authErrors";

/**
 * Component to display when user doesn't have authorization to access a resource
 * @param {Object} props
 * @param {Error} props.error - The authorization error object
 * @param {string} props.resourceName - Name of the resource (e.g., "Orders Report")
 * @param {string} props.title - Custom title (optional)
 * @param {string} props.message - Custom message (optional)
 * @param {boolean} props.showPrivileges - Whether to show required privileges (default: true)
 * @param {React.ReactNode} props.children - Additional content to display
 * @param {string} props.variant - Visual variant: "full" (full page) or "card" (card style) or "inline" (compact)
 */
export function UnauthorizedAccess({
  error,
  resourceName = "this resource",
  title,
  message,
  showPrivileges = true,
  children,
  variant = "full",
}) {
  const requiredPrivileges = extractRequiredPrivileges(error);

  const defaultTitle = title || "Access Restricted";
  const defaultMessage =
    message ||
    `You don't have the necessary permissions to access ${resourceName}.`;

  // Inline variant - compact display
  if (variant === "inline") {
    return (
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex-shrink-0 mt-0.5">
          <ShieldAlert className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-900">{defaultTitle}</p>
          <p className="text-sm text-amber-700 mt-1">{defaultMessage}</p>
          {/* {showPrivileges && requiredPrivileges.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-amber-600 font-medium mb-1">
                Required privileges:
              </p>
              <div className="flex flex-wrap gap-1">
                {requiredPrivileges.map((privilege) => (
                  <span
                    key={privilege}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800"
                  >
                    {privilege}
                  </span>
                ))}
              </div>
            </div>
          )} */}
          {children}
        </div>
      </div>
    );
  }

  // Card variant - card-style display
  if (variant === "card") {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Lock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-amber-900 mb-2">
                {defaultTitle}
              </h3>
              <p className="text-sm text-amber-700 mb-4">{defaultMessage}</p>
              
              {/* {showPrivileges && requiredPrivileges.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-amber-600 font-medium mb-2">
                    Required privileges:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {requiredPrivileges.map((privilege) => (
                      <span
                        key={privilege}
                        className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-amber-100 text-amber-800 border border-amber-200"
                      >
                        <Lock className="w-3 h-3 mr-1.5" />
                        {privilege}
                      </span>
                    ))}
                  </div>
                </div>
              )} */}

              <div className="flex items-start gap-2 p-3 bg-white border border-amber-200 rounded-md">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                  Please contact your system administrator to request access to these resources.
                </p>
              </div>

              {children && <div className="mt-4">{children}</div>}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full variant - full-page display (default)
  return (
    <div className="min-h-[500px] w-full flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <Card className="border-amber-200 shadow-lg">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
                <ShieldAlert className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {defaultTitle}
              </h2>
              <p className="text-gray-600">{defaultMessage}</p>
            </div>

            {showPrivileges && requiredPrivileges.length > 0 && (
              <div className="mb-6">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800 font-semibold mb-3">
                    This resource requires the following privileges:
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {requiredPrivileges.map((privilege) => (
                      <span
                        key={privilege}
                        className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-white text-amber-900 border border-amber-300 shadow-sm"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        {privilege}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
              <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 text-sm text-blue-800">
                <p className="font-medium mb-1">Need access?</p>
                <p>
                  Contact your system administrator to request the necessary
                  permissions for accessing this resource.
                </p>
              </div>
            </div>

            {children && (
              <div className="border-t border-gray-200 pt-6">{children}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Hook to check if an error is an authorization error
 * Returns a boolean and the UnauthorizedAccess component if applicable
 */
export function useAuthorizationError(error, resourceName) {
  const isUnauthorized = React.useMemo(() => {
    if (!error) return false;
    
    // Check GraphQL errors
    if (error.graphQLErrors && Array.isArray(error.graphQLErrors)) {
      return error.graphQLErrors.some((gqlError) =>
        gqlError?.extensions?.exception === "UserNotAuthorizedError" ||
        gqlError?.message?.toLowerCase().includes("access denied")
      );
    }

    // Check error message
    if (error.message) {
      const msg = error.message.toLowerCase();
      return msg.includes("access denied") || msg.includes("not authorized");
    }

    return false;
  }, [error]);

  const component = isUnauthorized ? (
    <UnauthorizedAccess error={error} resourceName={resourceName} />
  ) : null;

  return { isUnauthorized, component };
}

