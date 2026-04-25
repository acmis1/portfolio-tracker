'use server'

import { 
  recalculateAssetPnLService, 
  recalculateHistoricalSnapshotsService 
} from "../services/recalculation-service"

/**
 * Recalculates realized P&L for all transactions of a specific asset.
 * This should be called whenever a transaction for that asset is added, edited, or deleted.
 */
export async function recalculateAssetPnL(assetId: string, userId: string) {
  return recalculateAssetPnLService(assetId, userId)
}

/**
 * Recalculates the historical PortfolioSnapshots from a specific date onwards.
 * This ensures the growth chart reflects the corrected reality for a specific user.
 */
export async function recalculateHistoricalSnapshots(startDate: Date, userId: string) {
  return recalculateHistoricalSnapshotsService(startDate, userId)
}
