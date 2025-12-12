'use client';

import React, { useState, useMemo } from 'react';

interface Product {
  id: string;
  partNumber: string;
  description: string;
  category: string;
  manufacturer: string;
  basePrice: number;
  commission10: number;
  commission8: number;
  commission5: number;
  status: 'active' | 'discontinued' | 'while_supplies_last';
  hasConfigurator: boolean;
}

interface ConfiguredProduct {
  baseProduct: Product;
  configuredPartNumber: string;
  selectedOptions: Record<string, string>;
  prices: {
    commission10: number;
    commission8: number;
    commission5: number;
  };
  quantity: number;
}

interface ProductConfiguratorModalProps {
  product: Product;
  onClose: () => void;
  onSave: (configuredProduct: ConfiguredProduct) => void;
}

// Configuration options based on the ALF product line from the image
const configurationSections = [
  {
    id: 'distribution',
    name: 'Distribution Type',
    description: 'Available with Type II, III, IV & V Distributions',
    options: [
      { id: 'T2', label: 'Type II', priceAdder: 0 },
      { id: 'T3', label: 'Type III', priceAdder: 0 },
      { id: 'T4', label: 'Type IV', priceAdder: 0 },
      { id: 'T5', label: 'Type V', priceAdder: 0 },
    ],
  },
  {
    id: 'finish',
    name: 'Finish',
    description: 'White/Silver Gray/Black finishes with T4/T5/FLF/all HVU models add $20',
    options: [
      { id: 'DB', label: 'Dark Bronze', priceAdder: 0 },
      { id: 'WH', label: 'White', priceAdder: 20 },
      { id: 'SG', label: 'Silver Gray', priceAdder: 20 },
      { id: 'BK', label: 'Black', priceAdder: 20 },
    ],
  },
  {
    id: 'mounting',
    name: 'Mounting Option',
    description: 'Select mounting bracket type',
    options: [
      { id: 'ASR', label: 'Adjustable Square & Round Pole Mounting', priceAdder: 28 },
      { id: 'SFD', label: 'Slipfitter Mounting', priceAdder: 28 },
      { id: 'NONE', label: 'No Mounting (Fixture Only)', priceAdder: 0 },
    ],
  },
  {
    id: 'photocell',
    name: 'Photocell',
    description: 'Twist-lock photocell options',
    options: [
      { id: 'NONE', label: 'No Photocell', priceAdder: 0 },
      { id: 'PC2', label: 'Photocell AC 480V, 10-15 Lx On, 30-40 Lx Off', priceAdder: 42 },
    ],
  },
  {
    id: 'glare_shield',
    name: 'Glare Shield',
    description: 'External glare shield options',
    options: [
      { id: 'NONE', label: 'No Glare Shield', priceAdder: 0 },
      { id: 'EGS-M', label: 'External Glare Shield - Medium', priceAdder: 10 },
      { id: 'EGS-L', label: 'External Glare Shield - Large', priceAdder: 12 },
    ],
  },
  {
    id: 'house_shield',
    name: 'House Side Shield',
    description: 'External house side shield options',
    options: [
      { id: 'NONE', label: 'No House Side Shield', priceAdder: 0 },
      { id: 'HGS-M', label: 'House Side Shield - Medium', priceAdder: 18 },
      { id: 'HGS-L', label: 'House Side Shield - Large', priceAdder: 23 },
    ],
  },
  {
    id: 'backlight',
    name: 'Backlight Control',
    description: 'Backlight control shield (1pc for Medium, 2pc for Large)',
    options: [
      { id: 'NONE', label: 'No Backlight Control', priceAdder: 0 },
      { id: 'BLS', label: 'Backlight Control Shield', priceAdder: 12 },
    ],
  },
  {
    id: 'motion_sensor',
    name: 'Motion Sensor',
    description: 'DC fixture external motion sensor with daylight harvest',
    options: [
      { id: 'NONE', label: 'No Motion Sensor', priceAdder: 0 },
      { id: 'MS-DCE', label: 'Motion Sensor with 39ft High Bay Lens', priceAdder: 23 },
      { id: 'MS-DCE-RM', label: 'Motion Sensor with Remote', priceAdder: 55 },
    ],
  },
];

