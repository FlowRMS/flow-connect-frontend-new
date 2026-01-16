/**
 * Regression Tests: wasAbridged Flag Handling
 *
 * These tests ensure that both flows (Upload and Detail) correctly handle
 * the wasAbridged flag from the abridgement API.
 *
 * Bug history:
 * - Backend returns success=true but wasAbridged=false when reduction < 30% threshold
 * - In this case, abridgedUrl equals documentUrl (no new PDF generated)
 * - Frontend was storing abridgedUrl even when no new PDF was generated
 * - This caused "Abridged to X pages" link to download the original PDF
 *
 * Fix:
 * - Use effectiveAbridgedUrl = result.wasAbridged ? result.abridgedUrl : undefined
 * - Only store abridgedUrl when a new PDF was actually generated
 *
 * Expected behavior:
 * - wasAbridged=true: Store and use abridgedUrl
 * - wasAbridged=false: Don't store abridgedUrl, use original documentUrl
 */

import * as fs from 'fs';
import * as path from 'path';

describe('wasAbridged Flag Handling - Regression Tests', () => {
  const useTakeoffsStatePath = path.join(__dirname, '../hooks/useTakeoffsState.ts');
  const takeoffDetailPagePath = path.join(__dirname, '../../../app/(dashboard)/take-offs/[id]/page.tsx');

  let useTakeoffsStateSource: string;
  let takeoffDetailPageSource: string;

  beforeAll(() => {
    useTakeoffsStateSource = fs.readFileSync(useTakeoffsStatePath, 'utf-8');
    takeoffDetailPageSource = fs.readFileSync(takeoffDetailPagePath, 'utf-8');
  });

  describe('Upload Flow (useTakeoffsState.ts)', () => {
    describe('handleAbridgeDocument', () => {
      it('should define effectiveAbridgedUrl based on wasAbridged', () => {
        // Extract handleAbridgeDocument function (first one, before handleAbridgeAll)
        const funcMatch = useTakeoffsStateSource.match(
          /const handleAbridgeDocument = useCallback\(async[\s\S]*?(?=\n  \/\/ Helper to add a log)/
        );

        expect(funcMatch).toBeTruthy();
        const funcBody = funcMatch![0];

        // Should define effectiveAbridgedUrl based on wasAbridged
        expect(funcBody).toContain('const effectiveAbridgedUrl = result.wasAbridged ? result.abridgedUrl : undefined');
      });

      it('should use effectiveAbridgedUrl in setDocuments', () => {
        const funcMatch = useTakeoffsStateSource.match(
          /const handleAbridgeDocument = useCallback\(async[\s\S]*?(?=\n  \/\/ Helper to add a log)/
        );

        expect(funcMatch).toBeTruthy();
        const funcBody = funcMatch![0];

        // Should use effectiveAbridgedUrl in state update
        expect(funcBody).toContain('abridgedUrl: effectiveAbridgedUrl || undefined');
      });

      it('should use effectiveAbridgedUrl when persisting to backend', () => {
        const funcMatch = useTakeoffsStateSource.match(
          /const handleAbridgeDocument = useCallback\(async[\s\S]*?(?=\n  \/\/ Helper to add a log)/
        );

        expect(funcMatch).toBeTruthy();
        const funcBody = funcMatch![0];

        // Should use effectiveAbridgedUrl in updateTakeoffDocument
        expect(funcBody).toContain('abridgedUrl: effectiveAbridgedUrl || null');
      });
    });

    describe('handleAbridgeAll', () => {
      it('should define effectiveAbridgedUrl based on wasAbridged', () => {
        // Extract handleAbridgeAll function (ends before handleParseSchedules)
        const funcMatch = useTakeoffsStateSource.match(
          /const handleAbridgeAll = useCallback\(async[\s\S]*?(?=\n  \/\/ Parse schedule documents)/
        );

        expect(funcMatch).toBeTruthy();
        const funcBody = funcMatch![0];

        // Should define effectiveAbridgedUrl based on wasAbridged
        expect(funcBody).toContain('const effectiveAbridgedUrl = result.wasAbridged ? result.abridgedUrl : undefined');
      });

      it('should use effectiveAbridgedUrl in setDocuments', () => {
        const funcMatch = useTakeoffsStateSource.match(
          /const handleAbridgeAll = useCallback\(async[\s\S]*?(?=\n  \/\/ Parse schedule documents)/
        );

        expect(funcMatch).toBeTruthy();
        const funcBody = funcMatch![0];

        // Should use effectiveAbridgedUrl in state update
        expect(funcBody).toContain('abridgedUrl: effectiveAbridgedUrl || undefined');
      });

      it('should use effectiveAbridgedUrl when persisting to backend', () => {
        const funcMatch = useTakeoffsStateSource.match(
          /const handleAbridgeAll = useCallback\(async[\s\S]*?(?=\n  \/\/ Parse schedule documents)/
        );

        expect(funcMatch).toBeTruthy();
        const funcBody = funcMatch![0];

        // Should use effectiveAbridgedUrl in updateTakeoffDocument
        expect(funcBody).toContain('abridgedUrl: effectiveAbridgedUrl || null');
      });

      it('should log appropriate message based on wasAbridged', () => {
        const funcMatch = useTakeoffsStateSource.match(
          /const handleAbridgeAll = useCallback\(async[\s\S]*?(?=\n  \/\/ Parse schedule documents)/
        );

        expect(funcMatch).toBeTruthy();
        const funcBody = funcMatch![0];

        // Should have conditional logging
        expect(funcBody).toContain('if (result.wasAbridged)');
        expect(funcBody).toContain('Creating abridged PDF');
        expect(funcBody).toContain('below threshold');
      });
    });
  });

  describe('Detail Flow (page.tsx)', () => {
    describe('handleAbridgeDocument', () => {
      it('should define effectiveAbridgedUrl based on wasAbridged', () => {
        const funcMatch = takeoffDetailPageSource.match(
          /const handleAbridgeDocument = async[\s\S]*?(?=\n  \/\/ Cross a single|const handleCrossItem)/
        );

        expect(funcMatch).toBeTruthy();
        const funcBody = funcMatch![0];

        // Should define effectiveAbridgedUrl based on wasAbridged
        expect(funcBody).toContain('const effectiveAbridgedUrl = result.wasAbridged ? result.abridgedUrl : undefined');
      });

      it('should use effectiveAbridgedUrl in setDocuments', () => {
        const funcMatch = takeoffDetailPageSource.match(
          /const handleAbridgeDocument = async[\s\S]*?(?=\n  \/\/ Cross a single|const handleCrossItem)/
        );

        expect(funcMatch).toBeTruthy();
        const funcBody = funcMatch![0];

        // Should use effectiveAbridgedUrl in state update
        expect(funcBody).toContain('abridgedUrl: effectiveAbridgedUrl || undefined');
      });

      it('should use effectiveAbridgedUrl when persisting to backend', () => {
        const funcMatch = takeoffDetailPageSource.match(
          /const handleAbridgeDocument = async[\s\S]*?(?=\n  \/\/ Cross a single|const handleCrossItem)/
        );

        expect(funcMatch).toBeTruthy();
        const funcBody = funcMatch![0];

        // Should use effectiveAbridgedUrl in updateTakeoffDocument
        expect(funcBody).toContain('abridgedUrl: effectiveAbridgedUrl || null');
      });

      it('should log wasAbridged status', () => {
        const funcMatch = takeoffDetailPageSource.match(
          /const handleAbridgeDocument = async[\s\S]*?(?=\n  \/\/ Cross a single|const handleCrossItem)/
        );

        expect(funcMatch).toBeTruthy();
        const funcBody = funcMatch![0];

        // Should log wasAbridged for debugging
        expect(funcBody).toContain('wasAbridged');
        expect(funcBody).toContain('result.wasAbridged');
      });
    });
  });

  describe('GraphQL Type and Query', () => {
    const graphqlPath = path.join(__dirname, '../../lib/graphql/takeoffs.ts');
    let graphqlSource: string;

    beforeAll(() => {
      graphqlSource = fs.readFileSync(graphqlPath, 'utf-8');
    });

    it('should include wasAbridged in ABRIDGE_DOCUMENT query', () => {
      expect(graphqlSource).toContain('wasAbridged');

      // Extract the ABRIDGE_DOCUMENT query
      const queryMatch = graphqlSource.match(/const ABRIDGE_DOCUMENT[\s\S]*?`;/);
      expect(queryMatch).toBeTruthy();
      expect(queryMatch![0]).toContain('wasAbridged');
    });

    it('should include wasAbridged in AbridgementResult interface', () => {
      // Extract AbridgementResult interface
      const interfaceMatch = graphqlSource.match(/export interface AbridgementResult[\s\S]*?^\}/m);
      expect(interfaceMatch).toBeTruthy();
      expect(interfaceMatch![0]).toContain('wasAbridged: boolean');
    });
  });
});
