'use server'

import { PrismaClient } from "@prisma/client"
import { prisma } from "@/server/db"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { recalculateAssetPnL, recalculateHistoricalSnapshots } from "../../portfolio/actions/recalculate"
import { z } from "zod"

const resolveSchema = z.object({
  termDepositId: z.string(),
  actionDate: z.string(),
  resolutionType: z.enum([
    'EXIT_PORTFOLIO',
    'MOVE_TO_TRACKED_CASH',
    'REINVEST_TERM_DEPOSIT',
    'INVEST_TRACKED_ASSET'
  ]),
  resolutionNote: z.string().optional().nullable(),
  // For Reinvest/Invest
  newAsset: z.object({
    symbol: z.string().optional().nullable(),
    name: z.string(),
    assetClass: z.string(),
    price: z.number(),
    quantity: z.number(),
    currency: z.string(),
    maturityDate: z.string().optional().nullable(),
    interestRate: z.number().optional().nullable(),
  }).optional().nullable()
})

export type ResolveTermDepositInput = z.infer<typeof resolveSchema>

export async function resolveTermDepositMaturity(data: ResolveTermDepositInput) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "Unauthorized" }

  const result = resolveSchema.safeParse(data)
  if (!result.success) {
    console.error("Validation failed:", result.error.format())
    return { success: false, error: "Invalid resolution data" }
  }

  const { termDepositId, actionDate, resolutionType, resolutionNote, newAsset } = result.data
  
  // Set to end of day to avoid timezone/same-day maturity issues
  const dateObj = new Date(actionDate)
  dateObj.setHours(23, 59, 59, 999)

  try {
    const dbResult = await prisma.$transaction(async (tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => {
      // 1. Fetch TD and verify
      const td = await tx.termDeposit.findUnique({
        where: { id: termDepositId },
        include: { asset: true }
      })

      if (!td || td.asset.userId !== userId) throw new Error("Term deposit not found")
      if (td.resolvedAt) throw new Error("Term deposit already resolved")

      // 2. Maturity Check
      // We only allow resolving matured deposits. 
      // Using 00:00:00 for maturityDate comparison to ensure same-day resolution is allowed.
      const maturityMidnight = new Date(td.maturityDate)
      maturityMidnight.setHours(0, 0, 0, 0)
      if (dateObj < maturityMidnight) {
        throw new Error("Cannot resolve term deposit before maturity date")
      }

      // 3. Calculate Proceeds (Principal + Capped Interest)
      // Math matches summary.ts interest accrual cap
      const effectiveEndDate = td.maturityDate
      const daysElapsed = Math.max(0, (effectiveEndDate.getTime() - td.startDate.getTime()) / (1000 * 60 * 60 * 24))
      const accruedInterest = (td.principal * (td.interestRate / 100) * daysElapsed) / 365
      const totalProceeds = Math.round(td.principal + accruedInterest)

      // 4. Create SELL transaction for old TD to realize performance
      const sellTx = await tx.transaction.create({
        data: {
          userId,
          assetId: td.assetId,
          type: 'SELL',
          quantity: 1,
          pricePerUnit: totalProceeds,
          grossAmount: totalProceeds,
          date: dateObj,
        }
      })

      let secondaryAssetId: string | null = null

      // 5. Handle Specific Resolution Paths
      if (resolutionType === 'MOVE_TO_TRACKED_CASH') {
        const cashTx = await tx.cashTransaction.create({
          data: {
            userId,
            amount: totalProceeds,
            date: dateObj,
            type: 'SELL_ASSET',
            description: `Resolved TD: ${td.bankName} (${td.asset.symbol}) proceeds moved to cash`,
            currency: 'VND'
          }
        })
        await tx.transaction.update({
          where: { id: sellTx.id },
          data: { cashTransactionId: cashTx.id }
        })
      } 
      else if ((resolutionType === 'REINVEST_TERM_DEPOSIT' || resolutionType === 'INVEST_TRACKED_ASSET') && newAsset) {
        // Handle New Asset Creation/Lookup
        let effectiveSymbol = newAsset.symbol || newAsset.name.toUpperCase().replace(/\s+/g, '_').trim()
        if (newAsset.assetClass === 'TERM_DEPOSIT') {
          // Unique symbol for every TD instance
          effectiveSymbol = `TD_${Date.now()}`
        }

        let asset = await tx.asset.findFirst({
          where: { symbol: effectiveSymbol, userId }
        })

        if (asset) {
          // Update existing asset metadata if it matches
          asset = await tx.asset.update({
            where: { id: asset.id },
            data: { assetClass: newAsset.assetClass, name: newAsset.name }
          })
        } else {
          asset = await tx.asset.create({
            data: {
              symbol: effectiveSymbol,
              name: newAsset.name,
              assetClass: newAsset.assetClass,
              currency: newAsset.currency,
              userId,
            }
          })
        }
        
        secondaryAssetId = asset.id

        // Create TermDeposit record if applicable
        if (newAsset.assetClass === 'TERM_DEPOSIT' && newAsset.maturityDate && newAsset.interestRate !== undefined && newAsset.interestRate !== null) {
          const newMaturityDate = new Date(newAsset.maturityDate)
          if (newMaturityDate <= dateObj) {
            throw new Error("New maturity date must be after resolution date")
          }

          await tx.termDeposit.create({
            data: {
              assetId: asset.id,
              bankName: newAsset.name,
              principal: newAsset.price,
              startDate: dateObj,
              maturityDate: newMaturityDate,
              interestRate: newAsset.interestRate,
            }
          })
        }

        // Create BUY Transaction
        const buyGrossAmount = -(newAsset.quantity * newAsset.price)
        await tx.transaction.create({
          data: {
            userId,
            assetId: asset.id,
            type: 'BUY',
            quantity: newAsset.quantity,
            pricePerUnit: newAsset.price,
            grossAmount: buyGrossAmount,
            date: dateObj,
          }
        })
      }

      // 6. Update TD Metadata to mark it as resolved
      await tx.termDeposit.update({
        where: { id: td.id },
        data: {
          resolvedAt: dateObj,
          resolutionType,
          resolvedAmount: totalProceeds,
          resolutionNote: resolutionNote || null
        }
      })

      return { oldAssetId: td.assetId, secondaryAssetId }
    })

    // 7. Recalculate PnL and Snapshots
    await recalculateAssetPnL(dbResult.oldAssetId, userId)
    if (dbResult.secondaryAssetId) {
      await recalculateAssetPnL(dbResult.secondaryAssetId, userId)
    }
    await recalculateHistoricalSnapshots(dateObj, userId)

    revalidatePath('/')
    revalidatePath('/holdings')
    revalidatePath('/ledger')
    revalidatePath('/rebalance')
    
    return { success: true }
  } catch (error) {
    console.error("Failed to resolve TD maturity:", error)
    return { success: false, error: error instanceof Error ? error.message : "Database operation failed" }
  }
}
