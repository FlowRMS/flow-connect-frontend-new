/**
 * Entity Hover Card Component
 * Displays a sleek tooltip with detailed entity information on hover
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type {
  JobRelatedQuote,
  JobRelatedOrder,
  JobRelatedInvoice,
  JobRelatedCheck,
} from '../../lib/crm-graphql';

// Format currency
const formatCurrency = (value?: number | null): string => {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
};

// Format date
const formatDate = (date?: string | null): string => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Status badge component
function StatusBadge({ status, type }: { status?: string; type: 'quote' | 'order' | 'invoice' | 'check' }) {
  if (!status) return null;

  const colorMap: Record<string, string> = {
    // Quote statuses
    DRAFT: 'bg-gray-100 text-gray-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    SENT: 'bg-blue-100 text-blue-700',
    ACCEPTED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    EXPIRED: 'bg-gray-100 text-gray-500',
    // Order statuses
    OPEN: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
    SHIPPED: 'bg-cyan-100 text-cyan-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
    // Invoice statuses
    PAID: 'bg-green-100 text-green-700',
    UNPAID: 'bg-yellow-100 text-yellow-700',
    OVERDUE: 'bg-red-100 text-red-700',
    PARTIAL: 'bg-orange-100 text-orange-700',
    // Check statuses
    POSTED: 'bg-green-100 text-green-700',
    UNPOSTED: 'bg-yellow-100 text-yellow-700',
  };

  const bgColor = colorMap[status.toUpperCase()] || 'bg-gray-100 text-gray-700';

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${bgColor}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

// Quote hover content
function QuoteHoverContent({ quote }: { quote: JobRelatedQuote }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-[var(--foreground)]">{quote.quoteNumber}</h4>
        <StatusBadge status={quote.status} type="quote" />
      </div>

      {/* Customer Info */}
      {(quote.soldToCustomer || quote.billToCustomer) && (
        <div className="space-y-1">
          {quote.soldToCustomer && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[var(--muted-foreground)]">Sold To:</span>
              <span className="font-medium text-[var(--foreground)]">{quote.soldToCustomer.companyName}</span>
            </div>
          )}
          {quote.billToCustomer && quote.billToCustomer.id !== quote.soldToCustomer?.id && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[var(--muted-foreground)]">Bill To:</span>
              <span className="font-medium text-[var(--foreground)]">{quote.billToCustomer.companyName}</span>
            </div>
          )}
        </div>
      )}

      {/* Balance Info */}
      {quote.balance && (
        <div className="grid grid-cols-2 gap-2 p-2 bg-[var(--muted)]/30 rounded-lg">
          <div>
            <div className="text-xs text-[var(--muted-foreground)]">Total</div>
            <div className="font-semibold text-[var(--foreground)]">{formatCurrency(quote.balance.total)}</div>
          </div>
          <div>
            <div className="text-xs text-[var(--muted-foreground)]">Commission</div>
            <div className="font-semibold text-green-600">{formatCurrency(quote.balance.commission)}</div>
          </div>
          {quote.balance.quantity && (
            <div>
              <div className="text-xs text-[var(--muted-foreground)]">Qty</div>
              <div className="font-medium text-[var(--foreground)]">{quote.balance.quantity}</div>
            </div>
          )}
          {quote.balance.discountRate !== undefined && quote.balance.discountRate > 0 && (
            <div>
              <div className="text-xs text-[var(--muted-foreground)]">Discount</div>
              <div className="font-medium text-orange-600">{quote.balance.discountRate}%</div>
            </div>
          )}
        </div>
      )}

      {/* Line Items Summary */}
      {quote.details && quote.details.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
            {quote.details.length} Line Item{quote.details.length !== 1 ? 's' : ''}
          </div>
          <div className="max-h-24 overflow-y-auto space-y-1">
            {quote.details.slice(0, 3).map((detail, idx) => (
              <div key={detail.id || idx} className="flex items-center justify-between text-xs p-1.5 bg-[var(--muted)]/20 rounded">
                <span className="truncate flex-1 text-[var(--foreground)]">
                  {detail.product?.factoryPartNumber || detail.productNameAdhoc || 'Item'}
                </span>
                <span className="text-[var(--muted-foreground)] ml-2">x{detail.quantity}</span>
              </div>
            ))}
            {quote.details.length > 3 && (
              <div className="text-xs text-[var(--muted-foreground)] text-center">
                +{quote.details.length - 3} more items
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dates */}
      <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)] pt-2 border-t border-[var(--border)]">
        <div>
          <span>Created: </span>
          <span className="text-[var(--foreground)]">{formatDate(quote.entityDate)}</span>
        </div>
        {quote.expDate && (
          <div>
            <span>Expires: </span>
            <span className="text-[var(--foreground)]">{formatDate(quote.expDate)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Order hover content
function OrderHoverContent({ order }: { order: JobRelatedOrder }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-[var(--foreground)]">{order.orderNumber}</h4>
        <StatusBadge status={order.status || order.headerStatus} type="order" />
      </div>

      {/* Customer Info */}
      {(order.soldToCustomer || order.billToCustomer) && (
        <div className="space-y-1">
          {order.soldToCustomer && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[var(--muted-foreground)]">Sold To:</span>
              <span className="font-medium text-[var(--foreground)]">{order.soldToCustomer.companyName}</span>
            </div>
          )}
          {order.billToCustomer && order.billToCustomer.id !== order.soldToCustomer?.id && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[var(--muted-foreground)]">Bill To:</span>
              <span className="font-medium text-[var(--foreground)]">{order.billToCustomer.companyName}</span>
            </div>
          )}
        </div>
      )}

      {/* Balance Info */}
      {order.balance && (
        <div className="grid grid-cols-2 gap-2 p-2 bg-[var(--muted)]/30 rounded-lg">
          <div>
            <div className="text-xs text-[var(--muted-foreground)]">Total</div>
            <div className="font-semibold text-[var(--foreground)]">{formatCurrency(order.balance.total)}</div>
          </div>
          <div>
            <div className="text-xs text-[var(--muted-foreground)]">Commission</div>
            <div className="font-semibold text-green-600">{formatCurrency(order.balance.commission)}</div>
          </div>
          {order.balance.quantity && (
            <div>
              <div className="text-xs text-[var(--muted-foreground)]">Qty</div>
              <div className="font-medium text-[var(--foreground)]">{order.balance.quantity}</div>
            </div>
          )}
          {order.balance.shippingBalance !== undefined && order.balance.shippingBalance > 0 && (
            <div>
              <div className="text-xs text-[var(--muted-foreground)]">Shipping</div>
              <div className="font-medium text-[var(--foreground)]">{formatCurrency(order.balance.shippingBalance)}</div>
            </div>
          )}
        </div>
      )}

      {/* Line Items Summary */}
      {order.details && order.details.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
            {order.details.length} Line Item{order.details.length !== 1 ? 's' : ''}
          </div>
          <div className="max-h-24 overflow-y-auto space-y-1">
            {order.details.slice(0, 3).map((detail, idx) => (
              <div key={detail.id || idx} className="flex items-center justify-between text-xs p-1.5 bg-[var(--muted)]/20 rounded">
                <span className="truncate flex-1 text-[var(--foreground)]">
                  {detail.product?.factoryPartNumber || detail.productNameAdhoc || 'Item'}
                </span>
                <span className="text-[var(--muted-foreground)] ml-2">x{detail.quantity}</span>
              </div>
            ))}
            {order.details.length > 3 && (
              <div className="text-xs text-[var(--muted-foreground)] text-center">
                +{order.details.length - 3} more items
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dates */}
      <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)] pt-2 border-t border-[var(--border)]">
        <div>
          <span>Date: </span>
          <span className="text-[var(--foreground)]">{formatDate(order.entityDate)}</span>
        </div>
        {order.shipDate && (
          <div>
            <span>Ship: </span>
            <span className="text-[var(--foreground)]">{formatDate(order.shipDate)}</span>
          </div>
        )}
        {order.dueDate && (
          <div>
            <span>Due: </span>
            <span className="text-[var(--foreground)]">{formatDate(order.dueDate)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Invoice hover content
function InvoiceHoverContent({ invoice }: { invoice: JobRelatedInvoice }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-[var(--foreground)]">{invoice.invoiceNumber}</h4>
        <StatusBadge status={invoice.status} type="invoice" />
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs text-[var(--muted-foreground)]">Invoice Date</div>
          <div className="font-medium text-[var(--foreground)]">{formatDate(invoice.entityDate)}</div>
        </div>
        <div>
          <div className="text-xs text-[var(--muted-foreground)]">Due Date</div>
          <div className="font-medium text-[var(--foreground)]">{formatDate(invoice.dueDate)}</div>
        </div>
      </div>

      {/* Status indicators */}
      <div className="flex items-center gap-2">
        {invoice.locked && (
          <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Locked
          </span>
        )}
        {invoice.published && (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded text-xs text-green-600">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Published
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)] pt-2 border-t border-[var(--border)]">
        <div>
          <span>Created: </span>
          <span className="text-[var(--foreground)]">{formatDate(invoice.createdAt)}</span>
        </div>
        {invoice.orderId && (
          <div>
            <span>Order linked</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Check hover content
function CheckHoverContent({ check }: { check: JobRelatedCheck }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-[var(--foreground)]">{check.checkNumber}</h4>
        <StatusBadge status={check.status} type="check" />
      </div>

      {/* Amount and Factory */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-2 bg-green-50 rounded-lg">
          <div className="text-xs text-green-600">Commission Amount</div>
          <div className="font-semibold text-green-700 text-lg">
            {formatCurrency(check.enteredCommissionAmount)}
          </div>
        </div>
        {check.factory && (
          <div className="p-2 bg-[var(--muted)]/30 rounded-lg">
            <div className="text-xs text-[var(--muted-foreground)]">Factory</div>
            <div className="font-medium text-[var(--foreground)] truncate">{check.factory.title}</div>
            {check.factory.accountNumber && (
              <div className="text-xs text-[var(--muted-foreground)]">#{check.factory.accountNumber}</div>
            )}
          </div>
        )}
      </div>

      {/* Details Summary */}
      {check.details && check.details.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
            {check.details.length} Detail{check.details.length !== 1 ? 's' : ''}
          </div>
          <div className="max-h-24 overflow-y-auto space-y-1">
            {check.details.slice(0, 3).map((detail, idx) => (
              <div key={detail.id || idx} className="flex items-center justify-between text-xs p-1.5 bg-[var(--muted)]/20 rounded">
                <span className="truncate flex-1 text-[var(--foreground)]">
                  {detail.invoice?.invoiceNumber || detail.credit?.creditNumber || detail.adjustment?.adjustmentNumber || 'Detail'}
                </span>
                {detail.appliedAmount && (
                  <span className="text-green-600 ml-2">{formatCurrency(detail.appliedAmount)}</span>
                )}
              </div>
            ))}
            {check.details.length > 3 && (
              <div className="text-xs text-[var(--muted-foreground)] text-center">
                +{check.details.length - 3} more details
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dates */}
      <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)] pt-2 border-t border-[var(--border)]">
        <div>
          <span>Date: </span>
          <span className="text-[var(--foreground)]">{formatDate(check.entityDate)}</span>
        </div>
        {check.commissionMonth && (
          <div>
            <span>Month: </span>
            <span className="text-[var(--foreground)]">{check.commissionMonth}</span>
          </div>
        )}
        {check.postDate && (
          <div>
            <span>Posted: </span>
            <span className="text-[var(--foreground)]">{formatDate(check.postDate)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Props for the hover card wrapper
interface EntityHoverCardProps {
  children: React.ReactNode;
  entity: JobRelatedQuote | JobRelatedOrder | JobRelatedInvoice | JobRelatedCheck;
  type: 'quote' | 'order' | 'invoice' | 'check';
}

export function EntityHoverCard({ children, entity, type }: EntityHoverCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const cardWidth = 320;
        const cardHeight = 300;

        let left = rect.right + 12;
        let top = rect.top;

        // Check if card would overflow right edge
        if (left + cardWidth > window.innerWidth - 20) {
          left = rect.left - cardWidth - 12;
        }

        // Check if card would overflow bottom
        if (top + cardHeight > window.innerHeight - 20) {
          top = window.innerHeight - cardHeight - 20;
        }

        // Ensure top is not negative
        if (top < 20) {
          top = 20;
        }

        setPosition({ top, left });
        setIsHovered(true);
      }
    }, 400); // 400ms delay before showing
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsHovered(false);
  };

  const renderContent = () => {
    switch (type) {
      case 'quote':
        return <QuoteHoverContent quote={entity as JobRelatedQuote} />;
      case 'order':
        return <OrderHoverContent order={entity as JobRelatedOrder} />;
      case 'invoice':
        return <InvoiceHoverContent invoice={entity as JobRelatedInvoice} />;
      case 'check':
        return <CheckHoverContent check={entity as JobRelatedCheck} />;
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block w-full"
      >
        {children}
      </div>

      {isHovered &&
        createPortal(
          <div
            className="fixed z-[9999] w-80 p-4 bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200"
            style={{
              top: position.top,
              left: position.left,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
          >
            {renderContent()}
          </div>,
          document.body
        )}
    </>
  );
}

export default EntityHoverCard;
