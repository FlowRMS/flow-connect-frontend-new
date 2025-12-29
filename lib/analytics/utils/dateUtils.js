/**
 * Utility functions for date operations and calculations
 */

/**
 * Calculates Year-To-Date data by filtering current year and comparing with same period last year
 *
 * @param {Array} rows - Array of data objects with orderDate property
 * @returns {Object} Object containing filtered data for current year and last year same period
 */
export const calculateYTD = (rows) => {
  if (!rows || !Array.isArray(rows)) {
    return { currentYearData: [], lastYearSamePeriod: [] };
  }

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  // Filter data for current year only
  const currentYearData = rows.filter((row) => {
    if (!row.orderDate) return false;
    const orderDate = new Date(row.orderDate);
    return !isNaN(orderDate) && orderDate.getFullYear() === currentYear;
  });

  // Filter data for previous year same period
  const lastYear = currentYear - 1;
  const lastYearSamePeriod = rows.filter((row) => {
    if (!row.orderDate) return false;
    const orderDate = new Date(row.orderDate);
    return (
      !isNaN(orderDate) &&
      orderDate.getFullYear() === lastYear &&
      (orderDate.getMonth() < currentDate.getMonth() ||
        (orderDate.getMonth() === currentDate.getMonth() &&
          orderDate.getDate() <= currentDate.getDate()))
    );
  });

  return {
    currentYearData,
    lastYearSamePeriod,
  };
};

/**
 * Calculates percentage change between two values
 *
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {number} Percentage change
 */
export const calculatePercentChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};
