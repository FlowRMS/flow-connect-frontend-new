#!/usr/bin/env python3
"""Remove dead code from QuotesContent.tsx that was moved to LinesTab."""

file_path = r"c:\Users\ksubh\Desktop\Subhans projects\flow crm  curtis mock\flow-crm\components\QuotesContent.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()
    lines = content.split('\n')

# Find sections to remove:
# 1. renderHeaderCell function (now in LinesTab)
# 2. renderBodyCell function (now in LinesTab)

# Find start and end of renderHeaderCell
render_header_start = None
render_header_end = None
for i, line in enumerate(lines):
    if '// Render a table header cell for a given column key' in line:
        render_header_start = i
    if render_header_start is not None and line.strip() == '};' and 'renderHeaderCell' not in lines[i-1]:
        # Check if this is the end of renderHeaderCell by looking ahead for renderBodyCell
        for j in range(i+1, min(i+5, len(lines))):
            if 'renderBodyCell' in lines[j] or '// Render a table body cell' in lines[j]:
                render_header_end = i + 1
                break
        if render_header_end:
            break

# Find start and end of renderBodyCell
render_body_start = None
render_body_end = None
brace_count = 0
in_render_body = False
for i, line in enumerate(lines):
    if '// Render a table body cell for a given column key' in line:
        render_body_start = i
        in_render_body = True
        brace_count = 0
    if in_render_body:
        brace_count += line.count('{') - line.count('}')
        if brace_count == 0 and line.strip() == '};':
            render_body_end = i + 1
            break

print(f"renderHeaderCell: lines {render_header_start + 1 if render_header_start else 'not found'} to {render_header_end if render_header_end else 'not found'}")
print(f"renderBodyCell: lines {render_body_start + 1 if render_body_start else 'not found'} to {render_body_end if render_body_end else 'not found'}")

# First remove renderBodyCell, then renderHeaderCell (reverse order to keep indices valid)
if render_body_start is not None and render_body_end is not None:
    print(f"Removing renderBodyCell ({render_body_end - render_body_start} lines)")
    lines = lines[:render_body_start] + lines[render_body_end:]

# Recalculate renderHeaderCell indices after removal
render_header_start = None
render_header_end = None
for i, line in enumerate(lines):
    if '// Render a table header cell for a given column key' in line:
        render_header_start = i
    if render_header_start is not None and '  };' in line and i > render_header_start:
        # Look for next function definition to confirm this is the end
        for j in range(i+1, min(i+5, len(lines))):
            if 'const ' in lines[j] and '=' in lines[j]:
                render_header_end = i + 1
                break
        if render_header_end:
            break

if render_header_start is not None and render_header_end is not None:
    print(f"Removing renderHeaderCell ({render_header_end - render_header_start} lines)")
    lines = lines[:render_header_start] + lines[render_header_end:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print(f"New line count: {len(lines)}")
