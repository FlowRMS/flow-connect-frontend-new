'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { saveWorkflowImport } from '@/lib/flow-ai/workflow-import-storage';
import { type Workflow } from '@/lib/flow-ai/workflow-api';
import {
  detectFactoryFromPrompt,
  looksLikeProduct,
  normalizeProduct,
} from '@/lib/flow-ai/product-utils';
import { downloadJson, isValidUrl } from '@/lib/flow-ai/pipeline-utils';

export interface UseProductImportProps {
  prompt: string;
  workflow?: Workflow;
}

export interface UseProductImportReturn {
  isNavigatingToImport: boolean;
  handleNavigateToImport: (data: unknown) => Promise<void>;
  downloadProductImportJson: (data: unknown) => Promise<void>;
}

export function useProductImport({
  prompt,
  workflow,
}: UseProductImportProps): UseProductImportReturn {
  const router = useRouter();
  const [isNavigatingToImport, setIsNavigatingToImport] = useState(false);

  const fetchFullDataFromUrl = useCallback(async (
    outputFileUrl: string,
    previewData: unknown[]
  ): Promise<unknown[]> => {
    if (!isValidUrl(outputFileUrl)) {
      console.error('Backend returned local path instead of S3 URL:', outputFileUrl);
      return previewData;
    }

    try {
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
    }

    return previewData;
  }, []);

  const extractRawProducts = useCallback(async (data: Record<string, unknown>): Promise<unknown[]> => {
    const previewData = (data.preview_products || data.preview_rows) as unknown[] | undefined;

    if (data.output_file && previewData && Array.isArray(previewData)) {
      return fetchFullDataFromUrl(data.output_file as string, previewData);
    }

    if (data.products && Array.isArray(data.products)) {
      return data.products;
    }

    const result = data.result as Record<string, unknown> | undefined;
    if (result?.products && Array.isArray(result.products)) {
      return result.products;
    }

    const nestedData = data.data as Record<string, unknown> | undefined;
    if (nestedData?.products && Array.isArray(nestedData.products)) {
      return nestedData.products;
    }

    if (Array.isArray(data) && data.length > 0 && looksLikeProduct(data[0])) {
      return data as unknown[];
    }

    return [];
  }, [fetchFullDataFromUrl]);

  const handleNavigateToImport = useCallback(async (data: unknown) => {
    if (isNavigatingToImport) return;

    setIsNavigatingToImport(true);
    try {
      const dataObj = data as Record<string, unknown>;
      const rawProducts = await extractRawProducts(dataObj);

      if (rawProducts.length === 0) {
        toast.error('No products found to import');
        return;
      }

      const products = rawProducts.map(normalizeProduct);
      const detectedFactory = detectFactoryFromPrompt(prompt);

      const sessionId = await saveWorkflowImport({
        workflowId: workflow?.id || 'unknown',
        workflowName: workflow?.name || 'Workflow',
        detectedFactory,
        products,
        outputFileUrl: dataObj.output_file as string | undefined,
      });

      if (!sessionId) {
        toast.error('Error saving data. Try downloading the JSON manually.');
        return;
      }

      toast.success('Redirecting to product import...');
      router.push(`/products/import?from=workflow&session=${sessionId}`);
    } catch (error) {
      console.error('Failed to navigate to import:', error);
      toast.error('Error preparing import. Try downloading the JSON manually.');
    } finally {
      setIsNavigatingToImport(false);
    }
  }, [isNavigatingToImport, prompt, workflow, router, extractRawProducts]);

  const downloadProductImportJson = useCallback(async (data: unknown) => {
    try {
      const dataObj = data as Record<string, unknown>;
      const previewData = (dataObj.preview_products || dataObj.preview_rows) as unknown[] | undefined;
      const totalCount = (dataObj.total_products || dataObj.row_count || previewData?.length || 0) as number;

      if (dataObj.output_file && previewData && Array.isArray(previewData)) {
        const outputFileUrl = dataObj.output_file as string;

        if (!isValidUrl(outputFileUrl)) {
          console.error('Backend returned local path instead of S3 URL:', outputFileUrl);
          const normalizedProducts = previewData.map(normalizeProduct);
          downloadJson('products-import.json', { products: normalizedProducts });
          toast.warning(`Downloaded preview only (${normalizedProducts.length} of ${totalCount}). Backend error: file not uploaded to S3.`);
          return;
        }

        toast.info('Downloading full product data from server...');
        try {
          const response = await fetch(outputFileUrl);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const text = await response.text();
          try {
            const jsonData = JSON.parse(text);
            if (jsonData.products && Array.isArray(jsonData.products)) {
              jsonData.products = jsonData.products.map(normalizeProduct);
              downloadJson('products-import.json', jsonData);
              toast.success(`Downloaded ${jsonData.products.length} products.`);
            } else if (Array.isArray(jsonData)) {
              const normalized = jsonData.map(normalizeProduct);
              downloadJson('products-import.json', { products: normalized });
              toast.success(`Downloaded ${normalized.length} products.`);
            } else {
              const normalizedProducts = previewData.map(normalizeProduct);
              downloadJson('products-import.json', { products: normalizedProducts });
              toast.info(`Downloaded preview (${normalizedProducts.length} of ${totalCount}).`);
            }
          } catch {
            const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = 'products-export.csv';
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(url);
            toast.success('Downloaded as CSV (output was not JSON format).');
          }
        } catch (fetchError) {
          console.error('Failed to fetch from S3:', fetchError);
          const normalizedProducts = previewData.map(normalizeProduct);
          downloadJson('products-import.json', { products: normalizedProducts });
          toast.warning(`Downloaded preview only (${normalizedProducts.length} of ${totalCount}). Could not fetch full file.`);
        }
        return;
      }

      if (dataObj.products && Array.isArray(dataObj.products)) {
        const normalizedProducts = dataObj.products.map(normalizeProduct);
        downloadJson('products-import.json', { products: normalizedProducts });
        toast.success(`Downloaded ${normalizedProducts.length} products.`);
        return;
      }

      downloadJson('products-import.json', data);
      toast.success('Product data downloaded.');
    } catch (error) {
      console.error('Failed to download product data:', error);
      toast.error('Failed to download. Try copying from Raw JSON tab.');
    }
  }, []);

  return {
    isNavigatingToImport,
    handleNavigateToImport,
    downloadProductImportJson,
  };
}
