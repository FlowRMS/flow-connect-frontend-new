/**
 * Regression Tests: No Auto-Save to Known Product Crosses
 *
 * These tests ensure that cross handlers do NOT automatically save to
 * the known_product_crosses table. Users must explicitly click "Save Selected"
 * to persist crosses to the database.
 *
 * Bug history:
 * - handleCrossItem and handleCrossAll were incorrectly calling createKnownProductCross
 *   automatically when crossing items, which caused unwanted database entries.
 * - Fix: Removed auto-save calls; crosses are only saved when user clicks "Save Selected"
 */

import * as fs from 'fs';
import * as path from 'path';

describe('No Auto-Save to Known Product Crosses - Regression Tests', () => {
  // Read the source files
  const useTakeoffsStatePath = path.join(__dirname, '../hooks/useTakeoffsState.ts');
  const takeoffDetailPagePath = path.join(__dirname, '../../../app/(dashboard)/take-offs/[id]/page.tsx');

  let useTakeoffsStateSource: string;
  let takeoffDetailPageSource: string;

  beforeAll(() => {
    useTakeoffsStateSource = fs.readFileSync(useTakeoffsStatePath, 'utf-8');
    takeoffDetailPageSource = fs.readFileSync(takeoffDetailPagePath, 'utf-8');
  });

  describe('useTakeoffsState.ts', () => {
    it('handleCrossItem should NOT call createKnownProductCross', () => {
      // Extract handleCrossItem function body
      const handleCrossItemMatch = useTakeoffsStateSource.match(
        /const handleCrossItem = useCallback\(async[\s\S]*?(?=\n  \/\/ Cross selected items|const handleCrossSelected)/
      );

      expect(handleCrossItemMatch).toBeTruthy();
      const handleCrossItemBody = handleCrossItemMatch![0];

      // Verify it does NOT contain createKnownProductCross call
      expect(handleCrossItemBody).not.toContain('createKnownProductCross(');
      expect(handleCrossItemBody).not.toContain('await createKnownProductCross');
    });

    it('handleCrossAll should NOT call createKnownProductCross', () => {
      // Extract handleCrossAll function body
      const handleCrossAllMatch = useTakeoffsStateSource.match(
        /const handleCrossAll = useCallback\(async[\s\S]*?(?=\n  \/\/ Handle cross types change)/
      );

      expect(handleCrossAllMatch).toBeTruthy();
      const handleCrossAllBody = handleCrossAllMatch![0];

      // Verify it does NOT contain createKnownProductCross call
      expect(handleCrossAllBody).not.toContain('createKnownProductCross(');
      expect(handleCrossAllBody).not.toContain('await createKnownProductCross');
    });

    it('handleSaveSelectedCrosses SHOULD call createKnownProductCross (this is the correct place)', () => {
      // Extract handleSaveSelectedCrosses function body
      const handleSaveSelectedMatch = useTakeoffsStateSource.match(
        /const handleSaveSelectedCrosses = useCallback\(async[\s\S]*?(?=\n  \/\/ Handle deleting)/
      );

      expect(handleSaveSelectedMatch).toBeTruthy();
      const handleSaveSelectedBody = handleSaveSelectedMatch![0];

      // Verify it DOES contain createKnownProductCross call (this is correct)
      expect(handleSaveSelectedBody).toContain('createKnownProductCross');
    });
  });

  describe('take-offs/[id]/page.tsx', () => {
    it('should NOT import createKnownProductCross', () => {
      // Verify the import does not include createKnownProductCross
      const importLine = takeoffDetailPageSource.match(
        /import \{[^}]*\} from ['"]@\/components\/lib\/graphql\/product-crosses['"]/
      );

      expect(importLine).toBeTruthy();
      expect(importLine![0]).not.toContain('createKnownProductCross');
    });

    it('handleCrossItem should NOT call createKnownProductCross', () => {
      // Extract handleCrossItem function
      const handleCrossItemMatch = takeoffDetailPageSource.match(
        /const handleCrossItem = async[\s\S]*?(?=\n  \/\/ Cross all competitor)/
      );

      expect(handleCrossItemMatch).toBeTruthy();
      const handleCrossItemBody = handleCrossItemMatch![0];

      // Verify it does NOT contain createKnownProductCross call
      expect(handleCrossItemBody).not.toContain('createKnownProductCross(');
      expect(handleCrossItemBody).not.toContain('await createKnownProductCross');

      // Should have the comment explaining why
      expect(handleCrossItemBody).toContain('No auto-save to known_product_crosses');
    });

    it('handleCrossAll should NOT call createKnownProductCross', () => {
      // Extract handleCrossAll function
      const handleCrossAllMatch = takeoffDetailPageSource.match(
        /const handleCrossAll = async[\s\S]*?(?=\n  \/\/ Handle Create Quote)/
      );

      expect(handleCrossAllMatch).toBeTruthy();
      const handleCrossAllBody = handleCrossAllMatch![0];

      // Verify it does NOT contain createKnownProductCross call
      expect(handleCrossAllBody).not.toContain('createKnownProductCross(');
      expect(handleCrossAllBody).not.toContain('await createKnownProductCross');
    });
  });

  describe('Code comments documentation', () => {
    it('useTakeoffsState.ts should have documentation about no auto-save', () => {
      // Check for documentation comments in handleCrossItem
      expect(useTakeoffsStateSource).toContain('no auto-save to database');
    });

    it('take-offs/[id]/page.tsx should have documentation about no auto-save', () => {
      expect(takeoffDetailPageSource).toContain('No auto-save to known_product_crosses');
    });
  });
});
