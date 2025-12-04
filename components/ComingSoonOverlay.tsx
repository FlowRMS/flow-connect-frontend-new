/**
 * Coming Soon Overlay Component
 * A cool, modern overlay that indicates a feature is coming soon
 */

'use client';

import React from 'react';

interface ComingSoonOverlayProps {
  title?: string;
  description?: string;
}

export default function ComingSoonOverlay({ 
  title = 'Coming Soon',
  description = 'This feature is under development and will be available soon.'
}: ComingSoonOverlayProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/60 dark:bg-gray-900/60">
      <div className="relative">
        {/* Animated background circles */}
        <div className="absolute -inset-20 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-2xl animate-pulse delay-150" />
        </div>
        
        {/* Content card */}
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 max-w-md mx-4 text-center">
          {/* Icon */}
          <div className="mb-6 relative inline-block">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <svg 
                className="w-10 h-10 text-white" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={1.5}
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" 
                />
              </svg>
            </div>
            {/* Sparkle decorations */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping" />
            <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-blue-400 rounded-full animate-ping delay-300" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            {title}
          </h2>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {description}
          </p>

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>Building something amazing</span>
          </div>

          {/* Notify button */}
          {/* <button className="mt-6 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
            Notify Me When Ready
          </button> */}
        </div>
      </div>
    </div>
  );
}
