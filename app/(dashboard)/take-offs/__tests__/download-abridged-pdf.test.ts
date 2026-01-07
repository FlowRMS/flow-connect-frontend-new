/**
 * Regression Tests: Download Abridged PDF
 *
 * These tests ensure that when downloading documents, the abridged PDF is
 * downloaded instead of the original when available.
 *
 * Bug history:
 * - Clicking "Abridged to X pages" link downloaded the original PDF instead of abridged
 * - Fix: handleDownloadDocument and handleDownloadAllDocuments now use abridgedUrl || documentUrl
 *
 * Bug #2 (wasAbridged fix):
 * - Backend returns success=true but same URL when reduction < 30% threshold
 * - Frontend was storing abridgedUrl even when no new PDF was generated
 * - Fix: Only use abridgedUrl when wasAbridged=true from API response
 *
 * Expected behavior:
 * - If doc.abridgedUrl exists, download that
 * - Otherwise, download doc.documentUrl
 * - abridgedUrl should only be set when wasAbridged=true (new PDF actually generated)
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Download Abridged PDF - Regression Tests', () => {
  const takeoffDetailPagePath = path.join(__dirname, '../[id]/page.tsx');
  let pageSource: string;

  beforeAll(() => {
    pageSource = fs.readFileSync(takeoffDetailPagePath, 'utf-8');
  });

  describe('handleDownloadDocument', () => {
    it('should use abridgedUrl when available', () => {
      // Extract handleDownloadDocument function
      const funcMatch = pageSource.match(
        /const handleDownloadDocument = async[\s\S]*?(?=\n  const handleDownloadAllDocuments)/
      );

      expect(funcMatch).toBeTruthy();
      const funcBody = funcMatch![0];

      // Should prioritize abridgedUrl over documentUrl
      expect(funcBody).toContain('doc.abridgedUrl || doc.documentUrl');
    });

    it('should have comment explaining URL priority', () => {
      const funcMatch = pageSource.match(
        /const handleDownloadDocument = async[\s\S]*?(?=\n  const handleDownloadAllDocuments)/
      );

      expect(funcMatch).toBeTruthy();
      const funcBody = funcMatch![0];

      // Should have comment about using abridged URL
      expect(funcBody).toContain('abridged URL if available');
    });

    it('should use urlToDownload variable consistently', () => {
      const funcMatch = pageSource.match(
        /const handleDownloadDocument = async[\s\S]*?(?=\n  const handleDownloadAllDocuments)/
      );

      expect(funcMatch).toBeTruthy();
      const funcBody = funcMatch![0];

      // Should define urlToDownload
      expect(funcBody).toContain('const urlToDownload = doc.abridgedUrl || doc.documentUrl');
      // Should use urlToDownload in proxy URL
      expect(funcBody).toContain('encodeURIComponent(urlToDownload)');
      // Should use urlToDownload in fallback window.open
      expect(funcBody).toContain('window.open(urlToDownload');
    });
  });

  describe('handleDownloadAllDocuments', () => {
    it('should use abridgedUrl when available for each document', () => {
      // Extract handleDownloadAllDocuments function
      const funcMatch = pageSource.match(
        /const handleDownloadAllDocuments = async[\s\S]*?(?=\n  const handleAbridgeDocument)/
      );

      expect(funcMatch).toBeTruthy();
      const funcBody = funcMatch![0];

      // Should prioritize abridgedUrl over documentUrl
      expect(funcBody).toContain('doc.abridgedUrl || doc.documentUrl');
    });

    it('should filter documents that have either URL', () => {
      const funcMatch = pageSource.match(
        /const handleDownloadAllDocuments = async[\s\S]*?(?=\n  const handleAbridgeDocument)/
      );

      expect(funcMatch).toBeTruthy();
      const funcBody = funcMatch![0];

      // Should filter for documents with either URL
      expect(funcBody).toContain('d.documentUrl || d.abridgedUrl');
    });

    it('should have comment explaining URL priority', () => {
      const funcMatch = pageSource.match(
        /const handleDownloadAllDocuments = async[\s\S]*?(?=\n  const handleAbridgeDocument)/
      );

      expect(funcMatch).toBeTruthy();
      const funcBody = funcMatch![0];

      // Should have comment about using abridged URL
      expect(funcBody).toContain('abridged URL if available');
    });

    it('should use urlToDownload for ZIP file creation', () => {
      const funcMatch = pageSource.match(
        /const handleDownloadAllDocuments = async[\s\S]*?(?=\n  const handleAbridgeDocument)/
      );

      expect(funcMatch).toBeTruthy();
      const funcBody = funcMatch![0];

      // Should define urlToDownload in the map function
      expect(funcBody).toContain('const urlToDownload = doc.abridgedUrl || doc.documentUrl');
      // Should use urlToDownload in proxy URL
      expect(funcBody).toContain('encodeURIComponent(urlToDownload)');
      // Should use urlToDownload for file extension extraction
      expect(funcBody).toContain('new URL(urlToDownload)');
    });
  });

  describe('No hardcoded documentUrl usage', () => {
    it('handleDownloadDocument should NOT use doc.documentUrl directly for download', () => {
      const funcMatch = pageSource.match(
        /const handleDownloadDocument = async[\s\S]*?(?=\n  const handleDownloadAllDocuments)/
      );

      expect(funcMatch).toBeTruthy();
      const funcBody = funcMatch![0];

      // After defining urlToDownload, should NOT use doc.documentUrl directly
      // (except in the fallback assignment)
      const afterUrlDefinition = funcBody.split('const urlToDownload')[1];
      if (afterUrlDefinition) {
        // Should not have doc.documentUrl in proxy URL or window.open
        expect(afterUrlDefinition).not.toContain('encodeURIComponent(doc.documentUrl)');
        expect(afterUrlDefinition).not.toMatch(/window\.open\(doc\.documentUrl/);
      }
    });
  });

  describe('wasAbridged flag handling (Bug #2 fix)', () => {
    it('handleAbridgeDocument should use effectiveAbridgedUrl based on wasAbridged', () => {
      // Extract handleAbridgeDocument function
      const funcMatch = pageSource.match(
        /const handleAbridgeDocument = async[\s\S]*?(?=\n  \/\/ Cross a single|const handleCrossItem)/
      );

      expect(funcMatch).toBeTruthy();
      const funcBody = funcMatch![0];

      // Should define effectiveAbridgedUrl based on wasAbridged
      expect(funcBody).toContain('const effectiveAbridgedUrl = result.wasAbridged ? result.abridgedUrl : undefined');
    });

    it('handleAbridgeDocument should use effectiveAbridgedUrl when updating state', () => {
      const funcMatch = pageSource.match(
        /const handleAbridgeDocument = async[\s\S]*?(?=\n  \/\/ Cross a single|const handleCrossItem)/
      );

      expect(funcMatch).toBeTruthy();
      const funcBody = funcMatch![0];

      // Should use effectiveAbridgedUrl in setDocuments
      expect(funcBody).toContain('abridgedUrl: effectiveAbridgedUrl');
    });

    it('handleAbridgeDocument should use effectiveAbridgedUrl when persisting to backend', () => {
      const funcMatch = pageSource.match(
        /const handleAbridgeDocument = async[\s\S]*?(?=\n  \/\/ Cross a single|const handleCrossItem)/
      );

      expect(funcMatch).toBeTruthy();
      const funcBody = funcMatch![0];

      // Should use effectiveAbridgedUrl in updateTakeoffDocument call
      expect(funcBody).toContain('abridgedUrl: effectiveAbridgedUrl || null');
    });

    it('handleAbridgeDocument should NOT use result.abridgedUrl directly for state/persist', () => {
      const funcMatch = pageSource.match(
        /const handleAbridgeDocument = async[\s\S]*?(?=\n  \/\/ Cross a single|const handleCrossItem)/
      );

      expect(funcMatch).toBeTruthy();
      const funcBody = funcMatch![0];

      // After defining effectiveAbridgedUrl, should NOT use result.abridgedUrl directly
      const afterEffectiveDefinition = funcBody.split('const effectiveAbridgedUrl')[1];
      if (afterEffectiveDefinition) {
        // Should not have result.abridgedUrl in setDocuments or updateTakeoffDocument
        // (it's ok to have it in logging)
        const stateUpdateSection = afterEffectiveDefinition.match(/setDocuments[\s\S]*?(?=\n\s*\/\/ Persist|await updateTakeoffDocument)/);
        if (stateUpdateSection) {
          expect(stateUpdateSection[0]).not.toMatch(/abridgedUrl:\s*result\.abridgedUrl/);
        }
      }
    });
  });
});
