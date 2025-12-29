"use client";

import React from "react";
import { clearTokens } from "@/lib/analytics/tokenManager";

class AuthErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Check if it's an authentication-related error
    const isAuthError =
      error?.message?.toLowerCase().includes("token") ||
      error?.message?.toLowerCase().includes("auth") ||
      error?.message?.toLowerCase().includes("unauthorized") ||
      error?.message?.toLowerCase().includes("login again");

    return {
      hasError: isAuthError,
      error: isAuthError ? error : null,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[AuthErrorBoundary] Caught error:", error, errorInfo);

    const isAuthError =
      error?.message?.toLowerCase().includes("token") ||
      error?.message?.toLowerCase().includes("auth") ||
      error?.message?.toLowerCase().includes("unauthorized") ||
      error?.message?.toLowerCase().includes("login again");

    if (isAuthError) {
      this.setState({
        hasError: true,
        error,
        errorInfo,
      });

      // Clear tokens when auth error occurs
      clearTokens();
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });

    // Reload the page to restart the authentication flow
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Authentication Error
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Your session has expired or is invalid. Please refresh to
                continue.
              </p>
              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Refresh Page
                </button>
                <details className="text-left">
                  <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                    Technical Details
                  </summary>
                  <pre className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-auto">
                    {this.state.error?.message ||
                      "Unknown authentication error"}
                  </pre>
                </details>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;


