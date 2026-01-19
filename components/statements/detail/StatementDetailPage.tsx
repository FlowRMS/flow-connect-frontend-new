/**
 * StatementDetailPage Component
 * Unified page for creating, viewing, and editing statements
 * Similar to QuoteDetailV2Page pattern
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  useStatement,
  useCreateStatement,
  useUpdateStatement,
  useDeleteStatement,
  type CreateStatementInput,
  type UpdateStatementInput,
  type Statement,
  type StatementDetail,
  type StatementDetailInput,
  type StatementOutsideSplitRateInput,
} from '../api';
import {
  searchFactories,
  searchCustomers,
  searchProducts,
  searchInvoices,
  searchOrders,
  fetchProductUoms,
  searchUsers,
  type ProductUomResult,
} from '@/components/lib/api/search';

// Types
interface LineItem {
  tempId: string;
  id?: string;
  itemNumber: number;
  quantity: string;
  unitPrice: string;
  uomId: string;
  uomTitle: string;
  soldToCustomerId: string;
  soldToCustomerName: string;
  endUserId: string;
  endUserName: string;
  productId: string;
  productName: string;
  productNameAdhoc: string;
  productDescriptionAdhoc: string;
  orderId: string;
  orderNumber: string;
  orderDetailId: string;
  invoiceId: string;
  invoiceNumber: string;
  note: string;
  leadTime: string;
  divisionFactor: string;
  commissionRate: string;
  commissionDiscountRate: string;
  discountRate: string;
  outsideSplitRates: OutsideSplitRate[];
}

interface OutsideSplitRate {
  tempId: string;
  id?: string;
  userId: string;
  userName: string;
  splitRate: string;
  position: number;
}

const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const createEmptyLineItem = (itemNumber: number): LineItem => ({
  tempId: generateTempId(),
  itemNumber,
  quantity: '',
  unitPrice: '',
  uomId: '',
  uomTitle: '',
  soldToCustomerId: '',
  soldToCustomerName: '',
  endUserId: '',
  endUserName: '',
  productId: '',
  productName: '',
  productNameAdhoc: '',
  productDescriptionAdhoc: '',
  orderId: '',
  orderNumber: '',
  orderDetailId: '',
  invoiceId: '',
  invoiceNumber: '',
  note: '',
  leadTime: '',
  divisionFactor: '',
  commissionRate: '',
  commissionDiscountRate: '',
  discountRate: '',
  outsideSplitRates: [],
});

const createEmptySplitRate = (position: number): OutsideSplitRate => ({
  tempId: generateTempId(),
  userId: '',
  userName: '',
  splitRate: '',
  position,
});

// Auto-redistribute split rates equally among all entries
// Handles remainders by giving extra 0.1% to the last entry(ies) to ensure total is exactly 100%
const redistributeSplitRates = (rates: OutsideSplitRate[]): OutsideSplitRate[] => {
  if (rates.length === 0) return rates;

  const count = rates.length;
  // Calculate base rate rounded down to 1 decimal
  const baseRate = Math.floor(100 / count * 10) / 10;
  // Calculate how much is left after giving everyone the base rate
  const totalWithBase = baseRate * count;
  // Calculate remainder (in 0.1% increments)
  const remainderUnits = Math.round((100 - totalWithBase) * 10);

  return rates.map((rate, index) => {
    // Give extra 0.1% to the last 'remainderUnits' entries
    const extraUnits = index >= (count - remainderUnits) ? 1 : 0;
    const newRate = baseRate + (extraUnits * 0.1);
    return {
      ...rate,
      splitRate: newRate.toFixed(1),
      position: index + 1,
    };
  });
};

interface StatementDetailPageProps {
  statementId: string | null;
  onBack: () => void;
  isNew?: boolean;
}

// Searchable Dropdown Component with Portal
interface SearchableSelectProps {
  value: string;
  displayValue: string;
  placeholder: string;
  onSearch: (query: string) => void;
  onSelect: (id: string, name: string) => void;
  options: { id: string; label: string; sublabel?: string }[];
  isLoading?: boolean;
  disabled?: boolean;
}

function SearchableSelect({ value, displayValue, placeholder, onSearch, onSelect, options, isLoading, disabled }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0, openUpward: false });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Calculate dropdown position
  const updatePosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const dropdownHeight = 280; // Approximate max height of dropdown
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Open upward if not enough space below but enough above
      const openUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      setDropdownPosition({
        top: openUpward ? rect.top - 4 : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        openUpward,
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen, updatePosition]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (containerRef.current && !containerRef.current.contains(target)) {
        // Don't close if clicking inside the portal dropdown
        if (target.closest('[data-searchable-select-dropdown="true"]')) {
          return;
        }
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    setSearchQuery('');
    onSearch('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch(e.target.value);
  };

  const handleSelectOption = (option: { id: string; label: string }) => {
    onSelect(option.id, option.label);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={`w-full text-left px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm flex items-center justify-between hover:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className={`truncate ${!displayValue ? 'text-gray-400' : 'text-gray-900'}`}>
          {displayValue || placeholder}
        </span>
        <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className="text-gray-400 flex-shrink-0">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          data-searchable-select-dropdown="true"
          style={{
            position: 'fixed',
            top: dropdownPosition.openUpward ? 'auto' : dropdownPosition.top,
            bottom: dropdownPosition.openUpward ? `${window.innerHeight - dropdownPosition.top}px` : 'auto',
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            zIndex: 9999,
          }}
          className="bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden"
        >
          <div className="p-2 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
            />
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            {isLoading ? (
              <div className="px-3 py-4 text-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-emerald-500 mx-auto" />
              </div>
            ) : options.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-gray-500">No results found</div>
            ) : (
              options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelectOption(option)}
                  className={`w-full text-left px-3 py-2.5 hover:bg-emerald-50 transition-colors ${value === option.id ? 'bg-emerald-50' : ''}`}
                >
                  <div className="font-medium text-gray-900 text-sm">{option.label}</div>
                  {option.sublabel && <div className="text-xs text-gray-500 truncate">{option.sublabel}</div>}
                </button>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// Line Item Component
interface LineItemFormProps {
  item: LineItem;
  index: number;
  factoryId: string;
  onUpdate: (item: LineItem) => void;
  onRemove: () => void;
  uomOptions: ProductUomResult[];
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function LineItemForm({ item, index, factoryId, onUpdate, onRemove, uomOptions, isExpanded, onToggleExpand }: LineItemFormProps) {

  // Customer search
  const [customerQuery, setCustomerQuery] = useState('');
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customerSearch', customerQuery],
    queryFn: () => searchCustomers(customerQuery, true, 20),
    enabled: true,
  });

  // End user search
  const [endUserQuery, setEndUserQuery] = useState('');
  const { data: endUsers = [], isLoading: isLoadingEndUsers } = useQuery({
    queryKey: ['endUserSearch', endUserQuery],
    queryFn: () => searchCustomers(endUserQuery, true, 20),
    enabled: true,
  });

  // Product search - only search when factory is selected
  const [productQuery, setProductQuery] = useState('');
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['productSearch', productQuery, factoryId],
    queryFn: () => searchProducts(productQuery, factoryId, 20),
    enabled: !!factoryId,
  });

  // Invoice search
  const [invoiceQuery, setInvoiceQuery] = useState('');
  const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['invoiceSearch', invoiceQuery],
    queryFn: () => searchInvoices(invoiceQuery, 20),
    enabled: true,
  });

  // Order search
  const [orderQuery, setOrderQuery] = useState('');
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ['orderSearch', orderQuery],
    queryFn: () => searchOrders(orderQuery, 20),
    enabled: true,
  });

  // Outside rep search
  const [repQuery, setRepQuery] = useState('');
  const { data: reps = [], isLoading: isLoadingReps } = useQuery({
    queryKey: ['outsideRepSearch', repQuery],
    queryFn: () => searchUsers({ searchTerm: repQuery, isOutside: true, enabled: true, limit: 10 }),
    enabled: true,
  });

  const handleAddSplitRate = () => {
    const newEntry = createEmptySplitRate(item.outsideSplitRates.length + 1);
    const newRates = [...item.outsideSplitRates, newEntry];
    // Auto-redistribute split rates equally
    const redistributedRates = redistributeSplitRates(newRates);
    onUpdate({
      ...item,
      outsideSplitRates: redistributedRates,
    });
  };

  const handleRemoveSplitRate = (idx: number) => {
    const newRates = item.outsideSplitRates.filter((_, i) => i !== idx);
    // Auto-redistribute split rates equally among remaining entries
    const redistributedRates = redistributeSplitRates(newRates);
    onUpdate({ ...item, outsideSplitRates: redistributedRates });
  };

  const handleUpdateSplitRate = (idx: number, field: string, value: string, name?: string) => {
    const newRates = [...item.outsideSplitRates];
    if (field === 'userId' && name) {
      newRates[idx] = { ...newRates[idx], userId: value, userName: name };
    } else {
      newRates[idx] = { ...newRates[idx], [field]: value };
    }
    onUpdate({ ...item, outsideSplitRates: newRates });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-white border border-gray-200 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-50 to-white cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-50 flex items-center justify-center text-sm font-bold text-emerald-700">
            {item.itemNumber}
          </span>
          <span className="font-medium text-gray-900">
            {item.productName || item.productNameAdhoc || `Line Item ${item.itemNumber}`}
          </span>
          {item.quantity && <span className="text-sm text-gray-500">Qty: {item.quantity}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h12M6 6V4a2 2 0 012-2h4a2 2 0 012 2v2M8 10v5M12 10v5M5 6l1 11a2 2 0 002 2h4a2 2 0 002-2l1-11"/>
            </svg>
          </button>
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          >
            <path d="M5 8l5 5 5-5" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4 border-t border-gray-100">
              {/* Product Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Product</label>
                <SearchableSelect
                  value={item.productId}
                  displayValue={item.productName}
                  placeholder="Search product..."
                  onSearch={setProductQuery}
                  onSelect={(id, name) => onUpdate({ ...item, productId: id, productName: name })}
                  options={products.map(p => ({ id: p.id, label: p.factoryPartNumber, sublabel: p.description }))}
                  isLoading={isLoadingProducts}
                  disabled={!factoryId}
                />
              </div>

              {/* Quantity, Price, UOM */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Quantity</label>
                  <input
                    type="text"
                    value={item.quantity}
                    onChange={(e) => onUpdate({ ...item, quantity: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Unit Price</label>
                  <input
                    type="text"
                    value={item.unitPrice}
                    onChange={(e) => onUpdate({ ...item, unitPrice: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">UOM</label>
                  <select
                    value={item.uomId}
                    onChange={(e) => {
                      const uom = uomOptions.find(u => u.id === e.target.value);
                      onUpdate({ ...item, uomId: e.target.value, uomTitle: uom?.title || '' });
                    }}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                  >
                    <option value="">Select UOM</option>
                    {uomOptions.map(uom => (
                      <option key={uom.id} value={uom.id}>{uom.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Customer & End User */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Sold To Customer</label>
                  <SearchableSelect
                    value={item.soldToCustomerId}
                    displayValue={item.soldToCustomerName}
                    placeholder="Search customer..."
                    onSearch={setCustomerQuery}
                    onSelect={(id, name) => onUpdate({ ...item, soldToCustomerId: id, soldToCustomerName: name })}
                    options={customers.map(c => ({ id: c.id, label: c.companyName }))}
                    isLoading={isLoadingCustomers}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">End User</label>
                  <SearchableSelect
                    value={item.endUserId}
                    displayValue={item.endUserName}
                    placeholder="Search end user..."
                    onSearch={setEndUserQuery}
                    onSelect={(id, name) => onUpdate({ ...item, endUserId: id, endUserName: name })}
                    options={endUsers.map(c => ({ id: c.id, label: c.companyName }))}
                    isLoading={isLoadingEndUsers}
                  />
                </div>
              </div>

              {/* Order & Invoice */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Order</label>
                  <SearchableSelect
                    value={item.orderId}
                    displayValue={item.orderNumber}
                    placeholder="Search order..."
                    onSearch={setOrderQuery}
                    onSelect={(id, name) => onUpdate({ ...item, orderId: id, orderNumber: name })}
                    options={orders.map(o => ({ id: o.id, label: o.orderNumber, sublabel: o.entityDate }))}
                    isLoading={isLoadingOrders}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Invoice</label>
                  <SearchableSelect
                    value={item.invoiceId}
                    displayValue={item.invoiceNumber}
                    placeholder="Search invoice..."
                    onSearch={setInvoiceQuery}
                    onSelect={(id, name) => onUpdate({ ...item, invoiceId: id, invoiceNumber: name })}
                    options={invoices.map(i => ({ id: i.id, label: i.invoiceNumber, sublabel: i.entityDate }))}
                    isLoading={isLoadingInvoices}
                  />
                </div>
              </div>

              {/* Commission Rates */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Commission Rate %</label>
                  <input
                    type="text"
                    value={item.commissionRate}
                    onChange={(e) => onUpdate({ ...item, commissionRate: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Comm. Discount %</label>
                  <input
                    type="text"
                    value={item.commissionDiscountRate}
                    onChange={(e) => onUpdate({ ...item, commissionDiscountRate: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Discount Rate %</label>
                  <input
                    type="text"
                    value={item.discountRate}
                    onChange={(e) => onUpdate({ ...item, discountRate: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Division Factor & Lead Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Division Factor</label>
                  <input
                    type="text"
                    value={item.divisionFactor}
                    onChange={(e) => onUpdate({ ...item, divisionFactor: e.target.value })}
                    placeholder="1"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Lead Time</label>
                  <input
                    type="text"
                    value={item.leadTime}
                    onChange={(e) => onUpdate({ ...item, leadTime: e.target.value })}
                    placeholder="e.g., 2-3 weeks"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Note</label>
                <textarea
                  value={item.note}
                  onChange={(e) => onUpdate({ ...item, note: e.target.value })}
                  rows={2}
                  placeholder="Add a note..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 resize-none"
                />
              </div>

              {/* Outside Split Rates */}
              <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4">
                {(() => {
                  const totalSplitRate = item.outsideSplitRates.reduce((sum, s) => sum + (parseFloat(s.splitRate) || 0), 0);
                  return (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-purple-700">Outside Split Rates</span>
                            {item.outsideSplitRates.length > 0 && (
                              <p className="text-xs text-gray-500">
                                Total: <span className={totalSplitRate > 0 ? 'font-medium text-gray-700' : ''}>{totalSplitRate.toFixed(1)}%</span>
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddSplitRate}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add Rep
                        </button>
                      </div>
                      {/* Validation Message */}
                      {totalSplitRate > 100 && (
                        <div className="flex items-center gap-2 p-2 mb-3 bg-red-50 border border-red-200 rounded-lg">
                          <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <p className="text-xs text-red-700">
                            Total ({totalSplitRate.toFixed(1)}%) exceeds 100%. Please reduce the percentages.
                          </p>
                        </div>
                      )}
                    </>
                  );
                })()}

                {item.outsideSplitRates.length === 0 ? (
                  <div className="py-4 text-center text-sm text-gray-500">No outside reps added yet</div>
                ) : (
                  <div className="space-y-2">
                    {item.outsideSplitRates.map((split, idx) => {
                      // Filter out already-selected reps from dropdown (except current selection)
                      const filteredReps = reps.filter(
                        (r) => !item.outsideSplitRates.some(
                          (s, i) => s.userId === r.id && i !== idx
                        )
                      );
                      return (
                        <div key={split.tempId} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                          <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-bold text-purple-700">
                            {split.position}
                          </span>
                          <div className="flex-1">
                            <SearchableSelect
                              value={split.userId}
                              displayValue={split.userName}
                              placeholder="Search rep..."
                              onSearch={setRepQuery}
                              onSelect={(id, name) => handleUpdateSplitRate(idx, 'userId', id, name)}
                              options={filteredReps.map(r => ({ id: r.id, label: r.fullName || r.email || '', sublabel: r.email }))}
                              isLoading={isLoadingReps}
                            />
                          </div>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={split.splitRate}
                            onChange={(e) => handleUpdateSplitRate(idx, 'splitRate', e.target.value)}
                            placeholder="%"
                            className="w-20 px-2 py-2 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveSplitRate(idx)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function StatementDetailPage({ statementId, onBack, isNew = false }: StatementDetailPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // API hooks
  const { data: statement, isLoading, error } = useStatement(statementId);
  const createMutation = useCreateStatement();
  const updateMutation = useUpdateStatement();
  const deleteMutation = useDeleteStatement();

  // Form state
  const [statementNumber, setStatementNumber] = useState('');
  const [entityDate, setEntityDate] = useState('');
  const [factoryId, setFactoryId] = useState('');
  const [factoryName, setFactoryName] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([createEmptyLineItem(1)]);
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Factory search
  const [factoryQuery, setFactoryQuery] = useState('');
  const { data: factories = [], isLoading: isLoadingFactories } = useQuery({
    queryKey: ['factorySearch', factoryQuery],
    queryFn: () => searchFactories(factoryQuery, true, 20),
    enabled: true,
  });

  // UOM options
  const { data: uomOptions = [] } = useQuery({
    queryKey: ['productUoms'],
    queryFn: () => fetchProductUoms(),
  });

  // Initialize form when editing
  useEffect(() => {
    if (statement && !isNew) {
      setStatementNumber(statement.statementNumber || '');
      setEntityDate(statement.entityDate || '');
      setFactoryId(statement.factoryId || '');
      setFactoryName(statement.factory?.title || '');

      if (statement.details && statement.details.length > 0) {
        setLineItems(statement.details.map((d, idx) => ({
          tempId: generateTempId(),
          id: d.id,
          itemNumber: d.itemNumber || idx + 1,
          quantity: d.quantity || '',
          unitPrice: d.unitPrice || '',
          uomId: d.uomId || '',
          uomTitle: d.uom?.title || '',
          soldToCustomerId: d.soldToCustomerId || '',
          soldToCustomerName: d.soldToCustomer?.companyName || '',
          endUserId: d.endUserId || '',
          endUserName: d.endUser?.companyName || '',
          productId: d.productId || '',
          productName: d.product?.factoryPartNumber || '',
          productNameAdhoc: d.productNameAdhoc || '',
          productDescriptionAdhoc: d.productDescriptionAdhoc || '',
          orderId: d.orderId || '',
          orderNumber: '',
          orderDetailId: d.orderDetailId || '',
          invoiceId: d.invoiceId || '',
          invoiceNumber: '',
          note: d.note || '',
          leadTime: d.leadTime || '',
          divisionFactor: d.divisionFactor || '',
          commissionRate: d.commissionRate || '',
          commissionDiscountRate: d.commissionDiscountRate || '',
          discountRate: d.discountRate || '',
          outsideSplitRates: (d.outsideSplitRates || []).map((s, sIdx) => ({
            tempId: generateTempId(),
            id: s.id,
            userId: s.userId,
            userName: s.user?.fullName || s.user?.email || '',
            splitRate: s.splitRate,
            position: s.position || sIdx + 1,
          })),
        })));
      }
      setHasChanges(false);
    } else if (isNew) {
      // Reset form for new
      setStatementNumber('');
      setEntityDate(new Date().toISOString().split('T')[0]);
      setFactoryId('');
      setFactoryName('');
      setLineItems([createEmptyLineItem(1)]);
      setHasChanges(false);
    }
  }, [statement, isNew]);

  const handleAddLineItem = () => {
    const newItem = createEmptyLineItem(lineItems.length + 1);
    setLineItems(prev => [...prev, newItem]);
    // Expand the newly added item
    setExpandedItems(prev => new Set(prev).add(newItem.tempId));
    setHasChanges(true);
  };

  const handleRemoveLineItem = (index: number) => {
    const itemToRemove = lineItems[index];
    setLineItems(prev => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((item, i) => ({ ...item, itemNumber: i + 1 }));
    });
    // Remove from expanded set
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemToRemove.tempId);
      return newSet;
    });
    setHasChanges(true);
  };

  const handleUpdateLineItem = (index: number, item: LineItem) => {
    setLineItems(prev => {
      const updated = [...prev];
      updated[index] = item;
      return updated;
    });
    setHasChanges(true);
  };

  const handleToggleLineItemExpand = (tempId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tempId)) {
        newSet.delete(tempId);
      } else {
        newSet.add(tempId);
      }
      return newSet;
    });
  };

  const collapseAllLineItems = () => {
    setExpandedItems(new Set());
  };

  const handleSave = async () => {
    if (!statementNumber || !entityDate || !factoryId) {
      setSaveError('Statement Number, Date, and Factory are required');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    const details: StatementDetailInput[] = lineItems.map(item => ({
      id: item.id,
      itemNumber: item.itemNumber,
      quantity: item.quantity || undefined,
      unitPrice: item.unitPrice || undefined,
      uomId: item.uomId || undefined,
      soldToCustomerId: item.soldToCustomerId || undefined,
      endUserId: item.endUserId || undefined,
      productId: item.productId || undefined,
      productNameAdhoc: item.productNameAdhoc || undefined,
      productDescriptionAdhoc: item.productDescriptionAdhoc || undefined,
      orderId: item.orderId || undefined,
      orderDetailId: item.orderDetailId || undefined,
      invoiceId: item.invoiceId || undefined,
      note: item.note || undefined,
      leadTime: item.leadTime || undefined,
      divisionFactor: item.divisionFactor || undefined,
      commissionRate: item.commissionRate || undefined,
      commissionDiscountRate: item.commissionDiscountRate || undefined,
      discountRate: item.discountRate || undefined,
      outsideSplitRates: item.outsideSplitRates.filter(s => s.userId).map(s => ({
        id: s.id,
        userId: s.userId,
        splitRate: s.splitRate,
        position: s.position,
      })),
    }));

    try {
      if (isNew) {
        const input: CreateStatementInput = {
          statementNumber,
          entityDate,
          factoryId,
          creationType: 'MANUAL',
          details,
        };
        const result = await createMutation.mutateAsync(input);
        queryClient.invalidateQueries({ queryKey: ['statements'] });
        router.push(`/statements/${result.id}`);
      } else if (statementId) {
        const input: UpdateStatementInput = {
          id: statementId,
          statementNumber,
          entityDate,
          factoryId,
          creationType: statement?.creationType || 'MANUAL',
          details,
        };
        await updateMutation.mutateAsync(input);
        queryClient.invalidateQueries({ queryKey: ['statements'] });
        queryClient.invalidateQueries({ queryKey: ['statement', statementId] });
        setHasChanges(false);
        // Collapse all line items after successful save
        collapseAllLineItems();
      }
    } catch (err) {
      console.error('Failed to save statement:', err);
      setSaveError(err instanceof Error ? err.message : 'Failed to save statement');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!statementId) return;

    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync(statementId);
      queryClient.invalidateQueries({ queryKey: ['statements'] });
      onBack();
    } catch (err) {
      console.error('Failed to delete statement:', err);
      setSaveError(err instanceof Error ? err.message : 'Failed to delete statement');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Loading state
  if (isLoading && !isNew) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-emerald-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading statement...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !isNew) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load statement</h3>
          <p className="text-gray-500 mb-4">{error.message}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 10H5M5 10l5-5M5 10l5 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                  <rect x="9" y="3" width="6" height="4" rx="1"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {isNew ? 'New Statement' : statementNumber || 'Statement'}
                </h1>
                <p className="text-sm text-gray-500">
                  {isNew ? 'Create a new commission statement' : 'Edit statement details'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!isNew && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg font-medium text-sm transition-colors"
                >
                  Delete
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving || (!isNew && !hasChanges)}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-medium text-sm hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
                {isNew ? 'Create Statement' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Save Error */}
          {saveError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm text-red-700">{saveError}</span>
              <button onClick={() => setSaveError(null)} className="ml-auto text-red-500 hover:text-red-700">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-600">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <path d="M14 2v6h6"/>
            </svg>
            Statement Details
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Statement Number *</label>
              <input
                type="text"
                value={statementNumber}
                onChange={(e) => { setStatementNumber(e.target.value); setHasChanges(true); }}
                placeholder="STM-001"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Statement Date *</label>
              <input
                type="date"
                value={entityDate}
                onChange={(e) => { setEntityDate(e.target.value); setHasChanges(true); }}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Factory *</label>
              <SearchableSelect
                value={factoryId}
                displayValue={factoryName}
                placeholder="Select factory..."
                onSearch={setFactoryQuery}
                onSelect={(id, name) => { setFactoryId(id); setFactoryName(name); setHasChanges(true); }}
                options={factories.map(f => ({ id: f.id, label: f.title, sublabel: f.accountNumber }))}
                isLoading={isLoadingFactories}
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-600">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
              </svg>
              Line Items ({lineItems.length})
            </h3>
            <button
              type="button"
              onClick={handleAddLineItem}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-medium text-sm hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md shadow-emerald-500/20"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 4v12M4 10h12" strokeLinecap="round"/>
              </svg>
              Add Line Item
            </button>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {lineItems.map((item, index) => (
                <LineItemForm
                  key={item.tempId}
                  item={item}
                  index={index}
                  factoryId={factoryId}
                  onUpdate={(updatedItem) => handleUpdateLineItem(index, updatedItem)}
                  onRemove={() => handleRemoveLineItem(index)}
                  uomOptions={uomOptions}
                  isExpanded={expandedItems.has(item.tempId)}
                  onToggleExpand={() => handleToggleLineItemExpand(item.tempId)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Balance Summary (for existing statements) */}
        {!isNew && statement?.balance && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-600">
                <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
              </svg>
              Balance Summary
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-xs font-medium text-gray-500 mb-1">Subtotal</div>
                <div className="text-lg font-bold text-gray-900">
                  ${(statement.balance.subtotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-xs font-medium text-gray-500 mb-1">Total</div>
                <div className="text-lg font-bold text-gray-900">
                  ${(statement.balance.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-4 bg-emerald-50 rounded-lg">
                <div className="text-xs font-medium text-emerald-600 mb-1">Commission</div>
                <div className="text-lg font-bold text-emerald-700">
                  ${(statement.balance.commission || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg">
                <div className="text-xs font-medium text-amber-600 mb-1">Discount</div>
                <div className="text-lg font-bold text-amber-700">
                  ${(statement.balance.discount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Delete Statement?</h3>
              <p className="text-gray-500 text-center mb-6">
                Are you sure you want to delete statement <span className="font-medium text-gray-900">{statementNumber}</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  {isDeleting && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default StatementDetailPage;
