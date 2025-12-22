/**
 * InvoiceDetailContent Component
 * Main container for invoice detail (refactored version)
 *
 * TODO: Refactor from InvoiceDetailContent
 */

'use client';

import React from 'react';

interface InvoiceDetailContentProps {
  invoiceId: string;
}

export default function InvoiceDetailContent({ invoiceId }: InvoiceDetailContentProps) {
  return (
    <main className="flex-1 overflow-hidden bg-[var(--background)] flex">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">
                Invoice Detail (Refactored)
              </h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Invoice ID: {invoiceId}
              </p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-[var(--muted-foreground)]">
              Invoice detail refactoring in progress...
            </p>
            <p className="text-sm text-[var(--muted-foreground)] mt-2">
              This component will be refactored from InvoiceDetailContent
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

