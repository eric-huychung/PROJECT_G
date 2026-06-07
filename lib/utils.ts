/**
 * Shared className helper for conditional Tailwind classes.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names with tailwind-merge deduplication.
 *
 * @param inputs - Class values to combine
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
