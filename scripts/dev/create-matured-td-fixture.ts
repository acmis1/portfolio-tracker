import { prisma } from "../../src/server/db";

/**
 * QA FIXTURE SCRIPT: Create Matured Term Deposit
 * 
 * This script is for local development and QA testing ONLY.
 * It generates a fake term deposit asset that is already matured (yesterday).
 * 
 * Usage:
 *   NODE_ENV=development ALLOW_DEV_FIXTURES=true npx tsx scripts/dev/create-matured-td-fixture.ts
 */

async function main() {
  // Safety checks
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEV_FIXTURES !== "true") {
    console.error("ABORT: This script is for development use only and requires ALLOW_DEV_FIXTURES=true.");
    process.exit(1);
  }

  if (process.env.ALLOW_DEV_FIXTURES !== "true") {
    console.error("ABORT: Missing ALLOW_DEV_FIXTURES=true environment variable.");
    process.exit(1);
  }

  console.log("--- Creating Matured TD Fixture ---");

  let userId = process.env.DEV_FIXTURE_USER_ID;

  if (!userId) {
    const users = await prisma.asset.findMany({
      select: { userId: true },
      distinct: ['userId'],
    });

    if (users.length === 1) {
      userId = users[0].userId;
      console.log(`No DEV_FIXTURE_USER_ID provided. Using single existing user: ${userId}`);
    } else if (users.length === 0) {
      console.error("ABORT: No users found in database. Please provide DEV_FIXTURE_USER_ID.");
      process.exit(1);
    } else {
      console.error("ABORT: Multiple users found. Please specify DEV_FIXTURE_USER_ID:");
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

  console.log(`Creating asset ${symbol} for user ${userId}...`);

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

  console.log(`--------------------------------------------------`);
  console.log(`Fixture created successfully!`);
  console.log(`Asset ID: ${asset.id}`);
  console.log(`Symbol:   ${symbol}`);
  console.log(`User ID:  ${userId}`);
  console.log(`Maturity: ${maturityDate.toISOString()}`);
  console.log(`--------------------------------------------------`);
  console.log(`You can now view this in Holdings -> Term Deposits.`);
}

main()
  .catch(e => {
    console.error("ERROR:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
