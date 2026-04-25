import { PrismaClient } from "@prisma/client";

// Note: Using a fresh PrismaClient to avoid dependency issues with the server-side one in a script context if needed,
// but usually importing the shared one is better if it's configured correctly.
// For a standalone script, we'll initialize it here.
const prisma = new PrismaClient();

async function main() {
  const isProd = process.env.NODE_ENV === "production";
  const allowFixtures = process.env.ALLOW_DEV_FIXTURES === "true";
  const confirmDelete = process.env.CONFIRM_DELETE_QA_FIXTURES === "true";
  const devUserId = process.env.DEV_FIXTURE_USER_ID;

  console.log("🛠️ Aegis Ledger - QA Fixture Cleanup");
  console.log("------------------------------------");

  if (isProd) {
    console.error("❌ ERROR: Refusing to run in production environment.");
    process.exit(1);
  }

  if (!allowFixtures) {
    console.error("❌ ERROR: ALLOW_DEV_FIXTURES=true is required to run this script.");
    console.log("Usage: $env:ALLOW_DEV_FIXTURES=\"true\"; npm run dev:cleanup-qa-fixtures");
    process.exit(1);
  }

  // 1. Identify QA Assets
  // We look for symbols starting with TD_QA_MATURED_ or names that look like our QA assets
  const qaAssets = await prisma.asset.findMany({
    where: {
      OR: [
        { symbol: { startsWith: "TD_QA_MATURED_" } },
        { name: "QA Matured TD" },
        { name: { contains: "QA Rollover" } },
        { symbol: { startsWith: "QA_TEST_" } },
        { symbol: { startsWith: "TD_17" } } // Automated rollover symbols start with TD_ + timestamp
      ]
    },
    include: {
      termDeposits: true,
      transactions: true
    }
  });

  if (qaAssets.length === 0) {
    console.log("✅ No QA fixtures found in the database.");
    return;
  }

  // 2. Filter by User ID
  const userIds = Array.from(new Set(qaAssets.map(a => a.userId)));
  let targetUserId = devUserId;

  if (!targetUserId) {
    if (userIds.length > 1) {
      console.error(`❌ ERROR: Found QA fixtures belonging to multiple users: ${userIds.join(", ")}`);
      console.error("Please specify which user to clean up using DEV_FIXTURE_USER_ID environment variable.");
      process.exit(1);
    }
    targetUserId = userIds[0];
  }

  const filteredAssets = qaAssets.filter(a => a.userId === targetUserId);

  if (filteredAssets.length === 0) {
    console.log(`✅ No QA fixtures found for user ${targetUserId}.`);
    return;
  }

  console.log(`🔍 Found ${filteredAssets.length} QA assets for user: ${targetUserId}`);
  filteredAssets.forEach(a => {
    console.log(`   - [${a.symbol}] ${a.name} (${a.transactions.length} transactions)`);
  });

  // 3. Dry Run Check
  if (!confirmDelete) {
    console.log("\n⚠️ DRY RUN MODE: No data was deleted.");
    console.log("To perform actual deletion, set CONFIRM_DELETE_QA_FIXTURES=true.");
    console.log("Command: $env:ALLOW_DEV_FIXTURES=\"true\"; $env:CONFIRM_DELETE_QA_FIXTURES=\"true\"; npm run dev:cleanup-qa-fixtures");
    return;
  }

  // 4. Execution
  console.log("\n🚀 Starting atomic deletion...");

  try {
    const result = await prisma.$transaction(async (tx) => {
      let deletedAssets = 0;
      let deletedTransactions = 0;
      let deletedCashTransactions = 0;
      let deletedTermDeposits = 0;
      let deletedPrices = 0;

      for (const asset of filteredAssets) {
        // Find transactions and their linked cash transactions
        const transactions = await tx.transaction.findMany({
          where: { assetId: asset.id }
        });

        for (const t of transactions) {
          if (t.cashTransactionId) {
            await tx.cashTransaction.delete({
              where: { id: t.cashTransactionId }
            });
            deletedCashTransactions++;
          }
          await tx.transaction.delete({
            where: { id: t.id }
          });
          deletedTransactions++;
        }

        // Delete prices
        const priceResult = await tx.dailyPrice.deleteMany({
          where: { assetId: asset.id }
        });
        deletedPrices += priceResult.count;

        // Delete term deposits
        const tdResult = await tx.termDeposit.deleteMany({
          where: { assetId: asset.id }
        });
        deletedTermDeposits += tdResult.count;

        // Delete the asset itself
        await tx.asset.delete({
          where: { id: asset.id }
        });
        deletedAssets++;
      }

      return {
        deletedAssets,
        deletedTransactions,
        deletedCashTransactions,
        deletedTermDeposits,
        deletedPrices
      };
    });

    console.log("\n✨ CLEANUP SUCCESSFUL ✨");
    console.log(`------------------------------------`);
    console.log(`Assets:           ${result.deletedAssets}`);
    console.log(`Term Deposits:    ${result.deletedTermDeposits}`);
    console.log(`Transactions:     ${result.deletedTransactions}`);
    console.log(`Cash Ledger:      ${result.deletedCashTransactions}`);
    console.log(`Daily Prices:     ${result.deletedPrices}`);
    console.log(`------------------------------------`);
    console.log(`Total records removed from user ${targetUserId}.`);

  } catch (error) {
    console.error("\n❌ FATAL ERROR during cleanup transaction:");
    console.error(error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
