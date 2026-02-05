'use client';

import { Loader2, CheckCircle2, Download, ArrowRight } from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import {
  isProductImportJson,
  extractProducts,
  getProductPartNumber,
  getProductDescription,
  getProductPrice,
} from '@/lib/flow-ai/product-utils';

export interface PipelineResultPreviewProps {
  nodeResult: unknown;
  isNavigatingToImport: boolean;
  onNavigateToImport: (data: unknown) => void;
  onDownloadCsv?: (data: unknown) => void;
  isPricingTemplate?: boolean;
}

export function PipelineResultPreview({
  nodeResult,
  isNavigatingToImport,
  onNavigateToImport,
  onDownloadCsv,
  isPricingTemplate = false,
}: PipelineResultPreviewProps) {
  const isProductImport = isProductImportJson(nodeResult);
  const { products: allProducts, isStreaming, totalCount } = extractProducts(nodeResult);
  const previewProducts = allProducts.slice(0, 5);

  if (isProductImport) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-green-800">Processing completed</h3>
              <p className="text-sm text-green-700">
                {isStreaming
                  ? `${totalCount}+ products ready to import`
                  : `${totalCount} products ready to import`}
              </p>
            </div>
          </div>
        </div>

        {previewProducts.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-2 border-b">
              <span className="text-sm font-medium">Product preview</span>
            </div>
            <div className="divide-y">
              {previewProducts.map((product, idx) => {
                const productObj = product as Record<string, unknown>;
                return (
                  <div key={idx} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-mono text-sm">{getProductPartNumber(productObj)}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                        {getProductDescription(productObj)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${getProductPrice(productObj).toFixed(2)}</p>
                      <ProductPricingBadges product={productObj} />
                    </div>
                  </div>
                );
              })}
              {(totalCount > 5 || isStreaming) && (
                <div className="px-4 py-2 bg-muted/50 text-center text-xs text-muted-foreground">
                  {isStreaming ? '... and more products' : `... and ${totalCount - 5} more products`}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          {isPricingTemplate ? (
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => onNavigateToImport(nodeResult)}
              disabled={isNavigatingToImport}
            >
              {isNavigatingToImport ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  Import Products
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            onDownloadCsv && (
              <Button
                className="flex-1"
                onClick={() => onDownloadCsv(nodeResult)}
              >
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
            )
          )}
        </div>
      </div>
    );
  }

  // For non-product results, try to extract generic data rows
  const genericRows = extractGenericRows(nodeResult);
  const previewRows = genericRows.slice(0, 5);
  const totalRows = genericRows.length;

  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-medium text-green-800">Execution completed</h3>
            <p className="text-sm text-green-700">
              {totalRows > 0
                ? `${totalRows} rows processed successfully`
                : 'Workflow executed successfully'}
            </p>
          </div>
        </div>
      </div>

      {previewRows.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted px-4 py-2 border-b">
            <span className="text-sm font-medium">Data preview</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {Object.keys(previewRows[0]).slice(0, 5).map((key) => (
                    <th key={key} className="px-3 py-2 text-left font-medium text-muted-foreground">
                      {key}
                    </th>
                  ))}
                  {Object.keys(previewRows[0]).length > 5 && (
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">...</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y">
                {previewRows.map((row, idx) => (
                  <tr key={idx}>
                    {Object.values(row).slice(0, 5).map((value, colIdx) => (
                      <td key={colIdx} className="px-3 py-2 truncate max-w-[150px]">
                        {formatCellValue(value)}
                      </td>
                    ))}
                    {Object.keys(row).length > 5 && (
                      <td className="px-3 py-2 text-muted-foreground">...</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalRows > 5 && (
            <div className="px-4 py-2 bg-muted/50 text-center text-xs text-muted-foreground border-t">
              ... and {totalRows - 5} more rows
            </div>
          )}
        </div>
      )}

      {onDownloadCsv && (
        <Button
          className="w-full"
          onClick={() => onDownloadCsv(nodeResult)}
        >
          <Download className="w-4 h-4 mr-2" />
          Download CSV
        </Button>
      )}
    </div>
  );
}

function extractGenericRows(data: unknown): Record<string, unknown>[] {
  if (!data) return [];

  // If it's already an array
  if (Array.isArray(data)) {
    return data.filter((item): item is Record<string, unknown> =>
      typeof item === 'object' && item !== null
    );
  }

  // If it's an object, check common data properties (same logic as execution page)
  const obj = data as Record<string, unknown>;

  // Check direct array properties
  const possibleArrayProps = [
    'data',
    'rows',
    'result',
    'results',
    'items',
    'records',
    'preview_rows',
    'customer_price_list',
  ];

  for (const prop of possibleArrayProps) {
    if (Array.isArray(obj[prop])) {
      return (obj[prop] as unknown[]).filter((item): item is Record<string, unknown> =>
        typeof item === 'object' && item !== null
      );
    }
  }

  // Check inside nodes.node4.result structure (pipeline result format)
  const nodes = obj.nodes as Record<string, unknown> | undefined;
  if (nodes?.node4) {
    const node4 = nodes.node4 as Record<string, unknown>;
    const node4Result = node4.result;

    if (Array.isArray(node4Result)) {
      return node4Result.filter((item): item is Record<string, unknown> =>
        typeof item === 'object' && item !== null
      );
    }

    if (node4Result && typeof node4Result === 'object') {
      const resultObj = node4Result as Record<string, unknown>;
      for (const prop of possibleArrayProps) {
        if (Array.isArray(resultObj[prop])) {
          return (resultObj[prop] as unknown[]).filter((item): item is Record<string, unknown> =>
            typeof item === 'object' && item !== null
          );
        }
      }
    }
  }

  return [];
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

interface ProductPricingBadgesProps {
  product: Record<string, unknown>;
}

function ProductPricingBadges({ product }: ProductPricingBadgesProps) {
  const quantityPricing = product.quantityPricing as unknown[] | undefined;
  const customerPricing = product.customerPricing as unknown[] | undefined;

  return (
    <div className="flex flex-col items-end gap-0.5">
      {quantityPricing && quantityPricing.length > 0 && (
        <span className="text-xs text-blue-600">{quantityPricing.length} quantity prices</span>
      )}
      {customerPricing && customerPricing.length > 0 && (
        <span className="text-xs text-purple-600">{customerPricing.length} customer prices</span>
      )}
    </div>
  );
}
