'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Download, ArrowRight, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/flow-ai/ui/card';
import { toast } from 'sonner';
import { saveWorkflowImport } from '@/lib/flow-ai/workflow-import-storage';
import {
  isProductImportJson,
  extractProducts,
  getProductPartNumber,
  getProductDescription,
  getProductPrice,
  normalizeProduct,
  looksLikeProduct,
} from '@/lib/flow-ai/product-utils';
import { downloadJson, isValidUrl } from '@/lib/flow-ai/pipeline-utils';

interface PricingTemplateResultsProps {
  result: unknown;
  templateName: string;
  templateId?: string;
  onReset: () => void;
}

export function PricingTemplateResults({ result, templateName, templateId, onReset }: PricingTemplateResultsProps) {
  const router = useRouter();
  const [isNavigatingToImport, setIsNavigatingToImport] = useState(false);

  const isProductImport = isProductImportJson(result);
  const { products: allProducts, totalCount } = extractProducts(result);
  const previewProducts = allProducts.slice(0, 5);

  // Fetch full data from S3 URL when streaming was used
  const fetchFullDataFromUrl = useCallback(async (
    outputFileUrl: string,
    previewData: unknown[]
  ): Promise<unknown[]> => {
    if (!isValidUrl(outputFileUrl)) {
      console.error('Backend returned local path instead of S3 URL:', outputFileUrl);
      return previewData;
    }

    try {
      toast.info('Fetching full product data...');
      const response = await fetch(outputFileUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      const jsonData = JSON.parse(text);

      if (jsonData.products && Array.isArray(jsonData.products)) {
        return jsonData.products;
      } else if (Array.isArray(jsonData)) {
        return jsonData;
      }
    } catch (error) {
      console.error('Failed to fetch from output URL:', error);
      toast.warning('Could not fetch full data, using preview only');
    }

    return previewData;
  }, []);

  // Extract products - checks for output_file URL to get full data
  const extractRawProducts = useCallback(async (data: unknown): Promise<unknown[]> => {
    if (!data) return [];

    const dataObj = data as Record<string, unknown>;

    // Get preview data first
    const previewData = (dataObj.preview_products || dataObj.preview_rows) as unknown[] | undefined;

    // If there's an output_file URL and preview data, fetch full data from S3
    if (dataObj.output_file && previewData && Array.isArray(previewData)) {
      return fetchFullDataFromUrl(dataObj.output_file as string, previewData);
    }

    // Check for products array (full data already present)
    if (dataObj.products && Array.isArray(dataObj.products)) {
      return dataObj.products;
    }

    // Return preview data if available
    if (previewData && Array.isArray(previewData)) {
      return previewData;
    }

    // Check result.products
    const resultData = dataObj.result as Record<string, unknown> | undefined;
    if (resultData?.products && Array.isArray(resultData.products)) {
      return resultData.products;
    }

    // Check data.products
    const nestedData = dataObj.data as Record<string, unknown> | undefined;
    if (nestedData?.products && Array.isArray(nestedData.products)) {
      return nestedData.products;
    }

    // Check if data itself is an array of products
    if (Array.isArray(data) && data.length > 0 && looksLikeProduct(data[0])) {
      return data;
    }

    return [];
  }, [fetchFullDataFromUrl]);

  const handleNavigateToImport = useCallback(async () => {
    if (isNavigatingToImport) return;

    setIsNavigatingToImport(true);
    try {
      // Await the async extraction which may fetch from S3
      const rawProducts = await extractRawProducts(result);

      if (rawProducts.length === 0) {
        toast.error('No products found to import');
        setIsNavigatingToImport(false);
        return;
      }

      const products = rawProducts.map(normalizeProduct);
      const dataObj = result as Record<string, unknown>;

      const sessionId = await saveWorkflowImport({
        workflowId: templateId || 'pricing-template',
        workflowName: templateName || 'Pricing Template',
        detectedFactory: null,
        products,
        outputFileUrl: dataObj.output_file as string | undefined,
      });

      if (!sessionId) {
        toast.error('Error saving data. Try downloading the JSON manually.');
        setIsNavigatingToImport(false);
        return;
      }

      toast.success(`Importing ${products.length} products...`);
      router.push(`/products/import?from=workflow&session=${sessionId}`);
    } catch (error) {
      console.error('Failed to navigate to import:', error);
      toast.error('Error preparing import. Try downloading the JSON manually.');
      setIsNavigatingToImport(false);
    }
  }, [isNavigatingToImport, result, templateId, templateName, router, extractRawProducts]);

  const handleDownloadJson = useCallback(async () => {
    // Await the async extraction which may fetch from S3
    const rawProducts = await extractRawProducts(result);
    if (rawProducts.length === 0) {
      toast.error('No data to download');
      return;
    }

    const filename = `${templateName.replace(/\s+/g, '-').toLowerCase()}-result.json`;
    downloadJson(filename, { products: rawProducts });
    toast.success(`Downloaded ${rawProducts.length} products`);
  }, [result, templateName, extractRawProducts]);

  return (
    <div className="min-h-[calc(100vh-220px)] flex items-center justify-center p-4 pb-8">
      <Card className="w-full max-w-3xl border-2 border-green-500/20 shadow-2xl bg-gradient-to-br from-card via-card to-green-500/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-xl">Processing Complete</CardTitle>
              <CardDescription>Template: {templateName}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {isProductImport && previewProducts.length > 0 ? (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">
                  {totalCount} products ready to import
                </p>
              </div>

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
                  {totalCount > 5 && (
                    <div className="px-4 py-2 bg-muted/50 text-center text-xs text-muted-foreground">
                      ... and {totalCount - 5} more products
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleNavigateToImport}
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
                <Button variant="outline" onClick={handleDownloadJson}>
                  <Download className="w-4 h-4 mr-2" />
                  Download JSON
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">
                  Execution completed successfully
                </p>
              </div>
              <Button variant="outline" className="w-full" onClick={handleDownloadJson}>
                <Download className="w-4 h-4 mr-2" />
                Download Result JSON
              </Button>
            </>
          )}

          <div className="pt-4 border-t">
            <Button variant="ghost" className="w-full" onClick={onReset}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Process Another File
            </Button>
          </div>
        </CardContent>
      </Card>
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
