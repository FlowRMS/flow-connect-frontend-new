#!/usr/bin/env python3
import sys

file_path = r"c:\Users\ksubh\Desktop\Subhans projects\flow crm  curtis mock\flow-crm\components\QuotesContent.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_line = None
end_line = None

for i, line in enumerate(lines):
    if '{/* Kanban View */}' in line:
        start_line = i
    if start_line is not None and '/* List View */' in line:
        # End is the line before "/* List View */"
        # We need to find the ) : ( before List View
        end_line = i - 1
        break

if start_line is None or end_line is None:
    print("Could not find markers")
    print(f"start_line: {start_line}, end_line: {end_line}")
    sys.exit(1)

print(f"Found Kanban View from line {start_line + 1} to {end_line}")

replacement = '''      {/* Kanban View */}
      {viewMode === 'kanban' ? (
        <QuotesKanbanView
          stages={stages}
          quotesByStage={quotesByStage}
          sensors={sensors}
          handleDragStart={handleDragStart}
          handleDragEnd={handleDragEnd}
          handleDragCancel={handleDragCancel}
          handleQuoteSelect={handleQuoteSelect}
          activeQuote={activeQuote}
        />
      ) : (
'''

new_lines = lines[:start_line] + [replacement] + lines[end_line + 1:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Replacement completed. Removed {end_line - start_line} lines.")
