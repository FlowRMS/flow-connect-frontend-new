import React from "react";
import { Info } from "lucide-react";

export function DataDictionary() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors"
        title="View Data Dictionary"
      >
        <Info size={16} />
        <span className="hidden sm:inline">Data Dictionary</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dictionary Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Data Dictionary</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="pb-3 border-b border-gray-200">
                <dt className="font-medium text-gray-900 mb-1">Expected Commissions</dt>
                <dd className="text-gray-600 text-xs leading-relaxed">
                  Calculated commission amounts based on sales data and commission rates.
                </dd>
              </div>

              <div>
                <dt className="font-medium text-gray-900 mb-1">Paid Commissions</dt>
                <dd className="text-gray-600 text-xs leading-relaxed">
                  The sum of commissions reflected from commission statements, including both posted and unposted statements.
                </dd>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
