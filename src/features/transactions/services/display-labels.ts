export function getTransactionDisplayLabel(
  symbol: string | undefined,
  name: string,
  assetClass: string,
  date: Date,
  maturityDate?: string | Date
): string {
  if (assetClass === 'TERM_DEPOSIT' && maturityDate) {
    const matDate = new Date(maturityDate);
    const tenor = Math.round((matDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    return `${name} ${tenor}-Month Term Deposit`;
  }
  return symbol || name;
}
