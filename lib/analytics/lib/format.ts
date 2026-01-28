/**
 * Format a number as currency (USD)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a number as currency with full precision (up to 4 decimal places)
 */
export function formatCurrencyPrecise(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(value);
}

/**
 * Format a number as percentage
 */
export function formatPercentage(value: number | null | undefined): string {
  const num = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  if (!Number.isFinite(num)) return '-';
  return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
}

/**
 * Format a raw percentage value (e.g., 0.1234 -> "12.3%")
 */
export function formatPercentageFromDecimal(value: number | null | undefined): string {
  const num = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  if (!Number.isFinite(num)) return '-';
  return `${num >= 0 ? '+' : ''}${(num * 100).toFixed(1)}%`;
}

/**
 * Format large numbers with k/M suffixes
 */
export function formatNumberCompact(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}