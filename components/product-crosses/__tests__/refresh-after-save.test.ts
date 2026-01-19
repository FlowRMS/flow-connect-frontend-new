/**
 * Regression Tests: Refresh Table After Save Selected
 *
 * These tests ensure that after saving selected crosses in ProductCrossResultsModal,
 * the parent component is notified to refresh the data table.
 *
 * Bug history:
 * - After clicking "Save Selected" in ProductCrossResultsModal, the Product Crosses
 *   table was not updating because onRefresh was not being called.
 * - Fix: Added onRefresh prop and call it after successful save before closing modal.
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Refresh After Save Selected - Regression Tests', () => {
  const modalPath = path.join(__dirname, '../ProductCrossResultsModal.tsx');
  const contentPath = path.join(__dirname, '../ProductCrossesContent.tsx');

  let modalSource: string;
  let contentSource: string;

  beforeAll(() => {
    modalSource = fs.readFileSync(modalPath, 'utf-8');
    contentSource = fs.readFileSync(contentPath, 'utf-8');
  });

  describe('ProductCrossResultsModal.tsx', () => {
    it('interface should include onRefresh prop', () => {
      // Check that the interface includes onRefresh
      const interfaceMatch = modalSource.match(
        /interface ProductCrossResultsModalProps[\s\S]*?}/
      );

      expect(interfaceMatch).toBeTruthy();
      expect(interfaceMatch![0]).toContain('onRefresh');
    });

    it('component should destructure onRefresh from props', () => {
      // Check that onRefresh is destructured in the component
      const propsMatch = modalSource.match(
        /export function ProductCrossResultsModal\(\{[\s\S]*?\}\)/
      );

      expect(propsMatch).toBeTruthy();
      expect(propsMatch![0]).toContain('onRefresh');
    });

    it('handleSaveSelected should call onRefresh after successful save', () => {
      // Extract handleSaveSelected function
      const handleSaveSelectedMatch = modalSource.match(
        /const handleSaveSelected = async[\s\S]*?(?=\n  \/\/ Extract part number)/
      );

      expect(handleSaveSelectedMatch).toBeTruthy();
      const handleSaveSelectedBody = handleSaveSelectedMatch![0];

      // Verify it calls onRefresh before closing
      expect(handleSaveSelectedBody).toContain('onRefresh?.()');
      expect(handleSaveSelectedBody).toContain('onClose()');

      // Verify onRefresh is called in the success path (failedCount === 0)
      const successBlock = handleSaveSelectedBody.match(
        /if \(failedCount === 0\)[\s\S]*?(?=\} else)/
      );
      expect(successBlock).toBeTruthy();
      expect(successBlock![0]).toContain('onRefresh');
    });

    it('should have comment documenting the refresh behavior', () => {
      expect(modalSource).toContain('Refresh the parent data before closing');
    });
  });

  describe('ProductCrossesContent.tsx', () => {
    it('should pass onRefresh prop to ProductCrossResultsModal', () => {
      // Check that ProductCrossResultsModal is called with onRefresh
      const modalUsageMatch = contentSource.match(
        /<ProductCrossResultsModal[\s\S]*?\/>/
      );

      expect(modalUsageMatch).toBeTruthy();
      expect(modalUsageMatch![0]).toContain('onRefresh');
    });

    it('should pass loadData as onRefresh callback', () => {
      // Verify loadData is passed as the onRefresh handler
      const modalUsageMatch = contentSource.match(
        /<ProductCrossResultsModal[\s\S]*?\/>/
      );

      expect(modalUsageMatch).toBeTruthy();
      expect(modalUsageMatch![0]).toContain('onRefresh={loadData}');
    });
  });

  describe('Flow verification', () => {
    it('ProductCrossResultsModal should call onRefresh before onClose on success', () => {
      // Verify the order: onRefresh should be called before onClose
      const handleSaveSelectedMatch = modalSource.match(
        /const handleSaveSelected = async[\s\S]*?(?=\n  \/\/ Extract part number)/
      );

      expect(handleSaveSelectedMatch).toBeTruthy();
      const handleSaveSelectedBody = handleSaveSelectedMatch![0];

      // Find the positions of onRefresh and onClose in the success block
      const refreshIndex = handleSaveSelectedBody.indexOf('onRefresh?.()');
      const closeIndex = handleSaveSelectedBody.indexOf('onClose()', refreshIndex);

      // onRefresh should come before onClose
      expect(refreshIndex).toBeGreaterThan(-1);
      expect(closeIndex).toBeGreaterThan(-1);
      expect(refreshIndex).toBeLessThan(closeIndex);
    });
  });
});
