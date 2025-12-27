#!/usr/bin/env python3
import sys

file_path = r"c:\Users\ksubh\Desktop\Subhans projects\flow crm  curtis mock\flow-crm\components\QuotesContent.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find all the rep splits modals and their end markers
modals_to_replace = [
    ('{/* Rep Commission Splits Modal */}', '{/* Quote-Level Inside Rep Commission Splits Modal */}'),
    ('{/* Quote-Level Inside Rep Commission Splits Modal */}', '{/* Line Item Rep Commission Splits Modal */}'),
    ('{/* Line Item Rep Commission Splits Modal */}', '{/* Line Item Inside Rep Commission Splits Modal */}'),
    ('{/* Line Item Inside Rep Commission Splits Modal */}', '{/* Duplicate Quote Modal */}'),
]

replacements = [
    '''        {/* Rep Commission Splits Modal */}
        <GenericRepSplitsModal
          show={showRepSplitsModal}
          title="Commission Splits"
          subtitle="Divide commission among outside reps"
          splits={repCommissionSplits}
          availableReps={availableOutsideReps}
          onClose={() => setShowRepSplitsModal(false)}
          onCancel={() => {
            setSplitCommission(false);
            setRepCommissionSplits([]);
            setShowRepSplitsModal(false);
          }}
          onSetSplits={setRepCommissionSplits}
        />

''',
    '''        {/* Quote-Level Inside Rep Commission Splits Modal */}
        <GenericRepSplitsModal
          show={showInsideRepSplitsModal}
          title="Inside Rep Commission Splits"
          subtitle="Divide commission among inside reps"
          splits={insideRepCommissionSplits}
          availableReps={availableInsideReps}
          onClose={() => setShowInsideRepSplitsModal(false)}
          onCancel={() => {
            setSplitInsideCommission(false);
            setInsideRepCommissionSplits([]);
            setShowInsideRepSplitsModal(false);
          }}
          onSetSplits={setInsideRepCommissionSplits}
        />

''',
    '''        {/* Line Item Rep Commission Splits Modal */}
        <GenericRepSplitsModal
          show={showLineItemRepSplitsModal && lineItemRepSplitsTarget !== null}
          title="Commission Splits"
          subtitle="Divide commission for this line item"
          splits={lineItemRepSplits}
          availableReps={availableOutsideReps}
          onClose={() => {
            // Apply to line item
            if (lineItemRepSplitsTarget) {
              setQuoteLineItems(prev => prev.map(item =>
                item.id === lineItemRepSplitsTarget
                  ? { ...item, outsideRepSplits: lineItemRepSplits.map(s => ({ repId: s.repId, repName: s.repName, percentage: s.percentage })) }
                  : item
              ));
            }
            setShowLineItemRepSplitsModal(false);
            setLineItemRepSplitsTarget(null);
          }}
          onCancel={() => {
            setShowLineItemRepSplitsModal(false);
            setLineItemRepSplitsTarget(null);
            setLineItemRepSplits([]);
          }}
          onSetSplits={setLineItemRepSplits}
        />

''',
    '''        {/* Line Item Inside Rep Commission Splits Modal */}
        <GenericRepSplitsModal
          show={showLineItemInsideRepSplitsModal && lineItemInsideRepSplitsTarget !== null}
          title="Inside Rep Commission Splits"
          subtitle="Divide commission for this line item"
          splits={lineItemInsideRepSplits}
          availableReps={availableInsideReps}
          onClose={() => {
            // Apply to line item
            if (lineItemInsideRepSplitsTarget) {
              setQuoteLineItems(prev => prev.map(item =>
                item.id === lineItemInsideRepSplitsTarget
                  ? { ...item, insideRepSplits: lineItemInsideRepSplits.map(s => ({ repId: s.repId, repName: s.repName, percentage: s.percentage })) }
                  : item
              ));
            }
            setShowLineItemInsideRepSplitsModal(false);
            setLineItemInsideRepSplitsTarget(null);
          }}
          onCancel={() => {
            setShowLineItemInsideRepSplitsModal(false);
            setLineItemInsideRepSplitsTarget(null);
            setLineItemInsideRepSplits([]);
          }}
          onSetSplits={setLineItemInsideRepSplits}
        />

''',
]

# Process modals from last to first to maintain line numbers
for i in range(len(modals_to_replace) - 1, -1, -1):
    start_marker, end_marker = modals_to_replace[i]
    replacement = replacements[i]

    start_line = None
    end_line = None

    for j, line in enumerate(lines):
        if start_marker in line:
            start_line = j
        if start_line is not None and end_marker in line:
            end_line = j
            break

    if start_line is None or end_line is None:
        print(f"Could not find markers for modal {i+1}: {start_marker}")
        continue

    print(f"Replacing modal {i+1}: lines {start_line + 1} to {end_line}")
    lines = lines[:start_line] + [replacement] + lines[end_line:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("All rep splits modals replaced successfully!")
