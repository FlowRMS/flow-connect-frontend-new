import { pdfjs } from 'react-pdf';

let workerInitialized = false;

export function initializePdfWorker() {
  if (typeof window === 'undefined' || workerInitialized) {
    return;
  }

  try {
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      workerInitialized = true;
    }
  } catch (error) {
    console.warn('Failed to initialize PDF.js worker:', error);
  }
}

// Initialize immediately if in browser environment
if (typeof window !== 'undefined') {
  initializePdfWorker();
}