export default function ProductConfiguratorModal({ product, onClose, onSave }: ProductConfiguratorModalProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    configurationSections.forEach(section => {
      defaults[section.id] = section.options[0].id;
    });
    return defaults;
  });
  const [quantity, setQuantity] = useState(1);
  const [productName, setProductName] = useState('');

  const pricing = useMemo(() => {
    // Calculate price adders from selected options
    let totalAdders = 0;
    configurationSections.forEach(section => {
      const selectedOption = section.options.find(opt => opt.id === selectedOptions[section.id]);
      if (selectedOption) {
        totalAdders += selectedOption.priceAdder;
      }
    });

    // Calculate prices for all commission levels
    return {
      totalAdders,
      commission10: product.commission10 + totalAdders,
      commission8: product.commission8 + totalAdders,
      commission5: product.commission5 + totalAdders,
    };
  }, [product, selectedOptions]);

  const configuredPartNumber = useMemo(() => {
    const parts = [product.partNumber];
    configurationSections.forEach(section => {
      const selected = selectedOptions[section.id];
      if (selected && selected !== 'NONE') {
        parts.push(selected);
      }
    });
    return parts.join('-');
  }, [product.partNumber, selectedOptions]);

  const handleOptionChange = (sectionId: string, optionId: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [sectionId]: optionId,
    }));
  };

  const handleSave = () => {
    const configuredProduct: ConfiguredProduct = {
      baseProduct: product,
      configuredPartNumber: productName || configuredPartNumber,
      selectedOptions,
      prices: {
        commission10: pricing.commission10,
        commission8: pricing.commission8,
        commission5: pricing.commission5,
      },
      quantity,
    };
    onSave(configuredProduct);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--muted)]/30">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Product Configurator</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Configure {product.partNumber}</p>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex">
            {/* Configuration Options */}
            <div className="flex-1 p-6 space-y-6 border-r border-[var(--border)]">
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Base Product</h3>
                <div className="bg-[var(--muted)]/30 rounded-lg p-4">
                  <div className="font-medium text-[var(--foreground)]">{product.partNumber}</div>
                  <div className="text-sm text-[var(--muted-foreground)] mt-1">{product.description}</div>
                </div>
              </div>

              {/* Commission Level Pricing - Informational */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Commission Pricing</h3>
                <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
                  <div className="grid grid-cols-3 border-b border-[var(--border)] bg-[var(--muted)]/50">
                    <div className="px-4 py-2 text-xs font-semibold text-[var(--muted-foreground)] text-center">10% Commission</div>
                    <div className="px-4 py-2 text-xs font-semibold text-[var(--muted-foreground)] text-center border-x border-[var(--border)]">8% Commission</div>
                    <div className="px-4 py-2 text-xs font-semibold text-[var(--muted-foreground)] text-center">5% Commission</div>
                  </div>
                  <div className="grid grid-cols-3">
                    <div className="px-4 py-3 text-center">
                      <span className="text-sm font-semibold text-[var(--foreground)]">{formatCurrency(pricing.commission10)}</span>
                    </div>
                    <div className="px-4 py-3 text-center border-x border-[var(--border)]">
                      <span className="text-sm font-semibold text-[var(--foreground)]">{formatCurrency(pricing.commission8)}</span>
                    </div>
                    <div className="px-4 py-3 text-center">
                      <span className="text-sm font-semibold text-[var(--foreground)]">{formatCurrency(pricing.commission5)}</span>
                    </div>
                  </div>
                </div>
                {pricing.totalAdders > 0 && (
                  <p className="text-xs text-[var(--muted-foreground)] mt-2">
                    Includes {formatCurrency(pricing.totalAdders)} in option adders
                  </p>
                )}
              </div>

              {/* Configuration Sections */}
              {configurationSections.map((section) => (
                <div key={section.id}>
                  <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">{section.name}</h3>
                  <p className="text-xs text-[var(--muted-foreground)] mb-3">{section.description}</p>
                  <div className="space-y-2">
                    {section.options.map((option) => (
                      <label
                        key={option.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedOptions[section.id] === option.id
                            ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                            : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name={section.id}
                            checked={selectedOptions[section.id] === option.id}
                            onChange={() => handleOptionChange(section.id, option.id)}
                            className="w-4 h-4 text-[var(--primary)]"
                          />
                          <span className="text-sm text-[var(--foreground)]">{option.label}</span>
                        </div>
                        {option.priceAdder > 0 && (
                          <span className="text-sm font-medium text-green-600">+{formatCurrency(option.priceAdder)}</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Panel */}
            <div className="w-80 p-6 bg-[var(--muted)]/20">
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Configuration Summary</h3>

              {/* Configured Part Number */}
              <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4 mb-4">
                <div className="text-xs text-[var(--muted-foreground)] mb-1">Configured Part Number</div>
                <div className="text-sm font-mono font-medium text-[var(--foreground)] break-all">
                  {configuredPartNumber}
                </div>
              </div>

              {/* Custom Name */}
              <div className="mb-4">
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">Custom Product Name (Optional)</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Enter custom name..."
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                />
              </div>

              {/* Selected Options */}
              <div className="space-y-2 mb-4">
                <div className="text-xs text-[var(--muted-foreground)] font-semibold uppercase">Selected Options</div>
                {configurationSections.map((section) => {
                  const selected = section.options.find(opt => opt.id === selectedOptions[section.id]);
                  if (!selected || selected.id === 'NONE') return null;
                  return (
                    <div key={section.id} className="flex justify-between text-sm">
                      <span className="text-[var(--muted-foreground)]">{section.name}</span>
                      <span className="text-[var(--foreground)]">{selected.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Quantity */}
              <div className="mb-4">
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                />
              </div>

              {/* Pricing Summary */}
              <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
                <div className="px-4 py-2 bg-[var(--muted)]/50 border-b border-[var(--border)]">
                  <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Pricing Summary</span>
                </div>
                <div className="p-4 space-y-3">
                  {pricing.totalAdders > 0 && (
                    <div className="flex justify-between text-sm pb-3 border-b border-[var(--border)]">
                      <span className="text-[var(--muted-foreground)]">Options Added</span>
                      <span className="text-green-600 font-medium">+{formatCurrency(pricing.totalAdders)}</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--muted-foreground)]">10% Commission</span>
                      <span className="font-semibold text-[var(--foreground)]">{formatCurrency(pricing.commission10 * quantity)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--muted-foreground)]">8% Commission</span>
                      <span className="font-semibold text-[var(--foreground)]">{formatCurrency(pricing.commission8 * quantity)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--muted-foreground)]">5% Commission</span>
                      <span className="font-semibold text-[var(--foreground)]">{formatCurrency(pricing.commission5 * quantity)}</span>
                    </div>
                  </div>
                  {quantity > 1 && (
                    <p className="text-xs text-[var(--muted-foreground)] pt-2 border-t border-[var(--border)]">
                      Prices shown for {quantity} units
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between bg-[var(--muted)]/30">
          <div className="text-sm text-[var(--muted-foreground)]">
            Configure options and save as a new product
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
