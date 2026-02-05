'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  useFactorySearch,
  useProductUoms,
  importProducts,
  type FactorySearchResult,
  type ProductUom,
  type ProductImportItemInput,
  type QuantityPricingImportInput,
  type CustomerPricingImportInput,
} from '../api';
import {
  loadWorkflowImport,
  clearWorkflowImport,
  type WorkflowImportData,
  type WorkflowImportProduct,
} from '@/lib/flow-ai/workflow-import-storage';
import type { ParsedProduct, ParsedQuantityPricing, ParsedCustomerPricing, ImportResult } from './types';

export function useProductImportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Workflow integration state
  const [workflowSession, setWorkflowSession] = useState<WorkflowImportData | null>(null);
  const [isLoadingWorkflowData, setIsLoadingWorkflowData] = useState(false);
  const fromWorkflow = searchParams.get('from') === 'workflow';
  const sessionId = searchParams.get('session');

  // Factory selection state
  const [factorySearchTerm, setFactorySearchTerm] = useState('');
  const [selectedFactory, setSelectedFactory] = useState<FactorySearchResult | null>(null);
  const [isFactoryDropdownOpen, setIsFactoryDropdownOpen] = useState(false);

  // UOM selection state
  const [selectedUom, setSelectedUom] = useState<ProductUom | null>(null);
  const [isUomDropdownOpen, setIsUomDropdownOpen] = useState(false);

  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // API hooks
  const [autoSearchFactory, setAutoSearchFactory] = useState('');
  const { data: factories = [], isLoading: isLoadingFactories } = useFactorySearch(
    factorySearchTerm || autoSearchFactory,
    isFactoryDropdownOpen || !!autoSearchFactory
  );
  const { data: uoms = [] } = useProductUoms();

  // Parse workflow product to ParsedProduct
  const parseWorkflowProduct = useCallback((item: WorkflowImportProduct): ParsedProduct => {
    const unitPrice = typeof item.unitPrice === 'string'
      ? parseFloat(item.unitPrice) || 0
      : item.unitPrice || 0;

    const defaultCommissionRate = item.defaultCommissionRate
      ? (typeof item.defaultCommissionRate === 'string'
          ? parseFloat(item.defaultCommissionRate)
          : item.defaultCommissionRate)
      : undefined;

    const quantityPricing: ParsedQuantityPricing[] = [];
    if (item.quantityPricing && Array.isArray(item.quantityPricing)) {
      for (const qp of item.quantityPricing) {
        const qpLow = typeof qp.quantityLow === 'string'
          ? parseInt(qp.quantityLow, 10)
          : qp.quantityLow;
        const qpHigh = qp.quantityHigh
          ? (typeof qp.quantityHigh === 'string' ? parseInt(qp.quantityHigh, 10) : qp.quantityHigh)
          : null;
        const qpPrice = typeof qp.unitPrice === 'string'
          ? parseFloat(qp.unitPrice) || 0
          : qp.unitPrice || 0;

        quantityPricing.push({ quantityLow: qpLow, quantityHigh: qpHigh, unitPrice: qpPrice });
      }
    }

    const customerPricing: ParsedCustomerPricing[] = [];
    if (item.customerPricing && Array.isArray(item.customerPricing)) {
      for (const cp of item.customerPricing) {
        if (!cp.customerName) continue;

        const cpPrice = typeof cp.unitPrice === 'string'
          ? parseFloat(cp.unitPrice) || 0
          : cp.unitPrice || 0;
        const cpCommission = typeof cp.commissionRate === 'string'
          ? parseFloat(cp.commissionRate) || 0
          : cp.commissionRate || 0;

        customerPricing.push({
          customerName: cp.customerName,
          customerPartNumber: cp.customerPartNumber,
          unitPrice: cpPrice,
          commissionRate: cpCommission,
        });
      }
    }

    return {
      factoryPartNumber: item.factoryPartNumber,
      description: item.description || '',
      unitPrice,
      upc: item.upc || '',
      category: item.category,
      defaultCommissionRate,
      quantityPricing,
      customerPricing,
    };
  }, []);

  // Load workflow data from IndexedDB
  useEffect(() => {
    async function loadFromWorkflow() {
      if (!fromWorkflow || !sessionId) return;

      setIsLoadingWorkflowData(true);
      try {
        const data = await loadWorkflowImport(sessionId);
        if (!data) {
          toast.error('Workflow data not found. Please try again.');
          router.push('/flow-ai/workflows');
          return;
        }

        setWorkflowSession(data);
        const products = data.products.map(parseWorkflowProduct);
        setParsedProducts(products);

        if (data.detectedFactory) {
          setAutoSearchFactory(data.detectedFactory.toUpperCase());
        }

        toast.success(`Data loaded from workflow: ${products.length} products`);
      } catch (error) {
        console.error('Failed to load workflow data:', error);
        toast.error('Error loading workflow data');
      } finally {
        setIsLoadingWorkflowData(false);
      }
    }

    loadFromWorkflow();
  }, [fromWorkflow, sessionId, router, parseWorkflowProduct]);

  // Auto-select factory when factories load
  useEffect(() => {
    if (autoSearchFactory && factories.length > 0 && !selectedFactory) {
      const match = factories.find(f =>
        f.title.toLowerCase().includes(autoSearchFactory.toLowerCase())
      );
      if (match) {
        setSelectedFactory(match);
        setFactorySearchTerm(match.title);
        setAutoSearchFactory('');
        toast.info(`Factory auto-selected: ${match.title}`);
      }
    }
  }, [factories, autoSearchFactory, selectedFactory]);

  // Parse JSON file
  const parseJSON = useCallback((content: string): ParsedProduct[] => {
    try {
      const data = JSON.parse(content);

      if (!data.products || !Array.isArray(data.products)) {
        setParseError('Invalid JSON format. Expected { "products": [...] }');
        return [];
      }

      return data.products
        .filter((item: Record<string, unknown>) => item.factoryPartNumber)
        .map((item: WorkflowImportProduct) => parseWorkflowProduct(item));
    } catch (e) {
      setParseError(`Failed to parse JSON: ${e instanceof Error ? e.message : 'Unknown error'}`);
      return [];
    }
  }, [parseWorkflowProduct]);

  // Handle file selection
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParseError(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const products = parseJSON(content);
      setParsedProducts(products);
    };
    reader.onerror = () => {
      setParseError('Failed to read file');
    };
    reader.readAsText(selectedFile);
  }, [parseJSON]);

  // Handle import
  const handleImport = useCallback(async () => {
    if (!selectedFactory) {
      toast.error('Please select a factory');
      return;
    }

    if (!selectedUom) {
      toast.error('Please select a Unit of Measure');
      return;
    }

    if (parsedProducts.length === 0) {
      toast.error('No products to import');
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const productInputs: ProductImportItemInput[] = parsedProducts.map(p => ({
        factoryPartNumber: p.factoryPartNumber,
        unitPrice: p.unitPrice.toString(),
        description: p.description || undefined,
        upc: p.upc || undefined,
        category: p.category,
        defaultCommissionRate: p.defaultCommissionRate?.toString(),
        quantityPricing: p.quantityPricing.length > 0
          ? p.quantityPricing.map(qp => ({
              quantityLow: qp.quantityLow.toString(),
              quantityHigh: qp.quantityHigh?.toString() ?? null,
              unitPrice: qp.unitPrice.toString(),
            } as QuantityPricingImportInput))
          : undefined,
        customerPricing: p.customerPricing.length > 0
          ? p.customerPricing.map(cp => ({
              customerName: cp.customerName,
              customerPartNumber: cp.customerPartNumber,
              unitPrice: cp.unitPrice.toString(),
              commissionRate: cp.commissionRate.toString(),
            } as CustomerPricingImportInput))
          : undefined,
      }));

      const result = await importProducts(
        { factoryId: selectedFactory.id, products: productInputs },
        selectedUom.id
      );

      setImportResult({
        success: result.success,
        message: result.message,
        created: result.productsCreated,
        updated: result.productsUpdated,
        quantityPricing: result.quantityPricingCreated,
        customerPricingCreated: result.customerPricingCreated,
        customerPricingUpdated: result.customerPricingUpdated,
        customersNotFound: result.customersNotFound || [],
        errors: result.errors,
      });

      if (result.success) {
        toast.success(result.message);
        if (sessionId) {
          await clearWorkflowImport(sessionId);
        }
      } else {
        toast.error(`Import completed with errors: ${result.errors.length} failed`);
      }
    } catch (error) {
      console.error('Import failed:', error);
      toast.error(error instanceof Error ? error.message : 'Import failed');
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : 'Import failed',
        created: 0,
        updated: 0,
        quantityPricing: 0,
        customerPricingCreated: 0,
        customerPricingUpdated: 0,
        customersNotFound: [],
        errors: [],
      });
    } finally {
      setIsImporting(false);
    }
  }, [selectedFactory, selectedUom, parsedProducts, sessionId]);

  const handleBack = useCallback(() => {
    router.push(fromWorkflow ? `/flow-ai/workflows/${workflowSession?.workflowId}` : '/products');
  }, [router, fromWorkflow, workflowSession]);

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  }, []);

  return {
    // Workflow state
    fromWorkflow,
    workflowSession,
    isLoadingWorkflowData,

    // Factory state
    factorySearchTerm,
    setFactorySearchTerm,
    selectedFactory,
    setSelectedFactory,
    isFactoryDropdownOpen,
    setIsFactoryDropdownOpen,
    factories,
    isLoadingFactories,

    // UOM state
    selectedUom,
    setSelectedUom,
    isUomDropdownOpen,
    setIsUomDropdownOpen,
    uoms,

    // File state
    file,
    parsedProducts,
    parseError,
    handleFileChange,

    // Import state
    isImporting,
    importResult,
    handleImport,

    // Utilities
    handleBack,
    formatPrice,
  };
}
