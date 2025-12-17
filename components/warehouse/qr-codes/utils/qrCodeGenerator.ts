// QR code pattern generation utilities

import React from 'react';

/**
 * Generate a deterministic QR-like pattern based on ID (for visual representation)
 * Returns SVG string for print
 */
export function generateQRPattern(id: string): string {
  const hash = hashCode(id);
  let svg = '';

  // Corner markers
  svg += `<rect x="5" y="5" width="20" height="20" fill="black"/>`;
  svg += `<rect x="8" y="8" width="14" height="14" fill="white"/>`;
  svg += `<rect x="11" y="11" width="8" height="8" fill="black"/>`;

  svg += `<rect x="75" y="5" width="20" height="20" fill="black"/>`;
  svg += `<rect x="78" y="8" width="14" height="14" fill="white"/>`;
  svg += `<rect x="81" y="11" width="8" height="8" fill="black"/>`;

  svg += `<rect x="5" y="75" width="20" height="20" fill="black"/>`;
  svg += `<rect x="8" y="78" width="14" height="14" fill="white"/>`;
  svg += `<rect x="11" y="81" width="8" height="8" fill="black"/>`;

  // Data pattern based on hash
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const bit = (hash >> (i * 8 + j)) & 1;
      if (bit || (i + j) % 3 === 0) {
        const x = 30 + i * 5;
        const y = 30 + j * 5;
        svg += `<rect x="${x}" y="${y}" width="4" height="4" fill="black"/>`;
      }
    }
  }

  return svg;
}

/**
 * Generate a deterministic QR-like pattern as React nodes
 * Returns React elements for on-screen preview
 */
export function generateQRPatternSVG(id: string): React.ReactNode {
  const hash = hashCode(id);
  const elements: React.ReactNode[] = [];

  // Corner markers
  elements.push(React.createElement('rect', { key: 'c1', x: '5', y: '5', width: '20', height: '20', fill: 'currentColor' }));
  elements.push(React.createElement('rect', { key: 'c1w', x: '8', y: '8', width: '14', height: '14', fill: 'white' }));
  elements.push(React.createElement('rect', { key: 'c1b', x: '11', y: '11', width: '8', height: '8', fill: 'currentColor' }));

  elements.push(React.createElement('rect', { key: 'c2', x: '75', y: '5', width: '20', height: '20', fill: 'currentColor' }));
  elements.push(React.createElement('rect', { key: 'c2w', x: '78', y: '8', width: '14', height: '14', fill: 'white' }));
  elements.push(React.createElement('rect', { key: 'c2b', x: '81', y: '11', width: '8', height: '8', fill: 'currentColor' }));

  elements.push(React.createElement('rect', { key: 'c3', x: '5', y: '75', width: '20', height: '20', fill: 'currentColor' }));
  elements.push(React.createElement('rect', { key: 'c3w', x: '8', y: '78', width: '14', height: '14', fill: 'white' }));
  elements.push(React.createElement('rect', { key: 'c3b', x: '11', y: '81', width: '8', height: '8', fill: 'currentColor' }));

  // Data pattern
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const bit = (hash >> (i * 8 + j)) & 1;
      if (bit || (i + j) % 3 === 0) {
        const x = 30 + i * 5;
        const y = 30 + j * 5;
        elements.push(React.createElement('rect', { key: `d${i}${j}`, x, y, width: '4', height: '4', fill: 'currentColor' }));
      }
    }
  }

  return React.createElement(React.Fragment, {}, ...elements);
}

/**
 * Generate hash code from string for deterministic patterns
 */
export function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
