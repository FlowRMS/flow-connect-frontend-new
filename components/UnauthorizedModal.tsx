'use client';

import { useEffect, useState, useCallback } from 'react';
import { handleSignOut } from '@/lib/actions';

interface UnauthorizedModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

const COUNTDOWN_SECONDS = 10;

export function UnauthorizedModal({ isOpen, onClose }: UnauthorizedModalProps) {
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const performLogout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await handleSignOut();
    } catch (error) {
      console.error('Logout failed:', error);
      // Fallback: redirect to sign-in page
      window.location.href = '/sign-in';
    }
  }, [isLoggingOut]);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(COUNTDOWN_SECONDS);
      setIsLoggingOut(false);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          performLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, performLogout]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in duration-200">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
          Not Authorized
        </h2>

        {/* Message */}
        <p className="text-gray-600 text-center mb-6">
          You are not authorized on this tenancy. You will be logged out automatically.
        </p>

        {/* Countdown */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-full border-4 border-red-500 text-red-600">
            <span className="text-2xl font-bold">{countdown}</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={performLogout}
          disabled={isLoggingOut}
          className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          {isLoggingOut ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Logging out...
            </>
          ) : (
            'Log Out Now'
          )}
        </button>
      </div>
    </div>
  );
}
