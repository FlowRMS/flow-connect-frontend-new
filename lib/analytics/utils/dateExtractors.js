/**
 * Utility functions to extract year, quarter, and month from dates
 * Used for pivot table date-based grouping and filtering
 */

/**
 * Extract year from a date
 * @param {Date|string|null} date - Date object, ISO string, or null
 * @returns {number|null} Year as number (e.g., 2024) or null if invalid
 */
export function extractYear(date) {
  if (!date) return null;
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return null;
    return dateObj.getFullYear();
  } catch (error) {
    return null;
  }
}

/**
 * Extract quarter from a date
 * @param {Date|string|null} date - Date object, ISO string, or null
 * @returns {string|null} Quarter as string (e.g., "Q1", "Q2", "Q3", "Q4") or null if invalid
 */
export function extractQuarter(date) {
  if (!date) return null;
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return null;
    const month = dateObj.getMonth(); // 0-11
    const quarter = Math.floor(month / 3) + 1;
    return `Q${quarter}`;
  } catch (error) {
    return null;
  }
}

/**
 * Extract month from a date
 * @param {Date|string|null} date - Date object, ISO string, or null
 * @param {boolean} useMonthNames - If true, returns month name (e.g., "January"), otherwise returns number (1-12)
 * @returns {string|number|null} Month as string name, number, or null if invalid
 */
export function extractMonth(date, useMonthNames = false) {
  if (!date) return null;
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return null;
    const month = dateObj.getMonth(); // 0-11
    
    if (useMonthNames) {
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      return monthNames[month];
    }
    
    return month + 1; // Return 1-12
  } catch (error) {
    return null;
  }
}

/**
 * Extract all date components (year, quarter, month) from a date
 * @param {Date|string|null} date - Date object, ISO string, or null
 * @param {boolean} useMonthNames - If true, returns month name, otherwise returns number
 * @returns {Object} Object with year, quarter, and month properties
 */
export function extractDateComponents(date, useMonthNames = false) {
  return {
    year: extractYear(date),
    quarter: extractQuarter(date),
    month: extractMonth(date, useMonthNames),
  };
}
