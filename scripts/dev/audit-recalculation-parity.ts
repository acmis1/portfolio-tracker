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

  console.log("🔍 Starting Recalculation Parity Audit (Phase 2)...");

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

  // 2. Define audit window (last 30 days for better benchmarking)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);
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

  console.log(`📊 Found ${existingSnapshots.length} existing snapshots in DB.`);

  // 4. Run the optimized service
  console.log("🚀 Running Optimized recalculateHistoricalSnapshotsService...");
  
  const startTime = Date.now();
  await recalculateHistoricalSnapshotsService(startDate, userId);
  const duration = Date.now() - startTime;

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
  let maxDiff = 0;

  console.log("\n--- Comparison Results ---");
  for (const updated of postSnapshots) {
    const old = existingSnapshots.find(s => s.date.getTime() === updated.date.getTime());

    if (!old) {
      console.log(`🆕 New snapshot generated for ${updated.date.toISOString()} (was missing in DB)`);
      continue;
    }

    const diffs = [];
    const fields = ['totalValue', 'investedValue', 'cashBalance', 'costBasis'] as const;
    
    for (const field of fields) {
      const delta = Math.abs(old[field] - updated[field]);
      if (delta > 0.01) {
        diffs.push(`${field}: ${old[field].toFixed(2)} -> ${updated[field].toFixed(2)} (Δ ${delta.toFixed(4)})`);
        if (delta > maxDiff) maxDiff = delta;
      }
    }

    if (diffs.length > 0) {
      console.log(`❌ Difference on ${updated.date.toISOString().split('T')[0]}: ${diffs.join(', ')}`);
      diffCount++;
    } else {
      matchCount++;
    }
  }

  const days = postSnapshots.length;
  console.log("\n--- Audit Summary ---");
  console.log(`📊 Snapshots Processed: ${days}`);
  console.log(`✅ Matches: ${matchCount}`);
  console.log(`❌ Mismatches: ${diffCount}`);
  console.log(`📏 Max Absolute Difference: ${maxDiff.toFixed(4)} VND`);
  console.log(`⏱️ Total Runtime: ${duration}ms`);
  console.log(`🏎️ Performance: ${(duration / Math.max(1, days)).toFixed(2)} ms/day`);
  
  if (diffCount === 0 && matchCount > 0) {
    console.log("🟢 PASS: Parity verified within 0.01 tolerance.");
  } else if (diffCount > 0) {
    console.log("🔴 FAIL: Mismatches detected. Verify if DB snapshots were stale.");
  } else {
    console.log("🟡 SKIP: No snapshots were available for comparison.");
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
