/**
 * Download operations hook
 * Handles document download state and operations
 */

import { useState, useCallback } from 'react';
import JSZip from 'jszip';
import type { Takeoff, TakeoffDocument } from '../../types';
import { showErrorToast } from '../../../lib/toast';

interface UseDownloadProps {
  documents: TakeoffDocument[];
  selectedTakeoff: Takeoff | null;
}

export function useDownload({ documents, selectedTakeoff }: UseDownloadProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  // Download a single document
  const handleDownloadDocument = useCallback(async (doc: TakeoffDocument) => {
    // Use abridged URL if available, otherwise original
    const urlToDownload = doc.abridgedUrl || doc.documentUrl;

    if (!urlToDownload) {
      showErrorToast('No URL available', { description: 'Document URL not found.' });
      return;
    }

    try {
      // Use our proxy to avoid CORS
      const proxyUrl = `/api/document-proxy?url=${encodeURIComponent(urlToDownload)}`;
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('[Download] Exception:', error);
      showErrorToast('Download failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, []);

  // Download all documents as ZIP
  const handleDownloadAllDocuments = useCallback(async () => {
    if (documents.length === 0) {
      showErrorToast('No documents', { description: 'No documents to download.' });
      return;
    }

    setIsDownloading(true);
    let addedCount = 0;

    try {
      const zip = new JSZip();
      const folder = zip.folder(selectedTakeoff?.title || 'takeoff-documents');

      if (!folder) {
        throw new Error('Failed to create ZIP folder');
      }

      // Download each document and add to ZIP
      for (const doc of documents) {
        const urlToDownload = doc.abridgedUrl || doc.documentUrl;
        if (!urlToDownload) {
          console.warn(`[ZIP] Skipping ${doc.name}: no URL available (abridgedUrl: ${doc.abridgedUrl}, documentUrl: ${doc.documentUrl})`);
          continue;
        }

        try {
          const proxyUrl = `/api/document-proxy?url=${encodeURIComponent(urlToDownload)}`;
          const response = await fetch(proxyUrl);

          if (response.ok) {
            const blob = await response.blob();
            if (blob.size > 0) {
              folder.file(doc.name, blob);
              addedCount++;
            } else {
              console.warn(`[ZIP] Empty blob for ${doc.name}`);
            }
          } else {
            console.error(`[ZIP] Failed to fetch ${doc.name}: ${response.status} ${response.statusText}`);
          }
        } catch (error) {
          console.error(`[ZIP] Error fetching ${doc.name}:`, error);
        }
      }

      if (addedCount === 0) {
        showErrorToast('ZIP is empty', {
          description: 'Could not download any documents. Check console for details.'
        });
        return;
      }

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTakeoff?.title || 'takeoff-documents'}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating ZIP:', error);
      showErrorToast('Download failed', {
        description: error instanceof Error ? error.message : 'Failed to create ZIP'
      });
    } finally {
      setIsDownloading(false);
    }
  }, [documents, selectedTakeoff]);

  return {
    isDownloading,
    handleDownloadDocument,
    handleDownloadAllDocuments,
  };
}
