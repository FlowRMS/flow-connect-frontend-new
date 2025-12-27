#!/usr/bin/env python3
import sys

file_path = r"c:\Users\ksubh\Desktop\Subhans projects\flow crm  curtis mock\flow-crm\components\QuotesContent.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_line = None
end_line = None

for i, line in enumerate(lines):
    if '{/* Mark as Lost Modal */}' in line:
        start_line = i
    if start_line is not None and '{/* Line Item Details Modal' in line:
        end_line = i
        break

if start_line is None or end_line is None:
    print("Could not find markers")
    sys.exit(1)

print(f"Found Mark as Lost Modal from line {start_line + 1} to {end_line}")

replacement = '''        {/* Mark as Lost Modal */}
        <MarkAsLostModal
          show={showMarkAsLostModal}
          lostReason={lostReason}
          customLostReason={customLostReason}
          showAddReasonInput={showAddReasonInput}
          newReasonText={newReasonText}
          lostReasons={lostReasons}
          selectedQuotesForBulk={selectedQuotesForBulk}
          selectedQuote={selectedQuote}
          onClose={() => setShowMarkAsLostModal(false)}
          onSetLostReason={setLostReason}
          onSetCustomLostReason={setCustomLostReason}
          onSetShowAddReasonInput={setShowAddReasonInput}
          onSetNewReasonText={setNewReasonText}
          onSetLostReasons={setLostReasons}
          onSubmit={(reason) => {
            // Update quotes to Lost stage
            setQuotes(prev => prev.map(q =>
              selectedQuotesForBulk.has(q.id)
                ? { ...q, stage: 'Lost' as const, lostReason: reason }
                : q
            ));
            // Update selectedQuote if it's being marked as lost
            if (selectedQuote && selectedQuotesForBulk.has(selectedQuote.id)) {
              setSelectedQuote({ ...selectedQuote, stage: 'Lost' as const, lostReason: reason });
            }
            // Reset bulk selection
            setSelectedQuotesForBulk(new Set());
          }}
        />

'''

new_lines = lines[:start_line] + [replacement] + lines[end_line:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Replacement completed. Removed {end_line - start_line} lines.")
