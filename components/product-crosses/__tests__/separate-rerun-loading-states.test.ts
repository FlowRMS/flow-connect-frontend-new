/**
 * Regression Tests: Separate Loading States for Rerun Buttons
 *
 * These tests ensure that the "Rerun by Prompt" and "Rerun by Filters" buttons
 * have separate loading states so clicking one doesn't show loading on both.
 *
 * Bug history:
 * - Both Rerun buttons shared a single isSearching state
 * - Clicking one button would show "Searching..." on both buttons
 * - Fix: Created separate states: isSearchingByPrompt and isSearchingByFilters
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Separate Rerun Loading States - Regression Tests', () => {
  const modalPath = path.join(__dirname, '../ProductCrossResultsModal.tsx');
  let modalSource: string;

  beforeAll(() => {
    modalSource = fs.readFileSync(modalPath, 'utf-8');
  });

  describe('State declarations', () => {
    it('should have separate state for isSearchingByPrompt', () => {
      expect(modalSource).toContain('const [isSearchingByPrompt, setIsSearchingByPrompt] = useState');
    });

    it('should have separate state for isSearchingByFilters', () => {
      expect(modalSource).toContain('const [isSearchingByFilters, setIsSearchingByFilters] = useState');
    });

    it('should have combined isSearching for disabling other buttons', () => {
      expect(modalSource).toContain('const isSearching = isSearchingByPrompt || isSearchingByFilters');
    });

    it('should have comment explaining separate states', () => {
      expect(modalSource).toContain('separate states for each rerun button');
    });
  });

  describe('searchForCrosses function', () => {
    it('should accept source parameter to identify which button triggered search', () => {
      // Check function signature includes source parameter
      const funcMatch = modalSource.match(
        /const searchForCrosses = useCallback\(async\s*\(\s*types:[^,]+,\s*source:\s*['"]prompt['"][^)]+\)/
      );
      expect(funcMatch).toBeTruthy();
    });

    it('should set only isSearchingByPrompt when source is prompt', () => {
      const funcMatch = modalSource.match(
        /const searchForCrosses = useCallback\(async[\s\S]*?(?=\n  \/\/ Handle rerun with prompt)/
      );
      expect(funcMatch).toBeTruthy();

      const funcBody = funcMatch![0];

      // Check that it sets the correct state based on source
      expect(funcBody).toContain("if (source === 'prompt')");
      expect(funcBody).toContain('setIsSearchingByPrompt(true)');
    });

    it('should set only isSearchingByFilters when source is filters', () => {
      const funcMatch = modalSource.match(
        /const searchForCrosses = useCallback\(async[\s\S]*?(?=\n  \/\/ Handle rerun with prompt)/
      );
      expect(funcMatch).toBeTruthy();

      const funcBody = funcMatch![0];

      // Check that it sets the correct state based on source
      expect(funcBody).toContain('} else {');
      expect(funcBody).toContain('setIsSearchingByFilters(true)');
    });

    it('should clear only the specific loading state in finally block', () => {
      const funcMatch = modalSource.match(
        /const searchForCrosses = useCallback\(async[\s\S]*?(?=\n  \/\/ Handle rerun with prompt)/
      );
      expect(funcMatch).toBeTruthy();

      const funcBody = funcMatch![0];

      // Check finally block clears specific state
      expect(funcBody).toContain('finally {');
      expect(funcBody).toContain("if (source === 'prompt')");
      expect(funcBody).toContain('setIsSearchingByPrompt(false)');
      expect(funcBody).toContain('setIsSearchingByFilters(false)');
    });
  });

  describe('Handler functions', () => {
    it('handleRerunWithPrompt should call searchForCrosses with source=prompt', () => {
      const handlerMatch = modalSource.match(
        /const handleRerunWithPrompt = useCallback\(\(\)[\s\S]*?(?=\n  \/\/ Handle rerun with filters)/
      );
      expect(handlerMatch).toBeTruthy();

      const handlerBody = handlerMatch![0];
      expect(handlerBody).toContain("'prompt'");
    });

    it('handleRerunWithFilters should call searchForCrosses with source=filters', () => {
      const handlerMatch = modalSource.match(
        /const handleRerunWithFilters = useCallback\(\(\)[\s\S]*?(?=\n  \/\/ Load prompt templates)/
      );
      expect(handlerMatch).toBeTruthy();

      const handlerBody = handlerMatch![0];
      expect(handlerBody).toContain("'filters'");
    });
  });

  describe('UI button states', () => {
    it('Rerun by Prompt button should use isSearchingByPrompt for its loading state', () => {
      // Find the Rerun button in the prompt section
      expect(modalSource).toContain('isSearchingByPrompt');
      expect(modalSource).toContain("{isSearchingByPrompt ? 'Searching...' : 'Rerun'}");
    });

    it('Rerun by Filters button should use isSearchingByFilters for its loading state', () => {
      // Find the Rerun button in the filters section
      expect(modalSource).toContain('isSearchingByFilters');
      expect(modalSource).toContain("{isSearchingByFilters ? 'Searching...' : 'Rerun'}");
    });

    it('both buttons should be disabled when either is searching (using combined isSearching)', () => {
      // Both buttons should check isSearching for disabled state
      // This prevents clicking the other button while one is processing
      expect(modalSource).toContain('disabled={!promptInstructions.trim() || isSearching}');
      expect(modalSource).toContain('disabled={crossTypes.length === 0 || isSearching}');
    });
  });

  describe('Independence verification', () => {
    it('should NOT have a single shared isSearching state that both buttons use for loading indicator', () => {
      // Make sure there's no pattern where both buttons use the same state for their loading spinner
      // The loading spinner should use isSearchingByPrompt or isSearchingByFilters, not isSearching

      // Count occurrences of loading indicators
      const promptLoadingMatches = modalSource.match(/isSearchingByPrompt \&\&/g) || [];
      const filtersLoadingMatches = modalSource.match(/isSearchingByFilters \?/g) || [];

      // There should be at least one loading indicator for each button type
      expect(promptLoadingMatches.length).toBeGreaterThanOrEqual(1);
      expect(filtersLoadingMatches.length).toBeGreaterThanOrEqual(1);
    });
  });
});
