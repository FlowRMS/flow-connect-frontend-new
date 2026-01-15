'use client';

import React, { useState, useEffect } from 'react';
import type {
  Product,
  ProductPricingTier,
  CustomerPartNumber,
  ProductFile,
  ProductNote,
  ProductActivity,
} from '../../lib/types/rms';

// Extended Product type with all related data
interface ProductWithRelations extends Product {
  customerPartNumbers?: CustomerPartNumber[];
  pricingTiers?: ProductPricingTier[];
  files?: ProductFile[];
  notes?: ProductNote[];
  activities?: ProductActivity[];
}

interface ProductEditModalProps {
  product: ProductWithRelations | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: ProductWithRelations) => void;
  factories?: { id: string; name: string }[];
  categories?: { id: string; name: string }[];
  customers?: { id: string; name: string }[];
}

type TabId = 'customer-part-numbers' | 'quantity-pricing' | 'weights-measures' | 'files' | 'notes' | 'activity';

const UOM_OPTIONS = ['ea', 'box', 'case', 'pallet', 'roll', 'ft', 'lb', 'kg'];
const WEIGHT_UOM_OPTIONS = ['LB', 'KG', 'OZ', 'G'];
const LENGTH_UOM_OPTIONS = ['IN', 'FT', 'CM', 'M'];
const VOLUME_UOM_OPTIONS = ['CUBIC_IN', 'CUBIC_FT', 'CUBIC_CM', 'CUBIC_M'];

