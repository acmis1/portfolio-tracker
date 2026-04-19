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
    'MUTUAL_FUND': 'Mutual Fund',
    'REAL_ESTATE': 'Real Estate',
    'STOCK': 'Stock',
    'CRYPTO': 'Crypto',
    'GOLD': 'Gold',
    'TERM_DEPOSIT': 'Term Deposit'
  };

  if (mapping[slug]) return mapping[slug];

  return slug
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
