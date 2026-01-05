// Convert plain text pseudo code to HTML format with properly nested bullet points
export const convertPseudoCodeToHTML = (text: string): string => {
  if (!text) return '';

  // Split by line breaks, keeping original spacing to detect indentation
  const originalLines = text.split(/\r?\n/);

  // Create a completely isolated structure with unique class to avoid any CSS conflicts
  let html =
    '<div class="pseudo-formatted-content" style="list-style: none !important; list-style-type: none !important; margin: 0; padding: 0;">\n';
  let inSubSection = false; // Track if we're in a subsection (after a line ending with :)

  for (let i = 0; i < originalLines.length; i++) {
    const line = originalLines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      inSubSection = false;
      continue;
    }

    // Detect indentation (spaces or tabs at the start of original line)
    const indentMatch = line.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1].length : 0;
    const isIndented = indent >= 4;
    const isDeeplyIndented = indent >= 8; // 8+ spaces = sub-sub-item

    // Check if line ends with colon
    const endsWithColon = trimmed.endsWith(':');

    // Determine nesting level:
    // - Deeply indented (8+ spaces) = sub-sub-item (3 levels)
    // - Indented (4+ spaces) = sub-item (2 levels)
    // - In subsection and doesn't end with colon = sub-item (2 levels)
    // - Lines ending with colon are always main items (resets subsection)
    // - Otherwise = main item (1 level)
    let nestingLevel = 0;
    if (isDeeplyIndented) {
      nestingLevel = 2; // Sub-sub-item
    } else if (isIndented || (inSubSection && !endsWithColon)) {
      nestingLevel = 1; // Sub-item
    } else {
      nestingLevel = 0; // Main item
    }

    // Calculate bullet style based on nesting level
    let bulletStyle = '\u2022'; // Default bullet (•)
    if (nestingLevel === 1) {
      bulletStyle = '\u25CB'; // Hollow circle for level 2 (○)
    } else if (nestingLevel === 2) {
      bulletStyle = '\u25AA'; // Small square for level 3 (▪)
    }

    // Calculate left margin based on nesting level
    const leftMargin = nestingLevel * 1.5; // 1.5rem per level

    // Clean up the text content by removing leading dashes and bullets
    let cleanedText = trimmed;
    // Remove common bullet patterns from the beginning of the text
    cleanedText = cleanedText.replace(/^[-\u2022\u25CB\u25AA\u25E6]\s*/, ''); // Remove dash, bullets, and following space
    cleanedText = cleanedText.replace(/^-\s+/, ''); // Remove dash with multiple spaces

    // Add the list item with comprehensive inline styling to completely override any CSS
    html += `<div class="pseudo-item" style="`;
    html += `position: relative !important; `;
    html += `margin-bottom: 0.25rem !important; `;
    html += `padding-left: ${1.2 + leftMargin}rem !important; `;
    html += `line-height: 1.5 !important; `;
    html += `list-style: none !important; `;
    html += `list-style-type: none !important; `;
    html += `list-style-image: none !important; `;
    html += `display: block !important; `;
    html += `">`;
    html += `<span style="`;
    html += `position: absolute !important; `;
    html += `left: ${leftMargin}rem !important; `;
    html += `top: 0.1em !important; `;
    html += `font-size: 1em !important; `;
    html += `color: currentColor !important; `;
    html += `display: inline-block !important; `;
    html += `width: 1em !important; `;
    html += `text-align: center !important; `;
    html += `">${bulletStyle}</span>`;
    html += `${cleanedText}</div>\n`;

    // Update subsection state:
    // - If this line ends with colon, start a new subsection (next lines will be sub-items)
    if (endsWithColon) {
      inSubSection = true; // Start new subsection - next non-colon lines will be sub-items
    }
  }

  html += '</div>\n';

  return html;
};

// Legacy alias for backward compatibility
export const convertPseudoCodeToMarkdown = convertPseudoCodeToHTML;





