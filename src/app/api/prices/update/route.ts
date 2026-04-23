import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getLiveExchangeRate } from "@/lib/fx";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    // 0. Payload Size Guard (100KB limit for price updates)
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 1024 * 100) {
      return NextResponse.json({ error: "Payload Too Large" }, { status: 413 });
    }

    // 1. Auth Check - Timing-safe comparison
    const authHeader = req.headers.get("authorization") || "";
    const secret = process.env.PRICE_WEBHOOK_SECRET || "dev_secret_123";
    const expectedToken = `Bearer ${secret}`;

    const expectedBuffer = Buffer.from(expectedToken);
    const providedBuffer = Buffer.from(authHeader);

    if (
      expectedBuffer.length !== providedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse and Validate Payload
    const body = await req.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Payload must be an array" }, { status: 400 });
    }

    const results: any[] = [];
    const summary = {
      total: body.length,
      updated: 0,
      skipped: 0,
      failed: 0
    };

    const now = new Date();
    const todayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const USD_VND_RATE = await getLiveExchangeRate();

    const updatedUserIds = new Set<string>();

    // 3. Pre-fetch all assets that need updating to avoid N+1 queries
    const tickers = body.map((item: any) => item.ticker?.toUpperCase()).filter(Boolean);
    const allAssets = await prisma.asset.findMany({
      where: { symbol: { in: tickers } },
      select: {
        id: true,
        symbol: true,
        userId: true
      }
    });

    const assetsBySymbol = allAssets.reduce((acc: Record<string, any[]>, asset: any) => {
      if (!acc[asset.symbol]) acc[asset.symbol] = [];
      acc[asset.symbol].push(asset);
      return acc;
    }, {});

    // 4. Process Batch
    await prisma.$transaction(async (tx: any) => {
      for (const item of body as any[]) {
        try {
          const { ticker, price, currency } = item;

          if (!ticker || price === undefined || !currency) {
            results.push({ ticker: ticker || "unknown", status: "failed", error: "Missing required fields" });
            summary.failed++;
            continue;
          }

          const symbol = ticker.toUpperCase();
          const assets = assetsBySymbol[symbol] || [];

          if (assets.length === 0) {
            results.push({ ticker, status: "skipped", error: "No user portfolios contain this asset" });
            summary.skipped++;
            continue;
          }

          // Currency Conversion (Calculate once for all instances of this asset)
          let priceVND = price;
          if (currency === "USD") {
            priceVND = price * USD_VND_RATE;
          } else if (currency !== "VND") {
             results.push({ ticker, status: "failed", error: `Unsupported currency: ${currency}` });
             summary.failed++;
             continue;
          }

          // Update each asset instance
          for (const asset of assets) {
            await tx.dailyPrice.upsert({
              where: {
                assetId_date: {
                  assetId: asset.id,
                  date: todayMidnight
                }
              },
              update: {
                closePrice: priceVND,
                source: "webhook"
              },
              create: {
                assetId: asset.id,
                date: todayMidnight,
                closePrice: priceVND,
                source: "webhook"
              }
            });
            updatedUserIds.add(asset.userId);
          }

          results.push({ ticker, status: "updated", priceVND });
          summary.updated++;
        } catch (itemErr: any) {
          results.push({ ticker: item.ticker || "unknown", status: "failed", error: itemErr.message });
          summary.failed++;
        }
      }
    });

    // 4. Trigger Portfolio Snapshots for affected users
    let snapshotStatus = "skipped";
    if (updatedUserIds.size > 0) {
      const { capturePortfolioSnapshotInternal } = await import("@/features/portfolio/actions/rebalancing");
      try {
        for (const userId of updatedUserIds) {
          await capturePortfolioSnapshotInternal(userId);
        }
        snapshotStatus = "success";
      } catch (err) {
        console.error("Batch snapshot failed:", err);
        snapshotStatus = "failed";
      }
    }

    return NextResponse.json({
      success: true,
      summary,
      results,
      snapshot: {
        triggered: summary.updated > 0,
        status: snapshotStatus
      }
    });

  } catch (error: any) {
    console.error("Price Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
