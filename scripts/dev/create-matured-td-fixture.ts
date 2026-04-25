import { PrismaClient } from "@prisma/client";

/**
 * QA FIXTURE SCRIPT: Create Matured Term Deposit
 * 
 * This script is for local development and QA testing ONLY.
 * It generates a fake term deposit asset that is already matured (yesterday).
 * 
 * Usage:
 *   $env:ALLOW_DEV_FIXTURES="true"; npm run dev:create-matured-td
 */

const prisma = new PrismaClient();

async function main() {
  const isProd = process.env.NODE_ENV === "production";
  const allowFixtures = process.env.ALLOW_DEV_FIXTURES === "true";
  const devUserId = process.env.DEV_FIXTURE_USER_ID;

  console.log("🛠️ Aegis Ledger - QA Fixture Creation (Matured TD)");
  console.log("-------------------------------------------------");

  if (isProd) {
    console.error("❌ ERROR: Refusing to run in production environment.");
    process.exit(1);
  }

  if (!allowFixtures) {
    console.error("❌ ERROR: ALLOW_DEV_FIXTURES=true is required to run this script.");
    console.log("Usage: $env:ALLOW_DEV_FIXTURES=\"true\"; npm run dev:create-matured-td");
    process.exit(1);
  }

  // 1. Identify Target User
  let userId = devUserId;

  if (!userId) {
    // If not specified, try to find a user in the database
    const users = await prisma.asset.findMany({
      select: { userId: true },
      distinct: ['userId'],
    });

    if (users.length === 1) {
      userId = users[0].userId;
      console.log(`ℹ️ No DEV_FIXTURE_USER_ID provided. Using single existing user: ${userId}`);
    } else if (users.length === 0) {
      console.error("❌ ERROR: No users found in database. Please provide DEV_FIXTURE_USER_ID.");
      process.exit(1);
    } else {
      console.error("❌ ERROR: Multiple users found. Please specify DEV_FIXTURE_USER_ID environment variable.");
      console.log("Available Users:");
      users.forEach(u => console.log(` - ${u.userId}`));
      process.exit(1);
    }
  }

  const timestamp = Date.now();
  const symbol = `TD_QA_MATURED_${timestamp}`;
  const name = "QA Matured TD";
  const principal = 10000000;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90);
  
  const maturityDate = new Date();
  maturityDate.setDate(maturityDate.getDate() - 1);
  maturityDate.setHours(0, 0, 0, 0);

  console.log(`🚀 Creating asset ${symbol} for user ${userId}...`);

  try {
    const asset = await prisma.asset.create({
      data: {
        userId,
        symbol,
        name,
        assetClass: "TERM_DEPOSIT",
        currency: "VND",
        transactions: {
          create: {
            userId,
            type: "BUY",
            quantity: 1,
            pricePerUnit: principal,
            grossAmount: principal,
            date: startDate,
          }
        },
        termDeposits: {
          create: {
            bankName: name,
            principal,
            startDate,
            maturityDate,
            interestRate: 5,
          }
        }
      }
    });

    console.log(`\n✨ FIXTURE CREATED SUCCESSFULLY ✨`);
    console.log(`--------------------------------------------------`);
    console.log(`Asset ID: ${asset.id}`);
    console.log(`Symbol:   ${symbol}`);
    console.log(`User ID:  ${userId}`);
    console.log(`Maturity: ${maturityDate.toISOString()}`);
    console.log(`--------------------------------------------------`);
    console.log(`Usage: You can now view this in Holdings -> Term Deposits.`);

  } catch (error) {
    console.error("\n❌ FATAL ERROR during fixture creation:");
    console.error(error);
    process.exit(1);
  }
}

main()
  .catch(e => {
    console.error("💥 Script failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
