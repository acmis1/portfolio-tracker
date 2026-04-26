import { prisma } from "@/server/db";
import { TransactionMetadata } from "./types";

export type ActivityType = 'BUY' | 'SELL' | 'DEPOSIT' | 'WITHDRAWAL' | 'DIVIDEND' | 'INTEREST' | 'CONVERSION';

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
  category: 'CASH' | 'ASSET' | 'INCOME' | 'CONVERSION';
  metadata?: TransactionMetadata | null;
  // Conversion specific fields
  fromAssetSymbol?: string;
  fromAssetName?: string;
  fromQuantity?: number;
  toAssetSymbol?: string;
  toAssetName?: string;
  toQuantity?: number;
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

  // Create a map of cash transaction IDs already handled by asset transactions
  const handledCashTxIds = new Set(assetTxs.map(tx => tx.cashTransactionId).filter(Boolean));

  // Group asset transactions by conversionId
  const conversions = new Map<string, typeof assetTxs>();
  const independentAssetTxs: typeof assetTxs = [];

  assetTxs.forEach(tx => {
    if (tx.conversionId) {
      const group = conversions.get(tx.conversionId) || [];
      group.push(tx);
      conversions.set(tx.conversionId, group);
    } else {
      independentAssetTxs.push(tx);
    }
  });

  const normalizedConversions: UnifiedActivity[] = Array.from(conversions.entries()).map(([conversionId, group]) => {
    const fromLeg = group.find(tx => (tx.metadata as TransactionMetadata | null)?.conversionRole === 'FROM');
    const toLeg = group.find(tx => (tx.metadata as TransactionMetadata | null)?.conversionRole === 'TO');

    if (!fromLeg || !toLeg) {
      // Fallback for incomplete conversion
      const mainLeg = fromLeg || toLeg || group[0];
      return {
        id: conversionId,
        date: mainLeg.date,
        type: 'CONVERSION',
        amount: 0,
        description: 'Incomplete conversion record',
        category: 'CONVERSION',
        metadata: mainLeg.metadata as TransactionMetadata | null
      };
    }

    return {
      id: conversionId,
      date: fromLeg.date,
      type: 'CONVERSION',
      amount: 0, // Internal transfer, neutral amount
      category: 'CONVERSION',
      fromAssetSymbol: fromLeg.asset.symbol,
      fromAssetName: fromLeg.asset.name,
      fromQuantity: fromLeg.quantity,
      toAssetSymbol: toLeg.asset.symbol,
      toAssetName: toLeg.asset.name,
      toQuantity: toLeg.quantity,
      description: `Converted ${fromLeg.asset.symbol} → ${toLeg.asset.symbol}`,
      metadata: fromLeg.metadata as TransactionMetadata | null,
      price: Math.abs(fromLeg.grossAmount) // Use cost basis as "price" reference for the transfer
    };
  });

  const normalizedAssetTxs: UnifiedActivity[] = independentAssetTxs.map(tx => ({
    id: tx.id,
    date: tx.date,
    type: tx.type as ActivityType,
    amount: tx.grossAmount,
    quantity: tx.quantity,
    price: tx.pricePerUnit,
    assetName: tx.asset.name,
    assetSymbol: tx.asset.symbol,
    category: 'ASSET',
    metadata: tx.metadata as TransactionMetadata | null
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

  return [...normalizedConversions, ...normalizedAssetTxs, ...normalizedCashTxs]
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}
