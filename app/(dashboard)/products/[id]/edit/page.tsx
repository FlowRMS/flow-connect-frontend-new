'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProductConfiguratorModal from '../../../../../components/products/ProductConfiguratorModal';
import AliasesModal, { ProductAlias } from '../../../../../components/AliasesModal';
import type {
  Product,
  ProductPricingTier,
  CustomerPartNumber,
  ProductFile,
  ProductNote,
  ProductActivity,
} from '../../../../../lib/types/rms';

// Product type for configurator modal
interface ConfiguratorProduct {
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

// Spec Sheet interface
interface SpecSheet {
  id: string;
  name: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  uploadedBy: string;
}

// Manufacturer Price History interface
interface ManufacturerPriceHistory {
  id: string;
  date: string;
  price10: number;
  price8: number;
  price5: number;
  changePercent: number;
  effectiveDate: string;
  notes?: string;
}

// Quote Price History interface
interface QuotePriceHistory {
  id: string;
  quoteNumber: string;
  quoteDate: string;
  customer: string;
  project: string;
  quotedPrice: number;
  commissionLevel: '10%' | '8%' | '5%';
  quantity: number;
  status: 'won' | 'lost' | 'pending' | 'expired';
  competitorPrice?: number;
  notes?: string;
}

// Configuration interface
interface ProductConfiguration {
  id: string;
  partNumber: string;
  description: string;
  configuredOptions: string;
  createdAt: string;
  createdBy: string;
}

// Extended Product type with all related data
interface ProductWithRelations extends Product {
  customerPartNumbers?: CustomerPartNumber[];
  pricingTiers?: ProductPricingTier[];
  files?: ProductFile[];
  notes?: ProductNote[];
  activities?: ProductActivity[];
  commission10?: number;
  commission8?: number;
  commission5?: number;
  specSheets?: SpecSheet[];
  manufacturerPriceHistory?: ManufacturerPriceHistory[];
  quotePriceHistory?: QuotePriceHistory[];
  hasConfigurator?: boolean;
  status?: 'active' | 'discontinued' | 'while_supplies_last';
  // Configuration-related fields
  isConfiguredProduct?: boolean;
  baseProductId?: string;
  baseProductPartNumber?: string;
  configurations?: ProductConfiguration[];
  tags?: string[];
  // Quote-level product fields
  isQuoteLevelProduct?: boolean;
  linkedQuoteId?: string;
  linkedQuoteNumber?: string;
  // Document-specific product flag
  isDocumentSpecific?: boolean;
  // Default divisor
  defaultDivisor?: number;
  // Aliases
  aliases?: ProductAlias[];
}

// Mock data for dropdowns
const mockFactories = [
  { id: 'southern-grounding', name: 'Southern Grounding' },
  { id: 'alf', name: 'ALF' },
  { id: 'acme', name: 'Acme Lighting' },
];

const mockCategories = [
  { id: 'area-lights', name: 'Area Lights' },
  { id: 'accessories', name: 'Accessories' },
  { id: 'controls', name: 'Controls' },
  { id: 'ground-rod', name: 'GROUND ROD' },
];

const mockParentCategories = [
  { id: 'outdoor-lighting', name: 'Outdoor Lighting' },
  { id: 'mounting', name: 'Mounting' },
  { id: 'lighting-controls', name: 'Lighting Controls' },
  { id: 'shields', name: 'Shields' },
  { id: 'sensors', name: 'Sensors' },
  { id: 'remotes', name: 'Remotes' },
  { id: 'grounding', name: 'Grounding' },
];

const mockGrandparentCategories = [
  { id: 'lighting', name: 'Lighting' },
  { id: 'hardware', name: 'Hardware' },
  { id: 'electronics', name: 'Electronics' },
  { id: 'electrical', name: 'Electrical' },
];

const mockCustomers = [
  { id: 'a', name: 'A' },
  { id: 'acker-ec', name: 'ACKER EC' },
  { id: 'demo-plc', name: 'demoPLC 1755200792.651914' },
];

// Mock spec sheets data
const mockSpecSheets: SpecSheet[] = [
  {
    id: 'spec-1',
    name: 'Product Specification Sheet',
    fileName: 'ALF-LS600-spec-sheet.pdf',
    fileSize: '2.4 MB',
    uploadedAt: '2024-08-15',
    uploadedBy: 'John Smith',
  },
  {
    id: 'spec-2',
    name: 'Installation Guide',
    fileName: 'ALF-LS600-installation.pdf',
    fileSize: '1.8 MB',
    uploadedAt: '2024-08-10',
    uploadedBy: 'John Smith',
  },
  {
    id: 'spec-3',
    name: 'IES Photometric Data',
    fileName: 'ALF-LS600-ies-data.zip',
    fileSize: '856 KB',
    uploadedAt: '2024-07-20',
    uploadedBy: 'Sarah Johnson',
  },
];

// Mock manufacturer price history
const mockManufacturerPriceHistory: ManufacturerPriceHistory[] = [
  {
    id: 'mfr-1',
    date: '2024-10-01',
    price10: 320.00,
    price8: 310.00,
    price5: 301.00,
    changePercent: 3.2,
    effectiveDate: '2024-10-01',
    notes: 'Annual price increase',
  },
  {
    id: 'mfr-2',
    date: '2024-04-01',
    price10: 310.00,
    price8: 300.50,
    price5: 291.75,
    changePercent: 0,
    effectiveDate: '2024-04-01',
  },
  {
    id: 'mfr-3',
    date: '2024-01-15',
    price10: 310.00,
    price8: 300.50,
    price5: 291.75,
    changePercent: -2.5,
    effectiveDate: '2024-01-15',
    notes: 'Promotional pricing',
  },
  {
    id: 'mfr-4',
    date: '2023-10-01',
    price10: 318.00,
    price8: 308.25,
    price5: 299.25,
    changePercent: 4.0,
    effectiveDate: '2023-10-01',
    notes: 'Annual price increase',
  },
  {
    id: 'mfr-5',
    date: '2023-04-01',
    price10: 305.75,
    price8: 296.25,
    price5: 287.75,
    changePercent: 0,
    effectiveDate: '2023-04-01',
  },
];

// Mock quote price history
const mockQuotePriceHistory: QuotePriceHistory[] = [
  {
    id: 'quote-1',
    quoteNumber: 'Q-2024-1542',
    quoteDate: '2024-11-28',
    customer: 'Metro Construction Co.',
    project: 'Downtown Office Complex',
    quotedPrice: 315.00,
    commissionLevel: '8%',
    quantity: 48,
    status: 'pending',
  },
  {
    id: 'quote-2',
    quoteNumber: 'Q-2024-1489',
    quoteDate: '2024-11-15',
    customer: 'Greenfield Development',
    project: 'Parking Structure Lighting',
    quotedPrice: 305.00,
    commissionLevel: '5%',
    quantity: 120,
    status: 'won',
    notes: 'Volume discount applied',
  },
  {
    id: 'quote-3',
    quoteNumber: 'Q-2024-1423',
    quoteDate: '2024-10-22',
    customer: 'City of Riverside',
    project: 'Municipal Parking Lot',
    quotedPrice: 325.00,
    commissionLevel: '10%',
    quantity: 36,
    status: 'lost',
    competitorPrice: 298.00,
    notes: 'Lost to Acuity - price too high',
  },
  {
    id: 'quote-4',
    quoteNumber: 'Q-2024-1367',
    quoteDate: '2024-09-18',
    customer: 'Harbor Industrial Park',
    project: 'Warehouse Exterior',
    quotedPrice: 310.00,
    commissionLevel: '8%',
    quantity: 64,
    status: 'won',
  },
  {
    id: 'quote-5',
    quoteNumber: 'Q-2024-1298',
    quoteDate: '2024-08-30',
    customer: 'Sunrise Medical Center',
    project: 'Emergency Entrance',
    quotedPrice: 320.00,
    commissionLevel: '10%',
    quantity: 24,
    status: 'expired',
  },
  {
    id: 'quote-6',
    quoteNumber: 'Q-2024-1156',
    quoteDate: '2024-07-12',
    customer: 'Tech Campus LLC',
    project: 'Building A Perimeter',
    quotedPrice: 308.00,
    commissionLevel: '8%',
    quantity: 86,
    status: 'won',
  },
  {
    id: 'quote-7',
    quoteNumber: 'Q-2024-1089',
    quoteDate: '2024-06-05',
    customer: 'Retail Plaza Partners',
    project: 'Shopping Center Parking',
    quotedPrice: 322.00,
    commissionLevel: '10%',
    quantity: 42,
    status: 'lost',
    competitorPrice: 310.00,
    notes: 'Customer went with incumbent supplier',
  },
];

type TabId = 'overview' | 'customer-part-numbers' | 'configurations' | 'quantity-pricing' | 'manufacturer-pricing' | 'weights-measures' | 'quote-history' | 'files' | 'notes';

// Mock configurations data
const mockConfigurations: ProductConfiguration[] = [
  {
    id: 'config-1',
    partNumber: 'ALF-LS600-T3-G1-FSK-PSC-ASR-CFG1',
    description: 'LED Street Light - 60W, Type III, Generation 1, Fuse, Photocell, ASR',
    configuredOptions: 'Wattage: 60W, Distribution: Type III, Dimming: 0-10V',
    createdAt: '2024-11-15',
    createdBy: 'John Smith',
  },
  {
    id: 'config-2',
    partNumber: 'ALF-LS600-T3-G1-FSK-PSC-ASR-CFG2',
    description: 'LED Street Light - 80W, Type V, Generation 1, Fuse, Photocell',
    configuredOptions: 'Wattage: 80W, Distribution: Type V, Dimming: DALI',
    createdAt: '2024-10-22',
    createdBy: 'Sarah Johnson',
  },
  {
    id: 'config-3',
    partNumber: 'ALF-LS600-T3-G1-FSK-PSC-ASR-CFG3',
    description: 'LED Street Light - 100W, Type II, Generation 2',
    configuredOptions: 'Wattage: 100W, Distribution: Type II, Color: 4000K',
    createdAt: '2024-09-18',
    createdBy: 'Mike Wilson',
  },
];

const UOM_OPTIONS = ['ea', 'box', 'case', 'pallet', 'roll', 'ft', 'lb', 'kg'];
const WEIGHT_UOM_OPTIONS = ['LB', 'KG', 'OZ', 'G'];
const LENGTH_UOM_OPTIONS = ['IN', 'FT', 'CM', 'M'];
const VOLUME_UOM_OPTIONS = ['CUBIC_IN', 'CUBIC_FT', 'CUBIC_CM', 'CUBIC_M'];

export default function ProductEditPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showAddSpecSheet, setShowAddSpecSheet] = useState(false);
  const [showConfiguratorModal, setShowConfiguratorModal] = useState(false);
  const [showAliasesModal, setShowAliasesModal] = useState(false);
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
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
    tags: [],
    aliases: [],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Section refs for scroll-to functionality
  const sectionRefs = useRef<Record<TabId, HTMLDivElement | null>>({
    'overview': null,
    'customer-part-numbers': null,
    'configurations': null,
    'quantity-pricing': null,
    'manufacturer-pricing': null,
    'weights-measures': null,
    'quote-history': null,
    'files': null,
    'notes': null,
  });

  // Reference to the scrollable container
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToSection = useCallback((tabId: TabId) => {
    const section = sectionRefs.current[tabId];
    const container = scrollContainerRef.current;
    if (section && container) {
      const headerOffset = 20; // Small offset from top of scroll area
      const sectionTop = section.offsetTop - headerOffset;

      container.scrollTo({
        top: sectionTop,
        behavior: 'smooth'
      });
    }
    setActiveTab(tabId);
  }, []);

  // Scroll spy - update active tab based on scroll position
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const tabIds: TabId[] = [
      'overview',
      'customer-part-numbers',
      'configurations',
      'quantity-pricing',
      'manufacturer-pricing',
      'weights-measures',
      'quote-history',
      'files',
      'notes',
    ];

    const handleScroll = () => {
      const scrollTop = container.scrollTop;

      // Find which section is currently in view
      let currentSection: TabId = 'overview';

      for (const tabId of tabIds) {
        const section = sectionRefs.current[tabId];
        if (section) {
          // Get section's position relative to the scroll container
          const sectionTop = section.offsetTop;
          // If we've scrolled past this section's top (with some buffer), it's the current one
          if (scrollTop >= sectionTop - 100) {
            currentSection = tabId;
          }
        }
      }

      setActiveTab(currentSection);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    // Run once on mount to set initial active tab
    handleScroll();
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isLoading]); // Re-run when loading completes so refs are populated

  // Load product data
  useEffect(() => {
    // In a real app, this would fetch from API
    // For now, load mock data based on productId
    const mockProduct: ProductWithRelations = {
      id: productId,
      manufacturerId: 'southern-grounding',
      manufacturerName: 'Southern Grounding',
      partNumber: 'ZZ588',
      description: 'Rod,ground Galvanized 5/8"X8\'. High-quality galvanized steel ground rod designed for electrical grounding applications. Features durable construction with corrosion-resistant coating for long-lasting performance in various soil conditions.',
      unitPrice: 10,
      standardCommissionRate: 0.05,
      warehouseCommissionRate: 0.03,
      commissionDiscountRate: 0,
      category: 'GROUND ROD',
      categoryId: 'ground-rod',
      parentCategory: 'Grounding',
      parentCategoryId: 'grounding',
      grandparentCategory: 'Electrical',
      grandparentCategoryId: 'electrical',
      uom: 'ea',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Commission pricing from manufacturer
      commission10: 320.00,
      commission8: 310.00,
      commission5: 301.00,
      customerPartNumbers: [
        { id: '1', productId, customerId: 'a', customerName: 'A', customerPartNumber: 'test', priceOverride: 0, commissionRate: 0 },
        { id: '2', productId, customerId: 'acker-ec', customerName: 'ACKER EC', customerPartNumber: 'test123', priceOverride: 0, commissionRate: 0 },
        { id: '3', productId, customerId: 'demo-plc', customerName: 'demoPLC 1755200792.651914', customerPartNumber: 'test', priceOverride: 12, commissionRate: 0.015 },
      ],
      pricingTiers: [
        { id: '1', productId, minQuantity: 1, maxQuantity: 2, unitPrice: 2 },
        { id: '2', productId, minQuantity: 3, maxQuantity: 4, unitPrice: 1.9 },
        { id: '3', productId, minQuantity: 5, maxQuantity: 6, unitPrice: 1.8 },
        { id: '4', productId, minQuantity: 7, maxQuantity: 8, unitPrice: 1.7 },
      ],
      notes: [
        { id: '1', productId, content: 'Sample product note', createdAt: new Date().toISOString(), createdBy: 'Admin' },
      ],
      weightUom: 'LB',
      lengthUom: 'IN',
      volumeUom: 'CUBIC_IN',
      specSheets: mockSpecSheets,
      manufacturerPriceHistory: mockManufacturerPriceHistory,
      quotePriceHistory: mockQuotePriceHistory,
      // Check if this is a configurable product (ALF products have configurator)
      hasConfigurator: productId.startsWith('ALF'),
      status: 'active',
      // Configuration-related fields
      isConfiguredProduct: false,
      configurations: productId.startsWith('ALF') ? mockConfigurations : [],
      // Default divisor
      defaultDivisor: 1,
      // Quote-level product fields (simulate for demo - products starting with 'Q' are quote-level)
      isQuoteLevelProduct: productId.startsWith('Q'),
      linkedQuoteId: productId.startsWith('Q') ? 'quote-12345' : undefined,
      linkedQuoteNumber: productId.startsWith('Q') ? 'Q-2024-00123' : undefined,
      // Mock aliases
      aliases: [
        { id: 'alias-1', type: 'part_number', value: 'ZZ-588', createdAt: '2024-06-15T10:00:00Z', createdBy: 'John Smith' },
        { id: 'alias-2', type: 'part_number', value: 'GR-588-GAL', createdAt: '2024-05-20T14:30:00Z', createdBy: 'Admin' },
        { id: 'alias-3', type: 'description', value: 'Ground Rod 5/8" x 8ft Galvanized', createdAt: '2024-04-10T09:15:00Z', createdBy: 'Sarah Johnson' },
      ],
    };
    setFormData(mockProduct);
    setIsLoading(false);
  }, [productId]);

  const handleFieldChange = (field: keyof ProductWithRelations, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In a real app, this would call an API
      console.log('Saving product:', formData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push('/products');
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

  // Alias management functions
  const addProductAlias = (alias: Omit<ProductAlias, 'id' | 'createdAt'> | Omit<import('../../../../../components/AliasesModal').CompanyAlias, 'id' | 'createdAt'>) => {
    // Only handle ProductAlias since this is a product page
    if ('value' in alias && ('type' in alias && (alias.type === 'part_number' || alias.type === 'description'))) {
      const newAlias: ProductAlias = {
        ...(alias as Omit<ProductAlias, 'id' | 'createdAt'>),
        id: `alias-${Date.now()}`,
        createdAt: new Date().toISOString(),
        createdBy: 'Current User',
      };
      setFormData(prev => ({
        ...prev,
        aliases: [...(prev.aliases || []), newAlias],
      }));
    }
  };

  const deleteProductAlias = (aliasId: string) => {
    setFormData(prev => ({
      ...prev,
      aliases: (prev.aliases || []).filter(a => a.id !== aliasId),
    }));
  };

  // Use mock data if not available from formData
  const specSheets = formData.specSheets || mockSpecSheets;
  const manufacturerPriceHistory = formData.manufacturerPriceHistory || mockManufacturerPriceHistory;
  const quotePriceHistory = formData.quotePriceHistory || mockQuotePriceHistory;

  // Format helpers
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getQuoteStatusBadge = (status: QuotePriceHistory['status']) => {
    switch (status) {
      case 'won':
        return 'bg-green-100 text-green-700';
      case 'lost':
        return 'bg-red-100 text-red-700';
      case 'pending':
        return 'bg-blue-100 text-blue-700';
      case 'expired':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Calculate quote stats
  const quoteStats = {
    total: quotePriceHistory.length,
    won: quotePriceHistory.filter(q => q.status === 'won').length,
    lost: quotePriceHistory.filter(q => q.status === 'lost').length,
    pending: quotePriceHistory.filter(q => q.status === 'pending').length,
    winRate: quotePriceHistory.filter(q => q.status === 'won' || q.status === 'lost').length > 0
      ? Math.round((quotePriceHistory.filter(q => q.status === 'won').length / quotePriceHistory.filter(q => q.status === 'won' || q.status === 'lost').length) * 100)
      : 0,
    avgWinPrice: quotePriceHistory.filter(q => q.status === 'won').length > 0
      ? quotePriceHistory.filter(q => q.status === 'won').reduce((sum, q) => sum + q.quotedPrice, 0) / quotePriceHistory.filter(q => q.status === 'won').length
      : 0,
    avgLossPrice: quotePriceHistory.filter(q => q.status === 'lost').length > 0
      ? quotePriceHistory.filter(q => q.status === 'lost').reduce((sum, q) => sum + q.quotedPrice, 0) / quotePriceHistory.filter(q => q.status === 'lost').length
      : 0,
  };

  // Only show configurations tab for base products with configurator
  const showConfigurationsTab = formData.hasConfigurator && !formData.isConfiguredProduct;

  const tabs = [
    { id: 'overview' as TabId, label: 'Overview', count: null },
    { id: 'customer-part-numbers' as TabId, label: 'Customer Part Numbers', count: formData.customerPartNumbers?.length || 0 },
    ...(showConfigurationsTab ? [{ id: 'configurations' as TabId, label: 'Configurations', count: formData.configurations?.length || 0 }] : []),
    { id: 'quantity-pricing' as TabId, label: 'Quantity Pricing', count: formData.pricingTiers?.length || 0 },
    { id: 'manufacturer-pricing' as TabId, label: 'Manufacturer Pricing', count: null },
    { id: 'weights-measures' as TabId, label: 'Weights & Measures', count: null },
    { id: 'quote-history' as TabId, label: `Quote History`, count: quotePriceHistory.length },
    { id: 'files' as TabId, label: 'Files', count: (formData.files?.length || 0) + specSheets.length },
    { id: 'notes' as TabId, label: 'Notes', count: formData.notes?.length || 0 },
  ];

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
  const selectClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer";

  // Helper to select all text on focus
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  if (isLoading) {
    return (
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </main>
    );
  }

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
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-gray-900">
                  {formData.description
                    ? formData.description.length > 50
                      ? `${formData.description.slice(0, 50)}...`
                      : formData.description
                    : 'Untitled Product'}
                </h1>
                <div className="relative group">
                  <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="absolute left-0 top-full mt-1 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    Product name defaults to the first 255 characters of the description
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500">{formData.partNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {formData.hasConfigurator && (
              <button
                onClick={() => setShowConfiguratorModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round"/>
                </svg>
                Configurator
              </button>
            )}
            <button
              onClick={() => router.push('/products')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
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
              {tab.count !== null && tab.count > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'
                }`}>
                  {tab.count}
                </span>
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

          {/* Product Settings - Side by Side Toggles */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Document-Specific Product Toggle */}
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Document-Specific Product</span>
                  <div className="relative group">
                    <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-64 z-50">
                      When enabled, this product will be excluded from searches and matching when creating quotes, orders, and invoices.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleFieldChange('isDocumentSpecific', !formData.isDocumentSpecific)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.isDocumentSpecific ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isDocumentSpecific ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Warehouse Consignment Toggle */}
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Warehouse Consignment</span>
                  <div className="relative group">
                    <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-64 z-50">
                      When enabled, this product will be available in the Warehouse module for inventory management and fulfillment.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleFieldChange('isWarehouseConsignment', !formData.isWarehouseConsignment)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.isWarehouseConsignment ? 'bg-teal-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isWarehouseConsignment ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Basic Info Fields */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            {/* Quote-Level Product Banner */}
            {formData.isQuoteLevelProduct && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-amber-800">Quote-Level Product</span>
                        <div className="relative group">
                          <svg className="w-4 h-4 text-amber-600 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                            Quote-level products are not used in matching when uploading<br />new data or when searching for products to put into quotes.
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </div>
                      {formData.linkedQuoteId && (
                        <p className="text-sm text-amber-700 mt-0.5">
                          Linked to Quote:{' '}
                          <a
                            href={`/quotes?id=${formData.linkedQuoteId}`}
                            className="font-medium text-amber-800 hover:underline"
                          >
                            {formData.linkedQuoteNumber || formData.linkedQuoteId}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleFieldChange('isQuoteLevelProduct', false);
                      handleFieldChange('linkedQuoteId', undefined);
                      handleFieldChange('linkedQuoteNumber', undefined);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Convert to Manufacturer Product
                  </button>
                </div>
              </div>
            )}

            {/* Document-Specific Product Banner */}
            {formData.isDocumentSpecific && (
              <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-purple-800">Document-Specific Product</span>
                        <div className="relative group">
                          <svg className="w-4 h-4 text-purple-600 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                            Document-specific products are excluded from searches and<br />matching when creating quotes, orders, and invoices.
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-purple-700 mt-0.5">
                        This product will not appear in product searches or data matching
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFieldChange('isDocumentSpecific', false)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Convert to Full Product
                  </button>
                </div>
              </div>
            )}

            {/* Product Identification */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700">Part Number*</label>
                  <button
                    type="button"
                    onClick={() => setShowAliasesModal(true)}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Aliases ({formData.aliases?.length || 0})
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.partNumber}
                  onChange={(e) => handleFieldChange('partNumber', e.target.value)}
                  onFocus={handleInputFocus}
                  className={inputClass}
                  placeholder="Enter part number"
                />
              </div>
              <div>
                <label className={labelClass}>UPC</label>
                <input
                  type="text"
                  value={formData.upc || ''}
                  onChange={(e) => handleFieldChange('upc', e.target.value)}
                  onFocus={handleInputFocus}
                  className={inputClass}
                  placeholder="Universal Product Code"
                />
              </div>
              <div>
                <label className={labelClass}>Lead Time (Days)</label>
                <input
                  type="number"
                  value={formData.leadTimeDays || ''}
                  onChange={(e) => handleFieldChange('leadTimeDays', e.target.value ? parseInt(e.target.value) : undefined)}
                  onFocus={handleInputFocus}
                  className={inputClass}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Classification */}
            <div className="grid grid-cols-7 gap-4 mb-6">
              <div>
                <label className={labelClass}>Factory*</label>
                <div className="relative">
                  <select
                    value={formData.manufacturerId}
                    onChange={(e) => {
                      const factory = mockFactories.find(f => f.id === e.target.value);
                      handleFieldChange('manufacturerId', e.target.value);
                      if (factory) handleFieldChange('manufacturerName', factory.name);
                    }}
                    className={selectClass}
                  >
                    <option value="">Select factory</option>
                    {mockFactories.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div>
                <label className={labelClass}>Grandparent Category</label>
                <div className="relative">
                  <select
                    value={formData.grandparentCategoryId || ''}
                    onChange={(e) => {
                      const grandparentCategory = mockGrandparentCategories.find(c => c.id === e.target.value);
                      handleFieldChange('grandparentCategoryId', e.target.value);
                      if (grandparentCategory) handleFieldChange('grandparentCategory', grandparentCategory.name);
                    }}
                    className={selectClass}
                  >
                    <option value="">Select grandparent category</option>
                    {mockGrandparentCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div>
                <label className={labelClass}>Parent Category</label>
                <div className="relative">
                  <select
                    value={formData.parentCategoryId || ''}
                    onChange={(e) => {
                      const parentCategory = mockParentCategories.find(c => c.id === e.target.value);
                      handleFieldChange('parentCategoryId', e.target.value);
                      if (parentCategory) handleFieldChange('parentCategory', parentCategory.name);
                    }}
                    className={selectClass}
                  >
                    <option value="">Select parent category</option>
                    {mockParentCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div>
                <label className={labelClass}>Category</label>
                <div className="relative">
                  <select
                    value={formData.categoryId || ''}
                    onChange={(e) => {
                      const category = mockCategories.find(c => c.id === e.target.value);
                      handleFieldChange('categoryId', e.target.value);
                      if (category) handleFieldChange('category', category.name);
                    }}
                    className={selectClass}
                  >
                    <option value="">Select category</option>
                    {mockCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div>
                <label className={labelClass}>Default UOM</label>
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
                <label className={labelClass}>Default Divisor</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.defaultDivisor || ''}
                  onChange={(e) => handleFieldChange('defaultDivisor', e.target.value ? parseFloat(e.target.value) : undefined)}
                  onFocus={handleInputFocus}
                  className={inputClass}
                  placeholder="1"
                />
              </div>
              <div>
                <label className={labelClass}>Min Order Qty</label>
                <input
                  type="number"
                  value={formData.minOrderQty || ''}
                  onChange={(e) => handleFieldChange('minOrderQty', e.target.value ? parseInt(e.target.value) : undefined)}
                  onFocus={handleInputFocus}
                  className={inputClass}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Description - Full Width */}
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
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div>
                <label className={labelClass}>Unit Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.unitPrice || ''}
                  onChange={(e) => handleFieldChange('unitPrice', parseFloat(e.target.value) || 0)}
                  onFocus={handleInputFocus}
                  className={inputClass}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className={labelClass}>Cost</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost || ''}
                  onChange={(e) => handleFieldChange('cost', e.target.value ? parseFloat(e.target.value) : undefined)}
                  onFocus={handleInputFocus}
                  className={inputClass}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className={labelClass}>Unit Price Discount %</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.unitPriceDiscountRate != null ? (formData.unitPriceDiscountRate * 100).toFixed(1) : ''}
                  onChange={(e) => handleFieldChange('unitPriceDiscountRate', e.target.value ? parseFloat(e.target.value) / 100 : undefined)}
                  onFocus={handleInputFocus}
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
                  onFocus={handleInputFocus}
                  className={inputClass}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Commission Discount */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div>
                <label className={labelClass}>Commission Discount %</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.commissionDiscountRate != null ? (formData.commissionDiscountRate * 100).toFixed(1) : ''}
                  onChange={(e) => handleFieldChange('commissionDiscountRate', e.target.value ? parseFloat(e.target.value) / 100 : undefined)}
                  onFocus={handleInputFocus}
                  className={inputClass}
                  placeholder="0"
                />
              </div>
              <div>
                <label className={labelClass}>Approval Date</label>
                <input
                  type="date"
                  value={formData.approvalDate || ''}
                  onChange={(e) => handleFieldChange('approvalDate', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Approval Comments</label>
                <input
                  type="text"
                  value={formData.approvalComments || ''}
                  onChange={(e) => handleFieldChange('approvalComments', e.target.value)}
                  onFocus={handleInputFocus}
                  className={inputClass}
                  placeholder="Enter approval comments"
                />
              </div>
            </div>
          </div>

          {/* Tags Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2 min-h-[42px] p-3 border border-gray-200 rounded-lg bg-gray-50">
              {formData.tags && formData.tags.length > 0 ? (
                <>
                  {formData.tags.map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {tag}
                      <button
                        onClick={() => {
                          const newTags = formData.tags?.filter((_, i) => i !== idx) || [];
                          handleFieldChange('tags', newTags);
                        }}
                        className="ml-1 text-blue-500 hover:text-blue-700"
                      >
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </span>
                  ))}
                </>
              ) : (
                <span className="text-gray-400 text-sm">No tags</span>
              )}
              <button
                onClick={() => setShowAddTagModal(true)}
                className="inline-flex items-center gap-1 px-2 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                </svg>
                Add tag
              </button>
            </div>
          </div>

        </div>

        {/* ============ CUSTOMER PART NUMBERS SECTION ============ */}
        <div ref={el => { sectionRefs.current['customer-part-numbers'] = el; }} id="section-customer-part-numbers">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Part Numbers</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
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
                            const customer = mockCustomers.find(c => c.id === e.target.value);
                            updateCustomerPartNumber(index, 'customerId', e.target.value);
                            if (customer) updateCustomerPartNumber(index, 'customerName', customer.name);
                          }}
                          className={selectClass}
                        >
                          <option value="">Select customer</option>
                          {mockCustomers.map(c => (
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
                          value={item.commissionRate != null ? (item.commissionRate * 100).toFixed(1) : ''}
                          onChange={(e) => updateCustomerPartNumber(index, 'commissionRate', e.target.value ? parseFloat(e.target.value) / 100 : 0)}
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
          </div>
        </div>

        {/* ============ CONFIGURATIONS SECTION ============ */}
        {showConfigurationsTab && (
          <div ref={el => { sectionRefs.current['configurations'] = el; }} id="section-configurations">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Configurations</h2>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  Configured products created from this base product
                </p>
                <button
                  onClick={() => setShowConfiguratorModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 4v16m8-8H4" strokeLinecap="round"/>
                  </svg>
                  New Configuration
                </button>
              </div>

              {(formData.configurations || []).length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round"/>
                  </svg>
                  <p className="text-gray-500 mb-2">No configurations created yet</p>
                  <p className="text-sm text-gray-400">Use the configurator to create customized product variants</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <div className="col-span-3 text-xs font-semibold text-gray-500 uppercase">Part Number</div>
                    <div className="col-span-4 text-xs font-semibold text-gray-500 uppercase">Description</div>
                    <div className="col-span-3 text-xs font-semibold text-gray-500 uppercase">Options</div>
                    <div className="col-span-1 text-xs font-semibold text-gray-500 uppercase">Created</div>
                    <div className="col-span-1 text-xs font-semibold text-gray-500 uppercase text-right">Actions</div>
                  </div>

                  {/* Table Body */}
                  <div className="divide-y divide-gray-200">
                    {(formData.configurations || []).map((config) => (
                      <div
                        key={config.id}
                        className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="col-span-3">
                          <span
                            onClick={() => router.push(`/products/${config.id}/edit`)}
                            className="text-sm text-blue-600 font-medium cursor-pointer hover:underline"
                          >
                            {config.partNumber}
                          </span>
                        </div>
                        <div className="col-span-4 text-sm text-gray-900 truncate">{config.description}</div>
                        <div className="col-span-3 text-sm text-gray-500 truncate">{config.configuredOptions}</div>
                        <div className="col-span-1 text-sm text-gray-500">{formatDate(config.createdAt)}</div>
                        <div className="col-span-1 flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/products/${config.id}/edit`)}
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                            title="View Configuration"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============ QUANTITY PRICING SECTION ============ */}
        <div ref={el => { sectionRefs.current['quantity-pricing'] = el; }} id="section-quantity-pricing">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quantity Pricing</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
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
          </div>
        </div>

        {/* ============ MANUFACTURER PRICING SECTION ============ */}
        <div ref={el => { sectionRefs.current['manufacturer-pricing'] = el; }} id="section-manufacturer-pricing">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Manufacturer Pricing</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Manufacturer Price History</h3>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {/* Table Header */}
                  <div className="grid grid-cols-6 gap-4 px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <div className="text-xs font-semibold text-gray-500 uppercase">Effective Date</div>
                    <div className="text-xs font-semibold text-gray-500 uppercase text-right">10% Comm</div>
                    <div className="text-xs font-semibold text-gray-500 uppercase text-right">8% Comm</div>
                    <div className="text-xs font-semibold text-gray-500 uppercase text-right">5% Comm</div>
                    <div className="text-xs font-semibold text-gray-500 uppercase text-center">Change</div>
                    <div className="text-xs font-semibold text-gray-500 uppercase">Notes</div>
                  </div>

                  {/* Table Body */}
                  <div className="divide-y divide-gray-200">
                    {manufacturerPriceHistory.map((record, idx) => (
                      <div
                        key={record.id}
                        className={`grid grid-cols-6 gap-4 px-4 py-3 ${idx === 0 ? 'bg-blue-50' : ''}`}
                      >
                        <div className="flex items-center">
                          <span className="text-sm text-gray-900">{formatDate(record.effectiveDate)}</span>
                          {idx === 0 && (
                            <span className="ml-2 px-1.5 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700">Current</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-900 text-right font-medium">{formatCurrency(record.price10)}</div>
                        <div className="text-sm text-gray-900 text-right font-medium">{formatCurrency(record.price8)}</div>
                        <div className="text-sm text-gray-900 text-right font-medium">{formatCurrency(record.price5)}</div>
                        <div className="text-center">
                          {record.changePercent !== 0 ? (
                            <span className={`text-sm font-medium ${record.changePercent > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {record.changePercent > 0 ? '+' : ''}{record.changePercent}%
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </div>
                      <div className="text-sm text-gray-500 truncate">{record.notes || '-'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============ WEIGHTS & MEASURES SECTION ============ */}
        <div ref={el => { sectionRefs.current['weights-measures'] = el; }} id="section-weights-measures">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Weights & Measures</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
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
        </div>

        {/* ============ QUOTE HISTORY SECTION ============ */}
        <div ref={el => { sectionRefs.current['quote-history'] = el; }} id="section-quote-history">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quote History</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-green-50 rounded-lg border border-green-200 p-3">
                    <div className="text-xs text-green-600 font-medium">Won</div>
                    <div className="text-xl font-semibold text-green-700">{quoteStats.won}</div>
                  </div>
                  <div className="bg-red-50 rounded-lg border border-red-200 p-3">
                    <div className="text-xs text-red-600 font-medium">Lost</div>
                    <div className="text-xl font-semibold text-red-700">{quoteStats.lost}</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
                    <div className="text-xs text-blue-600 font-medium">Pending</div>
                    <div className="text-xl font-semibold text-blue-700">{quoteStats.pending}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                    <div className="text-xs text-gray-500 font-medium">Win Rate</div>
                    <div className="text-xl font-semibold text-gray-900">{quoteStats.winRate}%</div>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-gray-900">Quote History</h3>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {/* Table Header */}
                  <div className="grid grid-cols-8 gap-4 px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <div className="text-xs font-semibold text-gray-500 uppercase">Quote #</div>
                    <div className="text-xs font-semibold text-gray-500 uppercase">Date</div>
                    <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase">Customer / Project</div>
                    <div className="text-xs font-semibold text-gray-500 uppercase text-right">Quoted</div>
                    <div className="text-xs font-semibold text-gray-500 uppercase text-center">Qty</div>
                    <div className="text-xs font-semibold text-gray-500 uppercase text-center">Status</div>
                    <div className="text-xs font-semibold text-gray-500 uppercase">Notes</div>
                  </div>

                  {/* Table Body */}
                  <div className="divide-y divide-gray-200">
                    {quotePriceHistory.map((quote) => (
                      <div
                        key={quote.id}
                        className="grid grid-cols-8 gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="text-sm text-blue-600 font-medium cursor-pointer hover:underline">
                          {quote.quoteNumber}
                        </div>
                        <div className="text-sm text-gray-500">{formatDate(quote.quoteDate)}</div>
                        <div className="col-span-2">
                          <div className="text-sm text-gray-900">{quote.customer}</div>
                          <div className="text-xs text-gray-500">{quote.project}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">{formatCurrency(quote.quotedPrice)}</div>
                          <div className="text-xs text-gray-500">{quote.commissionLevel}</div>
                        </div>
                        <div className="text-sm text-gray-900 text-center">{quote.quantity}</div>
                        <div className="text-center">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded capitalize ${getQuoteStatusBadge(quote.status)}`}>
                            {quote.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {quote.status === 'lost' && quote.competitorPrice && (
                            <div className="text-red-600">Comp: {formatCurrency(quote.competitorPrice)}</div>
                          )}
                        {quote.notes && <div className="truncate">{quote.notes}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============ FILES SECTION ============ */}
        <div ref={el => { sectionRefs.current['files'] = el; }} id="section-files">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Files</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-6">
              {/* Spec Sheets Sub-section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Spec Sheets</h3>
                  <button
                    onClick={() => setShowAddSpecSheet(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Spec Sheet
                  </button>
                </div>
                {specSheets.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <path d="M14 2v6h6M12 18v-6M9 15l3-3 3 3"/>
                    </svg>
                    <p className="text-gray-500 text-sm">No spec sheets attached</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {specSheets.map((spec) => (
                      <div
                        key={spec.id}
                        className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                              <path d="M14 2v6h6"/>
                            </svg>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{spec.name}</div>
                            <div className="text-xs text-gray-500">
                              {spec.fileName} - {spec.fileSize} - Uploaded {formatDate(spec.uploadedAt)} by {spec.uploadedBy}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Preview">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </button>
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Download">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                            </svg>
                          </button>
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-red-500" title="Delete">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Add Spec Sheet Form */}
                {showAddSpecSheet && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <div className="text-center">
                      <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <path d="M14 2v6h6M12 18v-6M9 15l3-3 3 3"/>
                      </svg>
                      <p className="text-sm text-gray-900 mb-1">Drop files here or click to upload</p>
                      <p className="text-xs text-gray-500">PDF, DOC, XLS, ZIP up to 10MB</p>
                      <div className="flex items-center justify-center gap-2 mt-4">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                          Choose File
                        </button>
                        <button
                          onClick={() => setShowAddSpecSheet(false)}
                          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200" />

              {/* Other Files Sub-section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Other Files</h3>
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
                  <div className="space-y-2 mt-4">
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
                            <p className="text-sm text-gray-500">{file.fileSize} - {file.uploadedBy}</p>
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
            </div>
          </div>
        </div>

        {/* ============ NOTES SECTION ============ */}
        <div ref={el => { sectionRefs.current['notes'] = el; }} id="section-notes">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-4">
                {(formData.notes || []).map((note, index) => (
                  <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-sm text-gray-500">
                        {note.createdBy} - {new Date(note.createdAt).toLocaleDateString()}
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
          </div>
        </div>

      </div>

      {/* Product Configurator Modal */}
      {showConfiguratorModal && formData.hasConfigurator && (
        <ProductConfiguratorModal
          product={{
            id: formData.id,
            partNumber: formData.partNumber,
            description: formData.description,
            category: formData.category || '',
            manufacturer: formData.manufacturerName,
            basePrice: formData.unitPrice,
            commission10: formData.commission10 || formData.unitPrice,
            commission8: formData.commission8 || formData.unitPrice * 0.97,
            commission5: formData.commission5 || formData.unitPrice * 0.94,
            status: formData.status || 'active',
            hasConfigurator: true,
          }}
          onClose={() => setShowConfiguratorModal(false)}
          onSave={(configuredProduct) => {
            console.log('Configured product:', configuredProduct);
            setShowConfiguratorModal(false);
          }}
        />
      )}

      {/* Product Aliases Modal */}
      {showAliasesModal && (
        <AliasesModal
          type="product"
          entityName={formData.partNumber}
          aliases={formData.aliases || []}
          onAdd={addProductAlias}
          onDelete={deleteProductAlias}
          onClose={() => setShowAliasesModal(false)}
        />
      )}

      {/* Add Tag Modal */}
      {showAddTagModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Tag</h3>
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Enter tag name"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTagName.trim()) {
                  const currentTags = formData.tags || [];
                  if (!currentTags.includes(newTagName.trim())) {
                    handleFieldChange('tags', [...currentTags, newTagName.trim()]);
                  }
                  setNewTagName('');
                  setShowAddTagModal(false);
                }
              }}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => {
                  setNewTagName('');
                  setShowAddTagModal(false);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (newTagName.trim()) {
                    const currentTags = formData.tags || [];
                    if (!currentTags.includes(newTagName.trim())) {
                      handleFieldChange('tags', [...currentTags, newTagName.trim()]);
                    }
                    setNewTagName('');
                    setShowAddTagModal(false);
                  }
                }}
                disabled={!newTagName.trim()}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
