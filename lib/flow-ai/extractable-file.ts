/**
 * Checks if a value is an extractable file for GraphQL multipart uploads.
 * Based on apollo-upload-client's isExtractableFile function.
 */
export function isExtractableFile(value: unknown): boolean {
  return (
    (typeof File !== "undefined" && value instanceof File) ||
    (typeof Blob !== "undefined" && value instanceof Blob) ||
    (typeof FileList !== "undefined" && value instanceof FileList)
  );
}





