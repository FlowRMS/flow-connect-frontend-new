declare module 'pdfjs-dist/build/pdf.mjs' {
  export const version: string;
  export const GlobalWorkerOptions: {
    workerSrc: string;
  };
  export function getDocument(
    src: string | ArrayBuffer | { data: ArrayBuffer }
  ): {
    promise: Promise<{
      numPages: number;
      getPage(pageNumber: number): Promise<{
        getViewport(options: { scale: number }): {
          width: number;
          height: number;
        };
        render(options: {
          canvasContext: CanvasRenderingContext2D;
          viewport: { width: number; height: number };
        }): { promise: Promise<void> };
      }>;
    }>;
  };
}
