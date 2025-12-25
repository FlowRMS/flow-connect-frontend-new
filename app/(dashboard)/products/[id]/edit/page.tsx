'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  useProduct,
  useUpdateProduct,
  useProductUoms,
  useProductCategories,
  useFactorySearch,
  type ProductCategory,
  type ProductUom,
  type Factory,
  type UpdateProductInput,
  type FactorySearchResult,
} from '../../../../../components/products/api';

// ============================================================================
// Types
// ============================================================================

type TabId = 'overview' | 'factory-details' | 'uom-details' | 'category-details';

interface FormData {
  id: string;
  factoryPartNumber: string;
  description: string;
  unitPrice: number;
  defaultCommissionRate: number;
  approvalNeeded: boolean;
  published: boolean;
  // Related entities
  factory?: Factory;
  category?: ProductCategory;
  uom?: ProductUom;
  // Selected IDs for updates
  selectedFactoryId?: string;
  selectedUomId?: string;
  selectedCategoryId?: string;
}

// ============================================================================
// Component
// ============================================================================

export default function ProductEditPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  // API Hooks
  const { data: product, isLoading: isLoadingProduct, error: productError } = useProduct(productId);
  const updateProductMutation = useUpdateProduct();
  const { data: uoms = [] } = useProductUoms();

  // State
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [formData, setFormData] = useState<FormData>({
    id: '',
    factoryPartNumber: '',
    description: '',
    unitPrice: 0,
    defaultCommissionRate: 0,
    approvalNeeded: false,
    published: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Category Search State (requires factory to be selected)
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const { data: allCategories = [], isLoading: isLoadingCategories } = useProductCategories(
    formData.selectedFactoryId || formData.factory?.id
  );

  // Filter categories based on search term (client-side filtering)
  const categoryResults = categorySearchTerm
    ? allCategories.filter((c: ProductCategory) => c.title.toLowerCase().includes(categorySearchTerm.toLowerCase()))
    : allCategories;

  // UOM Dropdown State
  const [isUomDropdownOpen, setIsUomDropdownOpen] = useState(false);
  const uomDropdownRef = useRef<HTMLDivElement>(null);
  const uomInputRef = useRef<HTMLInputElement>(null);

  // Factory Search State
  const [factorySearchTerm, setFactorySearchTerm] = useState('');
  const [isFactoryDropdownOpen, setIsFactoryDropdownOpen] = useState(false);
  const factoryInputRef = useRef<HTMLInputElement>(null);
  const factoryDropdownRef = useRef<HTMLDivElement>(null);
  const { data: factories = [], isLoading: isLoadingFactories } = useFactorySearch(
    factorySearchTerm,
    isFactoryDropdownOpen
  );

  // Portal mount state
  const [isMounted, setIsMounted] = useState(false);

  // Section refs for scroll-to functionality
  const sectionRefs = useRef<Record<TabId, HTMLDivElement | null>>({
    'overview': null,
    'factory-details': null,
    'uom-details': null,
    'category-details': null,
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // Effects
  // ============================================================================

  // Mount state for portal
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load product data into form
  useEffect(() => {
    if (product) {
      setFormData({
        id: product.id,
        factoryPartNumber: product.factoryPartNumber,
        description: product.description || '',
        unitPrice: product.unitPrice || 0,
        defaultCommissionRate: product.defaultCommissionRate || 0,
        approvalNeeded: product.approvalNeeded,
        published: product.published,
        factory: product.factory,
        category: product.category,
        uom: product.uom,
        selectedFactoryId: product.factory?.id,
        selectedUomId: product.uom?.id,
        selectedCategoryId: product.category?.id,
      });
      setFactorySearchTerm(product.factory?.title || '');
      setHasChanges(false);
    }
  }, [product]);

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(target)) {
        setIsCategoryDropdownOpen(false);
      }
      if (uomDropdownRef.current && !uomDropdownRef.current.contains(target)) {
        setIsUomDropdownOpen(false);
      }
      if (
        factoryInputRef.current && !factoryInputRef.current.contains(target) &&
        factoryDropdownRef.current && !factoryDropdownRef.current.contains(target)
      ) {
        setIsFactoryDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll spy
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const tabIds: TabId[] = ['overview', 'factory-details', 'uom-details', 'category-details'];

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
  }, [isLoadingProduct]);

  // ============================================================================
  // Handlers
  // ============================================================================

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

  const handleFieldChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // Handle factory selection with category reset
  const handleFactorySelect = (factory: FactorySearchResult) => {
    const previousFactoryId = formData.selectedFactoryId;
    const isChangingFactory = previousFactoryId && previousFactoryId !== factory.id;

    if (isChangingFactory) {
      // Clear category when factory changes
      setFormData(prev => ({
        ...prev,
        factory: { id: factory.id, title: factory.title, accountNumber: factory.accountNumber },
        selectedFactoryId: factory.id,
        category: undefined,
        selectedCategoryId: undefined,
      }));
      toast.info('Category cleared - please select a new category for this factory');
    } else {
      setFormData(prev => ({
        ...prev,
        factory: { id: factory.id, title: factory.title, accountNumber: factory.accountNumber },
        selectedFactoryId: factory.id,
      }));
    }

    setFactorySearchTerm(factory.title);
    setIsFactoryDropdownOpen(false);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!formData.factoryPartNumber.trim()) {
      toast.error('Part number is required');
      return;
    }

    if (!formData.selectedFactoryId) {
      toast.error('Factory is required');
      return;
    }

    setIsSaving(true);
    try {
      const input: UpdateProductInput = {
        factoryId: formData.selectedFactoryId, // Use selected factory ID
        factoryPartNumber: formData.factoryPartNumber,
        description: formData.description || undefined,
        unitPrice: formData.unitPrice,
        defaultCommissionRate: formData.defaultCommissionRate,
        approvalNeeded: formData.approvalNeeded,
        published: formData.published,
        productUomId: formData.selectedUomId,
        productCategoryId: formData.selectedCategoryId,
      };

      await updateProductMutation.mutateAsync({ id: productId, input });
      toast.success('Product updated successfully');
      setHasChanges(false);
    } catch (error) {
      toast.error('Failed to update product');
      console.error('Update error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================================
  // Render Helpers
  // ============================================================================

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercent = (rate: number) => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  const tabs = [
    { id: 'overview' as TabId, label: 'Overview', count: null },
    { id: 'factory-details' as TabId, label: 'Factory Details', count: null },
    { id: 'uom-details' as TabId, label: 'UOM Details', count: null },
    { id: 'category-details' as TabId, label: 'Category Details', count: null },
  ];

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  // ============================================================================
  // Loading / Error States
  // ============================================================================

  if (isLoadingProduct) {
    return (
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Loading product...</span>
          </div>
        </div>
      </main>
    );
  }

  if (productError || !product) {
    return (
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="flex flex-col items-center justify-center h-64">
          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Product not found</h3>
          <p className="text-gray-500 mb-4">The product you're looking for doesn't exist or has been deleted.</p>
          <button
            onClick={() => router.push('/products')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Products
          </button>
        </div>
      </main>
    );
  }

  // ============================================================================
  // Main Render
  // ============================================================================

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
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {formData.description
                  ? formData.description.length > 50
                    ? `${formData.description.slice(0, 50)}...`
                    : formData.description
                  : 'Untitled Product'}
              </h1>
              <p className="text-sm text-gray-500">{formData.factoryPartNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Status Badges */}
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              formData.published
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {formData.published ? 'Published' : 'Draft'}
            </span>
            {formData.approvalNeeded && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                Approval Required
              </span>
            )}

            <button
              onClick={() => router.push('/products')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
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
              onClick={() => scrollToSection(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
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
                  onClick={() => handleFieldChange('published', !formData.published)}
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
                  onClick={() => handleFieldChange('approvalNeeded', !formData.approvalNeeded)}
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
                <label className={labelClass}>Part Number*</label>
                <input
                  type="text"
                  value={formData.factoryPartNumber}
                  onChange={(e) => handleFieldChange('factoryPartNumber', e.target.value)}
                  className={inputClass}
                  placeholder="Enter part number"
                />
              </div>
              <div>
                <label className={labelClass}>Factory*</label>
                <div className="relative">
                  <input
                    ref={factoryInputRef}
                    type="text"
                    value={factorySearchTerm}
                    onChange={(e) => {
                      setFactorySearchTerm(e.target.value);
                      setIsFactoryDropdownOpen(true);
                    }}
                    onFocus={() => setIsFactoryDropdownOpen(true)}
                    className={`${inputClass} pr-10 ${isFactoryDropdownOpen ? 'ring-2 ring-blue-500 border-transparent' : ''}`}
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
                            formData.selectedFactoryId === factory.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
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
                          {formData.selectedFactoryId === factory.id && (
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
                <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Changing factory will clear the selected category
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className={labelClass}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 resize-y"
                rows={4}
                placeholder="Enter detailed product description"
              />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className={labelClass}>Unit Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unitPrice || ''}
                    onChange={(e) => handleFieldChange('unitPrice', parseFloat(e.target.value) || 0)}
                    className={`${inputClass} pl-7`}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Default Commission Rate</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={formData.defaultCommissionRate ? (formData.defaultCommissionRate * 100).toFixed(1) : ''}
                    onChange={(e) => handleFieldChange('defaultCommissionRate', e.target.value ? parseFloat(e.target.value) / 100 : 0)}
                    className={`${inputClass} pr-8`}
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                </div>
              </div>
            </div>

            {/* UOM Selection - Trigger-based dropdown */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className={labelClass}>Unit of Measure</label>
                <div className="relative" ref={uomDropdownRef}>
                  <input
                    type="text"
                    value={uoms.find(u => u.id === formData.selectedUomId)?.title || formData.uom?.title || ''}
                    onFocus={() => setIsUomDropdownOpen(true)}
                    readOnly
                    className={`${inputClass} cursor-pointer`}
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
                            onClick={() => {
                              handleFieldChange('selectedUomId', uom.id);
                              handleFieldChange('uom', uom);
                              setIsUomDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center justify-between ${
                              formData.selectedUomId === uom.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                            }`}
                          >
                            <div>
                              <div className="font-medium">{uom.title}</div>
                              {uom.description && (
                                <div className="text-xs text-gray-500">{uom.description}</div>
                              )}
                            </div>
                            {uom.multiply && uom.multiplyBy && (
                              <span className="text-xs text-gray-400">×{uom.multiplyBy}</span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Category Selection - Trigger-based search dropdown */}
              <div>
                <label className={labelClass}>Category</label>
                <div className="relative" ref={categoryDropdownRef}>
                  <input
                    type="text"
                    value={isCategoryDropdownOpen ? categorySearchTerm : (formData.category?.title || '')}
                    onChange={(e) => setCategorySearchTerm(e.target.value)}
                    onFocus={() => {
                      setIsCategoryDropdownOpen(true);
                      setCategorySearchTerm('');
                    }}
                    className={inputClass}
                    placeholder={formData.factory?.id ? "Search categories..." : "Select factory first"}
                    disabled={!formData.factory?.id}
                  />
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>

                  {isCategoryDropdownOpen && formData.factory?.id && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {isLoadingCategories ? (
                        <div className="px-3 py-2 text-sm text-gray-500 flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          Searching...
                        </div>
                      ) : categoryResults.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          {categorySearchTerm ? 'No categories found' : 'Type to search categories'}
                        </div>
                      ) : (
                        categoryResults.map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => {
                              handleFieldChange('selectedCategoryId', category.id);
                              handleFieldChange('category', category);
                              setIsCategoryDropdownOpen(false);
                              setCategorySearchTerm('');
                            }}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center justify-between ${
                              formData.selectedCategoryId === category.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                            }`}
                          >
                            <span>{category.title}</span>
                            {category.commissionRate !== undefined && (
                              <span className="text-xs text-gray-400">{formatPercent(category.commissionRate)}</span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
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

        {/* ============ FACTORY DETAILS SECTION ============ */}
        <div ref={el => { sectionRefs.current['factory-details'] = el; }} id="section-factory-details">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Factory Details</h2>

          {formData.factory ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{formData.factory.title}</h3>
                    {formData.factory.accountNumber && (
                      <p className="text-sm text-gray-500">Account: {formData.factory.accountNumber}</p>
                    )}
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  formData.factory.published
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {formData.factory.published ? 'Published' : 'Draft'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-6">
                {/* Contact Info */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Contact
                  </h4>
                  {formData.factory.email && (
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm text-gray-900">{formData.factory.email}</p>
                    </div>
                  )}
                  {formData.factory.phone && (
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm text-gray-900">{formData.factory.phone}</p>
                    </div>
                  )}
                  {formData.factory.leadTime && (
                    <div>
                      <p className="text-xs text-gray-500">Lead Time</p>
                      <p className="text-sm text-gray-900">{formData.factory.leadTime}</p>
                    </div>
                  )}
                </div>

                {/* Commission & Discount */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Commission & Pricing
                  </h4>
                  {formData.factory.baseCommissionRate !== undefined && (
                    <div>
                      <p className="text-xs text-gray-500">Base Commission Rate</p>
                      <p className="text-sm text-gray-900">{formatPercent(formData.factory.baseCommissionRate)}</p>
                    </div>
                  )}
                  {formData.factory.commissionDiscountRate !== undefined && (
                    <div>
                      <p className="text-xs text-gray-500">Commission Discount Rate</p>
                      <p className="text-sm text-gray-900">{formatPercent(formData.factory.commissionDiscountRate)}</p>
                    </div>
                  )}
                  {formData.factory.overallDiscountRate !== undefined && (
                    <div>
                      <p className="text-xs text-gray-500">Overall Discount Rate</p>
                      <p className="text-sm text-gray-900">{formatPercent(formData.factory.overallDiscountRate)}</p>
                    </div>
                  )}
                </div>

                {/* Terms */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Terms
                  </h4>
                  {formData.factory.paymentTerms && (
                    <div>
                      <p className="text-xs text-gray-500">Payment Terms</p>
                      <p className="text-sm text-gray-900">{formData.factory.paymentTerms}</p>
                    </div>
                  )}
                  {formData.factory.freightTerms && (
                    <div>
                      <p className="text-xs text-gray-500">Freight Terms</p>
                      <p className="text-sm text-gray-900">{formData.factory.freightTerms}</p>
                    </div>
                  )}
                  {formData.factory.freightDiscountType && (
                    <div>
                      <p className="text-xs text-gray-500">Freight Discount Type</p>
                      <p className="text-sm text-gray-900">{formData.factory.freightDiscountType}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Split Rates */}
              {formData.factory.splitRates && formData.factory.splitRates.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Split Rates</h4>
                  <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                    <div className="grid grid-cols-4 gap-4 px-4 py-2 bg-gray-100 border-b border-gray-200">
                      <div className="text-xs font-medium text-gray-500 uppercase">Position</div>
                      <div className="text-xs font-medium text-gray-500 uppercase">User</div>
                      <div className="text-xs font-medium text-gray-500 uppercase">Email</div>
                      <div className="text-xs font-medium text-gray-500 uppercase">Split Rate</div>
                    </div>
                    {formData.factory.splitRates.map((splitRate, index) => (
                      <div key={splitRate.id} className={`grid grid-cols-4 gap-4 px-4 py-3 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <div className="text-sm text-gray-900">{splitRate.position}</div>
                        <div className="text-sm text-gray-900">{splitRate.user?.fullName || '-'}</div>
                        <div className="text-sm text-gray-500">{splitRate.user?.email || '-'}</div>
                        <div className="text-sm font-medium text-gray-900">{splitRate.splitRate}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Information */}
              {formData.factory.additionalInformation && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Additional Information</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{formData.factory.additionalInformation}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-gray-500">No factory associated with this product</p>
            </div>
          )}
        </div>

        {/* ============ UOM DETAILS SECTION ============ */}
        <div ref={el => { sectionRefs.current['uom-details'] = el; }} id="section-uom-details">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Unit of Measure Details</h2>

          {formData.uom ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{formData.uom.title}</h3>
                  {formData.uom.description && (
                    <p className="text-sm text-gray-500 mt-1">{formData.uom.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {formData.uom.multiply && (
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      Multiplier: ×{formData.uom.multiplyBy || 1}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Multiply Quantity</p>
                  <p className="text-sm font-medium text-gray-900">{formData.uom.multiply ? 'Yes' : 'No'}</p>
                </div>
                {formData.uom.multiply && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Multiply By</p>
                    <p className="text-sm font-medium text-gray-900">{formData.uom.multiplyBy || 1}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
              <p className="text-gray-500 mb-4">No unit of measure selected</p>
              <button
                onClick={() => setIsUomDropdownOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Select UOM
              </button>
            </div>
          )}
        </div>

        {/* ============ CATEGORY DETAILS SECTION ============ */}
        <div ref={el => { sectionRefs.current['category-details'] = el; }} id="section-category-details">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Details</h2>

          {formData.category ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{formData.category.title}</h3>
                    <p className="text-sm text-gray-500">Category ID: {formData.category.id}</p>
                  </div>
                </div>
                {formData.category.commissionRate !== undefined && (
                  <span className="px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-lg">
                    Commission: {formatPercent(formData.category.commissionRate)}
                  </span>
                )}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Factory ID</p>
                  <p className="text-sm font-medium text-gray-900">{formData.category.factoryId || '-'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Commission Rate</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formData.category.commissionRate !== undefined
                      ? formatPercent(formData.category.commissionRate)
                      : 'Not set'}
                  </p>
                </div>
              </div>

              {/* Parent/Grandparent Categories - Coming Soon */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <h4 className="text-sm font-medium text-gray-900">Category Hierarchy</h4>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">Coming Soon</span>
                </div>
                <div className="grid grid-cols-2 gap-4 opacity-50">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Parent Category</p>
                    <p className="text-sm text-gray-400">Feature not yet available</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Grandparent Category</p>
                    <p className="text-sm text-gray-400">Feature not yet available</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <p className="text-gray-500 mb-4">No category selected</p>
              {formData.factory?.id ? (
                <button
                  onClick={() => {
                    setIsCategoryDropdownOpen(true);
                    scrollToSection('overview');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Select Category
                </button>
              ) : (
                <p className="text-sm text-gray-400">Select a factory first to choose a category</p>
              )}
            </div>
          )}
        </div>

        {/* Coming Soon Sections */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Additional Sections</h2>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">Coming Soon</span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center opacity-60">
              <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3 className="text-sm font-medium text-gray-600">Customer Part Numbers</h3>
              <p className="text-xs text-gray-400 mt-1">Customer-specific part numbers</p>
            </div>

            <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center opacity-60">
              <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-sm font-medium text-gray-600">Quantity Pricing</h3>
              <p className="text-xs text-gray-400 mt-1">Volume-based pricing tiers</p>
            </div>

            <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center opacity-60">
              <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-sm font-medium text-gray-600">Files & Spec Sheets</h3>
              <p className="text-xs text-gray-400 mt-1">Product documentation</p>
            </div>

            <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center opacity-60">
              <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <h3 className="text-sm font-medium text-gray-600">Notes</h3>
              <p className="text-xs text-gray-400 mt-1">Product notes and comments</p>
            </div>

            <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center opacity-60">
              <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-sm font-medium text-gray-600">Quote History</h3>
              <p className="text-xs text-gray-400 mt-1">Historical quote data</p>
            </div>

            <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center opacity-60">
              <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3 className="text-sm font-medium text-gray-600">Configurations</h3>
              <p className="text-xs text-gray-400 mt-1">Product variants</p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
