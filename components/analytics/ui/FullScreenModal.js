"use client";

import React, { useEffect } from "react";
import { X, Maximize2 } from "lucide-react";

/**
 * FullScreenModal - A professional full-screen modal overlay for viewing tables/grids
 * 
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback when modal is closed
 * @param {React.ReactNode} children - Content to display in modal
 * @param {string} title - Optional title for the modal header
 */
export function FullScreenModal({ isOpen, onClose, children, title = "Full Screen View" }) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="fixed inset-4 md:inset-8 bg-white rounded-lg shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Maximize2 className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors group"
            title="Close (ESC)"
          >
            <X className="w-6 h-6 text-gray-500 group-hover:text-gray-900" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>

        {/* Footer hint */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            Press <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-semibold">ESC</kbd> or click outside to close
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * ExpandButton - A reusable button to trigger full-screen view
 * 
 * @param {function} onClick - Callback when button is clicked
 * @param {boolean} disabled - Whether button is disabled
 */
export function ExpandButton({ onClick, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium shadow-sm hover:shadow-md"
      title="Expand to full screen"
    >
      <Maximize2 size={16} />
      <span>Expand</span>
    </button>
  );
}
