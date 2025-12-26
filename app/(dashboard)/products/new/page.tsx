'use client';

import { useState, useEffect, useRef } from 'react';
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
  const { data: categories = [], isLoading: isLoadingCategories } = useProductCategories();

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle factory selection
  const handleFactorySelect = (factory: FactorySearchResult) => {
    setSelectedFactory(factory);
    setFormData(prev => ({ ...prev, factoryId: factory.id }));
    setFactorySearchTerm(factory.title);
    setIsFactoryDropdownOpen(false);
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
      const newProduct = await createProductMutation.mutateAsync(formData);
      toast.success('Product created successfully');
      // Navigate to the product edit page
      router.push(`/products/${newProduct.id}/edit`);
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

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              <h1 className="text-xl font-semibold text-gray-900">Create New Product</h1>
              <p className="text-sm text-gray-500">Add a new product to the catalog</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h2>

              <div className="grid grid-cols-2 gap-6">
                {/* Factory Selector */}
                <div className="relative">
                  <label className={labelClass}>
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
                      onFocus={() => setIsFactoryDropdownOpen(true)}
                      placeholder="Click to search factories..."
                      className={`${inputClass} pr-10 ${
                        isFactoryDropdownOpen ? 'ring-2 ring-blue-500 border-transparent' : ''
                      } ${errors.factoryId ? 'border-red-500' : ''}`}
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

                {/* Part Number */}
                <div>
                  <label className={labelClass}>
                    Factory Part Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.factoryPartNumber}
                    onChange={(e) => handleChange('factoryPartNumber', e.target.value)}
                    placeholder="Enter part number..."
                    className={`${inputClass} ${errors.factoryPartNumber ? 'border-red-500' : ''}`}
                  />
                  {errors.factoryPartNumber && (
                    <p className="mt-1 text-xs text-red-500">{errors.factoryPartNumber}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mt-6">
                <label className={labelClass}>
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Enter product description..."
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>

            {/* Pricing Information */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Pricing</h2>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Unit Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.unitPrice ?? ''}
                      onChange={(e) => handleChange('unitPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="0.00"
                      className={`${inputClass} pl-7`}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Default Commission Rate</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.defaultCommissionRate !== undefined ? formData.defaultCommissionRate * 100 : ''}
                      onChange={(e) => handleChange('defaultCommissionRate', e.target.value ? parseFloat(e.target.value) / 100 : undefined)}
                      placeholder="0"
                      className={`${inputClass} pr-8`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Classification */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Classification</h2>

              <div className="grid grid-cols-2 gap-6">
                {/* UOM Dropdown */}
                <div className="relative" ref={uomDropdownRef}>
                  <label className={labelClass}>
                    Unit of Measure <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={selectedUom?.title || ''}
                      onFocus={() => setIsUomDropdownOpen(true)}
                      readOnly
                      placeholder="Select UOM..."
                      className={`${inputClass} cursor-pointer pr-10 ${
                        isUomDropdownOpen ? 'ring-2 ring-blue-500 border-transparent' : ''
                      } ${errors.productUomId ? 'border-red-500' : ''}`}
                    />
                    <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform ${isUomDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {errors.productUomId && (
                    <p className="mt-1 text-xs text-red-500">{errors.productUomId}</p>
                  )}
                  {isUomDropdownOpen && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {uoms.length === 0 ? (
                        <div className="px-3 py-4 text-center text-sm text-gray-500">
                          No UOMs available
                        </div>
                      ) : (
                        uoms.map((uom: ProductUom) => (
                          <button
                            key={uom.id}
                            type="button"
                            onClick={() => handleUomSelect(uom)}
                            className={`w-full px-3 py-2.5 text-left text-sm transition-colors flex items-center gap-3 ${
                              formData.productUomId === uom.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">{uom.title}</div>
                              {uom.description && (
                                <div className="text-xs text-gray-500 truncate">{uom.description}</div>
                              )}
                            </div>
                            {uom.divisionFactor && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full flex-shrink-0">
                                ÷{uom.divisionFactor}
                              </span>
                            )}
                            {formData.productUomId === uom.id && (
                              <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Category Dropdown */}
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
                        setIsCategoryDropdownOpen(true);
                        setCategorySearchTerm('');
                      }}
                      placeholder="Click to search categories..."
                      className={`${inputClass} pr-10 ${
                        isCategoryDropdownOpen ? 'ring-2 ring-blue-500 border-transparent' : ''
                      }`}
                    />
                    <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {isCategoryDropdownOpen && isMounted && createPortal(
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
                        <div className="px-3 py-4 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                          Loading categories...
                        </div>
                      ) : filteredCategories.length === 0 ? (
                        <div className="px-3 py-4 text-center text-sm text-gray-500">
                          {categorySearchTerm ? 'No categories found' : 'No categories available'}
                        </div>
                      ) : (
                        filteredCategories.map((category: ProductCategory) => (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => handleCategorySelect(category)}
                            className={`w-full px-3 py-2.5 text-left text-sm transition-colors flex items-center gap-3 ${
                              selectedCategory?.id === category.id ? 'bg-purple-50 text-purple-700' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">{category.title}</div>
                              {category.commissionRate !== undefined && (
                                <div className="text-xs text-gray-500">
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
            </div>

            {/* Status Settings */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Status</h2>

              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-900">
                      Published
                    </label>
                    <p className="text-xs text-gray-500">Make product visible to users</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChange('published', !formData.published)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      formData.published ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                        formData.published ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-900">
                      Approval Needed
                    </label>
                    <p className="text-xs text-gray-500">Require approval for use in quotes</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChange('approvalNeeded', !formData.approvalNeeded)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      formData.approvalNeeded ? 'bg-amber-500' : 'bg-gray-300'
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

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-4 pb-8">
              <div className="text-sm text-gray-500">
                <span className="text-red-500">*</span> Required fields
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProductMutation.isPending}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
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
          </form>
        </div>
      </div>
    </div>
  );
}
