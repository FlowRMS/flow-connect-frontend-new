'use client';

import React, { useState, useEffect } from 'react';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: {
    id: string;
    partNumber: string;
    description: string;
    manufacturer: string;
    basePrice: number;
  }) => void;
  initialData?: {
    partNumber?: string;
    description?: string;
  };
  manufacturers?: { id: string; name: string }[];
}

export default function CreateProductModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  manufacturers = [],
}: CreateProductModalProps) {
  const [formData, setFormData] = useState({
    partNumber: '',
    description: '',
    manufacturer: '',
    basePrice: 0,
    uom: 'EA',
    leadTime: '',
    commissionRate: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens with initial data
  useEffect(() => {
    if (isOpen) {
      setFormData({
        partNumber: initialData?.partNumber || '',
        description: initialData?.description || '',
        manufacturer: '',
        basePrice: 0,
        uom: 'EA',
        leadTime: '',
        commissionRate: '',
      });
      setErrors({});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.partNumber.trim()) {
      newErrors.partNumber = 'Part number is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.manufacturer.trim()) {
      newErrors.manufacturer = 'Manufacturer is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      // Create the product object
      const newProduct = {
        id: `prod-${Date.now()}`,
        partNumber: formData.partNumber.trim(),
        description: formData.description.trim(),
        manufacturer: formData.manufacturer.trim(),
        basePrice: formData.basePrice || 0,
      };

      onSave(newProduct);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400";
  const inputErrorClass = "w-full px-3 py-2.5 border border-red-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all placeholder:text-gray-400";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
  const selectClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer";

  // Default manufacturers if none provided
  const defaultManufacturers = [
    { id: 'mfr-1', name: 'Acuity Brands' },
    { id: 'mfr-2', name: 'Cree Lighting' },
    { id: 'mfr-3', name: 'RAB Lighting' },
    { id: 'mfr-4', name: 'Lithonia' },
    { id: 'mfr-5', name: 'Lutron' },
    { id: 'mfr-6', name: 'Cooper Lighting' },
    { id: 'mfr-7', name: 'Signify' },
    { id: 'mfr-8', name: 'Eaton' },
    { id: 'mfr-9', name: 'Schneider Electric' },
    { id: 'mfr-10', name: 'ABB' },
    { id: 'mfr-11', name: 'Kenall' },
    { id: 'mfr-12', name: 'Waldmann' },
    { id: 'mfr-13', name: 'Kichler' },
    { id: 'mfr-14', name: 'WAC Lighting' },
    { id: 'mfr-15', name: 'Hubbell' },
  ];

  const mfrList = manufacturers.length > 0 ? manufacturers : defaultManufacturers;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Create Official Product</h2>
              <p className="text-sm text-gray-500">Add a new product to the catalog</p>
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
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Part Number */}
            <div>
              <label className={labelClass}>Part Number *</label>
              <input
                type="text"
                value={formData.partNumber}
                onChange={(e) => handleFieldChange('partNumber', e.target.value)}
                className={errors.partNumber ? inputErrorClass : inputClass}
                placeholder="Enter part number (e.g., LED-2X4-40W)"
                autoFocus
              />
              {errors.partNumber && (
                <p className="mt-1 text-sm text-red-500">{errors.partNumber}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className={labelClass}>Description *</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                className={errors.description ? inputErrorClass : inputClass}
                placeholder="Enter product description"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            {/* Manufacturer */}
            <div>
              <label className={labelClass}>Manufacturer *</label>
              <div className="relative">
                <select
                  value={formData.manufacturer}
                  onChange={(e) => handleFieldChange('manufacturer', e.target.value)}
                  className={errors.manufacturer ? inputErrorClass : selectClass}
                >
                  <option value="">Select manufacturer</option>
                  {mfrList.map(mfr => (
                    <option key={mfr.id} value={mfr.name}>{mfr.name}</option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {errors.manufacturer && (
                <p className="mt-1 text-sm text-red-500">{errors.manufacturer}</p>
              )}
            </div>

            {/* Two columns */}
            <div className="grid grid-cols-2 gap-4">
              {/* Base Price */}
              <div>
                <label className={labelClass}>Base Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.basePrice || ''}
                    onChange={(e) => handleFieldChange('basePrice', parseFloat(e.target.value) || 0)}
                    className={`${inputClass} pl-7`}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* UOM */}
              <div>
                <label className={labelClass}>Unit of Measure</label>
                <div className="relative">
                  <select
                    value={formData.uom}
                    onChange={(e) => handleFieldChange('uom', e.target.value)}
                    className={selectClass}
                  >
                    <option value="EA">EA (Each)</option>
                    <option value="BOX">BOX</option>
                    <option value="CASE">CASE</option>
                    <option value="FT">FT (Feet)</option>
                    <option value="M">M (Meters)</option>
                    <option value="ROLL">ROLL</option>
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Lead Time */}
              <div>
                <label className={labelClass}>Lead Time (days)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.leadTime}
                  onChange={(e) => handleFieldChange('leadTime', e.target.value)}
                  className={inputClass}
                  placeholder="e.g., 14"
                />
              </div>

              {/* Commission Rate */}
              <div>
                <label className={labelClass}>Commission Rate</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.commissionRate}
                    onChange={(e) => handleFieldChange('commissionRate', e.target.value)}
                    className={`${inputClass} pr-8`}
                    placeholder="e.g., 10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                </div>
              </div>
            </div>
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
                Creating...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                </svg>
                Create Product
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
