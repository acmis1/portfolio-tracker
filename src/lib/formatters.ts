export const formatCurrency = (value: number, currency = 'VND'): string => {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatPercentage = (value: number, includeSign = true): string => {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
  
  if (includeSign && value > 0) {
    return `+${formatted}`;
  }
  return formatted;
};

export const formatNumber = (value: number, decimals = 2): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

export const formatAssetClass = (slug: string): string => {
  if (!slug) return '';
  
  const mapping: Record<string, string> = {
    'INDIVIDUAL_STOCK': 'Individual Stock',
    'ETF': 'ETF',
    'STOCK_FUND': 'Stock Fund',
    'BOND_FUND': 'Bond Fund',
    'CRYPTO': 'Crypto',
    'REAL_ESTATE': 'Real Estate',
    'TERM_DEPOSIT': 'Term Deposit',
    'GOLD': 'Gold'
  };

  if (mapping[slug]) return mapping[slug];
  return slug
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const MACRO_MAPPING: Record<string, string> = {
  'INDIVIDUAL_STOCK': 'Equities',
  'ETF': 'Equities (Funds)',
  'STOCK_FUND': 'Equities (Funds)',
  'BOND_FUND': 'Fixed Income',
  'CASH': 'Cash & Equivalents',
  'TERM_DEPOSIT': 'Cash & Equivalents',
  'CRYPTO': 'Cryptocurrency',
  'REAL_ESTATE': 'Real Estate',
  'GOLD': 'Commodities',
};

export const formatMacroCategory = (slug: string): string => {
  return MACRO_MAPPING[slug] || formatAssetClass(slug);
};
