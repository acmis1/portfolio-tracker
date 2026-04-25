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
/**
 * Determines the best display labels for an asset to avoid "ugly" internal symbols.
 * Returns { primary: string, secondary?: string }
 */
export function formatAssetDisplay(symbol: string, name: string): { primary: string; secondary?: string } {
  const isInternal = symbol.includes('_') || symbol.startsWith('TD_');
  const normalizedName = name.toUpperCase().replace(/\s+/g, '_');
  
  // Rule 1: Hide ugly internal symbols that are just normalized names or TD identifiers
  if (isInternal && (symbol === normalizedName || symbol.startsWith('TD_'))) {
    return { primary: name };
  }

  // Rule 2: If symbol and name are identical, show only one
  if (symbol.toUpperCase() === name.toUpperCase()) {
    return { primary: name };
  }

  // Rule 3: For real tickers, show both if they differ
  return { primary: symbol, secondary: name };
}

/**
 * Formats a raw asset class constant into a human-readable label.
 */
export function formatAssetClass(assetClass: string): string {
  const mapping: Record<string, string> = {
    'STOCK_FUND': 'Stock Fund',
    'BOND_FUND': 'Bond Fund',
    'TERM_DEPOSIT': 'Term Deposit',
    'REAL_ESTATE': 'Real Estate',
    'INDIVIDUAL_STOCK': 'Individual Stock',
    'CRYPTOCURRENCY': 'Cryptocurrency',
    'ETF': 'ETF',
    'GOLD': 'Gold',
    'CASH': 'Cash'
  };

  return mapping[assetClass] || assetClass.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}
