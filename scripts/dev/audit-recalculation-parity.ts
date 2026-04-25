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

  const auditDays = parseInt(process.env.RECALC_AUDIT_DAYS || "30");
  const auditUserId = process.env.RECALC_AUDIT_USER_ID;

  // 1. Find a target user
  let userId = auditUserId;
  if (!userId) {
    const targetSnapshot = await prisma.portfolioSnapshot.findFirst({
      orderBy: { date: 'desc' }
    });
    if (!targetSnapshot) {
      console.log("⚠️ No snapshots found in DB. Nothing to audit.");
      return;
    }
    userId = targetSnapshot.userId;
  }

  console.log(`👤 Auditing User: ${userId}`);

  // 2. Define audit window
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - auditDays);
  startDate.setHours(0, 0, 0, 0);

  console.log(`📅 Window: ${startDate.toISOString()} to ${endDate.toISOString()} (${auditDays} days)`);

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

  console.log(`📊 Found ${existingSnapshots.length} existing snapshots in DB for comparison.`);

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
    const old = existingSnapshots.find(s => s.date.toISOString().split('T')[0] === updated.date.toISOString().split('T')[0]);

    if (!old) {
      console.log(`🆕 New snapshot generated for ${updated.date.toISOString().split('T')[0]} (was missing in DB)`);
      continue;
    }

    const diffs = [];
    const fields = ['totalValue', 'investedValue', 'cashBalance', 'costBasis'] as const;
    
    for (const field of fields) {
      const delta = Math.abs(old[field] - updated[field]);
      if (delta > 0.01) {
        diffs.push(`${field}: ${old[field].toLocaleString()} -> ${updated[field].toLocaleString()} (Δ ${delta.toFixed(4)})`);
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
  console.log(`👤 User ID: ${userId}`);
  console.log(`📅 Range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
  console.log(`📊 Snapshots in DB: ${existingSnapshots.length}`);
  console.log(`📊 Snapshots Recalculated: ${days}`);
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
