'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useFlowChat } from '@/contexts/FlowChatContext';
import {
  useProduct,
  useUpdateProduct,
  useProductUoms,
  useProductCategories,
  useFactorySearch,
  useProductCpns,
  useCreateProductCpn,
  useUpdateProductCpn,
  useDeleteProductCpn,
  useCustomerSearch,
  useProductQuantityPricingList,
  useCreateProductQuantityPricing,
  useUpdateProductQuantityPricing,
  useDeleteProductQuantityPricing,
  type ProductCategory,
  type ProductUom,
  type Factory,
  type UpdateProductInput,
  type FactorySearchResult,
  type ProductCpn,
  type ProductCpnInput,
  type CustomerSearchResult,
  type ProductQuantityPricing,
  type ProductQuantityPricingInput,
} from '../../../../../components/products/api';
import { ManageCategoriesModal, ManageUomsModal } from '../../../../../components/products/modals';
import { useUnsavedChangesGuard } from '../../../../../components/shared/hooks/useUnsavedChangesGuard';
import { useUnsavedChangesContext } from '../../../../../contexts/UnsavedChangesContext';
import { EntityAliasesSection } from '../../../../../components/shared/EntityAliasesSection';

// ============================================================================
// Types
// ============================================================================

type TabId = 'overview' | 'customer-part-numbers' | 'quantity-pricing' | 'factory-details' | 'uom-details' | 'category-details' | 'aliases';

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
  const { setFullEntityContext } = useFlowChat();

  // Set full entity context for global chatbot (type, id, and product part number)
  useEffect(() => {
    if (product?.factoryPartNumber && productId) {
      setFullEntityContext('product', productId, product.factoryPartNumber);
    }
    return () => {
      setFullEntityContext(null, null, null);
    };
  }, [product?.factoryPartNumber, productId, setFullEntityContext]);

  // CPN Hooks
  const { data: cpns = [], isLoading: isLoadingCpns, refetch: refetchCpns } = useProductCpns(productId);
  const createCpnMutation = useCreateProductCpn();
  const updateCpnMutation = useUpdateProductCpn();
  const deleteCpnMutation = useDeleteProductCpn();

  // Quantity Pricing Hooks
  const { data: quantityPricing = [], isLoading: isLoadingQuantityPricing, refetch: refetchQuantityPricing } = useProductQuantityPricingList(productId);
  const createQuantityPricingMutation = useCreateProductQuantityPricing();
  const updateQuantityPricingMutation = useUpdateProductQuantityPricing();
  const deleteQuantityPricingMutation = useDeleteProductQuantityPricing();

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

  // Category Search State
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const { data: allCategories = [], isLoading: isLoadingCategories } = useProductCategories(formData.selectedFactoryId);

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

  // CPN Form State
  const [showCpnForm, setShowCpnForm] = useState(false);
  const [editingCpn, setEditingCpn] = useState<ProductCpn | null>(null);
  const [deletingCpn, setDeletingCpn] = useState<ProductCpn | null>(null);
  const [cpnFormData, setCpnFormData] = useState({
    customerPartNumber: '',
    unitPrice: '',
    commissionRate: '',
    customerId: '',
    customerName: '',
  });
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const customerInputRef = useRef<HTMLInputElement>(null);
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  const { data: customers = [], isLoading: isLoadingCustomers } = useCustomerSearch(
    customerSearchTerm,
    isCustomerDropdownOpen
  );

  // Quantity Pricing Form State
  const [showQuantityPricingForm, setShowQuantityPricingForm] = useState(false);
  const [editingQuantityPricing, setEditingQuantityPricing] = useState<ProductQuantityPricing | null>(null);
  const [deletingQuantityPricing, setDeletingQuantityPricing] = useState<ProductQuantityPricing | null>(null);
  const [quantityPricingFormData, setQuantityPricingFormData] = useState({
    quantityLow: '',
    quantityHigh: '',
    unitPrice: '',
  });

  // Portal mount state
  const [isMounted, setIsMounted] = useState(false);

  // Management modals state
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showUomsModal, setShowUomsModal] = useState(false);

  // Section refs for scroll-to functionality
  const sectionRefs = useRef<Record<TabId, HTMLDivElement | null>>({
    'overview': null,
    'customer-part-numbers': null,
    'quantity-pricing': null,
    'factory-details': null,
    'uom-details': null,
    'category-details': null,
    'aliases': null,
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Flag to disable scroll spy during programmatic scrolling
  const isScrollingRef = useRef(false);

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
      if (
        customerInputRef.current && !customerInputRef.current.contains(target) &&
        customerDropdownRef.current && !customerDropdownRef.current.contains(target)
      ) {
        setIsCustomerDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll spy
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const tabIds: TabId[] = ['overview', 'customer-part-numbers', 'quantity-pricing', 'factory-details', 'uom-details', 'category-details', 'aliases'];

    const handleScroll = () => {
      // Skip scroll spy updates during programmatic scrolling
      if (isScrollingRef.current) return;

      const containerRect = container.getBoundingClientRect();
      let currentSection: TabId = 'overview';

      for (const tabId of tabIds) {
        const section = sectionRefs.current[tabId];
        if (section) {
          const sectionRect = section.getBoundingClientRect();
          // Check if section top is at or above the container top + offset
          if (sectionRect.top <= containerRect.top + 100) {
            currentSection = tabId;
          }
        }
      }
      setActiveTab(currentSection);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // ============================================================================
  // Handlers
  // ============================================================================

  const scrollToSection = useCallback((tabId: TabId) => {
    const section = sectionRefs.current[tabId];
    const container = scrollContainerRef.current;
    if (section && container) {
      // Disable scroll spy during programmatic scroll
      isScrollingRef.current = true;
      setActiveTab(tabId);

      // Calculate the section's position relative to the scroll container
      const containerRect = container.getBoundingClientRect();
      const sectionRect = section.getBoundingClientRect();
      const scrollTop = container.scrollTop;
      const headerOffset = 20;

      // Calculate the target scroll position
      const sectionTop = sectionRect.top - containerRect.top + scrollTop - headerOffset;

      container.scrollTo({ top: sectionTop, behavior: 'smooth' });

      // Re-enable scroll spy after scroll animation completes
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 500);
    }
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

  const handleSave = async (): Promise<boolean> => {
    if (!formData.factoryPartNumber.trim()) {
      toast.error('Part number is required');
      return false;
    }

    if (!formData.selectedFactoryId) {
      toast.error('Factory is required');
      return false;
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
      return true;
    } catch (error) {
      toast.error('Failed to update product');
      console.error('Update error:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Unsaved changes guard - tracks product editing and blocks navigation
  useUnsavedChangesGuard({
    entityType: 'Product',
    entityId: productId,
    entityName: product?.factoryPartNumber || null,
    hasChanges,
    onSave: handleSave,
  });

  // Get unsaved changes context for back button navigation check
  const { requestNavigation, hasUnsavedChanges } = useUnsavedChangesContext();

  // Handle back navigation with unsaved changes check
  const handleBack = () => {
    if (hasUnsavedChanges) {
      const canNavigate = requestNavigation('/products', 'back');
      if (!canNavigate) {
        return; // Navigation blocked, modal will be shown
      }
    }
    router.push('/products');
  };

  // CPN Handlers
  const resetCpnForm = () => {
    setCpnFormData({
      customerPartNumber: '',
      unitPrice: '',
      commissionRate: '',
      customerId: '',
      customerName: '',
    });
    setCustomerSearchTerm('');
    setShowCpnForm(false);
    setEditingCpn(null);
    setIsCustomerDropdownOpen(false);
  };

  const handleCustomerSelect = (customer: CustomerSearchResult) => {
    setCpnFormData(prev => ({
      ...prev,
      customerId: customer.id,
      customerName: customer.companyName,
    }));
    setCustomerSearchTerm(customer.companyName);
    setIsCustomerDropdownOpen(false);
  };

  const handleCreateCpn = async () => {
    if (!cpnFormData.customerId) {
      toast.error('Please select a customer');
      return;
    }
    if (!cpnFormData.customerPartNumber.trim()) {
      toast.error('Customer part number is required');
      return;
    }
    if (!cpnFormData.unitPrice) {
      toast.error('Unit price is required');
      return;
    }
    if (!cpnFormData.commissionRate) {
      toast.error('Commission rate is required');
      return;
    }

    try {
      const input: ProductCpnInput = {
        productId,
        customerId: cpnFormData.customerId,
        customerPartNumber: cpnFormData.customerPartNumber.trim(),
        unitPrice: cpnFormData.unitPrice,
        commissionRate: cpnFormData.commissionRate,
      };

      await createCpnMutation.mutateAsync(input);
      toast.success('Customer part number created successfully');
      resetCpnForm();
      refetchCpns();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create CPN');
    }
  };

  const handleUpdateCpn = async () => {
    if (!editingCpn) return;

    if (!cpnFormData.customerId) {
      toast.error('Please select a customer');
      return;
    }
    if (!cpnFormData.customerPartNumber.trim()) {
      toast.error('Customer part number is required');
      return;
    }
    if (!cpnFormData.unitPrice) {
      toast.error('Unit price is required');
      return;
    }
    if (!cpnFormData.commissionRate) {
      toast.error('Commission rate is required');
      return;
    }

    try {
      const input: ProductCpnInput = {
        productId,
        customerId: cpnFormData.customerId,
        customerPartNumber: cpnFormData.customerPartNumber.trim(),
        unitPrice: cpnFormData.unitPrice,
        commissionRate: cpnFormData.commissionRate,
      };

      await updateCpnMutation.mutateAsync({ id: editingCpn.id, input });
      toast.success('Customer part number updated successfully');
      resetCpnForm();
      refetchCpns();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update CPN');
    }
  };

  const handleDeleteCpn = async () => {
    if (!deletingCpn) return;

    try {
      await deleteCpnMutation.mutateAsync({ id: deletingCpn.id, productId });
      toast.success('Customer part number deleted successfully');
      setDeletingCpn(null);
      refetchCpns();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete CPN');
    }
  };

  const startEditCpn = (cpn: ProductCpn) => {
    setEditingCpn(cpn);
    setCpnFormData({
      customerPartNumber: cpn.customerPartNumber,
      unitPrice: String(cpn.unitPrice),
      commissionRate: String(cpn.commissionRate),
      customerId: cpn.customerId,
      customerName: cpn.customer?.companyName || '',
    });
    setCustomerSearchTerm(cpn.customer?.companyName || '');
    setShowCpnForm(true);
  };

  // Quantity Pricing Handlers
  const resetQuantityPricingForm = () => {
    setQuantityPricingFormData({
      quantityLow: '',
      quantityHigh: '',
      unitPrice: '',
    });
    setShowQuantityPricingForm(false);
    setEditingQuantityPricing(null);
  };

  const handleCreateQuantityPricing = async () => {
    if (!quantityPricingFormData.quantityLow) {
      toast.error('Quantity Low is required');
      return;
    }
    if (!quantityPricingFormData.quantityHigh) {
      toast.error('Quantity High is required');
      return;
    }
    if (!quantityPricingFormData.unitPrice) {
      toast.error('Unit Price is required');
      return;
    }

    try {
      const input: ProductQuantityPricingInput = {
        productId,
        quantityLow: quantityPricingFormData.quantityLow,
        quantityHigh: quantityPricingFormData.quantityHigh,
        unitPrice: quantityPricingFormData.unitPrice,
      };

      await createQuantityPricingMutation.mutateAsync(input);
      toast.success('Quantity pricing tier created successfully');
      resetQuantityPricingForm();
      refetchQuantityPricing();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create quantity pricing');
    }
  };

  const handleUpdateQuantityPricing = async () => {
    if (!editingQuantityPricing) return;

    if (!quantityPricingFormData.quantityLow) {
      toast.error('Quantity Low is required');
      return;
    }
    if (!quantityPricingFormData.quantityHigh) {
      toast.error('Quantity High is required');
      return;
    }
    if (!quantityPricingFormData.unitPrice) {
      toast.error('Unit Price is required');
      return;
    }

    try {
      const input: ProductQuantityPricingInput = {
        productId,
        quantityLow: quantityPricingFormData.quantityLow,
        quantityHigh: quantityPricingFormData.quantityHigh,
        unitPrice: quantityPricingFormData.unitPrice,
      };

      await updateQuantityPricingMutation.mutateAsync({ id: editingQuantityPricing.id, input });
      toast.success('Quantity pricing tier updated successfully');
      resetQuantityPricingForm();
      refetchQuantityPricing();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update quantity pricing');
    }
  };

  const handleDeleteQuantityPricing = async () => {
    if (!deletingQuantityPricing) return;

    try {
      await deleteQuantityPricingMutation.mutateAsync({ id: deletingQuantityPricing.id, productId });
      toast.success('Quantity pricing tier deleted successfully');
      setDeletingQuantityPricing(null);
      refetchQuantityPricing();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete quantity pricing');
    }
  };

  const startEditQuantityPricing = (tier: ProductQuantityPricing) => {
    setEditingQuantityPricing(tier);
    setQuantityPricingFormData({
      quantityLow: String(tier.quantityLow),
      quantityHigh: String(tier.quantityHigh),
      unitPrice: String(tier.unitPrice),
    });
    setShowQuantityPricingForm(true);
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
    { id: 'customer-part-numbers' as TabId, label: 'Customer Part Numbers', count: cpns.length || null },
    { id: 'quantity-pricing' as TabId, label: 'Quantity Pricing', count: quantityPricing.length || null },
    { id: 'factory-details' as TabId, label: 'Factory Details', count: null },
    { id: 'uom-details' as TabId, label: 'UOM Details', count: null },
    { id: 'category-details' as TabId, label: 'Category Details', count: null },
    { id: 'aliases' as TabId, label: 'Aliases', count: null },
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
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {formData.factoryPartNumber || 'Untitled Product'}
              </h1>
              <p className="text-sm text-gray-500">
                {formData.description
                  ? formData.description.length > 50
                    ? `${formData.description.slice(0, 50)}...`
                    : formData.description
                  : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Management Buttons */}
            <button
              onClick={() => setShowUomsModal(true)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              Manage UOMs
            </button>
            <button
              onClick={() => setShowCategoriesModal(true)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
              Manage Categories
            </button>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-300"></div>

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
                    value={formData.defaultCommissionRate ? formData.defaultCommissionRate : ''}
                    onChange={(e) => handleFieldChange('defaultCommissionRate', e.target.value ? parseFloat(e.target.value) : 0)}
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
                            {uom.divisionFactor && (
                              <span className="text-xs text-gray-400">÷{uom.divisionFactor}</span>
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
                      if (formData.selectedFactoryId) {
                        setIsCategoryDropdownOpen(true);
                        setCategorySearchTerm('');
                      }
                    }}
                    disabled={!formData.selectedFactoryId}
                    className={`${inputClass} ${!formData.selectedFactoryId ? 'bg-gray-50 cursor-not-allowed opacity-60' : ''}`}
                    placeholder={formData.selectedFactoryId ? "Search categories..." : "Select factory first"}
                  />
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>

                  {isCategoryDropdownOpen && formData.selectedFactoryId && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {isLoadingCategories ? (
                        <div className="px-3 py-2 text-sm text-gray-500 flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          Searching...
                        </div>
                      ) : categoryResults.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          {categorySearchTerm ? 'No categories found' : 'No categories available'}
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

        {/* ============ CUSTOMER PART NUMBERS SECTION ============ */}
        <div ref={el => { sectionRefs.current['customer-part-numbers'] = el; }} id="section-customer-part-numbers">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Customer Part Numbers</h2>
            {!showCpnForm && !editingCpn && (
              <button
                type="button"
                onClick={() => setShowCpnForm(true)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add CPN
              </button>
            )}
          </div>

          {/* CPN Form */}
          {(showCpnForm || editingCpn) && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                {editingCpn ? 'Edit Customer Part Number' : 'New Customer Part Number'}
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Customer Search Dropdown */}
                <div className="relative">
                  <label className={labelClass}>Customer *</label>
                  <input
                    ref={customerInputRef}
                    type="text"
                    value={customerSearchTerm}
                    onChange={(e) => {
                      setCustomerSearchTerm(e.target.value);
                      setIsCustomerDropdownOpen(true);
                      if (!e.target.value) {
                        setCpnFormData(prev => ({ ...prev, customerId: '', customerName: '' }));
                      }
                    }}
                    onFocus={() => setIsCustomerDropdownOpen(true)}
                    className={`${inputClass} pr-10 ${isCustomerDropdownOpen ? 'ring-2 ring-blue-500 border-transparent' : ''}`}
                    placeholder="Search customers..."
                  />
                  {isLoadingCustomers ? (
                    <div className="absolute right-3 top-[38px] -translate-y-1/2">
                      <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    </div>
                  ) : (
                    <svg className={`absolute right-3 top-[38px] -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform ${isCustomerDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                  {isCustomerDropdownOpen && isMounted && createPortal(
                    <div
                      ref={customerDropdownRef}
                      style={{
                        position: 'fixed',
                        top: (customerInputRef.current?.getBoundingClientRect().bottom ?? 0) + 4,
                        left: customerInputRef.current?.getBoundingClientRect().left ?? 0,
                        width: customerInputRef.current?.getBoundingClientRect().width ?? 300,
                        zIndex: 9999,
                      }}
                      className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
                    >
                      {isLoadingCustomers ? (
                        <div className="px-3 py-4 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                          Loading customers...
                        </div>
                      ) : customers.length === 0 ? (
                        <div className="px-3 py-4 text-center text-sm text-gray-500">
                          {customerSearchTerm ? 'No customers found' : 'Start typing to search customers'}
                        </div>
                      ) : (
                        customers.map((customer) => (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => handleCustomerSelect(customer)}
                            className={`w-full px-3 py-2.5 text-left text-sm transition-colors flex items-center gap-3 ${
                              cpnFormData.customerId === customer.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">{customer.companyName}</div>
                              {customer.isParent && (
                                <span className="text-xs text-gray-500">Parent Company</span>
                              )}
                            </div>
                            {customer.published && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex-shrink-0">Active</span>
                            )}
                            {cpnFormData.customerId === customer.id && (
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

                {/* Customer Part Number */}
                <div>
                  <label className={labelClass}>Customer Part Number *</label>
                  <input
                    type="text"
                    value={cpnFormData.customerPartNumber}
                    onChange={(e) => setCpnFormData(prev => ({ ...prev, customerPartNumber: e.target.value }))}
                    className={inputClass}
                    placeholder="Enter customer part number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Unit Price */}
                <div>
                  <label className={labelClass}>Unit Price *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={cpnFormData.unitPrice}
                      onChange={(e) => setCpnFormData(prev => ({ ...prev, unitPrice: e.target.value }))}
                      className={`${inputClass} pl-7`}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Commission Rate */}
                <div>
                  <label className={labelClass}>Commission Rate *</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={cpnFormData.commissionRate}
                      onChange={(e) => setCpnFormData(prev => ({ ...prev, commissionRate: e.target.value }))}
                      className={`${inputClass} pr-8`}
                      placeholder="0.00"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={resetCpnForm}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={editingCpn ? handleUpdateCpn : handleCreateCpn}
                  disabled={createCpnMutation.isPending || updateCpnMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {(createCpnMutation.isPending || updateCpnMutation.isPending) ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      {editingCpn ? 'Saving...' : 'Creating...'}
                    </>
                  ) : (
                    editingCpn ? 'Save Changes' : 'Create CPN'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* CPNs List */}
          {isLoadingCpns ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <svg className="animate-spin h-8 w-8 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <p className="text-gray-500 mt-2">Loading customer part numbers...</p>
            </div>
          ) : cpns.length === 0 && !showCpnForm ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <p className="text-gray-500 mb-2">No customer part numbers defined</p>
              <p className="text-gray-400 text-sm">Add a CPN to create customer-specific pricing for this product</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
              {cpns.map((cpn) => (
                <div key={cpn.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{cpn.customerPartNumber}</h4>
                          <span className="text-gray-400">·</span>
                          <span className="text-gray-600">{cpn.customer?.companyName || 'Unknown Customer'}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatCurrency(cpn.unitPrice)}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            {`${Number(cpn.commissionRate || 0).toFixed(1)}%`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEditCpn(cpn)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingCpn(cpn)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Delete CPN Confirmation Modal */}
          {deletingCpn && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Delete Customer Part Number</h3>
                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-4">
                  Are you sure you want to delete the customer part number &quot;{deletingCpn.customerPartNumber}&quot; for {deletingCpn.customer?.companyName}?
                </p>
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setDeletingCpn(null)}
                    disabled={deleteCpnMutation.isPending}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteCpn}
                    disabled={deleteCpnMutation.isPending}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {deleteCpnMutation.isPending ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Deleting...
                      </>
                    ) : (
                      'Delete'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============ QUANTITY PRICING SECTION ============ */}
        <div ref={el => { sectionRefs.current['quantity-pricing'] = el; }} id="section-quantity-pricing">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Quantity Pricing</h2>
            {!showQuantityPricingForm && (
              <button
                onClick={() => setShowQuantityPricingForm(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Tier
              </button>
            )}
          </div>

          {/* Quantity Pricing Form */}
          {showQuantityPricingForm && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium text-gray-900">
                  {editingQuantityPricing ? 'Edit Pricing Tier' : 'Add New Pricing Tier'}
                </h3>
                <button
                  onClick={resetQuantityPricingForm}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className={labelClass}>Quantity Low *</label>
                  <input
                    type="number"
                    value={quantityPricingFormData.quantityLow}
                    onChange={(e) => setQuantityPricingFormData(prev => ({ ...prev, quantityLow: e.target.value }))}
                    className={inputClass}
                    placeholder="1"
                    min="0"
                    step="1"
                  />
                </div>
                <div>
                  <label className={labelClass}>Quantity High *</label>
                  <input
                    type="number"
                    value={quantityPricingFormData.quantityHigh}
                    onChange={(e) => setQuantityPricingFormData(prev => ({ ...prev, quantityHigh: e.target.value }))}
                    className={inputClass}
                    placeholder="100"
                    min="0"
                    step="1"
                  />
                </div>
                <div>
                  <label className={labelClass}>Unit Price *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={quantityPricingFormData.unitPrice}
                      onChange={(e) => setQuantityPricingFormData(prev => ({ ...prev, unitPrice: e.target.value }))}
                      className={`${inputClass} pl-7`}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={resetQuantityPricingForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingQuantityPricing ? handleUpdateQuantityPricing : handleCreateQuantityPricing}
                  disabled={createQuantityPricingMutation.isPending || updateQuantityPricingMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {(createQuantityPricingMutation.isPending || updateQuantityPricingMutation.isPending) ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    editingQuantityPricing ? 'Update Tier' : 'Add Tier'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Quantity Pricing List */}
          {isLoadingQuantityPricing ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading pricing tiers...</p>
            </div>
          ) : quantityPricing.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-1">No Quantity Pricing Tiers</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                Add volume-based pricing tiers to offer discounts for larger orders
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {quantityPricing
                .sort((a, b) => a.quantityLow - b.quantityLow)
                .map((tier, index) => (
                <div
                  key={tier.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-all duration-200 group"
                >
                  {/* Tier Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        index === 0
                          ? 'bg-blue-100 text-blue-600'
                          : index === 1
                            ? 'bg-purple-100 text-purple-600'
                            : index === 2
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-100 text-gray-600'
                      }`}>
                        <span className="text-sm font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Tier {index + 1}</p>
                        <p className="text-sm font-medium text-gray-900">Volume Discount</p>
                      </div>
                    </div>

                    {/* Actions - visible on hover */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEditQuantityPricing(tier)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit tier"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeletingQuantityPricing(tier)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete tier"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Quantity Range */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                        </svg>
                        <span className="text-xs text-gray-500 font-medium">Quantity Range</span>
                      </div>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {tier.quantityLow.toLocaleString()} — {tier.quantityHigh.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">units</p>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between bg-green-50 rounded-lg p-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs text-green-700 font-medium">Unit Price</span>
                      </div>
                      <p className="text-xl font-bold text-green-700 mt-1">
                        {formatCurrency(tier.unitPrice)}
                      </p>
                    </div>
                    {index > 0 && formData.unitPrice && tier.unitPrice < formData.unitPrice && (
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                          {Math.round((1 - tier.unitPrice / formData.unitPrice) * 100)}% off
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Delete Quantity Pricing Confirmation Modal */}
          {deletingQuantityPricing && isMounted && createPortal(
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Pricing Tier</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this pricing tier ({deletingQuantityPricing.quantityLow} - {deletingQuantityPricing.quantityHigh} units at {formatCurrency(deletingQuantityPricing.unitPrice)})? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setDeletingQuantityPricing(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteQuantityPricing}
                    disabled={deleteQuantityPricingMutation.isPending}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {deleteQuantityPricingMutation.isPending ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Deleting...
                      </>
                    ) : (
                      'Delete'
                    )}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
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
                  {formData.uom.divisionFactor && (
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      Division Factor: ÷{formData.uom.divisionFactor}
                    </span>
                  )}
                </div>
              </div>

              {formData.uom.divisionFactor && (
                <div className="mt-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Division Factor</p>
                    <p className="text-sm font-medium text-gray-900">{formData.uom.divisionFactor}</p>
                    <p className="text-xs text-gray-400 mt-1">Quantity will be divided by this factor for pricing</p>
                  </div>
                </div>
              )}
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

              {/* Category Hierarchy */}
              {(formData.category?.parent || formData.category?.grandparent) && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <h4 className="text-sm font-medium text-gray-900">Category Hierarchy</h4>
                  </div>

                  {/* Beautiful Breadcrumb-style Hierarchy */}
                  <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
                    {formData.category?.grandparent && (
                      <>
                        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm border border-purple-200">
                          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-gray-700">{formData.category.grandparent.title}</span>
                          {formData.category.grandparent.commissionRate !== undefined && (
                            <span className="text-xs text-purple-600 font-medium">
                              {formatPercent(formData.category.grandparent.commissionRate)}
                            </span>
                          )}
                        </div>
                        <svg className="w-5 h-5 text-purple-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </>
                    )}

                    {formData.category?.parent && (
                      <>
                        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm border border-indigo-200">
                          <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-gray-700">{formData.category.parent.title}</span>
                          {formData.category.parent.commissionRate !== undefined && (
                            <span className="text-xs text-indigo-600 font-medium">
                              {formatPercent(formData.category.parent.commissionRate)}
                            </span>
                          )}
                        </div>
                        <svg className="w-5 h-5 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </>
                    )}

                    {/* Current Category */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <span className="text-sm font-semibold text-white">{formData.category.title}</span>
                      {formData.category.commissionRate !== undefined && (
                        <span className="text-xs text-white/80 font-medium">
                          {formatPercent(formData.category.commissionRate)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hierarchy Details Grid */}
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {formData.category?.grandparent && (
                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-purple-600">1</span>
                          </div>
                          <p className="text-xs text-purple-600 font-medium">Grandparent</p>
                        </div>
                        <p className="text-sm font-medium text-gray-900">{formData.category.grandparent.title}</p>
                        {formData.category.grandparent.commissionRate !== undefined && (
                          <p className="text-xs text-gray-500 mt-1">
                            Commission: {formatPercent(formData.category.grandparent.commissionRate)}
                          </p>
                        )}
                      </div>
                    )}

                    {formData.category?.parent && (
                      <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-indigo-600">{formData.category?.grandparent ? '2' : '1'}</span>
                          </div>
                          <p className="text-xs text-indigo-600 font-medium">Parent</p>
                        </div>
                        <p className="text-sm font-medium text-gray-900">{formData.category.parent.title}</p>
                        {formData.category.parent.commissionRate !== undefined && (
                          <p className="text-xs text-gray-500 mt-1">
                            Commission: {formatPercent(formData.category.parent.commissionRate)}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-600">
                            {formData.category?.grandparent ? '3' : formData.category?.parent ? '2' : '1'}
                          </span>
                        </div>
                        <p className="text-xs text-blue-600 font-medium">Current</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{formData.category?.title}</p>
                      {formData.category?.commissionRate !== undefined && (
                        <p className="text-xs text-gray-500 mt-1">
                          Commission: {formatPercent(formData.category.commissionRate)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
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

        {/* ============ ALIASES SECTION ============ */}
        <div ref={el => { sectionRefs.current['aliases'] = el; }} id="section-aliases">
          <EntityAliasesSection
            entityId={productId}
            entityType="PRODUCT"
            entityName={formData.factoryPartNumber || 'Untitled Product'}
            title="Product Aliases"
            subTypes={['END_USER', 'SOLD_TO', 'BILL_TO']}
            infoText="Add alternative part numbers or descriptions that should match to this product during data imports and commission statement processing."
          />
        </div>

        {/* Coming Soon Sections */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Additional Sections</h2>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">Coming Soon</span>
          </div>

          <div className="grid grid-cols-4 gap-4">
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

      {/* Management Modals */}
      <ManageCategoriesModal
        isOpen={showCategoriesModal}
        onClose={() => setShowCategoriesModal(false)}
      />
      <ManageUomsModal
        isOpen={showUomsModal}
        onClose={() => setShowUomsModal(false)}
      />
    </main>
  );
}
