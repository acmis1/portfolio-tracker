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
