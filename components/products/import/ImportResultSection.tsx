'use client';

import type { ImportResult } from './types';

interface ImportResultSectionProps {
  importResult: ImportResult;
}

export function ImportResultSection({ importResult }: ImportResultSectionProps) {
  return (
    <div className={`rounded-lg border p-6 ${
      importResult.success
        ? 'bg-green-50 border-green-200'
        : 'bg-yellow-50 border-yellow-200'
    }`}>
      <h3 className={`text-lg font-semibold mb-2 ${
        importResult.success ? 'text-green-800' : 'text-yellow-800'
      }`}>
        Import Result
      </h3>
      <p className={`text-sm ${importResult.success ? 'text-green-700' : 'text-yellow-700'}`}>
        {importResult.message}
      </p>
      <div className="mt-3 flex flex-wrap gap-4 text-sm">
        <span className="text-green-700">Products created: {importResult.created}</span>
        <span className="text-blue-700">Products updated: {importResult.updated}</span>
        {importResult.quantityPricing > 0 && (
          <span className="text-indigo-700">Qty pricing: {importResult.quantityPricing}</span>
        )}
        {importResult.customerPricingCreated > 0 && (
          <span className="text-purple-700">Customer prices created: {importResult.customerPricingCreated}</span>
        )}
        {importResult.customerPricingUpdated > 0 && (
          <span className="text-purple-600">Customer prices updated: {importResult.customerPricingUpdated}</span>
        )}
        {importResult.errors.length > 0 && (
          <span className="text-red-700">Errors: {importResult.errors.length}</span>
        )}
      </div>

      {importResult.customersNotFound.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-orange-800 mb-2">
            Customers not found in CRM ({importResult.customersNotFound.length}):
          </p>
          <div className="max-h-24 overflow-y-auto space-y-1 bg-orange-100 p-2 rounded">
            {importResult.customersNotFound.slice(0, 10).map((name, idx) => (
              <p key={idx} className="text-xs text-orange-700">{name}</p>
            ))}
            {importResult.customersNotFound.length > 10 && (
              <p className="text-xs text-orange-600 font-medium">
                ... and {importResult.customersNotFound.length - 10} more
              </p>
            )}
          </div>
        </div>
      )}

      {importResult.errors.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-red-800 mb-2">Errors:</p>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {importResult.errors.map((err, idx) => (
              <p key={idx} className="text-xs text-red-700">
                {err.factoryPartNumber}: {err.error}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
