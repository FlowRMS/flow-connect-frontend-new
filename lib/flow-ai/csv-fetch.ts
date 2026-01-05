'use client';

/**
 * Fetches CSV data through the backend proxy to avoid CORS issues.
 */
export async function fetchCsvDataViaProxy(csvUrl: string): Promise<unknown[][] | null> {
  try {
    const response = await fetch('/api/flow-ai/csv-fetch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ csvUrl }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.error) {
      console.error('CSV fetch error:', result.error);
      return null;
    }

    return result.csvData ?? null;
  } catch (error) {
    console.error('Error fetching CSV data:', error);
    return null;
  }
}




