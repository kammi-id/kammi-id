import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to merge Tailwind CSS classes using clsx and tailwind-merge.
 * It handles conditional classes and prevents class collisions.
 *
 * @param inputs - Array of class values to be merged.
 * @returns A string of merged CSS classes.
 *
 * @example
 * ```tsx
 * <div className={cn('px-2 py-1', isActive && 'bg-blue-500')} />
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
