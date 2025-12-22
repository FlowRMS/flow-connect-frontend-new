/**
 * LinkedObjectsTab Component
 * Displays related entities connected to the invoice
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface LinkedObjectsTabProps {
  // TODO: Add props for linked objects data when implementing real functionality
}

export function LinkedObjectsTab({}: LinkedObjectsTabProps) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)]">
          Linked Objects
        </h3>
        <p className="text-sm text-[var(--muted-foreground)]">
          Related entities connected to this invoice
        </p>
      </div>

      {/* Orders Section */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-blue-500"
            >
              <path d="M14 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z" />
              <path d="M8 6h4M8 10h4M8 14h2" />
            </svg>
            <span className="font-medium">Orders</span>
            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
              2
            </span>
          </div>
          <button className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)]">
            + Link Order
          </button>
        </div>
        <div className="divide-y divide-[var(--border)]">
          <div className="px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/20">
            <div className="flex items-center gap-3">
              <span className="text-sm text-[var(--muted-foreground)] font-mono">
                ORD-2024-0156
              </span>
              <span className="text-sm">Downtown Office - Phase 1</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">$45,000</span>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                processing
              </span>
            </div>
          </div>
          <div className="px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/20">
            <div className="flex items-center gap-3">
              <span className="text-sm text-[var(--muted-foreground)] font-mono">
                ORD-2024-0189
              </span>
              <span className="text-sm">Downtown Office - Phase 2</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">$62,000</span>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                shipped
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quotes Section */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-orange-500"
            >
              <path d="M14 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z" />
              <path d="M8 6h4M8 10h4M8 14h2" />
            </svg>
            <span className="font-medium">Quotes</span>
            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
              1
            </span>
          </div>
          <button className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)]">
            + Link Quote
          </button>
        </div>
        <div className="divide-y divide-[var(--border)]">
          <div className="px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/20">
            <div className="flex items-center gap-3">
              <span className="text-sm text-[var(--muted-foreground)] font-mono">
                QT-2024-001
              </span>
              <span className="text-sm">Downtown Office Complex</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">$125,000</span>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Commission Statements Section */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-yellow-500"
            >
              <path d="M10 4v12M6 8l4-4 4 4" />
            </svg>
            <span className="font-medium">Commission Statements</span>
            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
              1
            </span>
          </div>
          <button className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)]">
            + Link Statement
          </button>
        </div>
        <div className="divide-y divide-[var(--border)]">
          <div className="px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/20">
            <div className="flex items-center gap-3">
              <span className="text-sm text-[var(--muted-foreground)] font-mono">
                CS-2024-03
              </span>
              <span className="text-sm">March 2024 Statement</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-green-600">$4,250</span>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                processed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contacts Section */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-blue-500"
            >
              <path d="M16 14v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2" />
              <circle cx="10" cy="7" r="3" />
            </svg>
            <span className="font-medium">Contacts</span>
            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
              2
            </span>
          </div>
          <button className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)]">
            + Link Contact
          </button>
        </div>
        <div className="divide-y divide-[var(--border)]">
          <div className="px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium">
                JS
              </div>
              <div>
                <div className="text-sm font-medium">John Smith</div>
                <div className="text-xs text-[var(--muted-foreground)]">
                  Project Manager
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm">Turner Construction</div>
              <div className="text-xs text-[var(--muted-foreground)]">
                jsmith@turner.com
              </div>
            </div>
          </div>
          <div className="px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-medium">
                ED
              </div>
              <div>
                <div className="text-sm font-medium">Emily Davis</div>
                <div className="text-xs text-[var(--muted-foreground)]">
                  Purchasing Agent
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm">Turner Construction</div>
              <div className="text-xs text-[var(--muted-foreground)]">
                edavis@turner.com
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Companies Section */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-purple-500"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            </svg>
            <span className="font-medium">Companies</span>
            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
              1
            </span>
          </div>
          <button className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)]">
            + Link Company
          </button>
        </div>
        <div className="divide-y divide-[var(--border)]">
          <div className="px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-medium">
                TU
              </div>
              <div>
                <div className="text-sm font-medium">Turner Construction</div>
                <div className="text-xs text-[var(--muted-foreground)]">
                  New York, NY
                </div>
              </div>
            </div>
            <span className="text-sm text-[var(--primary)]">Customer</span>
          </div>
        </div>
      </div>
    </div>
  );
}

