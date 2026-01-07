'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
  useCreateProduct,
  useProductUoms,
  useProductCategories,
  useFactorySearch,
  type CreateProductInput,
  type ProductUom,
  type ProductCategory,
  type FactorySearchResult,
} from '../api/useProductsApi';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateProductModal({ isOpen, onClose, onSuccess }: CreateProductModalProps) {
  // Form state
  const [formData, setFormData] = useState<CreateProductInput>({
    factoryId: '',
    factoryPartNumber: '',
    unitPrice: undefined,
    defaultCommissionRate: undefined,
    productUomId: '',
    productCategoryId: undefined,
    published: false,
    approvalNeeded: false,
    description: '',
  });

  // Factory search state
  const [factorySearchTerm, setFactorySearchTerm] = useState('');
  const [selectedFactory, setSelectedFactory] = useState<FactorySearchResult | null>(null);
  const [isFactoryDropdownOpen, setIsFactoryDropdownOpen] = useState(false);
  const factoryInputRef = useRef<HTMLInputElement>(null);
  const factoryDropdownRef = useRef<HTMLDivElement>(null);

  // Category search state
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // UOM dropdown state
  const [isUomDropdownOpen, setIsUomDropdownOpen] = useState(false);
  const uomInputRef = useRef<HTMLInputElement>(null);
  const uomDropdownRef = useRef<HTMLDivElement>(null);

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Portal mount state
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // API hooks - factory search enabled when dropdown is open
  const createProductMutation = useCreateProduct();
  const { data: uoms = [] } = useProductUoms();
  const { data: factories = [], isLoading: isLoadingFactories } = useFactorySearch(
    factorySearchTerm,
    isFactoryDropdownOpen // Enable search when dropdown is open
  );
  const { data: categories = [], isLoading: isLoadingCategories } = useProductCategories(selectedFactory?.id);

  // Get selected UOM
  const selectedUom = uoms.find(u => u.id === formData.productUomId);

  // Filter categories based on search
  const filteredCategories = categorySearchTerm
    ? categories.filter(c => c.title.toLowerCase().includes(categorySearchTerm.toLowerCase()))
    : categories;

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      // Factory dropdown
      if (
        factoryInputRef.current && !factoryInputRef.current.contains(target) &&
        factoryDropdownRef.current && !factoryDropdownRef.current.contains(target)
      ) {
        setIsFactoryDropdownOpen(false);
      }

      // Category dropdown
      if (
        categoryInputRef.current && !categoryInputRef.current.contains(target) &&
        categoryDropdownRef.current && !categoryDropdownRef.current.contains(target)
      ) {
        setIsCategoryDropdownOpen(false);
      }

      // UOM dropdown
      if (
        uomInputRef.current && !uomInputRef.current.contains(target) &&
        uomDropdownRef.current && !uomDropdownRef.current.contains(target)
      ) {
        setIsUomDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        factoryId: '',
        factoryPartNumber: '',
        unitPrice: undefined,
        defaultCommissionRate: undefined,
        productUomId: '',
        productCategoryId: undefined,
        published: false,
        approvalNeeded: false,
        description: '',
      });
      setFactorySearchTerm('');
      setSelectedFactory(null);
      setIsFactoryDropdownOpen(false);
      setCategorySearchTerm('');
      setSelectedCategory(null);
      setIsCategoryDropdownOpen(false);
      setIsUomDropdownOpen(false);
      setErrors({});
    }
  }, [isOpen]);

  // Validation
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.factoryId) {
      newErrors.factoryId = 'Factory is required';
    }
    if (!formData.factoryPartNumber?.trim()) {
      newErrors.factoryPartNumber = 'Part Number is required';
    }
    if (!formData.productUomId) {
      newErrors.productUomId = 'Unit of Measure is required';
    }
    if (formData.unitPrice === undefined || formData.unitPrice === null) {
      newErrors.unitPrice = 'Unit Price is required';
    }
    if (formData.defaultCommissionRate === undefined || formData.defaultCommissionRate === null) {
      newErrors.defaultCommissionRate = 'Default Commission Rate is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle factory selection
  const handleFactorySelect = (factory: FactorySearchResult) => {
    setSelectedFactory(factory);
    setFormData(prev => ({ ...prev, factoryId: factory.id, productCategoryId: undefined }));
    setFactorySearchTerm(factory.title);
    setIsFactoryDropdownOpen(false);
    // Clear category when factory changes
    setSelectedCategory(null);
    setCategorySearchTerm('');
  };

  // Handle category selection
  const handleCategorySelect = (category: ProductCategory) => {
    setSelectedCategory(category);
    setFormData(prev => ({ ...prev, productCategoryId: category.id }));
    setCategorySearchTerm(category.title);
    setIsCategoryDropdownOpen(false);
  };

  // Handle UOM selection
  const handleUomSelect = (uom: ProductUom) => {
    setFormData(prev => ({ ...prev, productUomId: uom.id }));
    setIsUomDropdownOpen(false);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      await createProductMutation.mutateAsync(formData);
      toast.success('Product created successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to create product:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create product');
    }
  };

  // Handle field changes
  const handleChange = (field: keyof CreateProductInput, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--muted)]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Create Product</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Add a new product to the catalog</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Factory Selector */}
            <div className="relative">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Factory <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  ref={factoryInputRef}
                  type="text"
                  value={factorySearchTerm}
                  onChange={(e) => {
                    setFactorySearchTerm(e.target.value);
                    setIsFactoryDropdownOpen(true);
                    if (!e.target.value) {
                      setSelectedFactory(null);
                      setFormData(prev => ({ ...prev, factoryId: '', productCategoryId: undefined }));
                      setSelectedCategory(null);
                      setCategorySearchTerm('');
                    }
                  }}
                  onFocus={() => {
                    setIsFactoryDropdownOpen(true);
                    // Trigger search with empty string on focus
                  }}
                  placeholder="Click to search factories..."
                  className={`w-full px-3 py-2.5 pr-10 border rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 ${
                    isFactoryDropdownOpen ? 'ring-2 ring-[var(--primary)] border-transparent' : ''
                  } ${errors.factoryId ? 'border-red-500' : 'border-[var(--border)]'}`}
                />
                {isLoadingFactories ? (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="animate-spin h-4 w-4 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  </div>
                ) : (
                  <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] transition-transform ${isFactoryDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </div>
              {errors.factoryId && (
                <p className="mt-1 text-xs text-red-500">{errors.factoryId}</p>
              )}
              {isFactoryDropdownOpen && isMounted && createPortal(
                <div
                  ref={factoryDropdownRef}
                  style={{
                    position: 'fixed',
                    top: (factoryInputRef.current?.getBoundingClientRect().bottom ?? 0) + 4,
                    left: factoryInputRef.current?.getBoundingClientRect().left ?? 0,
                    width: factoryInputRef.current?.getBoundingClientRect().width ?? 300,
                    zIndex: 9999,
                  }}
                  className="bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-64 overflow-y-auto"
                >
                  {isLoadingFactories ? (
                    <div className="px-3 py-4 text-center text-sm text-[var(--muted-foreground)] flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Loading factories...
                    </div>
                  ) : factories.length === 0 ? (
                    <div className="px-3 py-4 text-center text-sm text-[var(--muted-foreground)]">
                      {factorySearchTerm ? 'No factories found' : 'Start typing to search factories'}
                    </div>
                  ) : (
                    factories.map((factory) => (
                      <button
                        key={factory.id}
                        type="button"
                        onClick={() => handleFactorySelect(factory)}
                        className={`w-full px-3 py-2.5 text-left text-sm transition-colors flex items-center gap-3 ${
                          selectedFactory?.id === factory.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-[var(--muted)]'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-[var(--foreground)] truncate">{factory.title}</div>
                          {factory.accountNumber && (
                            <div className="text-xs text-[var(--muted-foreground)]">Account: {factory.accountNumber}</div>
                          )}
                        </div>
                        {factory.published && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex-shrink-0">
                            Active
                          </span>
                        )}
                        {selectedFactory?.id === factory.id && (
                          <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))
                  )}
                </div>,
                document.body
              )}
            </div>

            {/* Part Number */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Factory Part Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.factoryPartNumber}
                onChange={(e) => handleChange('factoryPartNumber', e.target.value)}
                placeholder="Enter part number..."
                className={`w-full px-3 py-2.5 border rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 ${
                  errors.factoryPartNumber ? 'border-red-500' : 'border-[var(--border)]'
                }`}
              />
              {errors.factoryPartNumber && (
                <p className="mt-1 text-xs text-red-500">{errors.factoryPartNumber}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter product description..."
                rows={3}
                className="w-full px-3 py-2.5 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
              />
            </div>

            {/* Unit Price & Commission Rate */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  Unit Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unitPrice ?? ''}
                    onChange={(e) => handleChange('unitPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="0.00"
                    className={`w-full pl-7 pr-3 py-2.5 border rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 ${
                      errors.unitPrice ? 'border-red-500' : 'border-[var(--border)]'
                    }`}
                  />
                </div>
                {errors.unitPrice && (
                  <p className="mt-1 text-xs text-red-500">{errors.unitPrice}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  Default Commission Rate <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.defaultCommissionRate !== undefined ? formData.defaultCommissionRate * 100 : ''}
                    onChange={(e) => handleChange('defaultCommissionRate', e.target.value ? parseFloat(e.target.value) / 100 : undefined)}
                    placeholder="0"
                    className={`w-full pl-3 pr-8 py-2.5 border rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 ${
                      errors.defaultCommissionRate ? 'border-red-500' : 'border-[var(--border)]'
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">%</span>
                </div>
                {errors.defaultCommissionRate && (
                  <p className="mt-1 text-xs text-red-500">{errors.defaultCommissionRate}</p>
                )}
              </div>
            </div>

            {/* UOM & Category */}
            <div className="grid grid-cols-2 gap-4">
              {/* UOM Dropdown */}
              <div className="relative">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  Unit of Measure <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    ref={uomInputRef}
                    type="text"
                    value={selectedUom?.title || ''}
                    onFocus={() => setIsUomDropdownOpen(true)}
                    readOnly
                    placeholder="Select UOM..."
                    className={`w-full px-3 py-2.5 pr-10 border rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-green-500/50 cursor-pointer ${
                      isUomDropdownOpen ? 'ring-2 ring-green-500 border-transparent' : ''
                    } ${errors.productUomId ? 'border-red-500' : 'border-[var(--border)]'}`}
                  />
                  <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] transition-transform ${isUomDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {errors.productUomId && (
                  <p className="mt-1 text-xs text-red-500">{errors.productUomId}</p>
                )}
                {isUomDropdownOpen && isMounted && createPortal(
                  <div
                    ref={uomDropdownRef}
                    style={{
                      position: 'fixed',
                      top: (uomInputRef.current?.getBoundingClientRect().bottom ?? 0) + 4,
                      left: uomInputRef.current?.getBoundingClientRect().left ?? 0,
                      width: uomInputRef.current?.getBoundingClientRect().width ?? 200,
                      zIndex: 9999,
                    }}
                    className="bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-48 overflow-y-auto"
                  >
                    {uoms.length === 0 ? (
                      <div className="px-3 py-4 text-center text-sm text-[var(--muted-foreground)]">
                        No UOMs available
                      </div>
                    ) : (
                      uoms.map((uom: ProductUom) => (
                        <button
                          key={uom.id}
                          type="button"
                          onClick={() => handleUomSelect(uom)}
                          className={`w-full px-3 py-2.5 text-left text-sm transition-colors flex items-center gap-3 ${
                            formData.productUomId === uom.id ? 'bg-green-50 text-green-700' : 'hover:bg-[var(--muted)]'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-[var(--foreground)] truncate">{uom.title}</div>
                            {uom.description && (
                              <div className="text-xs text-[var(--muted-foreground)] truncate">{uom.description}</div>
                            )}
                          </div>
                          {uom.divisionFactor && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full flex-shrink-0">
                              ÷{uom.divisionFactor}
                            </span>
                          )}
                          {formData.productUomId === uom.id && (
                            <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))
                    )}
                  </div>,
                  document.body
                )}
              </div>

              {/* Category Dropdown */}
              <div className="relative">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  Category
                </label>
                <div className="relative">
                  <input
                    ref={categoryInputRef}
                    type="text"
                    value={isCategoryDropdownOpen ? categorySearchTerm : (selectedCategory?.title || '')}
                    onChange={(e) => {
                      setCategorySearchTerm(e.target.value);
                      if (!e.target.value) {
                        setSelectedCategory(null);
                        setFormData(prev => ({ ...prev, productCategoryId: undefined }));
                      }
                    }}
                    onFocus={() => {
                      setIsCategoryDropdownOpen(true);
                      setCategorySearchTerm('');
                    }}
                    placeholder={selectedFactory ? "Click to search categories..." : "Select factory first"}
                    disabled={!selectedFactory}
                    className={`w-full px-3 py-2.5 pr-10 border rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isCategoryDropdownOpen ? 'ring-2 ring-purple-500 border-transparent' : 'border-[var(--border)]'
                    }`}
                  />
                  <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {isCategoryDropdownOpen && selectedFactory && isMounted && createPortal(
                  <div
                    ref={categoryDropdownRef}
                    style={{
                      position: 'fixed',
                      top: (categoryInputRef.current?.getBoundingClientRect().bottom ?? 0) + 4,
                      left: categoryInputRef.current?.getBoundingClientRect().left ?? 0,
                      width: categoryInputRef.current?.getBoundingClientRect().width ?? 200,
                      zIndex: 9999,
                    }}
                    className="bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-48 overflow-y-auto"
                  >
                    {isLoadingCategories ? (
                      <div className="px-3 py-4 text-center text-sm text-[var(--muted-foreground)] flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Loading categories...
                      </div>
                    ) : filteredCategories.length === 0 ? (
                      <div className="px-3 py-4 text-center text-sm text-[var(--muted-foreground)]">
                        {categorySearchTerm ? 'No categories found' : 'No categories for this factory'}
                      </div>
                    ) : (
                      filteredCategories.map((category: ProductCategory) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => handleCategorySelect(category)}
                          className={`w-full px-3 py-2.5 text-left text-sm transition-colors flex items-center gap-3 ${
                            selectedCategory?.id === category.id ? 'bg-purple-50 text-purple-700' : 'hover:bg-[var(--muted)]'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-[var(--foreground)] truncate">{category.title}</div>
                            {category.commissionRate !== undefined && (
                              <div className="text-xs text-[var(--muted-foreground)]">
                                Commission: {(category.commissionRate * 100).toFixed(1)}%
                              </div>
                            )}
                          </div>
                          {selectedCategory?.id === category.id && (
                            <svg className="w-4 h-4 text-purple-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))
                    )}
                  </div>,
                  document.body
                )}
              </div>
            </div>

            {/* Status Toggles */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-[var(--muted)]/30 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)]">
                    Published
                  </label>
                  <p className="text-xs text-[var(--muted-foreground)]">Make product visible</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('published', !formData.published)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    formData.published ? 'bg-green-500' : 'bg-[var(--muted)]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                      formData.published ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-[var(--muted)]/30 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)]">
                    Approval Needed
                  </label>
                  <p className="text-xs text-[var(--muted-foreground)]">Require approval for use</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('approvalNeeded', !formData.approvalNeeded)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    formData.approvalNeeded ? 'bg-amber-500' : 'bg-[var(--muted)]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                      formData.approvalNeeded ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between bg-[var(--muted)]/20">
          <div className="text-sm text-[var(--muted-foreground)]">
            <span className="text-red-500">*</span> Required fields
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={createProductMutation.isPending}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {createProductMutation.isPending ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Product
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {createProductMutation.isError && (
          <div className="px-6 py-3 bg-red-50 border-t border-red-200">
            <p className="text-sm text-red-600">
              {createProductMutation.error?.message || 'Failed to create product. Please try again.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
