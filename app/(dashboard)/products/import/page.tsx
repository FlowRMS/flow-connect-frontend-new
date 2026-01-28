'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  useFactorySearch,
  useProductUoms,
  type FactorySearchResult,
  type ProductUom,
  type ProductImportItemInput,
  type QuantityPricingImportInput,
} from '../../../../components/products/api/useProductsApi';
import { importProducts } from '../../../../components/products/api/productsApi';

interface ParsedProduct {
  factoryPartNumber: string;
  description: string;
  unitPrice: number;
  upc: string;
  quantityPricing: Array<{
    quantityLow: number;
    quantityHigh: number | null;
    unitPrice: number;
  }>;
}

export default function ImportProductsPage() {
  const router = useRouter();

  // Factory selection state
  const [factorySearchTerm, setFactorySearchTerm] = useState('');
  const [selectedFactory, setSelectedFactory] = useState<FactorySearchResult | null>(null);
  const [isFactoryDropdownOpen, setIsFactoryDropdownOpen] = useState(false);
  const factoryInputRef = useRef<HTMLInputElement>(null);

  // UOM selection state
  const [selectedUom, setSelectedUom] = useState<ProductUom | null>(null);
  const [isUomDropdownOpen, setIsUomDropdownOpen] = useState(false);

  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    created: number;
    updated: number;
    errors: Array<{ factoryPartNumber: string; error: string }>;
  } | null>(null);

  // API hooks
  const { data: factories = [], isLoading: isLoadingFactories } = useFactorySearch(
    factorySearchTerm,
    isFactoryDropdownOpen
  );
  const { data: uoms = [] } = useProductUoms();

  // Parse JSON file (from workflow output)
  const parseJSON = useCallback((content: string) => {
    try {
      const data = JSON.parse(content);

      // Check if it's the expected product import format
      if (!data.products || !Array.isArray(data.products)) {
        setParseError('Invalid JSON format. Expected { "products": [...] }');
        return [];
      }

      const products: ParsedProduct[] = [];

      for (const item of data.products) {
        if (!item.factoryPartNumber) continue; // Skip invalid entries

        // Parse unitPrice (can be string or number)
        const unitPrice = typeof item.unitPrice === 'string'
          ? parseFloat(item.unitPrice) || 0
          : item.unitPrice || 0;

        // Parse quantity pricing
        const quantityPricing: ParsedProduct['quantityPricing'] = [];
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

            quantityPricing.push({
              quantityLow: qpLow,
              quantityHigh: qpHigh,
              unitPrice: qpPrice,
            });
          }
        }

        products.push({
          factoryPartNumber: item.factoryPartNumber,
          description: item.description || '',
          unitPrice,
          upc: item.upc || '',
          quantityPricing,
        });
      }

      return products;
    } catch (e) {
      setParseError(`Failed to parse JSON: ${e instanceof Error ? e.message : 'Unknown error'}`);
      return [];
    }
  }, []);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  // Handle factory selection
  const handleFactorySelect = (factory: FactorySearchResult) => {
    setSelectedFactory(factory);
    setFactorySearchTerm(factory.title);
    setIsFactoryDropdownOpen(false);
  };

  // Handle UOM selection
  const handleUomSelect = (uom: ProductUom) => {
    setSelectedUom(uom);
    setIsUomDropdownOpen(false);
  };

  // Handle import
  const handleImport = async () => {
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
      // Convert parsed products to import input format
      const productInputs: ProductImportItemInput[] = parsedProducts.map(p => ({
        factoryPartNumber: p.factoryPartNumber,
        unitPrice: p.unitPrice.toString(),
        description: p.description || undefined,
        upc: p.upc || undefined,
        quantityPricing: p.quantityPricing.length > 0
          ? p.quantityPricing.map(qp => ({
              quantityLow: qp.quantityLow.toString(),
              quantityHigh: qp.quantityHigh?.toString() ?? null,
              unitPrice: qp.unitPrice.toString(),
            } as QuantityPricingImportInput))
          : undefined,
      }));

      const result = await importProducts(
        {
          factoryId: selectedFactory.id,
          products: productInputs,
        },
        selectedUom.id
      );

      setImportResult({
        success: result.success,
        message: result.message,
        created: result.productsCreated,
        updated: result.productsUpdated,
        errors: result.errors,
      });

      if (result.success) {
        toast.success(result.message);
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
        errors: [],
      });
    } finally {
      setIsImporting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <main className="flex-1 bg-gray-50 overflow-hidden flex flex-col">
      {/* Header */}
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
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Import Products</h1>
                <p className="text-sm text-gray-500">
                  Import products from JSON file (workflow output)
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/products')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={isImporting || !selectedFactory || !selectedUom || parsedProducts.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isImporting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Importing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Import {parsedProducts.length} Products
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Configuration Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h2>

            <div className="grid grid-cols-2 gap-4">
              {/* Factory Selection */}
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
                      }
                    }}
                    onFocus={() => setIsFactoryDropdownOpen(true)}
                    className={inputClass}
                    placeholder="Search factories..."
                  />
                  {isFactoryDropdownOpen && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {isLoadingFactories ? (
                        <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
                      ) : factories.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          {factorySearchTerm ? 'No factories found' : 'Start typing to search'}
                        </div>
                      ) : (
                        factories.map((factory) => (
                          <button
                            key={factory.id}
                            type="button"
                            onClick={() => handleFactorySelect(factory)}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                              selectedFactory?.id === factory.id ? 'bg-blue-50 text-blue-700' : ''
                            }`}
                          >
                            {factory.title}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* UOM Selection */}
              <div>
                <label className={labelClass}>Default Unit of Measure *</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsUomDropdownOpen(!isUomDropdownOpen)}
                    className={`${inputClass} text-left flex items-center justify-between`}
                  >
                    <span className={selectedUom ? 'text-gray-900' : 'text-gray-400'}>
                      {selectedUom?.title || 'Select UOM...'}
                    </span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isUomDropdownOpen && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {uoms.map((uom) => (
                        <button
                          key={uom.id}
                          type="button"
                          onClick={() => handleUomSelect(uom)}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                            selectedUom?.id === uom.id ? 'bg-blue-50 text-blue-700' : ''
                          }`}
                        >
                          {uom.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload JSON File</h2>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
                id="json-upload"
              />
              <label
                htmlFor="json-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700">
                  {file ? file.name : 'Click to upload JSON file'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Download the JSON from a workflow result and upload it here
                </p>
              </label>
            </div>

            {parseError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{parseError}</p>
              </div>
            )}
          </div>

          {/* Import Result */}
          {importResult && (
            <div className={`rounded-lg border p-6 ${
              importResult.success
                ? 'bg-green-50 border-green-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <h3 className={`text-lg font-semibold mb-2 ${
                importResult.success ? 'text-green-800' : 'text-yellow-800'
              }`}>
                Import Result
              </h3>
              <p className={`text-sm ${importResult.success ? 'text-green-700' : 'text-yellow-700'}`}>
                {importResult.message}
              </p>
              <div className="mt-3 flex gap-4 text-sm">
                <span className="text-green-700">Created: {importResult.created}</span>
                <span className="text-blue-700">Updated: {importResult.updated}</span>
                {importResult.errors.length > 0 && (
                  <span className="text-red-700">Errors: {importResult.errors.length}</span>
                )}
              </div>
              {importResult.errors.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-red-800 mb-2">Errors:</p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {importResult.errors.map((err, idx) => (
                      <p key={idx} className="text-xs text-red-700">
                        {err.factoryPartNumber}: {err.error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preview Section */}
          {parsedProducts.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Preview ({parsedProducts.length} products)
                </h2>
                <span className="text-sm text-gray-500">
                  Showing first 10 products
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 font-medium text-gray-700">Part Number</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-700">Description</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-700">Base Price</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-700">5+ Price</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-700">10+ Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedProducts.slice(0, 10).map((product, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-3 font-mono text-xs">{product.factoryPartNumber}</td>
                        <td className="py-2 px-3 text-gray-600 truncate max-w-xs">
                          {product.description || '-'}
                        </td>
                        <td className="py-2 px-3 text-right">{formatPrice(product.unitPrice)}</td>
                        <td className="py-2 px-3 text-right">
                          {product.quantityPricing.find(p => p.quantityLow === 5)
                            ? formatPrice(product.quantityPricing.find(p => p.quantityLow === 5)!.unitPrice)
                            : '-'}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {product.quantityPricing.find(p => p.quantityLow === 10)
                            ? formatPrice(product.quantityPricing.find(p => p.quantityLow === 10)!.unitPrice)
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {parsedProducts.length > 10 && (
                <p className="mt-3 text-sm text-gray-500 text-center">
                  ... and {parsedProducts.length - 10} more products
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