export default function ProductEditModal({
  product,
  isOpen,
  onClose,
  onSave,
  factories = [],
  categories = [],
  customers = [],
}: ProductEditModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('customer-part-numbers');
  const [formData, setFormData] = useState<ProductWithRelations>({
    id: '',
    manufacturerId: '',
    manufacturerName: '',
    partNumber: '',
    description: '',
    unitPrice: 0,
    isActive: true,
    createdAt: '',
    updatedAt: '',
    customerPartNumbers: [],
    pricingTiers: [],
    files: [],
    notes: [],
    activities: [],
  });
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form data when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        customerPartNumbers: product.customerPartNumbers || [],
        pricingTiers: product.pricingTiers || [],
        files: product.files || [],
        notes: product.notes || [],
        activities: product.activities || [],
      });
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleFieldChange = (field: keyof ProductWithRelations, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  // Customer Part Numbers handlers
  const addCustomerPartNumber = () => {
    const newItem: CustomerPartNumber = {
      id: `temp-${Date.now()}`,
      productId: formData.id,
      customerId: '',
      customerName: '',
      customerPartNumber: '',
      priceOverride: 0,
      commissionRate: 0,
    };
    setFormData(prev => ({
      ...prev,
      customerPartNumbers: [...(prev.customerPartNumbers || []), newItem],
    }));
  };

  const updateCustomerPartNumber = (index: number, field: keyof CustomerPartNumber, value: unknown) => {
    setFormData(prev => {
      const items = [...(prev.customerPartNumbers || [])];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, customerPartNumbers: items };
    });
  };

  const removeCustomerPartNumber = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customerPartNumbers: (prev.customerPartNumbers || []).filter((_, i) => i !== index),
    }));
  };

  // Pricing Tiers handlers
  const addPricingTier = () => {
    const newItem: ProductPricingTier = {
      id: `temp-${Date.now()}`,
      productId: formData.id,
      minQuantity: 1,
      maxQuantity: 1,
      unitPrice: 0,
    };
    setFormData(prev => ({
      ...prev,
      pricingTiers: [...(prev.pricingTiers || []), newItem],
    }));
  };

  const updatePricingTier = (index: number, field: keyof ProductPricingTier, value: unknown) => {
    setFormData(prev => {
      const items = [...(prev.pricingTiers || [])];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, pricingTiers: items };
    });
  };

  const removePricingTier = (index: number) => {
    setFormData(prev => ({
      ...prev,
      pricingTiers: (prev.pricingTiers || []).filter((_, i) => i !== index),
    }));
  };

  // Notes handlers
  const addNote = () => {
    const newNote: ProductNote = {
      id: `temp-${Date.now()}`,
      productId: formData.id,
      content: '',
      createdAt: new Date().toISOString(),
      createdBy: 'Current User',
    };
    setFormData(prev => ({
      ...prev,
      notes: [...(prev.notes || []), newNote],
    }));
  };

  const updateNote = (index: number, content: string) => {
    setFormData(prev => {
      const items = [...(prev.notes || [])];
      items[index] = { ...items[index], content, updatedAt: new Date().toISOString() };
      return { ...prev, notes: items };
    });
  };

  const removeNote = (index: number) => {
    setFormData(prev => ({
      ...prev,
      notes: (prev.notes || []).filter((_, i) => i !== index),
    }));
  };

  const tabs = [
    { id: 'customer-part-numbers' as TabId, label: 'Customer Part Numbers', count: formData.customerPartNumbers?.length || 0 },
    { id: 'quantity-pricing' as TabId, label: 'Quantity Pricing', count: formData.pricingTiers?.length || 0 },
    { id: 'weights-measures' as TabId, label: 'Weights & Measures', count: null },
    { id: 'files' as TabId, label: 'Files', count: formData.files?.length || 0 },
    { id: 'notes' as TabId, label: 'Notes', count: formData.notes?.length || 0 },
    { id: 'activity' as TabId, label: 'Activity Feed', count: null },
  ];

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
  const selectClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Edit Product</h2>
              <p className="text-sm text-gray-500">{formData.partNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Basic Info Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-6 gap-4">
              {/* Row 1 */}
              <div>
                <label className={labelClass}>Part Number*</label>
                <input
                  type="text"
                  value={formData.partNumber}
                  onChange={(e) => handleFieldChange('partNumber', e.target.value)}
                  className={inputClass}
                  placeholder="Enter part number"
                />
              </div>
              <div>
                <label className={labelClass}>Factory*</label>
                <div className="relative">
                  <select
                    value={formData.manufacturerId}
                    onChange={(e) => {
                      const factory = factories.find(f => f.id === e.target.value);
                      handleFieldChange('manufacturerId', e.target.value);
                      if (factory) handleFieldChange('manufacturerName', factory.name);
                    }}
                    className={selectClass}
                  >
                    <option value="">Select factory</option>
                    {factories.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className={labelClass}>Category*</label>
                  <div className="relative">
                    <select
                      value={formData.categoryId || ''}
                      onChange={(e) => {
                        const category = categories.find(c => c.id === e.target.value);
                        handleFieldChange('categoryId', e.target.value);
                        if (category) handleFieldChange('category', category.name);
                      }}
                      className={selectClass}
                    >
                      <option value="">Select category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <button className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
              <div>
                <label className={labelClass}>UOM*</label>
                <div className="relative">
                  <select
                    value={formData.uom || 'ea'}
                    onChange={(e) => handleFieldChange('uom', e.target.value)}
                    className={selectClass}
                  >
                    {UOM_OPTIONS.map(uom => (
                      <option key={uom} value={uom}>{uom}</option>
                    ))}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div>
                <label className={labelClass}>Lead Time</label>
                <input
                  type="number"
                  value={formData.leadTimeDays || ''}
                  onChange={(e) => handleFieldChange('leadTimeDays', e.target.value ? parseInt(e.target.value) : undefined)}
                  className={inputClass}
                  placeholder="Days"
                />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  className={inputClass}
                  placeholder="Product description"
                />
              </div>

              {/* Row 2 */}
              <div>
                <label className={labelClass}>Unit Price*</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.unitPrice || ''}
                  onChange={(e) => handleFieldChange('unitPrice', parseFloat(e.target.value) || 0)}
                  className={inputClass}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className={labelClass}>Min Order Qty</label>
                <input
                  type="number"
                  value={formData.minOrderQty || ''}
                  onChange={(e) => handleFieldChange('minOrderQty', e.target.value ? parseInt(e.target.value) : undefined)}
                  className={inputClass}
                  placeholder="0"
                />
              </div>
              <div>
                <label className={labelClass}>Commission Rate*</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.standardCommissionRate != null ? (formData.standardCommissionRate * 100).toFixed(1) : ''}
                  onChange={(e) => handleFieldChange('standardCommissionRate', e.target.value ? parseFloat(e.target.value) / 100 : undefined)}
                  className={inputClass}
                  placeholder="0"
                />
              </div>
              <div>
                <label className={labelClass}>Commission Discount Rate</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.commissionDiscountRate != null ? (formData.commissionDiscountRate * 100).toFixed(1) : ''}
                  onChange={(e) => handleFieldChange('commissionDiscountRate', e.target.value ? parseFloat(e.target.value) / 100 : undefined)}
                  className={inputClass}
                  placeholder="0"
                />
              </div>
              <div>
                <label className={labelClass}>Unit Price Discount Rate</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.unitPriceDiscountRate != null ? (formData.unitPriceDiscountRate * 100).toFixed(1) : ''}
                  onChange={(e) => handleFieldChange('unitPriceDiscountRate', e.target.value ? parseFloat(e.target.value) / 100 : undefined)}
                  className={inputClass}
                  placeholder="0"
                />
              </div>
              <div>
                <label className={labelClass}>Cost</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost || ''}
                  onChange={(e) => handleFieldChange('cost', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className={inputClass}
                  placeholder="0.00"
                />
              </div>

              {/* Row 3 */}
              <div>
                <label className={labelClass}>UPC</label>
                <input
                  type="text"
                  value={formData.upc || ''}
                  onChange={(e) => handleFieldChange('upc', e.target.value)}
                  className={inputClass}
                  placeholder="Universal Product Code"
                />
              </div>
              <div>
                <label className={labelClass}>Approval Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.approvalDate || ''}
                    onChange={(e) => handleFieldChange('approvalDate', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Approval Comments</label>
                <input
                  type="text"
                  value={formData.approvalComments || ''}
                  onChange={(e) => handleFieldChange('approvalComments', e.target.value)}
                  className={inputClass}
                  placeholder="Enter approval comments"
                />
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="border-b border-gray-200">
            <div className="flex px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium transition-colors relative flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                  {tab.count !== null && (
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Customer Part Numbers Tab */}
            {activeTab === 'customer-part-numbers' && (
              <div className="space-y-4">
                {(formData.customerPartNumbers || []).map((item, index) => (
                  <div key={item.id} className="grid grid-cols-5 gap-4 items-end">
                    <div>
                      <label className={labelClass}>Customer Part Number*</label>
                      <input
                        type="text"
                        value={item.customerPartNumber}
                        onChange={(e) => updateCustomerPartNumber(index, 'customerPartNumber', e.target.value)}
                        className={inputClass}
                        placeholder="Enter part number"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Customer*</label>
                      <div className="relative">
                        <select
                          value={item.customerId}
                          onChange={(e) => {
                            const customer = customers.find(c => c.id === e.target.value);
                            updateCustomerPartNumber(index, 'customerId', e.target.value);
                            if (customer) updateCustomerPartNumber(index, 'customerName', customer.name);
                          }}
                          className={selectClass}
                        >
                          <option value="">Select customer</option>
                          {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Unit Price*</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={item.priceOverride || ''}
                          onChange={(e) => updateCustomerPartNumber(index, 'priceOverride', parseFloat(e.target.value) || 0)}
                          className={`${inputClass} pl-7`}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Commission Rate*</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          value={item.commissionRate != null ? item.commissionRate : ''}
                          onChange={(e) => updateCustomerPartNumber(index, 'commissionRate', e.target.value ? parseFloat(e.target.value) : 0)}
                          className={`${inputClass} pr-8`}
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => removeCustomerPartNumber(index)}
                        className="p-2.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      {index === (formData.customerPartNumbers || []).length - 1 && (
                        <button
                          onClick={addCustomerPartNumber}
                          className="p-2.5 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {(formData.customerPartNumbers || []).length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No customer part numbers defined</p>
                    <button
                      onClick={addCustomerPartNumber}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Customer Part Number
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Quantity Pricing Tab */}
            {activeTab === 'quantity-pricing' && (
              <div className="space-y-4">
                {(formData.pricingTiers || []).map((tier, index) => (
                  <div key={tier.id} className="grid grid-cols-4 gap-4 items-end">
                    <div>
                      <label className={labelClass}>Quantity Low*</label>
                      <input
                        type="number"
                        value={tier.minQuantity}
                        onChange={(e) => updatePricingTier(index, 'minQuantity', parseInt(e.target.value) || 0)}
                        className={inputClass}
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Quantity High*</label>
                      <input
                        type="number"
                        value={tier.maxQuantity}
                        onChange={(e) => updatePricingTier(index, 'maxQuantity', parseInt(e.target.value) || 0)}
                        className={inputClass}
                        placeholder="10"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Unit Price*</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={tier.unitPrice}
                          onChange={(e) => updatePricingTier(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className={`${inputClass} pr-8`}
                          placeholder="0.00"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => removePricingTier(index)}
                        className="p-2.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      {index === (formData.pricingTiers || []).length - 1 && (
                        <button
                          onClick={addPricingTier}
                          className="p-2.5 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {(formData.pricingTiers || []).length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No quantity pricing tiers defined</p>
                    <button
                      onClick={addPricingTier}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Pricing Tier
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Weights & Measures Tab */}
            {activeTab === 'weights-measures' && (
              <div className="space-y-6">
                {/* Warehouse Location Section */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Warehouse Location
                  </h4>
                  <div className="grid grid-cols-6 gap-4">
                    <div>
                      <label className={labelClass}>Section</label>
                      <input
                        type="text"
                        value={formData.warehouseSection || ''}
                        onChange={(e) => handleFieldChange('warehouseSection', e.target.value || undefined)}
                        className={inputClass}
                        placeholder="e.g., A"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Aisle</label>
                      <input
                        type="text"
                        value={formData.warehouseAisle || ''}
                        onChange={(e) => handleFieldChange('warehouseAisle', e.target.value || undefined)}
                        className={inputClass}
                        placeholder="e.g., 1"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Shelf</label>
                      <input
                        type="text"
                        value={formData.warehouseShelf || ''}
                        onChange={(e) => handleFieldChange('warehouseShelf', e.target.value || undefined)}
                        className={inputClass}
                        placeholder="e.g., 3"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Bay</label>
                      <input
                        type="text"
                        value={formData.warehouseBay || ''}
                        onChange={(e) => handleFieldChange('warehouseBay', e.target.value || undefined)}
                        className={inputClass}
                        placeholder="e.g., 2"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Row</label>
                      <input
                        type="text"
                        value={formData.warehouseRow || ''}
                        onChange={(e) => handleFieldChange('warehouseRow', e.target.value || undefined)}
                        className={inputClass}
                        placeholder="e.g., 1"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Bin</label>
                      <input
                        type="text"
                        value={formData.warehouseBin || ''}
                        onChange={(e) => handleFieldChange('warehouseBin', e.target.value || undefined)}
                        className={inputClass}
                        placeholder="e.g., A"
                      />
                    </div>
                  </div>
                </div>

                {/* Weights & Dimensions */}
                <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Net Weight</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.netWeight || ''}
                      onChange={(e) => handleFieldChange('netWeight', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className={inputClass}
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Weight of product excluding packaging</p>
                  </div>
                  <div>
                    <label className={labelClass}>Weight UOM</label>
                    <div className="relative">
                      <select
                        value={formData.weightUom || 'LB'}
                        onChange={(e) => handleFieldChange('weightUom', e.target.value)}
                        className={selectClass}
                      >
                        {WEIGHT_UOM_OPTIONS.map(uom => (
                          <option key={uom} value={uom}>{uom}</option>
                        ))}
                      </select>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Width</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.width || ''}
                      onChange={(e) => handleFieldChange('width', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className={inputClass}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Length UOM</label>
                    <div className="relative">
                      <select
                        value={formData.lengthUom || 'IN'}
                        onChange={(e) => handleFieldChange('lengthUom', e.target.value)}
                        className={selectClass}
                      >
                        {LENGTH_UOM_OPTIONS.map(uom => (
                          <option key={uom} value={uom}>{uom}</option>
                        ))}
                      </select>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Volume UOM</label>
                    <div className="relative">
                      <select
                        value={formData.volumeUom || 'CUBIC_IN'}
                        onChange={(e) => handleFieldChange('volumeUom', e.target.value)}
                        className={selectClass}
                      >
                        {VOLUME_UOM_OPTIONS.map(uom => (
                          <option key={uom} value={uom}>{uom}</option>
                        ))}
                      </select>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Tare Weight</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.tareWeight || ''}
                      onChange={(e) => handleFieldChange('tareWeight', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className={inputClass}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Gross Weight</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.grossWeight || ''}
                      onChange={(e) => handleFieldChange('grossWeight', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className={inputClass}
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Total weight including packaging</p>
                  </div>
                  <div>
                    <label className={labelClass}>Length</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.length || ''}
                      onChange={(e) => handleFieldChange('length', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className={inputClass}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Height</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.height || ''}
                      onChange={(e) => handleFieldChange('height', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className={inputClass}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Volume</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.volume || ''}
                      onChange={(e) => handleFieldChange('volume', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className={inputClass}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Units Per Case</label>
                    <input
                      type="number"
                      value={formData.unitsPerCase || ''}
                      onChange={(e) => handleFieldChange('unitsPerCase', e.target.value ? parseInt(e.target.value) : undefined)}
                      className={inputClass}
                      placeholder="0"
                    />
                  </div>
                </div>
                </div>
              </div>
            )}

            {/* Files Tab */}
            {activeTab === 'files' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gray-600 mb-2">Drop files here or click to upload</p>
                  <p className="text-sm text-gray-500">PDF, DOC, XLS, images up to 10MB</p>
                  <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Choose Files
                  </button>
                </div>
                {(formData.files || []).length > 0 && (
                  <div className="space-y-2">
                    {(formData.files || []).map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{file.name}</p>
                            <p className="text-sm text-gray-500">{file.fileSize} • {file.uploadedBy}</p>
                          </div>
                        </div>
                        <button className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                {(formData.notes || []).map((note, index) => (
                  <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-sm text-gray-500">
                        {note.createdBy} • {new Date(note.createdAt).toLocaleDateString()}
                        {note.updatedAt && ` (edited ${new Date(note.updatedAt).toLocaleDateString()})`}
                      </div>
                      <button
                        onClick={() => removeNote(index)}
                        className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <textarea
                      value={note.content}
                      onChange={(e) => updateNote(index, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Enter note content..."
                    />
                  </div>
                ))}
                <button
                  onClick={addNote}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Note
                </button>
              </div>
            )}

            {/* Activity Feed Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-4">
                {(formData.activities || []).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No activity recorded yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(formData.activities || []).map((activity) => (
                      <div key={activity.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{activity.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {activity.userName} • {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
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
  );
}
