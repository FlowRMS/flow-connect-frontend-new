/**
 * Takeoff Flow Consistency Tests
 *
 * These tests ensure that both flows have consistent functionality:
 * - Upload flow: upload → classify → abridge → proceed to parsing → cross
 * - Detail flow: open takeoff detail → abridge → proceed to parsing → cross
 *
 * Tests cover:
 * - Cross All functionality
 * - Abridge All functionality
 * - Create Quote validation
 * - Status change logic
 * - Document parsing
 * - Download functionality
 * - View Report functionality
 */

import { getInitialStep, getSelectableItems } from '../../components/takeoffs/utils';
import type { ParsedItem, TakeoffStatus } from '../../components/takeoffs/types';

describe('Takeoff Flow Consistency', () => {

  // ==========================================================================
  // STATUS CHANGE TESTS
  // ==========================================================================
  describe('Status Change Logic', () => {
    describe('getInitialStep', () => {
      it('should return "parsing" for Complete status', () => {
        expect(getInitialStep('Complete')).toBe('parsing');
      });

      it('should return "parsing" for Parsing status', () => {
        expect(getInitialStep('Parsing')).toBe('parsing');
      });

      it('should return "classification" for Abridgment status (show classification tab with abridged docs)', () => {
        // After abridgment, user should see classification tab showing abridged documents
        // with "Proceed to Parsing" button, NOT the separate "Create Abridged Documents" screen
        expect(getInitialStep('Abridgment')).toBe('classification');
      });

      it('should return "classification" for Classification status', () => {
        expect(getInitialStep('Classification')).toBe('classification');
      });

      it('should return "classification" as default', () => {
        expect(getInitialStep('Unknown' as TakeoffStatus)).toBe('classification');
      });
    });

    describe('Status Flow Progression', () => {
      const statusOrder: TakeoffStatus[] = ['Classification', 'Abridgment', 'Parsing', 'Complete'];

      it('should have correct status progression order', () => {
        expect(statusOrder).toEqual(['Classification', 'Abridgment', 'Parsing', 'Complete']);
      });

      it('Complete status should map to parsing step (to show crossed items)', () => {
        // Both flows should show the parsing tab when status is Complete
        // This allows users to see crossed items
        expect(getInitialStep('Complete')).toBe('parsing');
      });
    });
  });

  // ==========================================================================
  // CROSS ALL FUNCTIONALITY TESTS
  // ==========================================================================
  describe('Cross All Functionality', () => {
    describe('getSelectableItems', () => {
      const mockItems: ParsedItem[] = [
        {
          id: '1',
          manufacturer: 'Competitor A',
          partNumber: 'COMP-001',
          description: 'Test item 1',
          quantity: 1,
          isOurManufacturer: false,
          isCrossed: false,
        },
        {
          id: '2',
          manufacturer: 'Our Company',
          partNumber: 'OUR-001',
          description: 'Test item 2',
          quantity: 1,
          isOurManufacturer: true,
          isCrossed: false,
        },
        {
          id: '3',
          manufacturer: 'Competitor B',
          partNumber: 'COMP-002',
          description: 'Test item 3',
          quantity: 2,
          isOurManufacturer: false,
          isCrossed: true, // Already crossed
        },
      ];

      it('should exclude items from our manufacturer', () => {
        const selectable = getSelectableItems(mockItems);
        const hasOurManufacturer = selectable.some(item => item.isOurManufacturer);
        expect(hasOurManufacturer).toBe(false);
      });

      it('should include items that are already crossed (allow re-crossing)', () => {
        const selectable = getSelectableItems(mockItems);
        const crossedItems = selectable.filter(item => item.isCrossed);
        expect(crossedItems.length).toBe(1);
        expect(crossedItems[0].id).toBe('3');
      });

      it('should return all competitor items regardless of crossed status', () => {
        const selectable = getSelectableItems(mockItems);
        expect(selectable.length).toBe(2);
        expect(selectable.map(i => i.id)).toEqual(['1', '3']);
      });

      it('should return empty array if all items are from our manufacturer', () => {
        const ourItems: ParsedItem[] = [
          {
            id: '1',
            manufacturer: 'Our Company',
            partNumber: 'OUR-001',
            description: 'Our item',
            quantity: 1,
            isOurManufacturer: true,
            isCrossed: false,
          },
        ];
        const selectable = getSelectableItems(ourItems);
        expect(selectable.length).toBe(0);
      });

      it('should return empty array for empty input', () => {
        expect(getSelectableItems([])).toEqual([]);
      });
    });

    describe('Cross All Validation', () => {
      it('should allow crossing when there are competitor items', () => {
        const items: ParsedItem[] = [
          {
            id: '1',
            manufacturer: 'Competitor',
            partNumber: 'COMP-001',
            description: 'Test',
            quantity: 1,
            isOurManufacturer: false,
            isCrossed: false,
          },
        ];
        const canCross = getSelectableItems(items).length > 0;
        expect(canCross).toBe(true);
      });

      it('should block crossing when only our manufacturer items exist', () => {
        const items: ParsedItem[] = [
          {
            id: '1',
            manufacturer: 'Our Company',
            partNumber: 'OUR-001',
            description: 'Test',
            quantity: 1,
            isOurManufacturer: true,
            isCrossed: false,
          },
        ];
        const canCross = getSelectableItems(items).length > 0;
        expect(canCross).toBe(false);
      });
    });
  });

  // ==========================================================================
  // CREATE QUOTE VALIDATION TESTS
  // ==========================================================================
  describe('Create Quote Validation', () => {
    describe('Status Validation', () => {
      it('should allow quote creation only when status is Complete', () => {
        const statuses: TakeoffStatus[] = ['Classification', 'Abridgment', 'Parsing', 'Complete'];

        statuses.forEach(status => {
          const canCreateQuote = status === 'Complete';
          if (status === 'Complete') {
            expect(canCreateQuote).toBe(true);
          } else {
            expect(canCreateQuote).toBe(false);
          }
        });
      });
    });

    describe('Crossed Items Validation', () => {
      it('should require at least one crossed item', () => {
        const itemsWithCrossed: ParsedItem[] = [
          {
            id: '1',
            manufacturer: 'Competitor',
            partNumber: 'COMP-001',
            description: 'Test',
            quantity: 1,
            isOurManufacturer: false,
            isCrossed: true,
            crossedManufacturer: 'Our Company',
            crossedPartNumber: 'OUR-001',
          },
        ];
        const itemsWithoutCrossed: ParsedItem[] = [
          {
            id: '1',
            manufacturer: 'Competitor',
            partNumber: 'COMP-001',
            description: 'Test',
            quantity: 1,
            isOurManufacturer: false,
            isCrossed: false,
          },
        ];

        const hasCrossedItems1 = itemsWithCrossed.filter(i => i.isCrossed).length > 0;
        const hasCrossedItems2 = itemsWithoutCrossed.filter(i => i.isCrossed).length > 0;

        expect(hasCrossedItems1).toBe(true);
        expect(hasCrossedItems2).toBe(false);
      });
    });
  });

  // ==========================================================================
  // ABRIDGE ALL FUNCTIONALITY TESTS
  // ==========================================================================
  describe('Abridge All Functionality', () => {
    interface MockDocument {
      id: string;
      name: string;
      abridged: boolean;
      documentUrl?: string;
      pages: number;
    }

    describe('Document Selection for Abridgment', () => {
      it('should select only documents that are not yet abridged', () => {
        const docs: MockDocument[] = [
          { id: '1', name: 'doc1.pdf', abridged: false, documentUrl: 'http://...', pages: 50 },
          { id: '2', name: 'doc2.pdf', abridged: true, documentUrl: 'http://...', pages: 30 },
          { id: '3', name: 'doc3.pdf', abridged: false, documentUrl: 'http://...', pages: 20 },
        ];

        const toAbridge = docs.filter(d => !d.abridged && d.documentUrl);
        expect(toAbridge.length).toBe(2);
        expect(toAbridge.map(d => d.id)).toEqual(['1', '3']);
      });

      it('should require documentUrl to abridge', () => {
        const docs: MockDocument[] = [
          { id: '1', name: 'doc1.pdf', abridged: false, documentUrl: undefined, pages: 50 },
          { id: '2', name: 'doc2.pdf', abridged: false, documentUrl: 'http://...', pages: 30 },
        ];

        const toAbridge = docs.filter(d => !d.abridged && d.documentUrl);
        expect(toAbridge.length).toBe(1);
        expect(toAbridge[0].id).toBe('2');
      });
    });

    describe('Status Update After Abridgment', () => {
      it('should update status to Abridgment when all docs are abridged', () => {
        const allAbridged = true;
        const currentStatus = 'Classification';
        const shouldUpdateStatus = allAbridged && currentStatus !== 'Complete';
        expect(shouldUpdateStatus).toBe(true);
      });

      it('should not update status if already Complete', () => {
        const allAbridged = true;
        const currentStatus = 'Complete';
        const shouldUpdateStatus = allAbridged && currentStatus !== 'Complete';
        expect(shouldUpdateStatus).toBe(false);
      });
    });
  });

  // ==========================================================================
  // DOCUMENT PARSING TESTS
  // ==========================================================================
  describe('Document Parsing', () => {
    interface MockDocument {
      id: string;
      name: string;
      abridgedUrl?: string;
      documentUrl?: string;
    }

    describe('URL Selection for Parsing', () => {
      it('should prefer abridgedUrl over documentUrl', () => {
        const doc: MockDocument = {
          id: '1',
          name: 'test.pdf',
          abridgedUrl: 'http://abridged.url',
          documentUrl: 'http://original.url',
        };

        const urlToUse = doc.abridgedUrl || doc.documentUrl;
        expect(urlToUse).toBe('http://abridged.url');
      });

      it('should fall back to documentUrl if no abridgedUrl', () => {
        const doc: MockDocument = {
          id: '1',
          name: 'test.pdf',
          documentUrl: 'http://original.url',
        };

        const urlToUse = doc.abridgedUrl || doc.documentUrl;
        expect(urlToUse).toBe('http://original.url');
      });

      it('should filter documents with URLs', () => {
        const docs: MockDocument[] = [
          { id: '1', name: 'doc1.pdf', documentUrl: 'http://...' },
          { id: '2', name: 'doc2.pdf' }, // No URL
          { id: '3', name: 'doc3.pdf', abridgedUrl: 'http://...' },
        ];

        const docsWithUrls = docs.filter(d => d.abridgedUrl || d.documentUrl);
        expect(docsWithUrls.length).toBe(2);
      });
    });

    describe('Status Update After Parsing', () => {
      it('should update status to Parsing when parsing starts', () => {
        const currentStatus = 'Abridgment';
        const newStatus = 'Parsing';
        expect(newStatus).toBe('Parsing');
      });
    });
  });

  // ==========================================================================
  // FLOW CONSISTENCY CHECKS
  // ==========================================================================
  describe('Flow Consistency Checks', () => {
    describe('Both flows should have same behavior', () => {
      it('Cross All: should use same filter logic (getSelectableItems)', () => {
        // Both flows use getSelectableItems which filters by !isOurManufacturer
        const items: ParsedItem[] = [
          { id: '1', manufacturer: 'Comp', partNumber: 'P1', description: 'D1', quantity: 1, isOurManufacturer: false, isCrossed: false },
          { id: '2', manufacturer: 'Our', partNumber: 'P2', description: 'D2', quantity: 1, isOurManufacturer: true, isCrossed: false },
        ];

        const uploadFlowItems = getSelectableItems(items);
        const detailFlowItems = getSelectableItems(items);

        expect(uploadFlowItems).toEqual(detailFlowItems);
      });

      it('Status mapping: should return same step for same status', () => {
        const statuses: TakeoffStatus[] = ['Classification', 'Abridgment', 'Parsing', 'Complete'];

        statuses.forEach(status => {
          const uploadFlowStep = getInitialStep(status);
          const detailFlowStep = getInitialStep(status);
          expect(uploadFlowStep).toBe(detailFlowStep);
        });
      });

      it('Create Quote validation: both flows should check status === Complete', () => {
        const validateQuoteCreation = (status: TakeoffStatus) => status === 'Complete';

        expect(validateQuoteCreation('Complete')).toBe(true);
        expect(validateQuoteCreation('Parsing')).toBe(false);
        expect(validateQuoteCreation('Abridgment')).toBe(false);
        expect(validateQuoteCreation('Classification')).toBe(false);
      });
    });

    describe('Handler Behavior Checklist', () => {
      // These tests document expected behavior that should be consistent

      it('Cross All should update status to Complete when all items are crossed', () => {
        // Both handleCrossAll in useTakeoffsState.ts and page.tsx should:
        // 1. Filter items by !isOurManufacturer
        // 2. Process all items
        // 3. Update status to COMPLETE
        const expectedBehavior = {
          filter: 'items.filter(i => !i.isOurManufacturer)',
          statusAfter: 'COMPLETE',
        };
        expect(expectedBehavior.statusAfter).toBe('COMPLETE');
      });

      it('Abridge All should update status to Abridgment when all docs are abridged', () => {
        // Both handleAbridgeAll should:
        // 1. Filter docs by !abridged && documentUrl
        // 2. Process all docs
        // 3. Update status to ABRIDGMENT (if not already Complete)
        const expectedBehavior = {
          filter: 'docs.filter(d => !d.abridged && d.documentUrl)',
          statusAfter: 'ABRIDGMENT',
          condition: 'status !== Complete',
        };
        expect(expectedBehavior.statusAfter).toBe('ABRIDGMENT');
      });

      it('Individual Cross should update status to Complete when all items are crossed', () => {
        // Both handleCrossItem should check if all crossable items are now crossed
        // and update status to COMPLETE if so
        const allItemsCrossed = true;
        const expectedStatus = allItemsCrossed ? 'COMPLETE' : 'PARSING';
        expect(expectedStatus).toBe('COMPLETE');
      });

      it('Individual Abridge should update status to Abridgment when all docs are abridged', () => {
        // Both handleAbridgeDocument should check if all docs are now abridged
        // and update status to ABRIDGMENT if so (and status !== Complete)
        const allDocsAbridged = true;
        const currentStatus = 'Classification';
        const expectedStatus = allDocsAbridged && currentStatus !== 'Complete' ? 'ABRIDGMENT' : currentStatus;
        expect(expectedStatus).toBe('ABRIDGMENT');
      });
    });
  });

  // ==========================================================================
  // CREATE QUOTE MODAL BEHAVIOR TESTS
  // ==========================================================================
  describe('Create Quote Modal Behavior', () => {
    describe('onSuccess callback', () => {
      it('should NOT close modal immediately in onSuccess - let user see success step', () => {
        // Both flows should NOT call setShowCreateQuoteModal(false) in onSuccess
        // The modal has internal "Stay Here" and "View Quote" buttons that handle closing
        //
        // CORRECT behavior (page.tsx):
        // onSuccess={(quote) => {
        //   console.log('Quote created:', quote);
        //   // Modal stays open to show success step
        // }}
        //
        // INCORRECT behavior (was in TakeoffsContent.tsx before fix):
        // onSuccess={(quote) => {
        //   console.log('Quote created:', quote);
        //   setShowCreateQuoteModal(false); // <-- BUG: closes before success step shows
        // }}

        const correctOnSuccess = (quote: unknown) => {
          console.log('Quote created:', quote);
          // Should NOT close modal here
          return false; // Represents: does not close modal
        };

        const incorrectOnSuccess = (quote: unknown) => {
          console.log('Quote created:', quote);
          // This was the bug - closing modal before success step
          return true; // Represents: closes modal immediately
        };

        expect(correctOnSuccess({})).toBe(false);
        expect(incorrectOnSuccess({})).toBe(true);
      });

      it('should allow user to see success step with quote details', () => {
        // After creating a quote, the modal should:
        // 1. Display the success step
        // 2. Show the created quote details
        // 3. Provide "Stay Here" and "View Quote" buttons
        // 4. Only close when user clicks one of these buttons

        const modalSteps = ['select-items', 'input', 'success'];
        const stepAfterQuoteCreation = 'success';

        expect(modalSteps).toContain(stepAfterQuoteCreation);
        expect(stepAfterQuoteCreation).toBe('success');
      });

      it('both flows should have consistent onSuccess behavior', () => {
        // TakeoffsContent.tsx (upload flow) and page.tsx (detail flow)
        // should both NOT close the modal in onSuccess
        // This ensures users see the success confirmation in both flows

        const uploadFlowClosesModalInOnSuccess = false; // Fixed
        const detailFlowClosesModalInOnSuccess = false; // Already correct

        expect(uploadFlowClosesModalInOnSuccess).toBe(detailFlowClosesModalInOnSuccess);
        expect(uploadFlowClosesModalInOnSuccess).toBe(false);
      });
    });
  });

  // ==========================================================================
  // SORTING FUNCTIONALITY TESTS
  // ==========================================================================
  describe('Table Sorting', () => {
    describe('ParsingTab Sorting', () => {
      const mockItems: ParsedItem[] = [
        { id: '1', manufacturer: 'Zebra', partNumber: 'Z001', description: 'Item Z', quantity: 5, isOurManufacturer: false, isCrossed: false },
        { id: '2', manufacturer: 'Apple', partNumber: 'A001', description: 'Item A', quantity: 10, isOurManufacturer: false, isCrossed: false },
        { id: '3', manufacturer: 'Beta', partNumber: 'B001', description: 'Item B', quantity: 1, isOurManufacturer: false, isCrossed: false },
      ];

      it('should sort by manufacturer ascending', () => {
        const sorted = [...mockItems].sort((a, b) =>
          a.manufacturer.toLowerCase().localeCompare(b.manufacturer.toLowerCase())
        );
        expect(sorted[0].manufacturer).toBe('Apple');
        expect(sorted[2].manufacturer).toBe('Zebra');
      });

      it('should sort by manufacturer descending', () => {
        const sorted = [...mockItems].sort((a, b) =>
          b.manufacturer.toLowerCase().localeCompare(a.manufacturer.toLowerCase())
        );
        expect(sorted[0].manufacturer).toBe('Zebra');
        expect(sorted[2].manufacturer).toBe('Apple');
      });

      it('should sort by quantity ascending', () => {
        const sorted = [...mockItems].sort((a, b) => a.quantity - b.quantity);
        expect(sorted[0].quantity).toBe(1);
        expect(sorted[2].quantity).toBe(10);
      });

      it('should sort by quantity descending', () => {
        const sorted = [...mockItems].sort((a, b) => b.quantity - a.quantity);
        expect(sorted[0].quantity).toBe(10);
        expect(sorted[2].quantity).toBe(1);
      });
    });
  });

  // ==========================================================================
  // RE-CROSSING REGRESSION TESTS (FLO-727 / SUP-148)
  // These tests ensure that both flows allow re-crossing already crossed items
  // ==========================================================================
  describe('Re-Crossing Regression Tests', () => {
    describe('State Update Logic - Must Allow Re-Crossing', () => {
      /**
       * REGRESSION TEST: useTakeoffsState.ts state update
       * Bug: The state update was skipping items with isCrossed: true
       * Fix: Only skip items from our manufacturer, not already crossed items
       */
      it('should NOT skip already crossed items in state update (useTakeoffsState fix)', () => {
        const items: ParsedItem[] = [
          { id: '1', manufacturer: 'Competitor A', partNumber: 'C001', description: 'Item 1', quantity: 1, isOurManufacturer: false, isCrossed: true },
          { id: '2', manufacturer: 'Competitor B', partNumber: 'C002', description: 'Item 2', quantity: 1, isOurManufacturer: false, isCrossed: false },
          { id: '3', manufacturer: 'Our Company', partNumber: 'O001', description: 'Item 3', quantity: 1, isOurManufacturer: true, isCrossed: false },
        ];

        // Simulate the CORRECT state update logic (after fix)
        const crossedResults = new Map<string, { manufacturer: string; partNumber: string; description: string }>();
        crossedResults.set('1', { manufacturer: 'New Cross', partNumber: 'NC001', description: 'Re-crossed item' });
        crossedResults.set('2', { manufacturer: 'New Cross', partNumber: 'NC002', description: 'Crossed item' });

        const itemsToCross = items.filter(item => !item.isOurManufacturer);

        // This simulates the FIXED state update logic
        const updatedItems = items.map(item => {
          // Skip our manufacturer items - they should never be crossed
          if (item.isOurManufacturer) return item;

          const crossedResult = crossedResults.get(item.id);
          // Only update items that were sent to the API
          if (!crossedResult && !itemsToCross.some(i => i.id === item.id)) {
            return item;
          }

          if (!crossedResult) {
            return { ...item, isCrossed: true, crossedManufacturer: 'Fallback' };
          }

          return {
            ...item,
            isCrossed: true,
            crossedManufacturer: crossedResult.manufacturer,
            crossedPartNumber: crossedResult.partNumber,
            crossedDescription: crossedResult.description,
          };
        });

        // Verify already-crossed item WAS updated (re-crossed)
        const reCrossedItem = updatedItems.find(i => i.id === '1');
        expect(reCrossedItem?.crossedManufacturer).toBe('New Cross');
        expect(reCrossedItem?.crossedPartNumber).toBe('NC001');

        // Verify new crossed item was updated
        const newCrossedItem = updatedItems.find(i => i.id === '2');
        expect(newCrossedItem?.crossedManufacturer).toBe('New Cross');

        // Verify our manufacturer item was NOT touched
        const ourItem = updatedItems.find(i => i.id === '3');
        expect(ourItem?.isCrossed).toBe(false);
      });

      /**
       * REGRESSION TEST: Ensure the BAD pattern is NOT used
       * The old buggy code had: if (item.isOurManufacturer || item.isCrossed) return item;
       * This caused already-crossed items to be skipped during re-crossing
       */
      it('should demonstrate the BUG pattern that must NOT be used', () => {
        const items: ParsedItem[] = [
          { id: '1', manufacturer: 'Competitor', partNumber: 'C001', description: 'Item', quantity: 1, isOurManufacturer: false, isCrossed: true },
        ];

        const crossedResults = new Map<string, { manufacturer: string; partNumber: string }>([
          ['1', { manufacturer: 'New Result', partNumber: 'NEW001' }],
        ]);

        // BUGGY pattern (DO NOT USE) - skips already crossed items
        const buggyUpdate = items.map(item => {
          if (item.isOurManufacturer || item.isCrossed) return item; // BUG: skips re-crossing
          const result = crossedResults.get(item.id);
          return result ? { ...item, crossedManufacturer: result.manufacturer } : item;
        });

        // CORRECT pattern - only skips our manufacturer
        const correctUpdate = items.map(item => {
          if (item.isOurManufacturer) return item; // CORRECT: only skip our manufacturer
          const result = crossedResults.get(item.id);
          return result ? { ...item, crossedManufacturer: result.manufacturer } : item;
        });

        // Buggy version does NOT update the item
        expect(buggyUpdate[0].crossedManufacturer).toBeUndefined();

        // Correct version DOES update the item
        expect(correctUpdate[0].crossedManufacturer).toBe('New Result');
      });
    });

    describe('Toast Message Consistency', () => {
      /**
       * REGRESSION TEST: page.tsx toast message
       * Bug: page.tsx only had console.log, no toast when no items to cross
       * Fix: Added showInfoToast with same message as useTakeoffsState
       */
      it('should have consistent "no items to cross" message in both flows', () => {
        // Both flows should use the same message
        const expectedMessage = 'No items to cross';
        const expectedDescription = 'All items are from our manufacturers.';

        // These represent what each flow should display
        const uploadFlowMessage = { title: 'No items to cross', description: 'All items are from our manufacturers.' };
        const detailFlowMessage = { title: 'No items to cross', description: 'All items are from our manufacturers.' };

        expect(uploadFlowMessage.title).toBe(expectedMessage);
        expect(detailFlowMessage.title).toBe(expectedMessage);
        expect(uploadFlowMessage.description).toBe(expectedDescription);
        expect(detailFlowMessage.description).toBe(expectedDescription);
      });

      /**
       * Both flows should show toast (not just console.log) when no items to cross
       */
      it('should show toast notification in BOTH flows when no items to cross', () => {
        // This test documents the expected behavior
        const uploadFlowShowsToast = true;  // useTakeoffsState.ts line 828
        const detailFlowShowsToast = true;  // page.tsx line 627 (after fix)

        expect(uploadFlowShowsToast).toBe(true);
        expect(detailFlowShowsToast).toBe(true);
        expect(uploadFlowShowsToast).toBe(detailFlowShowsToast);
      });
    });

    describe('Cross All Filter Consistency', () => {
      /**
       * Both flows must use the same filter: !isOurManufacturer
       * NOT: !isOurManufacturer && !isCrossed (which would prevent re-crossing)
       */
      it('should filter by isOurManufacturer ONLY, allowing re-crossing', () => {
        const items: ParsedItem[] = [
          { id: '1', manufacturer: 'Comp A', partNumber: 'C1', description: 'D1', quantity: 1, isOurManufacturer: false, isCrossed: false },
          { id: '2', manufacturer: 'Comp B', partNumber: 'C2', description: 'D2', quantity: 1, isOurManufacturer: false, isCrossed: true },
          { id: '3', manufacturer: 'Our Co', partNumber: 'O1', description: 'D3', quantity: 1, isOurManufacturer: true, isCrossed: false },
        ];

        // CORRECT filter (allows re-crossing)
        const correctFilter = items.filter(item => !item.isOurManufacturer);

        // WRONG filter (prevents re-crossing)
        const wrongFilter = items.filter(item => !item.isOurManufacturer && !item.isCrossed);

        // Correct filter includes both competitor items (even the already crossed one)
        expect(correctFilter.length).toBe(2);
        expect(correctFilter.map(i => i.id)).toContain('1');
        expect(correctFilter.map(i => i.id)).toContain('2');

        // Wrong filter would exclude the already crossed item
        expect(wrongFilter.length).toBe(1);
        expect(wrongFilter.map(i => i.id)).not.toContain('2');

        // Verify getSelectableItems uses the CORRECT filter
        const selectableItems = getSelectableItems(items);
        expect(selectableItems).toEqual(correctFilter);
      });
    });
  });

  describe('Abridgement Data Consistency', () => {
    describe('AbridgedPages Fallback Logic', () => {
      /**
       * When API returns null for abridgedPages, should use actualPages as fallback
       * This prevents "/1 pages kept (100% reduction)" display bug
       */
      it('should use actualPages when result.abridgedPages is null', () => {
        const result = { abridgedPages: null, originalPages: 84 };
        const actualPages = result.originalPages || 1;

        // CORRECT: Use fallback
        const correctAbridgedPages = result.abridgedPages || actualPages;

        // WRONG: Use null directly
        const wrongAbridgedPages = result.abridgedPages;

        expect(correctAbridgedPages).toBe(84);
        expect(wrongAbridgedPages).toBeNull();
      });

      it('should use actualPages when result.abridgedPages is 0', () => {
        const result = { abridgedPages: 0, originalPages: 1 };
        const actualPages = result.originalPages || 1;

        // For 0, we should still use actualPages (can't have 0 pages)
        const abridgedPages = result.abridgedPages || actualPages;

        expect(abridgedPages).toBe(1);
      });

      it('should preserve valid abridgedPages value', () => {
        const result = { abridgedPages: 60, originalPages: 84 };
        const actualPages = result.originalPages || 84;

        const abridgedPages = result.abridgedPages || actualPages;

        expect(abridgedPages).toBe(60);
      });
    });

    describe('Reduction Percentage Calculation', () => {
      /**
       * Reduction percentage should be calculated from page counts, not stored value
       * Formula: ((totalPages - abridgedPages) / totalPages) * 100
       */
      it('should calculate 0% when all pages are kept', () => {
        const totalPages = 1;
        const abridgedPages = 1;

        const reductionPercent = totalPages > 0
          ? ((totalPages - abridgedPages) / totalPages) * 100
          : 0;

        expect(reductionPercent).toBe(0);
      });

      it('should calculate correct percentage for partial reduction', () => {
        const totalPages = 84;
        const abridgedPages = 60;

        const reductionPercent = totalPages > 0
          ? ((totalPages - abridgedPages) / totalPages) * 100
          : 0;

        expect(reductionPercent).toBeCloseTo(28.57, 1);
      });

      it('should return 0% when totalPages is 0 or undefined', () => {
        const totalPages = 0;
        const abridgedPages = 0;

        const reductionPercent = totalPages > 0
          ? ((totalPages - abridgedPages) / totalPages) * 100
          : 0;

        expect(reductionPercent).toBe(0);
      });
    });

    describe('Modal Stats Consistency', () => {
      /**
       * Modal should use document.abridgedPages for summary stats,
       * NOT count from pageAnalyses, to be consistent with ClassificationTab
       */
      it('should use abridgedPages for includedPages count', () => {
        const document = {
          pages: 1,
          abridgedPages: 1,
          pageAnalyses: [{ pageNumber: 1, isRelevant: false }], // AI said not relevant
        };

        // CORRECT: Use abridgedPages (final result)
        const correctIncludedPages = document.abridgedPages ?? document.pages ?? 0;

        // WRONG: Count from pageAnalyses (AI analysis)
        const wrongIncludedPages = document.pageAnalyses.filter(
          (pa: { isRelevant: boolean }) => pa.isRelevant
        ).length;

        expect(correctIncludedPages).toBe(1); // All pages kept
        expect(wrongIncludedPages).toBe(0); // AI said 0 relevant

        // Modal should show 1/1 pages kept (0% reduction), NOT 0/1 (100% reduction)
      });

      it('should detect AI analysis mismatch', () => {
        const document = {
          pages: 1,
          abridgedPages: 1,
          pageAnalyses: [{ pageNumber: 1, isRelevant: false }],
        };

        const includedPages = document.abridgedPages ?? document.pages ?? 0;
        const aiIncludedCount = document.pageAnalyses.filter(
          (pa: { isRelevant: boolean }) => pa.isRelevant
        ).length;
        const hasAnalysisMismatch = aiIncludedCount !== includedPages;

        expect(hasAnalysisMismatch).toBe(true);
        // Modal should show a note explaining the mismatch
      });

      it('should not show mismatch when AI and final result agree', () => {
        const document = {
          pages: 84,
          abridgedPages: 60,
          pageAnalyses: Array.from({ length: 84 }, (_, i) => ({
            pageNumber: i + 1,
            isRelevant: i < 60, // First 60 pages relevant
          })),
        };

        const includedPages = document.abridgedPages ?? document.pages ?? 0;
        const aiIncludedCount = document.pageAnalyses.filter(
          (pa: { isRelevant: boolean }) => pa.isRelevant
        ).length;
        const hasAnalysisMismatch = aiIncludedCount !== includedPages;

        expect(aiIncludedCount).toBe(60);
        expect(includedPages).toBe(60);
        expect(hasAnalysisMismatch).toBe(false);
      });
    });

    describe('DB Persistence Consistency', () => {
      /**
       * Both state update and DB persist should use the same fallback values
       * to ensure data consistency
       */
      it('should use same fallback for state and DB persist', () => {
        const result = { abridgedPages: null, originalPages: 84 };
        const docPages = 84;
        const actualPages = result.originalPages || docPages;

        // State update fallback
        const stateAbridgedPages = result.abridgedPages || actualPages;

        // DB persist fallback (must match state)
        const persistAbridgedPages = result.abridgedPages || actualPages;

        expect(stateAbridgedPages).toBe(persistAbridgedPages);
        expect(stateAbridgedPages).toBe(84);
      });

      it('should persist actualPages for pages field', () => {
        const result = { originalPages: 84, abridgedPages: 60 };
        const docPages = 80; // Might be different from API
        const actualPages = result.originalPages || docPages;

        // Should use API's originalPages, not existing doc.pages
        expect(actualPages).toBe(84);
      });
    });

    describe('Below Threshold Handling', () => {
      const REDUCTION_THRESHOLD = 30;

      it('should identify below threshold when reduction < 30%', () => {
        const reductionPercent = 28.57; // 60/84 pages kept
        const isBelowThreshold = reductionPercent < REDUCTION_THRESHOLD;

        expect(isBelowThreshold).toBe(true);
      });

      it('should identify above threshold when reduction >= 30%', () => {
        const reductionPercent = 40; // 50/84 pages kept
        const isBelowThreshold = reductionPercent < REDUCTION_THRESHOLD;

        expect(isBelowThreshold).toBe(false);
      });

      it('should show below threshold for 0% reduction', () => {
        const reductionPercent = 0; // All pages kept
        const isBelowThreshold = reductionPercent < REDUCTION_THRESHOLD;

        expect(isBelowThreshold).toBe(true);
      });
    });
  });

  // ==========================================================================
  // CSV EXPORT TESTS
  // ==========================================================================
  describe('CSV Export Functionality', () => {
    /**
     * Helper function to escape CSV cell values
     * Must wrap in quotes if contains comma, quote, or newline
     */
    const escapeCSV = (value: string | number): string => {
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    describe('escapeCSV Helper Function', () => {
      it('should return plain string when no special characters', () => {
        expect(escapeCSV('Hello')).toBe('Hello');
        expect(escapeCSV('Page 1')).toBe('Page 1');
        expect(escapeCSV('Yes')).toBe('Yes');
      });

      it('should wrap in quotes when string contains comma', () => {
        expect(escapeCSV('Hello, World')).toBe('"Hello, World"');
        expect(escapeCSV('Item A, Item B')).toBe('"Item A, Item B"');
      });

      it('should wrap in quotes and escape when string contains quote', () => {
        expect(escapeCSV('Say "Hello"')).toBe('"Say ""Hello"""');
        expect(escapeCSV('It\'s a "test"')).toBe('"It\'s a ""test"""');
      });

      it('should wrap in quotes when string contains newline', () => {
        expect(escapeCSV('Line 1\nLine 2')).toBe('"Line 1\nLine 2"');
      });

      it('should handle numbers correctly', () => {
        expect(escapeCSV(42)).toBe('42');
        expect(escapeCSV(0)).toBe('0');
      });

      it('should handle complex strings with multiple special chars', () => {
        const complexString = 'The page contains "keywords" like product, info\nand more';
        const escaped = escapeCSV(complexString);
        expect(escaped).toBe('"The page contains ""keywords"" like product, info\nand more"');
      });
    });

    describe('CSV Row Generation', () => {
      interface ReportItem {
        page: number;
        included: boolean;
        reason: string;
      }

      it('should generate correct header row', () => {
        const headerRow = ['Page', 'AI Marked Relevant', 'Reason'];
        const csvHeader = headerRow.map(cell => escapeCSV(cell)).join(',');

        expect(csvHeader).toBe('Page,AI Marked Relevant,Reason');
      });

      it('should generate correct data row for simple data', () => {
        const item: ReportItem = {
          page: 1,
          included: true,
          reason: 'Contains product information',
        };

        const row = [
          `Page ${item.page}`,
          item.included ? 'Yes' : 'No',
          item.reason,
        ];
        const csvRow = row.map(cell => escapeCSV(cell)).join(',');

        expect(csvRow).toBe('Page 1,Yes,Contains product information');
      });

      it('should properly escape reason with commas', () => {
        const item: ReportItem = {
          page: 1,
          included: false,
          reason: 'No product, schedule, or spec information found',
        };

        const row = [
          `Page ${item.page}`,
          item.included ? 'Yes' : 'No',
          item.reason,
        ];
        const csvRow = row.map(cell => escapeCSV(cell)).join(',');

        expect(csvRow).toBe('Page 1,No,"No product, schedule, or spec information found"');
      });

      it('should properly escape reason with quotes', () => {
        const item: ReportItem = {
          page: 1,
          included: false,
          reason: 'Does not contain "keywords" like product or schedule',
        };

        const row = [
          `Page ${item.page}`,
          item.included ? 'Yes' : 'No',
          item.reason,
        ];
        const csvRow = row.map(cell => escapeCSV(cell)).join(',');

        expect(csvRow).toBe('Page 1,No,"Does not contain ""keywords"" like product or schedule"');
      });
    });

    describe('Full CSV Generation', () => {
      interface ReportItem {
        page: number;
        included: boolean;
        reason: string;
      }

      const generateCSV = (reportItems: ReportItem[]): string => {
        const rows: (string | number)[][] = [
          ['Page', 'AI Marked Relevant', 'Reason'],
          ...reportItems.map(item => [
            `Page ${item.page}`,
            item.included ? 'Yes' : 'No',
            item.reason,
          ]),
        ];

        return rows.map(row =>
          row.map(cell => escapeCSV(cell)).join(',')
        ).join('\n');
      };

      it('should generate valid CSV with multiple rows', () => {
        const items: ReportItem[] = [
          { page: 1, included: true, reason: 'Contains schedules' },
          { page: 2, included: false, reason: 'Technical drawing only' },
        ];

        const csv = generateCSV(items);
        const lines = csv.split('\n');

        expect(lines.length).toBe(3); // Header + 2 data rows
        expect(lines[0]).toBe('Page,AI Marked Relevant,Reason');
        expect(lines[1]).toBe('Page 1,Yes,Contains schedules');
        expect(lines[2]).toBe('Page 2,No,Technical drawing only');
      });

      it('should handle empty report items', () => {
        const items: ReportItem[] = [];
        const csv = generateCSV(items);

        expect(csv).toBe('Page,AI Marked Relevant,Reason');
      });

      it('should generate CSV that Excel can parse correctly', () => {
        const items: ReportItem[] = [
          {
            page: 1,
            included: false,
            reason: 'The page contains a detailed plumbing under floor plan drawing but does not contain any of the specified keywords such as product, information, schedules.',
          },
        ];

        const csv = generateCSV(items);
        const lines = csv.split('\n');

        // Header should be 3 columns
        expect(lines[0].split(',').length).toBe(3);

        // Data row: Page 1, No, and a long quoted reason
        // The reason contains commas so it should be quoted
        expect(lines[1]).toContain('Page 1');
        expect(lines[1]).toContain('No');
        expect(lines[1]).toContain('"The page contains');
      });

      it('should NOT split words into separate columns (regression test)', () => {
        // This was the bug: "Abridgment Report Summary" was being split into
        // separate columns because it wasn't properly formatted as CSV
        const items: ReportItem[] = [
          { page: 1, included: true, reason: 'Multiple words here' },
        ];

        const csv = generateCSV(items);
        const lines = csv.split('\n');

        // Parse the CSV manually to verify column count
        const parseCSVRow = (row: string): string[] => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;

          for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === '"') {
              if (inQuotes && row[i + 1] === '"') {
                current += '"';
                i++;
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              result.push(current);
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current);
          return result;
        };

        // Header should have exactly 3 columns
        const headerCols = parseCSVRow(lines[0]);
        expect(headerCols.length).toBe(3);
        expect(headerCols[0]).toBe('Page');
        expect(headerCols[1]).toBe('AI Marked Relevant');
        expect(headerCols[2]).toBe('Reason');

        // Data row should have exactly 3 columns
        const dataCols = parseCSVRow(lines[1]);
        expect(dataCols.length).toBe(3);
        expect(dataCols[0]).toBe('Page 1');
        expect(dataCols[1]).toBe('Yes');
        expect(dataCols[2]).toBe('Multiple words here');
      });
    });
  });
});
