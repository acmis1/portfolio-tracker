import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getRebalancingDrift } from '@/features/portfolio/actions/rebalancing';
import { getPortfolioSummary } from '@/features/portfolio/utils';

/**
 * DAILY PORTFOLIO SNAPSHOT CRON
 * Trigger: POST Request (e.g., from Vercel Cron or GitHub Actions)
 * Auth: Authorization: Bearer {CRON_SECRET}
 */
export async function POST(request: Request) {
  // 1. Authorization Check
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // If CRON_SECRET is missing, we log a warning but deny access for safety.
  if (!cronSecret) {
    console.error("CRON_SECRET environment variable is not configured.");
    return NextResponse.json({ error: "Configuration error" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Compute current portfolio state
    // We reuse the drift calculation and summary logic.
    const drift = await getRebalancingDrift();
    const portfolioSummary = await getPortfolioSummary();

    // 3. Normalize Date (Midnight UTC)
    const now = new Date();
    const todayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // 4. Upsert Snapshot
    // Ensures we only have one record per day, updating it if the cron runs multiple times.
    const snapshot = await prisma.portfolioSnapshot.upsert({
      where: {
        date: todayMidnight,
      },
      update: {
        totalValue: drift.totalPortfolioValue,
        investedValue: drift.investedValue,
        cashBalance: drift.cashBalance,
        costBasis: portfolioSummary.totalInvested,
      },
      create: {
        date: todayMidnight,
        totalValue: drift.totalPortfolioValue,
        investedValue: drift.investedValue,
        cashBalance: drift.cashBalance,
        costBasis: portfolioSummary.totalInvested,
      },
    });

    console.log(`Portfolio snapshot recorded for ${todayMidnight.toISOString()}: ${summary.totalPortfolioValue} VND`);

    return NextResponse.json({ 
      success: true, 
      date: todayMidnight.toISOString(),
      totalValue: summary.totalPortfolioValue 
    });

  } catch (error: any) {
    console.error("Failed to record portfolio snapshot:", error);
    return NextResponse.json({ error: error.message || "Snapshot failed" }, { status: 500 });
  }
}
