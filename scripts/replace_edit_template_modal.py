#!/usr/bin/env python3
import sys

file_path = r"c:\Users\ksubh\Desktop\Subhans projects\flow crm  curtis mock\flow-crm\components\QuotesContent.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_line = None
end_line = None

for i, line in enumerate(lines):
    if '{/* Edit Template Modal */}' in line:
        start_line = i
    if start_line is not None and '{/* Send Email Modal */}' in line:
        end_line = i
        break

if start_line is None or end_line is None:
    print("Could not find markers")
    sys.exit(1)

print(f"Found Edit Template Modal from line {start_line + 1} to {end_line}")

replacement = '''        {/* Edit Template Modal */}
        <EditTemplateModal
          show={showEditTemplateModal}
          pdfTemplate={pdfTemplate}
          onClose={() => setShowEditTemplateModal(false)}
          onSetPdfTemplate={setPdfTemplate}
          onSave={() => {
            alert('Template saved successfully!');
            setShowEditTemplateModal(false);
          }}
          onReset={() => {
            setPdfTemplate({
              companyLogo: true,
              companyName: 'FlowConnect Lighting',
              companyAddress: '123 Main Street, Suite 400\\nAnytown, ST 12345',
              includeProjectDetails: true,
              includeProductList: true,
              includeSpecSheets: true,
              includeJustification: true,
              headerText: 'Manufacturer Approval Request',
              footerText: 'Thank you for your consideration. Please respond within 5 business days.',
              customMessage: '',
            });
          }}
        />

'''

new_lines = lines[:start_line] + [replacement] + lines[end_line:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Replacement completed. Removed {end_line - start_line} lines.")
