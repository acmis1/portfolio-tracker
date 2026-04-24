/**
 * Global formatting utilities for Aegis Ledger
 */

/**
 * Formats a number as VND currency with dot separators (e.g., 1.000.000 ₫)
 * Uses the Vietnamese locale (vi-VN) for consistent institutional presentation.
 */
export function formatVND(value: number | undefined | null): string {
  if (value === undefined || value === null) return '0 ₫';
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formats a number with dot thousands separators but without the currency symbol
 */
export function formatNumberDots(value: number | undefined | null): string {
  if (value === undefined || value === null) return '0';
  
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formats an asset quantity with appropriate precision (up to 6 decimals)
 * Prevents showing "0" for small positions like Crypto or Gold.
 */
export function formatQuantity(value: number | undefined | null): string {
  if (value === undefined || value === null) return '0';
  
  // For very small numbers, we want to see the decimals.
  // For large numbers, we might still want some decimals if they exist.
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  }).format(value);
}
/**
 * Formats a number as a compact VND currency (e.g., 1.4B ₫)
 */
export function formatCompactVND(value: number | undefined | null): string {
  if (value === undefined || value === null) return '0 ₫';
  
  return new Intl.NumberFormat('vi-VN', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(value) + ' ₫';
}
