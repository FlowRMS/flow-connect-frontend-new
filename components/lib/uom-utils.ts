/**
 * UOM (Unit of Measure) utilities for handling division factors.
 *
 * Background:
 * The legacy system (v4/v5) used `multiply` and `multiply_by` fields where:
 *   - extended = qty * unit_price * multiply_by (multiplication)
 *
 * The new system (v6) uses `division_factor` where:
 *   - extended = qty * unit_price / division_factor (division)
 *
 * During migration, `multiply_by` was directly copied to `division_factor`,
 * but the operation changed from multiplication to division. This causes
 * incorrect pricing when division_factor < 1:
 *   - Old: multiply_by = 0.1 meant "multiply by 0.1" (i.e., divide by 10)
 *   - New: division_factor = 0.1 → price / 0.1 = price * 10 (WRONG!)
 *
 * This utility normalizes division factors to ensure correct calculations.
 */

/**
 * Normalizes a division factor to ensure correct pricing calculations.
 *
 * If the division factor is less than 1, it's inverted to maintain
 * the same semantic meaning as the legacy system.
 *
 * Examples:
 *   - divisionFactor = 10 → returns 10 (divide by 10)
 *   - divisionFactor = 0.1 → returns 10 (invert: 1/0.1 = 10, divide by 10)
 *   - divisionFactor = 1 → returns 1 (no change)
 *   - divisionFactor = null/undefined → returns 1 (default)
 *
 * @param divisionFactor - The raw division factor from the UOM
 * @returns The normalized divisor to use in calculations
 */
export function normalizeDivisor(divisionFactor: number | null | undefined): number {
  // Default to 1 if not provided
  if (divisionFactor === null || divisionFactor === undefined || divisionFactor === 0) {
    return 1;
  }

  // If division factor is less than 1, invert it to maintain correct semantics
  // This handles legacy data where multiply_by < 1 was used
  if (divisionFactor < 1) {
    return 1 / divisionFactor;
  }

  return divisionFactor;
}

/**
 * Calculates the extended price from quantity, unit price, and division factor.
 *
 * @param quantity - The quantity of items
 * @param unitPrice - The price per unit
 * @param divisionFactor - The raw division factor from the UOM
 * @returns The calculated extended price
 */
export function calculateExtendedPrice(
  quantity: number,
  unitPrice: number,
  divisionFactor: number | null | undefined
): number {
  const divisor = normalizeDivisor(divisionFactor);
  return (quantity * unitPrice) / divisor;
}
