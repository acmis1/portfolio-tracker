import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/assets/active
 * Securely returns the currently tracked asset inventory for external price discovery.
 * Protection: Bearer token using PRICE_WEBHOOK_SECRET
 */
export async function GET(req: Request) {
  try {
    // 1. Auth Check - Shared with Pricing Webhook
    const authHeader = req.headers.get("authorization");
    const secret = process.env.PRICE_WEBHOOK_SECRET || "dev_secret_123";

    if (!authHeader || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch Assets
    // We only need symbol (mapped to ticker) and currency for update routing
    const assets = await prisma.asset.findMany({
      select: {
        symbol: true,
        currency: true
      },
      orderBy: {
        symbol: 'asc'
      }
    });

    // 3. Map Internal -> External Schema
    const formattedAssets = assets.map(a => ({
      ticker: a.symbol,
      currency: a.currency
    }));

    return NextResponse.json({
      success: true,
      count: formattedAssets.length,
      assets: formattedAssets
    });

  } catch (error: any) {
    console.error("Active Inventory Endpoint Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message }, 
      { status: 500 }
    );
  }
}
