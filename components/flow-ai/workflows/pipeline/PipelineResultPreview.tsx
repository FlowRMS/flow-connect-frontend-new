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
  onDownloadJson: (data: unknown) => void;
}

export function PipelineResultPreview({
  nodeResult,
  isNavigatingToImport,
  onNavigateToImport,
  onDownloadJson,
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
          <Button variant="outline" onClick={() => onDownloadJson(nodeResult)}>
            <Download className="w-4 h-4 mr-2" />
            Download JSON
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-green-600" />
        <div>
          <h3 className="font-medium text-green-800">Execution completed</h3>
          <p className="text-sm text-green-700">Workflow executed successfully</p>
        </div>
      </div>
    </div>
  );
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
