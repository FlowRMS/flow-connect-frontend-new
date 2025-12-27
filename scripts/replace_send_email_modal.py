#!/usr/bin/env python3
import sys

file_path = r"c:\Users\ksubh\Desktop\Subhans projects\flow crm  curtis mock\flow-crm\components\QuotesContent.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_line = None
end_line = None

for i, line in enumerate(lines):
    if '{/* Send Email Modal */}' in line:
        start_line = i
    if start_line is not None and '{/* Mark Approval Status Modal */}' in line:
        end_line = i
        break

if start_line is None or end_line is None:
    print("Could not find markers")
    print(f"start_line: {start_line}, end_line: {end_line}")
    sys.exit(1)

print(f"Found Send Email Modal from line {start_line + 1} to {end_line}")

replacement = '''        {/* Send Email Modal */}
        <SendEmailModal
          show={showSendEmailModal}
          generatedPdfData={generatedPdfData}
          pdfTemplate={pdfTemplate}
          onClose={() => setShowSendEmailModal(false)}
          onPreviewPdf={() => {
            setShowSendEmailModal(false);
            setShowPdfPreviewModal(true);
          }}
          onSend={() => {
            if (generatedPdfData) {
              alert('Email sent successfully to Mike Johnson with approval request for ' + generatedPdfData.manufacturer);
            }
            setShowSendEmailModal(false);
            setGeneratedPdfData(null);
            setSelectedManufacturerForApproval(null);
          }}
        />

'''

new_lines = lines[:start_line] + [replacement] + lines[end_line:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Replacement completed. Removed {end_line - start_line} lines.")
