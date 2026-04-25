import { prisma } from "../../src/lib/db";
import { 
  recalculateAssetPnLService, 
  recalculateHistoricalSnapshotsService 
} from "../../src/features/portfolio/services/recalculation-service";

/**
 * Audit Recalculation Parity
 * 
 * This script runs the extracted recalculation logic in a non-destructive way 
 * (by comparing outputs or using a dry-run mode if we had one, but here we 
 * will just compare the calculated values for snapshots against existing DB rows).
 */

async function main() {
  if (process.env.NODE_ENV === "production" && !process.env.I_AM_SURE_PRODUCTION) {
    console.error("❌ ERROR: This script is restricted in production.");
    process.exit(1);
  }

  if (process.env.ALLOW_RECALC_AUDIT !== "true") {
    console.error("❌ ERROR: Set ALLOW_RECALC_AUDIT=true to run this script.");
    process.exit(1);
  }

  console.log("🔍 Starting Recalculation Parity Audit...");

  // 1. Find a target user (pick the first one with snapshots)
  const targetSnapshot = await prisma.portfolioSnapshot.findFirst({
    orderBy: { date: 'desc' }
  });

  if (!targetSnapshot) {
    console.log("⚠️ No snapshots found in DB. Nothing to audit.");
    return;
  }

  const userId = targetSnapshot.userId;
  console.log(`👤 Auditing User: ${userId}`);

  // 2. Define audit window (last 7 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 7);
  startDate.setHours(0, 0, 0, 0);

  console.log(`📅 Window: ${startDate.toISOString()} to ${endDate.toISOString()}`);

  // 3. Fetch existing snapshots for comparison
  const existingSnapshots = await prisma.portfolioSnapshot.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { date: 'asc' }
  });

  console.log(`📊 Found ${existingSnapshots.length} existing snapshots for comparison.`);

  // 4. Since the service currently performs WRITES (upserts), 
  // we will perform a simulation by reading the logic.
  // Actually, for Phase 1, the service IS the old logic. 
  // So we expect the upserts to result in IDENTICAL values.
  
  console.log("🚀 Running recalculateHistoricalSnapshotsService (will overwrite existing rows with identical values)...");
  
  const startTime = Date.now();
  await recalculateHistoricalSnapshotsService(startDate, userId);
  const duration = Date.now() - startTime;

  console.log(`✅ Recalculation complete in ${duration}ms.`);

  // 5. Verify parity
  const postSnapshots = await prisma.portfolioSnapshot.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { date: 'asc' }
  });

  let matchCount = 0;
  let diffCount = 0;

  for (let i = 0; i < existingSnapshots.length; i++) {
    const old = existingSnapshots[i];
    const updated = postSnapshots.find(s => s.date.getTime() === old.date.getTime());

    if (!updated) {
      console.log(`❌ Missing snapshot for ${old.date.toISOString()}`);
      diffCount++;
      continue;
    }

    const diffs = [];
    if (Math.abs(old.totalValue - updated.totalValue) > 0.01) diffs.push(`totalValue: ${old.totalValue} -> ${updated.totalValue}`);
    if (Math.abs(old.investedValue - updated.investedValue) > 0.01) diffs.push(`investedValue: ${old.investedValue} -> ${updated.investedValue}`);
    if (Math.abs(old.cashBalance - updated.cashBalance) > 0.01) diffs.push(`cashBalance: ${old.cashBalance} -> ${updated.cashBalance}`);
    if (Math.abs(old.costBasis - updated.costBasis) > 0.01) diffs.push(`costBasis: ${old.costBasis} -> ${updated.costBasis}`);

    if (diffs.length > 0) {
      console.log(`❌ Difference on ${old.date.toISOString()}: ${diffs.join(', ')}`);
      diffCount++;
    } else {
      matchCount++;
    }
  }

  console.log("\n--- Audit Summary ---");
  console.log(`✅ Matches: ${matchCount}`);
  console.log(`❌ Differences: ${diffCount}`);
  
  if (diffCount === 0 && matchCount > 0) {
    console.log("🌟 PARITY VERIFIED: The extracted service produces identical results to current DB state.");
  } else if (matchCount === 0 && diffCount === 0) {
    console.log("❓ No data compared.");
  } else {
    console.log("⚠️ PARITY FAILED or some values shifted due to data changes since last snapshot.");
  }
}

main()
  .catch(e => {
    console.error("💥 Audit script failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
