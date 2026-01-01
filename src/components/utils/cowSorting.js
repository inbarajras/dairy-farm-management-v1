// Cow Sorting Utilities

import { SHIFT_TYPES } from './cowConstants';

/**
 * Sorts milk production records by date (newest first) and shift priority (Evening > Morning)
 * @param {Array} milkProduction - Array of milk production records
 * @returns {Array} Sorted array of milk production records
 */
export const sortMilkProductionRecords = (milkProduction) => {
  if (!Array.isArray(milkProduction) || milkProduction.length === 0) {
    return [];
  }

  return [...milkProduction].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);

    // Check for invalid dates
    if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
      console.warn('Invalid date found in milk production records:', { a: a.date, b: b.date });
      return 0;
    }

    const dateComparison = dateB.getTime() - dateA.getTime(); // Descending order (newest first)

    // If dates are the same, prioritize Evening shift over Morning shift
    if (dateComparison === 0) {
      const shiftA = a.shift || SHIFT_TYPES.MORNING;
      const shiftB = b.shift || SHIFT_TYPES.MORNING;

      // Evening has higher priority than Morning
      if (shiftA === SHIFT_TYPES.EVENING && shiftB === SHIFT_TYPES.MORNING) {
        return -1; // a comes first (Evening before Morning)
      }
      if (shiftA === SHIFT_TYPES.MORNING && shiftB === SHIFT_TYPES.EVENING) {
        return 1; // b comes first (Evening before Morning)
      }

      // If both are the same shift, maintain original order
      return 0;
    }

    return dateComparison;
  });
};

/**
 * Compares two milk production records for sorting
 * Useful as a direct comparator function
 * @param {Object} a - First milk production record
 * @param {Object} b - Second milk production record
 * @returns {number} Comparison result (-1, 0, or 1)
 */
export const compareMilkProductionRecords = (a, b) => {
  const dateA = new Date(a.date);
  const dateB = new Date(b.date);

  // Check for invalid dates
  if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
    console.warn('Invalid date found in milk production records:', { a: a.date, b: b.date });
    return 0;
  }

  const dateComparison = dateB.getTime() - dateA.getTime();

  // If dates are the same, prioritize Evening shift over Morning shift
  if (dateComparison === 0) {
    const shiftA = a.shift || SHIFT_TYPES.MORNING;
    const shiftB = b.shift || SHIFT_TYPES.MORNING;

    if (shiftA === SHIFT_TYPES.EVENING && shiftB === SHIFT_TYPES.MORNING) {
      return -1;
    }
    if (shiftA === SHIFT_TYPES.MORNING && shiftB === SHIFT_TYPES.EVENING) {
      return 1;
    }

    return 0;
  }

  return dateComparison;
};
