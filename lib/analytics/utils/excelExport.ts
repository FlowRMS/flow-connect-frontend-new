/**
 * Export utility that converts CSV to XLSX via GraphQL mutation
 */

import { apolloClient } from '@/lib/analytics/apolloClient';
import { TRANSFORM_TO_EXCEL } from '@/lib/analytics/graphql/mutations/transformToExcel';
import { buildCsvString, type ColumnForExport } from './exportGridCsv';

/**
 * Creates a File object from CSV string
 */
function createCSVFile(csvContent: string, filename: string): File {
  const blob = new Blob([csvContent], { type: 'text/csv' });
  return new File([blob], filename, { type: 'text/csv' });
}

/**
 * Exports grid data to XLSX by converting to CSV first,
 * then sending to GraphQL mutation for transformation
 */
export async function exportToExcelViaGraphQL({
  filename,
  columns,
  rows,
  csvFile,
}: {
  filename: string;
  columns: ColumnForExport[];
  rows: Record<string, unknown>[];
  csvFile?: File;
}): Promise<void> {
  try {
    console.log('[exportToExcelViaGraphQL] Starting export with', rows.length, 'rows');

    let csvContent: string;
    let actualCsvFile: File;

    if (csvFile) {
      // Use the provided CSV file directly (contains pivot hierarchy)
      console.log('[exportToExcelViaGraphQL] Using provided CSV file with pivot hierarchy');
      actualCsvFile = csvFile;
    } else {
      // Step 1: Convert grid data to CSV using the SAME logic as CSV export
      csvContent = buildCsvString(columns, rows);
      console.log('[exportToExcelViaGraphQL] CSV generated using same logic as CSV export, size:', csvContent.length, 'bytes');

      // Step 2: Create a File object from the CSV content
      const csvFilename = `${filename}.csv`;
      actualCsvFile = createCSVFile(csvContent, csvFilename);
      console.log('[exportToExcelViaGraphQL] CSV file created:', csvFilename);
    }

    // Step 3: Send to GraphQL query using apollo-upload-client protocol
    console.log('[exportToExcelViaGraphQL] Sending to GraphQL query...');
    
    let data;
    try {
      const result = await apolloClient.query({
        query: TRANSFORM_TO_EXCEL,
        variables: {
          file: actualCsvFile,
        },
        fetchPolicy: 'no-cache', // Ensure fresh data for file uploads
      });
      data = result.data;
    } catch (networkError: unknown) {
      // Handle CORS and network errors specifically
      const errorMessage = networkError instanceof Error ? networkError.message : String(networkError);
      if (errorMessage?.includes('Failed to fetch') || 
          errorMessage?.includes('CORS') ||
          errorMessage?.includes('Access-Control-Allow-Origin')) {
        console.warn('[exportToExcelViaGraphQL] CORS or network error detected:', errorMessage);
        console.warn('[exportToExcelViaGraphQL] This usually means the GraphQL server needs CORS configuration for file uploads');
        throw new Error('Network error: Unable to connect to GraphQL server. This may be a CORS configuration issue on the server side.');
      }
      // Re-throw other errors
      throw networkError;
    }

    console.log('[exportToExcelViaGraphQL] Query response:', data);

    // Step 4: The query should return a URL or base64 string
    const excelUrl = (data as { transformToExcel?: string })?.transformToExcel;
    
    if (!excelUrl) {
      throw new Error('No XLSX URL returned from query');
    }

    // Step 5: Download the XLSX file
    console.log('[exportToExcelViaGraphQL] Downloading XLSX from:', excelUrl);
    
    // Check if it's a presigned URL (starts with http/https)
    if (excelUrl.startsWith('http://') || excelUrl.startsWith('https://')) {
      // Use direct navigation to bypass CORS - presigned URLs don't need fetch
      console.log('[exportToExcelViaGraphQL] Detected presigned URL, using direct download');
      const link = document.createElement('a');
      link.href = excelUrl;
      link.download = `${filename}.xlsx`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (excelUrl.startsWith('data:')) {
      // Base64 data URL - handle as before
      console.log('[exportToExcelViaGraphQL] Detected data URL, using blob download');
      const link = document.createElement('a');
      link.href = excelUrl;
      link.download = `${filename}.xlsx`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Regular URL - fetch and download (keep existing behavior for compatibility)
      console.log('[exportToExcelViaGraphQL] Detected regular URL, fetching blob');
      const response = await fetch(excelUrl);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.xlsx`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }

    console.log('[exportToExcelViaGraphQL] Export completed successfully');
  } catch (error) {
    console.error('[exportToExcelViaGraphQL] Export failed:', error);
    throw error;
  }
}


