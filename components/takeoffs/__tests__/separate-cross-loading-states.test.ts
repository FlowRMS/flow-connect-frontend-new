/**
 * Regression Tests: Separate Loading States for Cross Buttons
 *
 * These tests ensure that the individual "Cross/Re-Cross" buttons and the "Cross All"
 * button have separate loading states so clicking one doesn't affect the other.
 *
 * Bug history:
 * - Individual Cross buttons and Cross All button shared the same loading state
 * - Clicking an individual Cross button would show "Crossing..." on the Cross All button
 * - Fix: handleCrossItem uses itemCrossingState only, Cross All button uses itemCrossingState to disable
 *
 * Expected behavior:
 * - Cross/Re-Cross individual: spinner only on that row
 * - Cross All: spinners on each row (NO "Crossing..." on main button)
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Separate Cross Loading States - Regression Tests', () => {
  const useTakeoffsStatePath = path.join(__dirname, '../hooks/useTakeoffsState.ts');
  const takeoffDetailPagePath = path.join(__dirname, '../../../app/(dashboard)/take-offs/[id]/page.tsx');
  const parsingTabPath = path.join(__dirname, '../views/ParsingTab.tsx');

  let useTakeoffsStateSource: string;
  let takeoffDetailPageSource: string;
  let parsingTabSource: string;

  beforeAll(() => {
    useTakeoffsStateSource = fs.readFileSync(useTakeoffsStatePath, 'utf-8');
    takeoffDetailPageSource = fs.readFileSync(takeoffDetailPagePath, 'utf-8');
    parsingTabSource = fs.readFileSync(parsingTabPath, 'utf-8');
  });

  describe('useTakeoffsState.ts', () => {
    it('handleCrossItem should use setItemCrossingState for individual item loading', () => {
      // Extract handleCrossItem function
      const handleCrossItemMatch = useTakeoffsStateSource.match(
        /const handleCrossItem = useCallback\(async[\s\S]*?(?=\n  \/\/ Cross selected items|const handleCrossSelected)/
      );

      expect(handleCrossItemMatch).toBeTruthy();
      const handleCrossItemBody = handleCrossItemMatch![0];

      // Should use itemCrossingState for individual item
      expect(handleCrossItemBody).toContain('setItemCrossingState');
      expect(handleCrossItemBody).toContain('itemCrossingState for individual item');
    });

    it('handleCrossItem should NOT use setProductCrossState (which is for Cross All)', () => {
      // Extract handleCrossItem function
      const handleCrossItemMatch = useTakeoffsStateSource.match(
        /const handleCrossItem = useCallback\(async[\s\S]*?(?=\n  \/\/ Cross selected items|const handleCrossSelected)/
      );

      expect(handleCrossItemMatch).toBeTruthy();
      const handleCrossItemBody = handleCrossItemMatch![0];

      // Should NOT use productCrossState (that's for Cross All)
      expect(handleCrossItemBody).not.toContain('setProductCrossState({');
    });

    it('handleCrossAll should use setItemCrossingState for per-row spinners', () => {
      // Extract handleCrossAll function
      const handleCrossAllMatch = useTakeoffsStateSource.match(
        /const handleCrossAll = useCallback\(async[\s\S]*?(?=\n  \/\/ Handle cross types change)/
      );

      expect(handleCrossAllMatch).toBeTruthy();
      const handleCrossAllBody = handleCrossAllMatch![0];

      // Should use itemCrossingState for per-row spinners
      expect(handleCrossAllBody).toContain('setItemCrossingState');
    });
  });

  describe('take-offs/[id]/page.tsx', () => {
    it('handleCrossItem should use setItemCrossingState for individual item loading', () => {
      // Extract handleCrossItem function
      const handleCrossItemMatch = takeoffDetailPageSource.match(
        /const handleCrossItem = async[\s\S]*?(?=\n  \/\/ Cross all competitor)/
      );

      expect(handleCrossItemMatch).toBeTruthy();
      const handleCrossItemBody = handleCrossItemMatch![0];

      // Should use itemCrossingState for individual item
      expect(handleCrossItemBody).toContain('setItemCrossingState');
    });

    it('handleCrossAll should use setItemCrossingState for per-row spinners', () => {
      // Extract handleCrossAll function
      const handleCrossAllMatch = takeoffDetailPageSource.match(
        /const handleCrossAll = async[\s\S]*?(?=\n  \/\/ Handle Create Quote)/
      );

      expect(handleCrossAllMatch).toBeTruthy();
      const handleCrossAllBody = handleCrossAllMatch![0];

      // Should use itemCrossingState for per-row spinners
      expect(handleCrossAllBody).toContain('setItemCrossingState');
    });
  });

  describe('ParsingTab.tsx - Cross All button behavior', () => {
    it('Cross All button should be disabled when any item is processing', () => {
      // Button should check itemCrossingState for any processing items
      expect(parsingTabSource).toContain('Object.values(itemCrossingState).some(s => s.isProcessing)');
    });

    it('Cross All button should NOT have conditional rendering for "Crossing..." text', () => {
      // The Cross All button should NOT use isProductCrossProcessing for its text
      // It should always show "Cross All"
      const buttonMatch = parsingTabSource.match(
        /<button[^>]*onClick={handleCrossAllClick}[\s\S]*?<\/button>/
      );
      expect(buttonMatch).toBeTruthy();
      const buttonContent = buttonMatch![0];

      // Button should NOT contain isProductCrossProcessing conditional
      expect(buttonContent).not.toContain('isProductCrossProcessing ?');
      // Button should contain static "Cross All" text
      expect(buttonContent).toContain('Cross All');
    });

    it('Individual row should show "Crossing..." spinner when that specific item is processing', () => {
      // Each row checks its own state - this is correct behavior
      expect(parsingTabSource).toContain('itemCrossingState[item.id]');
      expect(parsingTabSource).toContain('crossState?.isProcessing');
      // Individual rows show "Crossing..." for their own processing state
      expect(parsingTabSource).toContain('<span>Crossing...</span>');
    });
  });
});
