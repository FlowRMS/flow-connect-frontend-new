'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
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
} from '../../../../components/products/api/useProductsApi';

// ============================================================================
// Types
// ============================================================================

type TabId = 'overview' | 'customer-part-numbers' | 'quantity-pricing';

// ============================================================================
// Component
// ============================================================================

export default function CreateProductPage() {
  const router = useRouter();

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

  // UI State
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [isSaving, setIsSaving] = useState(false);

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
  const uomDropdownRef = useRef<HTMLDivElement>(null);

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Portal mount state
  const [isMounted, setIsMounted] = useState(false);

  // Section refs for scroll-to functionality
  const sectionRefs = useRef<Record<TabId, HTMLDivElement | null>>({
    'overview': null,
    'customer-part-numbers': null,
    'quantity-pricing': null,
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // API hooks
  const createProductMutation = useCreateProduct();
  const { data: uoms = [] } = useProductUoms();
  const { data: factories = [], isLoading: isLoadingFactories } = useFactorySearch(
    factorySearchTerm,
    isFactoryDropdownOpen
  );
  const { data: categories = [], isLoading: isLoadingCategories } = useProductCategories(selectedFactory?.id);

  // Get selected UOM
  const selectedUom = uoms.find(u => u.id === formData.productUomId);

  // Filter categories based on search
  const filteredCategories = categorySearchTerm
    ? categories.filter(c => c.title.toLowerCase().includes(categorySearchTerm.toLowerCase()))
    : categories;

  // Scroll spy
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const tabIds: TabId[] = ['overview', 'customer-part-numbers', 'quantity-pricing'];

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      let currentSection: TabId = 'overview';

      for (const tabId of tabIds) {
        const section = sectionRefs.current[tabId];
        if (section) {
          const sectionTop = section.offsetTop;
          if (scrollTop >= sectionTop - 100) {
            currentSection = tabId;
          }
        }
      }
      setActiveTab(currentSection);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (
        factoryInputRef.current && !factoryInputRef.current.contains(target) &&
        factoryDropdownRef.current && !factoryDropdownRef.current.contains(target)
      ) {
        setIsFactoryDropdownOpen(false);
      }

      if (
        categoryInputRef.current && !categoryInputRef.current.contains(target) &&
        categoryDropdownRef.current && !categoryDropdownRef.current.contains(target)
      ) {
        setIsCategoryDropdownOpen(false);
      }

      if (uomDropdownRef.current && !uomDropdownRef.current.contains(target)) {
        setIsUomDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll to section
  const scrollToSection = useCallback((tabId: TabId) => {
    const section = sectionRefs.current[tabId];
    const container = scrollContainerRef.current;
    if (section && container) {
      const headerOffset = 20;
      const sectionTop = section.offsetTop - headerOffset;
      container.scrollTo({ top: sectionTop, behavior: 'smooth' });
    }
    setActiveTab(tabId);
  }, []);

  // Validation
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.factoryId) {
      newErrors.factoryId = 'Factory is required';
    }
    if (!formData.factoryPartNumber?.trim()) {
      newErrors.factoryPartNumber = 'Part Number is required';
    }
    if (formData.unitPrice === undefined || formData.unitPrice === null) {
      newErrors.unitPrice = 'Unit Price is required';
    }
    if (!formData.productUomId) {
      newErrors.productUomId = 'Unit of Measure is required';
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
    setFormData(prev => ({ ...prev, factoryId: factory.id }));
    setFactorySearchTerm(factory.title);
    setIsFactoryDropdownOpen(false);
    if (errors.factoryId) {
      setErrors(prev => ({ ...prev, factoryId: '' }));
    }
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
    if (errors.productUomId) {
      setErrors(prev => ({ ...prev, productUomId: '' }));
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validate()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      const newProduct = await createProductMutation.mutateAsync(formData);
      toast.success('Product created successfully');
      // Navigate to the product edit page
      router.push(`/products/${newProduct.id}/edit`);
    } catch (error) {
      console.error('Failed to create product:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create product');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle field changes
  const handleChange = (field: keyof CreateProductInput, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatPercent = (rate: number) => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  const tabs = [
    { id: 'overview' as TabId, label: 'Overview', count: null },
    { id: 'customer-part-numbers' as TabId, label: 'Customer Part Numbers', count: null, disabled: true },
    { id: 'quantity-pricing' as TabId, label: 'Quantity Pricing', count: null, disabled: true },
  ];

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <main className="flex-1 bg-gray-50 overflow-hidden flex flex-col">
      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/products')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                  <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {formData.description
                    ? formData.description.length > 50
                      ? `${formData.description.slice(0, 50)}...`
                      : formData.description
                    : 'New Product'}
                </h1>
                <p className="text-sm text-gray-500">
                  {formData.factoryPartNumber || 'Enter product details below'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Status Badges */}
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
              Unsaved
            </span>

            <button
              onClick={() => router.push('/products')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
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
      </div>

      {/* Sticky Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-6 flex-shrink-0 sticky top-0 z-10">
        <div className="flex gap-1 overflow-x-auto py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && scrollToSection(tab.id)}
              disabled={tab.disabled}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                tab.disabled
                  ? 'text-gray-400 cursor-not-allowed'
                  : activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
              {tab.disabled && (
                <svg className="w-3 h-3 inline ml-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 space-y-8 relative">

        {/* ============ OVERVIEW SECTION ============ */}
        <div ref={el => { sectionRefs.current['overview'] = el; }} id="section-overview">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>

          {/* Product Status Toggles */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Published Toggle */}
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Published</span>
                  <div className="relative group">
                    <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-64 z-50">
                      Published products are visible and searchable in quotes and orders.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('published', !formData.published)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.published ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.published ? 'translate-x-6' : 'translate-x-1'
                  }`}/>
                </button>
              </div>

              {/* Approval Needed Toggle */}
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Approval Needed</span>
                  <div className="relative group">
                    <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-64 z-50">
                      When enabled, this product requires manager approval before use.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('approvalNeeded', !formData.approvalNeeded)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.approvalNeeded ? 'bg-amber-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.approvalNeeded ? 'translate-x-6' : 'translate-x-1'
                  }`}/>
                </button>
              </div>
            </div>
          </div>

          {/* Basic Info Fields */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {/* Product Identification */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className={labelClass}>Part Number *</label>
                <input
                  type="text"
                  value={formData.factoryPartNumber}
                  onChange={(e) => handleChange('factoryPartNumber', e.target.value)}
                  className={`${inputClass} ${errors.factoryPartNumber ? 'border-red-500' : ''}`}
                  placeholder="Enter part number"
                />
                {errors.factoryPartNumber && (
                  <p className="mt-1 text-xs text-red-500">{errors.factoryPartNumber}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>Factory *</label>
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
                    onFocus={() => setIsFactoryDropdownOpen(true)}
                    className={`${inputClass} pr-10 ${isFactoryDropdownOpen ? 'ring-2 ring-blue-500 border-transparent' : ''} ${errors.factoryId ? 'border-red-500' : ''}`}
                    placeholder="Search factories..."
                  />
                  {isLoadingFactories ? (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    </div>
                  ) : (
                    <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform ${isFactoryDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
                  >
                    {isLoadingFactories ? (
                      <div className="px-3 py-4 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Loading factories...
                      </div>
                    ) : factories.length === 0 ? (
                      <div className="px-3 py-4 text-center text-sm text-gray-500">
                        {factorySearchTerm ? 'No factories found' : 'Start typing to search factories'}
                      </div>
                    ) : (
                      factories.map((factory) => (
                        <button
                          key={factory.id}
                          type="button"
                          onClick={() => handleFactorySelect(factory)}
                          className={`w-full px-3 py-2.5 text-left text-sm transition-colors flex items-center gap-3 ${
                            selectedFactory?.id === factory.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{factory.title}</div>
                            {factory.accountNumber && (
                              <div className="text-xs text-gray-500">Account: {factory.accountNumber}</div>
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
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className={labelClass}>Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 resize-y"
                rows={4}
                placeholder="Enter detailed product description"
              />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className={labelClass}>Unit Price *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unitPrice ?? ''}
                    onChange={(e) => handleChange('unitPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className={`${inputClass} pl-7 ${errors.unitPrice ? 'border-red-500' : ''}`}
                    placeholder="0.00"
                  />
                </div>
                {errors.unitPrice && (
                  <p className="mt-1 text-xs text-red-500">{errors.unitPrice}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>Default Commission Rate *</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={formData.defaultCommissionRate !== undefined ? formData.defaultCommissionRate * 100 : ''}
                    onChange={(e) => handleChange('defaultCommissionRate', e.target.value ? parseFloat(e.target.value) / 100 : undefined)}
                    className={`${inputClass} pr-8 ${errors.defaultCommissionRate ? 'border-red-500' : ''}`}
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                </div>
                {errors.defaultCommissionRate && (
                  <p className="mt-1 text-xs text-red-500">{errors.defaultCommissionRate}</p>
                )}
              </div>
            </div>

            {/* UOM Selection */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className={labelClass}>Unit of Measure *</label>
                <div className="relative" ref={uomDropdownRef}>
                  <input
                    type="text"
                    value={selectedUom?.title || ''}
                    onFocus={() => setIsUomDropdownOpen(true)}
                    readOnly
                    className={`${inputClass} cursor-pointer ${errors.productUomId ? 'border-red-500' : ''}`}
                    placeholder="Select UOM..."
                  />
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>

                  {isUomDropdownOpen && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {uoms.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">No UOMs available</div>
                      ) : (
                        uoms.map((uom) => (
                          <button
                            key={uom.id}
                            type="button"
                            onClick={() => handleUomSelect(uom)}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center justify-between ${
                              formData.productUomId === uom.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                            }`}
                          >
                            <div>
                              <div className="font-medium">{uom.title}</div>
                              {uom.description && (
                                <div className="text-xs text-gray-500">{uom.description}</div>
                              )}
                            </div>
                            {uom.divisionFactor && (
                              <span className="text-xs text-gray-400">÷{uom.divisionFactor}</span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {errors.productUomId && (
                  <p className="mt-1 text-xs text-red-500">{errors.productUomId}</p>
                )}
              </div>

              {/* Category Selection */}
              <div className="relative">
                <label className={labelClass}>Category</label>
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
                      if (selectedFactory) {
                        setIsCategoryDropdownOpen(true);
                        setCategorySearchTerm('');
                      }
                    }}
                    placeholder={selectedFactory ? "Search categories..." : "Select factory first"}
                    disabled={!selectedFactory}
                    className={`${inputClass} ${!selectedFactory ? 'bg-gray-50 cursor-not-allowed opacity-60' : ''}`}
                  />
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
                    className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                  >
                    {isLoadingCategories ? (
                      <div className="px-3 py-2 text-sm text-gray-500 flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        Searching...
                      </div>
                    ) : filteredCategories.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        {categorySearchTerm ? 'No categories found' : 'No categories available'}
                      </div>
                    ) : (
                      filteredCategories.map((category: ProductCategory) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => handleCategorySelect(category)}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center justify-between ${
                            selectedCategory?.id === category.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                          }`}
                        >
                          <span>{category.title}</span>
                          {category.commissionRate !== undefined && (
                            <span className="text-xs text-gray-400">{formatPercent(category.commissionRate)}</span>
                          )}
                        </button>
                      ))
                    )}
                  </div>,
                  document.body
                )}
              </div>
            </div>

            {/* Coming Soon Features */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Additional Features</h3>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">Coming Soon</span>
              </div>
              <div className="grid grid-cols-3 gap-4 opacity-50">
                <div>
                  <label className={`${labelClass} text-gray-400`}>UPC</label>
                  <input type="text" disabled className={`${inputClass} bg-gray-50 cursor-not-allowed`} placeholder="Universal Product Code" />
                </div>
                <div>
                  <label className={`${labelClass} text-gray-400`}>Lead Time (Days)</label>
                  <input type="number" disabled className={`${inputClass} bg-gray-50 cursor-not-allowed`} placeholder="0" />
                </div>
                <div>
                  <label className={`${labelClass} text-gray-400`}>Min Order Qty</label>
                  <input type="number" disabled className={`${inputClass} bg-gray-50 cursor-not-allowed`} placeholder="0" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============ CUSTOMER PART NUMBERS SECTION (DISABLED) ============ */}
        <div ref={el => { sectionRefs.current['customer-part-numbers'] = el; }} id="section-customer-part-numbers">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-400">Customer Part Numbers</h2>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          <div className="bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-500 mb-2">Create Product First</h3>
              <p className="text-sm text-gray-400 max-w-md mb-4">
                You need to create and save the product before you can add Customer Part Numbers (CPNs).
                Click the &quot;Create Product&quot; button above to save this product, then you can add CPNs.
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                CPNs allow you to set customer-specific part numbers and pricing
              </div>
            </div>
          </div>
        </div>

        {/* ============ QUANTITY PRICING SECTION (DISABLED) ============ */}
        <div ref={el => { sectionRefs.current['quantity-pricing'] = el; }} id="section-quantity-pricing">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-400">Quantity Pricing</h2>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          <div className="bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-500 mb-2">Create Product First</h3>
              <p className="text-sm text-gray-400 max-w-md mb-4">
                You need to create and save the product before you can add Quantity Pricing tiers.
                Click the &quot;Create Product&quot; button above to save this product, then you can add volume-based pricing.
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Quantity pricing allows you to set different prices based on order volume
              </div>
            </div>
          </div>
        </div>

        {/* Required Fields Note */}
        <div className="flex items-center justify-center pt-4 pb-8">
          <div className="text-sm text-gray-500">
            <span className="text-red-500">*</span> Required fields
          </div>
        </div>
      </div>
    </main>
  );
}
