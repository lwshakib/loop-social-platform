/**
 * Styling Utilities
 * Helper functions for consistently managing CSS classes, especially
 * for merging and deduplicating Tailwind CSS classes.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn (Class Names)
 * Combines multiple CSS class inputs into a single string.
 * It uses 'clsx' to manage conditional classes and 'twMerge' to
 * resolve conflicts between different Tailwind utility classes.
 *
 * @param inputs Array of class names or conditional class objects.
 * @returns A clean, deduplicated string of CSS classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
