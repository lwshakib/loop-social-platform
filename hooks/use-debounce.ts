/**
 * useDebounce Hook
 * A custom hook to delay the update of a value until a certain amount of time
 * has passed since the last change. Essential for search inputs to prevent
 * triggering API calls on every keystroke.
 */

import { useEffect, useState } from 'react';

/**
 * useDebounce
 * Creates a debounced version of a rapidly changing value.
 *
 * @param value The raw input value (e.g., search term).
 * @param delay The wait time in milliseconds before the value updates.
 * @returns The debounced value which updates after the delay period.
 */
export function useDebounce<T>(value: T, delay: number): T {
  // Store the debounced value in local state
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // CLEANUP: Cancel the timer if the value or delay changes
    // before the timeout completes. This is what handles the debouncing logic.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
