// Canvas Utilities

/**
 * Pixels per foot for visual representation
 */
export const PIXELS_PER_FOOT = 10;

/**
 * Convert feet to pixels
 */
export function feetToPixels(feet: number): number {
  return feet * PIXELS_PER_FOOT;
}

/**
 * Convert pixels to feet
 */
export function pixelsToFeet(pixels: number): number {
  return Math.round(pixels / PIXELS_PER_FOOT);
}

/**
 * Snap a value to grid
 */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate grid size based on element depth
 */
export function getGridSize(depth: number): number {
  return Math.max(5, 20 - depth * 5);
}

/**
 * Get grid background style
 */
export function getGridBackgroundStyle(gridSize: number, color: string): React.CSSProperties {
  const gridColor = color.includes('purple')
    ? 'rgba(147,51,234,0.1)'
    : color.includes('blue')
      ? 'rgba(59,130,246,0.1)'
      : color.includes('green')
        ? 'rgba(34,197,94,0.1)'
        : 'rgba(0,0,0,0.05)';

  return {
    backgroundImage: `
      linear-gradient(to right, ${gridColor} 1px, transparent 1px),
      linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)
    `,
    backgroundSize: `${gridSize}px ${gridSize}px`,
  };
}
