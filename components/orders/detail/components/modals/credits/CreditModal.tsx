/**
 * CreditModal Component
 * Full-featured modal for creating and editing credits with beautiful UX
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Order, OrderLineItem } from '@/lib/types/rms';
import type { Credit, CreditType, CreditDetailInput, CreateCreditInput } from '../../../../api/creditsApi';
import { formatCurrency } from '../../../utils';
import { SearchableDropdownV2 } from '@/components/quotes-v2/components/SearchableDropdownV2';
import { useUserSearch } from '../../../../api';
import { searchUsers } from '@/components/quotes/api/quotesApi';
import { StyledDatePicker, parseDateString, formatDateToString } from '@/components/shared/StyledDatePicker';

// Credit Type Configuration with colors and labels
const CREDIT_TYPE_CONFIG: Record<CreditType, { label: string; color: string; bgColor: string; description: string }> = {
  RETURN: {
    label: 'Return',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    description: 'Product returned by customer'
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    description: 'Order or line item cancelled'
  },
  PRICE_ADJUSTMENT: {
    label: 'Price Adjustment',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    description: 'Price correction or discount'
  },
  DEFECTIVE: {
    label: 'Defective',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    description: 'Defective product replacement'
  },
  OTHER: {
    label: 'Other',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    description: 'Other credit reason'
  },
};

interface OutsideSplitRate {
  id: string;
  userId: string;
  userName: string;
  splitRate: number;
  position: number;
}

interface CreditLineItemState {
  id: string;
  linkedLineItemId: string | null;
  linkedLineItemLabel: string;
  creditType: CreditType | '';
  quantity: number;
  unitPrice: number;
  creditAmount: number;
  commissionRate: number;
  commissionAmount: number;
  itemNumber: number;
  outsideSplitRates: OutsideSplitRate[];
  isExpanded: boolean;
  showOriginalDetails: boolean;
  showImpactPreview: boolean;
  showOutsideSplits: boolean;
  outsideSplitsFromLineItem: boolean; // Whether the splits are inherited from the line item
}

interface CreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  credit?: Credit | null;
  onSubmit: (input: CreateCreditInput) => Promise<void>;
  isLoading?: boolean;
  isLoadingCreditDetails?: boolean;
}

// Collapsible Section Component
function CollapsibleSection({
  title,
  icon,
  isOpen,
  onToggle,
  children,
  colorScheme = 'blue',
  badge,
}: {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  colorScheme?: 'blue' | 'orange' | 'purple' | 'green';
  badge?: React.ReactNode;
}) {
  const colors = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      headerBg: 'bg-gradient-to-r from-blue-50 to-blue-100/50',
      text: 'text-blue-700',
      iconBg: 'bg-blue-100',
      hoverBg: 'hover:bg-blue-100/50',
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      headerBg: 'bg-gradient-to-r from-orange-50 to-orange-100/50',
      text: 'text-orange-700',
      iconBg: 'bg-orange-100',
      hoverBg: 'hover:bg-orange-100/50',
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      headerBg: 'bg-gradient-to-r from-purple-50 to-purple-100/50',
      text: 'text-purple-700',
      iconBg: 'bg-purple-100',
      hoverBg: 'hover:bg-purple-100/50',
    },
    green: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      headerBg: 'bg-gradient-to-r from-emerald-50 to-emerald-100/50',
      text: 'text-emerald-700',
      iconBg: 'bg-emerald-100',
      hoverBg: 'hover:bg-emerald-100/50',
    },
  };

  const scheme = colors[colorScheme];

  return (
    <div className={`rounded-xl border ${scheme.border} overflow-hidden transition-all duration-200`}>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full px-4 py-2.5 ${scheme.headerBg} flex items-center gap-3 ${scheme.hoverBg} transition-colors`}
      >
        <div className={`w-7 h-7 rounded-lg ${scheme.iconBg} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <span className={`text-sm font-semibold ${scheme.text} flex-1 text-left`}>{title}</span>
        {badge}
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`${scheme.text} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className={`p-4 ${scheme.bg}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function CreditModal({
  isOpen,
  onClose,
  order,
  credit,
  onSubmit,
  isLoading = false,
  isLoadingCreditDetails = false,
}: CreditModalProps) {
  const isEditMode = !!credit;

  // Form state
  const [creditNumber, setCreditNumber] = useState('');
  const [creditDate, setCreditDate] = useState<Date | null>(new Date());
  const [reason, setReason] = useState('');
  const [creditType, setCreditType] = useState<CreditType | ''>('');
  const [lineItems, setLineItems] = useState<CreditLineItemState[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Outside rep search state
  const [repSearchTerm, setRepSearchTerm] = useState('');
  const [repSearchEnabled, setRepSearchEnabled] = useState(false);

  // Search for outside reps
  const { data: repResults, isLoading: isRepLoading } = useUserSearch(
    repSearchTerm,
    { isInside: false, isOutside: true },
    repSearchEnabled
  );

  const repOptions = useMemo(() => {
    return (repResults || []).map(u => ({
      id: u.id,
      label: u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || '',
      sublabel: u.email,
    }));
  }, [repResults]);

  // Build line item dropdown options
  const lineItemOptions = useMemo(() => {
    const items = (order.lineItems || [])
      .filter(li => li.partNumber !== 'FREIGHT')
      .map(li => ({
        id: li.id,
        label: `#${li.lineNumber} - ${li.partNumber}`,
        sublabel: li.description?.substring(0, 60) || '',
      }));
    return [{ id: 'order-level', label: 'Order-Level Credit', sublabel: 'Not tied to a specific line item' }, ...items];
  }, [order.lineItems]);

  // Helper to find order line item by orderDetailId
  const findOrderLineItem = useCallback((orderDetailId?: string) => {
    if (!orderDetailId) return null;
    return (order.lineItems || []).find(li => li.id === orderDetailId);
  }, [order.lineItems]);

  // Initialize form when modal opens or credit changes
  useEffect(() => {
    if (isOpen) {
      if (credit) {
        // Edit mode - populate from existing credit (full Credit type with details)
        setCreditNumber(credit.creditNumber || '');
        setCreditDate(parseDateString(credit.entityDate) || new Date());
        setReason(credit.reason || '');
        setCreditType(credit.creditType || '');

        // Populate line items from credit details if available
        if (credit.details && credit.details.length > 0) {
          const populatedLineItems: CreditLineItemState[] = credit.details.map((detail, index) => {
            const linkedOrderLineItem = findOrderLineItem(detail.orderDetailId);
            const quantity = parseFloat(detail.quantity || '0');
            const unitPrice = parseFloat(detail.unitPrice || '0');
            const creditAmount = detail.subtotal || (quantity * unitPrice);
            const commissionRate = parseFloat(detail.commissionRate || '8');
            const commissionAmount = detail.commission || (creditAmount * (commissionRate / 100));

            return {
              id: detail.id || `edit-${Date.now()}-${index}`,
              linkedLineItemId: detail.orderDetailId || null,
              linkedLineItemLabel: linkedOrderLineItem
                ? `#${linkedOrderLineItem.lineNumber} - ${linkedOrderLineItem.partNumber}`
                : 'Order-Level Credit',
              creditType: credit.creditType || '',
              quantity,
              unitPrice,
              creditAmount,
              commissionRate,
              commissionAmount,
              itemNumber: detail.itemNumber || (index + 1),
              outsideSplitRates: (detail.outsideSplitRates || []).map((split, splitIndex) => ({
                id: split.id || `split-${Date.now()}-${splitIndex}`,
                userId: split.userId || '',
                userName: split.user?.fullName || split.user?.firstName || '',
                splitRate: parseFloat(split.splitRate || '0'),
                position: split.position || splitIndex,
              })),
              isExpanded: true,
              showOriginalDetails: true,
              showImpactPreview: true,
              showOutsideSplits: (detail.outsideSplitRates || []).length > 0,
              outsideSplitsFromLineItem: false, // In edit mode, the splits were already saved, so they're editable
            };
          });
          setLineItems(populatedLineItems);
        } else {
          // No details available, start with empty line item
          setLineItems([createEmptyLineItem(1)]);
        }
      } else {
        // Create mode - reset form
        setCreditNumber('');
        setCreditDate(new Date());
        setReason('');
        setCreditType('');
        setLineItems([createEmptyLineItem(1)]);
      }
      setErrors({});
      setTouched({});
    }
  }, [isOpen, credit, order.lineItems, findOrderLineItem]);

  // Create an empty line item
  function createEmptyLineItem(itemNumber: number): CreditLineItemState {
    return {
      id: `new-${Date.now()}-${itemNumber}`,
      linkedLineItemId: null,
      linkedLineItemLabel: 'Order-Level Credit',
      creditType: creditType || '',
      quantity: 0,
      unitPrice: 0,
      creditAmount: 0,
      commissionRate: 8,
      commissionAmount: 0,
      itemNumber,
      outsideSplitRates: [],
      isExpanded: true,
      showOriginalDetails: true,
      showImpactPreview: true,
      showOutsideSplits: false,
      outsideSplitsFromLineItem: false,
    };
  }

  // Calculate totals
  const totals = useMemo(() => {
    const totalCredit = lineItems.reduce((sum, li) => sum + li.creditAmount, 0);
    const totalCommission = lineItems.reduce((sum, li) => sum + li.commissionAmount, 0);
    const totalQty = lineItems.reduce((sum, li) => sum + li.quantity, 0);
    return { totalCredit, totalCommission, totalQty };
  }, [lineItems]);

  // Update line item
  const updateLineItem = (index: number, updates: Partial<CreditLineItemState>) => {
    setLineItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], ...updates };

      // Recalculate amounts if quantity, unitPrice, or commissionRate changed
      if ('quantity' in updates || 'unitPrice' in updates || 'commissionRate' in updates) {
        const item = newItems[index];
        item.creditAmount = item.quantity * item.unitPrice;
        item.commissionAmount = item.creditAmount * (item.commissionRate / 100);
      }

      return newItems;
    });
  };

  // Toggle line item expansion
  const toggleLineItemExpanded = (index: number) => {
    updateLineItem(index, { isExpanded: !lineItems[index].isExpanded });
  };

  // Toggle section visibility
  const toggleSection = (index: number, section: 'showOriginalDetails' | 'showImpactPreview' | 'showOutsideSplits') => {
    updateLineItem(index, { [section]: !lineItems[index][section] });
  };

  // Add new line item
  const addLineItem = () => {
    setLineItems(prev => [...prev, createEmptyLineItem(prev.length + 1)]);
  };

  // Remove line item
  const removeLineItem = (index: number) => {
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  // Select order line item
  const selectOrderLineItem = async (index: number, lineItemId: string, label: string) => {
    if (lineItemId === 'order-level') {
      // Order-Level Credit - clear everything including outside splits
      updateLineItem(index, {
        linkedLineItemId: null,
        linkedLineItemLabel: 'Order-Level Credit',
        unitPrice: 0,
        quantity: 0,
        creditAmount: 0,
        commissionAmount: 0,
        outsideSplitRates: [],
        showOutsideSplits: false,
        outsideSplitsFromLineItem: false,
      });
    } else {
      const orderLineItem = (order.lineItems || []).find(li => li.id === lineItemId);
      if (orderLineItem) {
        // Check if line item has outside rep splits
        const lineItemOutsideSplits = (orderLineItem as any).outsideSplitRates || [];
        const hasOutsideSplits = lineItemOutsideSplits.length > 0;

        // First update with basic info immediately
        updateLineItem(index, {
          linkedLineItemId: lineItemId,
          linkedLineItemLabel: label,
          unitPrice: orderLineItem.unitPrice,
          commissionRate: orderLineItem.commissionRate ?? 8, // Already stored as whole percentage
          outsideSplitRates: [],
          showOutsideSplits: true,
          outsideSplitsFromLineItem: hasOutsideSplits,
        });

        // If there are outside splits, fetch user names
        if (hasOutsideSplits) {
          try {
            // Fetch all outside reps to match userIds to names
            const users = await searchUsers({ searchTerm: '', isOutside: true, enabled: true, limit: 100 });

            const outsideSplitRates: OutsideSplitRate[] = lineItemOutsideSplits.map((split: any, idx: number) => {
              const matchingUser = users.find(u => u.id === split.userId);
              return {
                id: `inherited-${Date.now()}-${idx}`,
                userId: split.userId || '',
                userName: matchingUser?.fullName || matchingUser?.firstName || 'Unknown Rep',
                splitRate: parseFloat(split.splitRate || '0'),
                position: split.position || idx,
              };
            });

            updateLineItem(index, {
              outsideSplitRates,
            });
          } catch (error) {
            console.error('Error fetching outside rep names:', error);
            // Fallback: use Unknown Rep if fetch fails
            const outsideSplitRates: OutsideSplitRate[] = lineItemOutsideSplits.map((split: any, idx: number) => ({
              id: `inherited-${Date.now()}-${idx}`,
              userId: split.userId || '',
              userName: 'Unknown Rep',
              splitRate: parseFloat(split.splitRate || '0'),
              position: split.position || idx,
            }));
            updateLineItem(index, {
              outsideSplitRates,
            });
          }
        }
      }
    }
  };

  // Handle rep search
  const handleRepSearch = useCallback((term: string) => {
    setRepSearchTerm(term);
    setRepSearchEnabled(true);
  }, []);

  // Add rep to line item splits
  const addRepToLineItem = (lineIndex: number, repId: string, repName: string) => {
    setLineItems(prev => {
      const newItems = [...prev];
      const item = newItems[lineIndex];
      if (!item.outsideSplitRates.some(r => r.userId === repId)) {
        const newRep: OutsideSplitRate = {
          id: `new-${crypto.randomUUID()}`,  // Use new- prefix so it's not mistaken for a database ID
          userId: repId,
          userName: repName,
          splitRate: 0,
          position: item.outsideSplitRates.length,
        };
        const newRates = [...item.outsideSplitRates, newRep];
        // Auto-distribute
        const perRep = Math.floor(100 / newRates.length);
        const remainder = 100 - (perRep * newRates.length);
        item.outsideSplitRates = newRates.map((r, idx) => ({
          ...r,
          splitRate: idx === newRates.length - 1 ? perRep + remainder : perRep,
        }));
      }
      return newItems;
    });
  };

  // Remove rep from line item splits
  const removeRepFromLineItem = (lineIndex: number, repId: string) => {
    setLineItems(prev => {
      const newItems = [...prev];
      const item = newItems[lineIndex];
      const newRates = item.outsideSplitRates.filter(r => r.id !== repId);
      if (newRates.length > 0) {
        const perRep = Math.floor(100 / newRates.length);
        const remainder = 100 - (perRep * newRates.length);
        item.outsideSplitRates = newRates.map((r, idx) => ({
          ...r,
          splitRate: idx === newRates.length - 1 ? perRep + remainder : perRep,
        }));
      } else {
        item.outsideSplitRates = [];
      }
      return newItems;
    });
  };

  // Update split rate
  const updateSplitRate = (lineIndex: number, repId: string, rate: number) => {
    setLineItems(prev => {
      const newItems = [...prev];
      const item = newItems[lineIndex];
      item.outsideSplitRates = item.outsideSplitRates.map(r =>
        r.id === repId ? { ...r, splitRate: rate } : r
      );
      return newItems;
    });
  };

  // Auto-distribute split rates
  const autoDistributeSplits = (lineIndex: number) => {
    setLineItems(prev => {
      const newItems = [...prev];
      const item = newItems[lineIndex];
      const count = item.outsideSplitRates.length;
      if (count > 0) {
        const perRep = Math.floor(100 / count);
        const remainder = 100 - (perRep * count);
        item.outsideSplitRates = item.outsideSplitRates.map((r, idx) => ({
          ...r,
          splitRate: idx === count - 1 ? perRep + remainder : perRep,
        }));
      }
      return newItems;
    });
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!creditNumber || creditNumber.trim() === '') {
      newErrors.creditNumber = 'Credit number is required';
    }

    if (!creditDate) {
      newErrors.creditDate = 'Credit date is required';
    }

    if (!creditType) {
      newErrors.creditType = 'Credit type is required';
    }

    if (lineItems.length === 0) {
      newErrors.lineItems = 'At least one line item is required';
    }

    lineItems.forEach((item, index) => {
      if (item.quantity === 0) {
        newErrors[`lineItem-${index}-quantity`] = 'Quantity is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async () => {
    setTouched({
      creditNumber: true,
      creditDate: true,
      creditType: true,
      ...lineItems.reduce((acc, _, idx) => ({ ...acc, [`lineItem-${idx}-quantity`]: true }), {}),
    });

    if (!validate()) return;

    const details: CreditDetailInput[] = lineItems.map((item, idx) => ({
      itemNumber: idx + 1,
      quantity: String(item.quantity),
      unitPrice: String(item.unitPrice),
      commissionRate: String(item.commissionRate),
      orderDetailId: item.linkedLineItemId || undefined,
      outsideSplitRates: item.outsideSplitRates.length > 0
        ? item.outsideSplitRates.map(sr => ({
            userId: sr.userId,
            splitRate: String(sr.splitRate),
            position: sr.position,
          }))
        : undefined,
    }));

    const input: CreateCreditInput = {
      ...(credit?.id ? { id: credit.id } : {}),
      creditNumber: creditNumber.trim(),
      entityDate: formatDateToString(creditDate) || new Date().toISOString().split('T')[0],
      orderId: order.id,
      creditType: creditType as CreditType,
      creationType: 'MANUAL',
      reason: reason || undefined,
      details,
    };

    await onSubmit(input);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-4 bg-gradient-to-r from-red-50 to-orange-50">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 12h8"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-[var(--foreground)] flex items-center gap-3">
              {isEditMode ? 'Edit Credit' : 'Create Credit'}
              <span className="text-red-600 text-lg font-bold">
                {formatCurrency(totals.totalCredit)}
              </span>
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
              Order #{order.orderNumber} - Credits reduce order totals
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Loading state when fetching credit details for edit */}
          {isLoadingCreditDetails && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <svg className="animate-spin h-8 w-8 text-[var(--primary)]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span className="text-sm text-[var(--muted-foreground)]">Loading credit details...</span>
              </div>
            </div>
          )}

          {!isLoadingCreditDetails && (
            <>
          {/* Credit Info Section */}
          <div className="bg-[var(--muted)]/20 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="14" height="14" rx="2"/>
                <path d="M3 8h14"/>
                <path d="M7 2v4"/>
                <path d="M13 2v4"/>
              </svg>
              Credit Information
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Credit Number (Required) */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  Credit Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={creditNumber}
                  onChange={(e) => {
                    setCreditNumber(e.target.value);
                    setTouched(prev => ({ ...prev, creditNumber: true }));
                  }}
                  onBlur={() => setTouched(prev => ({ ...prev, creditNumber: true }))}
                  placeholder="Enter credit number"
                  className={`w-full px-3 py-2 border rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 ${
                    touched.creditNumber && errors.creditNumber
                      ? 'border-red-500'
                      : 'border-[var(--border)]'
                  }`}
                />
                {touched.creditNumber && errors.creditNumber && (
                  <p className="text-xs text-red-500 mt-1">{errors.creditNumber}</p>
                )}
              </div>

              {/* Credit Date - Styled Date Picker */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  Credit Date <span className="text-red-500">*</span>
                </label>
                <StyledDatePicker
                  selected={creditDate}
                  onChange={(date) => {
                    setCreditDate(date);
                    setTouched(prev => ({ ...prev, creditDate: true }));
                  }}
                  placeholder="Select credit date..."
                />
                {touched.creditDate && errors.creditDate && (
                  <p className="text-xs text-red-500 mt-1">{errors.creditDate}</p>
                )}
              </div>

              {/* Credit Type */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  Credit Type <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(CREDIT_TYPE_CONFIG) as CreditType[]).map((type) => {
                    const config = CREDIT_TYPE_CONFIG[type];
                    const isSelected = creditType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setCreditType(type);
                          setTouched(prev => ({ ...prev, creditType: true }));
                          setLineItems(prev => prev.map(li => ({ ...li, creditType: type })));
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          isSelected
                            ? `${config.bgColor} ${config.color} ring-2 ring-offset-1 ring-current`
                            : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80'
                        }`}
                        title={config.description}
                      >
                        {config.label}
                      </button>
                    );
                  })}
                </div>
                {touched.creditType && errors.creditType && (
                  <p className="text-xs text-red-500 mt-1">{errors.creditType}</p>
                )}
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Reason / Notes
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="Describe the reason for this credit..."
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
              />
            </div>
          </div>

          {/* Line Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h12M4 10h12M4 14h8" strokeLinecap="round"/>
                </svg>
                Credit Line Items
              </h3>
              <button
                type="button"
                onClick={addLineItem}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                </svg>
                Add Line
              </button>
            </div>

            {errors.lineItems && (
              <p className="text-sm text-red-500">{errors.lineItems}</p>
            )}

            <div className="space-y-3">
              {lineItems.length === 0 ? (
                <div className="border border-[var(--border)] rounded-lg px-4 py-8 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[var(--muted)] flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)] mb-3">No credit lines added yet</p>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                    </svg>
                    Add First Line
                  </button>
                </div>
              ) : (
                lineItems.map((item, index) => {
                  const linkedLineItem = item.linkedLineItemId
                    ? (order.lineItems || []).find(li => li.id === item.linkedLineItemId)
                    : null;
                  const splitTotal = item.outsideSplitRates.reduce((s, r) => s + r.splitRate, 0);
                  const splitValid = item.outsideSplitRates.length === 0 || splitTotal === 100;

                  return (
                    <div
                      key={item.id}
                      className="border border-[var(--border)] rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      {/* Line Item Header - Always Visible */}
                      <div
                        className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${
                          item.isExpanded ? 'bg-gradient-to-r from-gray-50 to-white border-b border-[var(--border)]' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => toggleLineItemExpanded(index)}
                      >
                        {/* Expand/Collapse Icon */}
                        <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 20 20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className={`text-[var(--primary)] transition-transform duration-200 ${item.isExpanded ? 'rotate-180' : ''}`}
                          >
                            <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>

                        {/* Item Number Badge */}
                        <div className="w-7 h-7 rounded-full bg-[var(--muted)] flex items-center justify-center flex-shrink-0 text-sm font-bold text-[var(--muted-foreground)]">
                          {index + 1}
                        </div>

                        {/* Summary Info */}
                        <div className="flex-1 min-w-0 flex items-center gap-4">
                          <span className="text-sm font-medium text-[var(--foreground)] truncate">
                            {item.linkedLineItemLabel}
                          </span>
                          <div className="hidden sm:flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                            <span>Qty: <strong className="text-[var(--foreground)]">{item.quantity}</strong></span>
                            <span>Amount: <strong className="text-red-600">{formatCurrency(item.creditAmount)}</strong></span>
                            {item.outsideSplitRates.length > 0 && (
                              <span className="flex items-center gap-1">
                                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="7" cy="7" r="3"/>
                                  <circle cx="13" cy="13" r="3"/>
                                </svg>
                                {item.outsideSplitRates.length} rep{item.outsideSplitRates.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeLineItem(index);
                          }}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors text-[var(--muted-foreground)] hover:text-red-600"
                          title="Remove line item"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>

                      {/* Expanded Content */}
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          item.isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="p-4 space-y-4">
                          {/* Line Item Selection */}
                          <div>
                            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1.5">
                              Link to Order Line Item
                            </label>
                            <SearchableDropdownV2
                              value={item.linkedLineItemId || 'order-level'}
                              displayValue={item.linkedLineItemLabel}
                              onChange={(id, label) => selectOrderLineItem(index, id, label)}
                              options={lineItemOptions}
                              placeholder="Select line item..."
                            />
                          </div>

                          {/* Original Line Item Details - Collapsible */}
                          {linkedLineItem && (
                            <CollapsibleSection
                              title="Original Line Item Details"
                              icon={
                                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                                  <circle cx="10" cy="10" r="7"/>
                                  <path d="M10 6v4l2 2" strokeLinecap="round"/>
                                </svg>
                              }
                              isOpen={item.showOriginalDetails}
                              onToggle={() => toggleSection(index, 'showOriginalDetails')}
                              colorScheme="blue"
                            >
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                                <div>
                                  <span className="text-blue-600/70 text-xs block mb-1">Qty Ordered</span>
                                  <div className="font-semibold text-blue-900">{linkedLineItem.quantity}</div>
                                </div>
                                <div>
                                  <span className="text-blue-600/70 text-xs block mb-1">Unit Price</span>
                                  <div className="font-semibold text-blue-900">{formatCurrency(linkedLineItem.unitPrice)}</div>
                                </div>
                                <div>
                                  <span className="text-blue-600/70 text-xs block mb-1">Line Total</span>
                                  <div className="font-semibold text-blue-900">{formatCurrency(linkedLineItem.extendedPrice)}</div>
                                </div>
                                <div>
                                  <span className="text-blue-600/70 text-xs block mb-1">Qty Shipped</span>
                                  <div className="font-semibold text-blue-900">{linkedLineItem.quantityShipped || 0}</div>
                                </div>
                                <div>
                                  <span className="text-blue-600/70 text-xs block mb-1">Commission Rate</span>
                                  <div className="font-semibold text-blue-900">{Number(linkedLineItem.commissionRate || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}%</div>
                                </div>
                              </div>
                            </CollapsibleSection>
                          )}

                          {/* Credit Input Fields */}
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                                Credit Qty <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                value={item.quantity === 0 ? '' : item.quantity}
                                min={1}
                                max={linkedLineItem?.quantity}
                                placeholder={linkedLineItem ? `Max: ${linkedLineItem.quantity}` : 'Enter qty'}
                                onChange={(e) => {
                                  const value = Math.abs(parseFloat(e.target.value) || 0);
                                  updateLineItem(index, { quantity: value });
                                  setTouched(prev => ({ ...prev, [`lineItem-${index}-quantity`]: true }));
                                }}
                                className={`w-full px-3 py-2 border rounded-lg text-sm bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 ${
                                  touched[`lineItem-${index}-quantity`] && errors[`lineItem-${index}-quantity`]
                                    ? 'border-red-500'
                                    : 'border-[var(--border)]'
                                }`}
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                                Unit Price
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.unitPrice || ''}
                                  onChange={(e) => updateLineItem(index, { unitPrice: parseFloat(e.target.value) || 0 })}
                                  className="w-full pl-7 pr-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                                Credit Amount
                              </label>
                              <div className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--muted)]/30 font-semibold text-red-600">
                                {formatCurrency(item.creditAmount)}
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                                Comm. Rate %
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  step="0.1"
                                  value={item.commissionRate || ''}
                                  onChange={(e) => updateLineItem(index, { commissionRate: parseFloat(e.target.value) || 0 })}
                                  className="w-full px-3 py-2 pr-8 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">%</span>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                                Comm. Amount
                              </label>
                              <div className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--muted)]/30 font-semibold text-red-600">
                                {formatCurrency(item.commissionAmount)}
                              </div>
                            </div>
                          </div>

                          {/* Outside Split Rates Section - Collapsible */}
                          <CollapsibleSection
                            title={item.outsideSplitsFromLineItem ? "Outside Rep Split Rates (from Line Item)" : "Outside Rep Split Rates"}
                            icon={
                              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={item.outsideSplitsFromLineItem ? "text-gray-400" : "text-purple-600"}>
                                <circle cx="7" cy="7" r="3"/>
                                <circle cx="13" cy="13" r="3"/>
                                <path d="M10 7a3 3 0 00-3 3"/>
                              </svg>
                            }
                            isOpen={item.showOutsideSplits}
                            onToggle={() => toggleSection(index, 'showOutsideSplits')}
                            colorScheme={item.outsideSplitsFromLineItem ? "blue" : "purple"}
                            badge={
                              item.outsideSplitRates.length > 0 ? (
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                  item.outsideSplitsFromLineItem
                                    ? 'bg-gray-100 text-gray-600'
                                    : splitValid
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-red-100 text-red-700'
                                }`}>
                                  {item.outsideSplitRates.length} rep{item.outsideSplitRates.length > 1 ? 's' : ''} • {splitTotal}%
                                  {item.outsideSplitsFromLineItem && ' (inherited)'}
                                </span>
                              ) : (
                                item.linkedLineItemId && !item.outsideSplitsFromLineItem ? (
                                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                                    No outside rep on line item
                                  </span>
                                ) : null
                              )
                            }
                          >
                            <div className={`space-y-4 ${item.outsideSplitsFromLineItem ? 'opacity-75' : ''}`}>
                              {/* Inherited from line item notice */}
                              {item.outsideSplitsFromLineItem && item.outsideSplitRates.length > 0 && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-600">
                                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="10" cy="10" r="8"/>
                                    <path d="M10 6v4M10 14v.01"/>
                                  </svg>
                                  <span>Outside rep split rates inherited from the selected line item</span>
                                </div>
                              )}

                              {/* No outside rep on line item notice */}
                              {item.linkedLineItemId && !item.outsideSplitsFromLineItem && item.outsideSplitRates.length === 0 && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
                                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="10" cy="10" r="8"/>
                                    <path d="M10 6v4M10 14v.01"/>
                                  </svg>
                                  <span>The selected line item has no outside rep assigned. You can add reps below.</span>
                                </div>
                              )}

                              {/* Reps List */}
                              {item.outsideSplitRates.length > 0 && (
                                <div className="space-y-2">
                                  {item.outsideSplitRates.map((split, splitIdx) => (
                                    <div
                                      key={split.id}
                                      className={`flex items-center gap-3 p-3 rounded-xl border shadow-sm transition-shadow ${
                                        item.outsideSplitsFromLineItem
                                          ? 'bg-gray-50 border-gray-200'
                                          : 'bg-white border-purple-100 hover:shadow-md'
                                      }`}
                                    >
                                      {/* Avatar */}
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                                        item.outsideSplitsFromLineItem
                                          ? 'bg-gradient-to-br from-gray-400 to-gray-500'
                                          : 'bg-gradient-to-br from-purple-400 to-purple-600'
                                      }`}>
                                        {split.userName.charAt(0).toUpperCase()}
                                      </div>

                                      {/* Name */}
                                      <div className="flex-1 min-w-0">
                                        <div className={`text-sm font-semibold truncate ${item.outsideSplitsFromLineItem ? 'text-gray-600' : 'text-gray-900'}`}>
                                          {split.userName}
                                        </div>
                                        <div className="text-xs text-gray-500">Position {splitIdx + 1}</div>
                                      </div>

                                      {/* Split Rate Display/Input */}
                                      <div className="flex items-center gap-2">
                                        <div className="relative">
                                          {item.outsideSplitsFromLineItem ? (
                                            <div className="w-20 px-3 py-2 text-sm border border-gray-200 rounded-lg text-right font-semibold bg-gray-100 text-gray-600">
                                              {split.splitRate}%
                                            </div>
                                          ) : (
                                            <>
                                              <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={split.splitRate}
                                                onChange={(e) => updateSplitRate(index, split.id, parseInt(e.target.value) || 0)}
                                                className="w-20 px-3 py-2 text-sm border border-purple-200 rounded-lg text-right font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                                              />
                                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">%</span>
                                            </>
                                          )}
                                        </div>
                                      </div>

                                      {/* Commission Preview */}
                                      <div className="hidden sm:block text-right px-3">
                                        <div className="text-xs text-gray-500">Commission</div>
                                        <div className={`text-sm font-semibold ${item.outsideSplitsFromLineItem ? 'text-gray-600' : 'text-purple-700'}`}>
                                          {formatCurrency(item.commissionAmount * (split.splitRate / 100))}
                                        </div>
                                      </div>

                                      {/* Remove Button - hidden when inherited */}
                                      {!item.outsideSplitsFromLineItem && (
                                        <button
                                          type="button"
                                          onClick={() => removeRepFromLineItem(index, split.id)}
                                          className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                        >
                                          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                  ))}

                                  {/* Auto Distribute Button - hidden when inherited */}
                                  {!item.outsideSplitsFromLineItem && item.outsideSplitRates.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => autoDistributeSplits(index)}
                                      className="w-full py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 10h12M10 4v12" strokeLinecap="round"/>
                                      </svg>
                                      Auto-distribute evenly
                                    </button>
                                  )}

                                  {/* Validation Message - hidden when inherited */}
                                  {!item.outsideSplitsFromLineItem && !splitValid && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="10" cy="10" r="8"/>
                                        <path d="M10 6v4M10 12v.01"/>
                                      </svg>
                                      Split rates must total 100% (currently {splitTotal}%)
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Add Rep - hidden when inherited from line item */}
                              {!item.outsideSplitsFromLineItem && (
                                <div className="pt-2">
                                  <label className="block text-xs font-medium text-purple-700 mb-2">
                                    Add Outside Rep
                                  </label>
                                  <SearchableDropdownV2
                                    value=""
                                    displayValue=""
                                    onChange={(id, label) => {
                                      if (id && !item.outsideSplitRates.some(r => r.userId === id)) {
                                        addRepToLineItem(index, id, label);
                                      }
                                    }}
                                    options={repOptions.filter(opt => !item.outsideSplitRates.some(r => r.userId === opt.id))}
                                    onSearch={handleRepSearch}
                                    isLoading={isRepLoading}
                                    placeholder="Search for outside rep..."
                                  />
                                </div>
                              )}
                            </div>
                          </CollapsibleSection>

                          {/* Impact Preview - Collapsible */}
                          {linkedLineItem && item.quantity > 0 && (
                            <CollapsibleSection
                              title="Impact After Credit Applied"
                              icon={
                                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-600">
                                  <path d="M10 2l8 16H2L10 2z" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M10 8v4M10 14v.01"/>
                                </svg>
                              }
                              isOpen={item.showImpactPreview}
                              onToggle={() => toggleSection(index, 'showImpactPreview')}
                              colorScheme="orange"
                            >
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-orange-600/70 text-xs block mb-1">New Qty</span>
                                  <div className="font-semibold text-orange-900">
                                    {linkedLineItem.quantity - item.quantity}
                                    <span className="ml-2 text-red-600 text-xs font-medium">(-{item.quantity})</span>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-orange-600/70 text-xs block mb-1">New Line Total</span>
                                  <div className="font-semibold text-orange-900">
                                    {formatCurrency(linkedLineItem.extendedPrice - item.creditAmount)}
                                    <span className="ml-2 text-red-600 text-xs font-medium">(-{formatCurrency(item.creditAmount)})</span>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-orange-600/70 text-xs block mb-1">Commission Impact</span>
                                  <div className="font-bold text-red-600">
                                    -{formatCurrency(item.commissionAmount)}
                                  </div>
                                </div>
                              </div>
                            </CollapsibleSection>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/20">
          <div className="flex items-center justify-between">
            {/* Totals Summary */}
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-[var(--muted-foreground)]">Total Items:</span>
                <span className="ml-2 font-semibold">{lineItems.length}</span>
              </div>
              <div>
                <span className="text-[var(--muted-foreground)]">Total Qty:</span>
                <span className="ml-2 font-semibold">{totals.totalQty}</span>
              </div>
              <div>
                <span className="text-[var(--muted-foreground)]">Total Credit:</span>
                <span className="ml-2 font-bold text-red-600 text-lg">{formatCurrency(totals.totalCredit)}</span>
              </div>
              <div>
                <span className="text-[var(--muted-foreground)]">Total Comm:</span>
                <span className="ml-2 font-semibold text-red-600">{formatCurrency(totals.totalCommission)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || lineItems.length === 0}
                className="px-5 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                )}
                {isEditMode ? 'Save Changes' : 'Create Credit'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
