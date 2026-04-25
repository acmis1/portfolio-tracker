import { prisma } from "@/server/db";

export type ActivityType = 'BUY' | 'SELL' | 'DEPOSIT' | 'WITHDRAWAL' | 'DIVIDEND' | 'INTEREST';

export interface UnifiedActivity {
  id: string;
  date: Date;
  type: ActivityType;
  amount: number;
  quantity?: number;
  price?: number;
  assetName?: string;
  assetSymbol?: string;
  description?: string;
  referenceId?: string;
  category: 'CASH' | 'ASSET' | 'INCOME';
}

export async function getUnifiedActivity(userId: string): Promise<UnifiedActivity[]> {
  const [assetTxs, cashTxs] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      include: { asset: true },
      orderBy: { date: 'desc' }
    }),
    prisma.cashTransaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' }
    })
  ]);

  // Create a map of cash transaction IDs already handled by asset transactions to avoid double counting
  const handledCashTxIds = new Set(assetTxs.map(tx => tx.cashTransactionId).filter(Boolean));

  const normalizedAssetTxs: UnifiedActivity[] = assetTxs.map(tx => ({
    id: tx.id,
    date: tx.date,
    type: tx.type as ActivityType,
    amount: tx.grossAmount,
    quantity: tx.quantity,
    price: tx.pricePerUnit,
    assetName: tx.asset.name,
    assetSymbol: tx.asset.symbol,
    category: 'ASSET'
  }));

  const normalizedCashTxs: UnifiedActivity[] = cashTxs
    .filter(tx => !handledCashTxIds.has(tx.id))
    .map(tx => ({
      id: tx.id,
      date: tx.date,
      type: tx.type as ActivityType,
      amount: tx.amount,
      description: tx.description || undefined,
      referenceId: tx.referenceId || undefined,
      category: tx.type === 'DIVIDEND' || tx.type === 'INTEREST' ? 'INCOME' : 'CASH'
    }));

  return [...normalizedAssetTxs, ...normalizedCashTxs].sort((a, b) => b.date.getTime() - a.date.getTime());
}
