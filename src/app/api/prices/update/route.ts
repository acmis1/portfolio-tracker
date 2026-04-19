import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getLiveExchangeRate } from "@/lib/fx";
import { forcePortfolioSnapshot } from "@/features/portfolio/actions/rebalancing";

export async function POST(req: Request) {
  try {
    // 1. Auth Check
    const authHeader = req.headers.get("authorization");
    const secret = process.env.PRICE_WEBHOOK_SECRET || "dev_secret_123";

    if (!authHeader || authHeader !== `Bearer ${secret}`) {
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

    // 3. Process Batch
    await prisma.$transaction(async (tx: any) => {
      for (const item of body as any[]) {
        try {
          const { ticker, price, currency } = item;

          if (!ticker || price === undefined || !currency) {
            results.push({ ticker: ticker || "unknown", status: "failed", error: "Missing required fields" });
            summary.failed++;
            continue;
          }

          // Find Asset
          const asset = await tx.asset.findFirst({
            where: { symbol: ticker }
          });

          if (!asset) {
            results.push({ ticker, status: "skipped", error: "Asset not found" });
            summary.skipped++;
            continue;
          }

          // Currency Conversion
          let priceVND = price;
          if (currency === "USD") {
            priceVND = price * USD_VND_RATE;
          } else if (currency !== "VND") {
             // We only support USD/VND for now as per requirements
             results.push({ ticker, status: "failed", error: `Unsupported currency: ${currency}` });
             summary.failed++;
             continue;
          }

          // Upsert DailyPrice
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

          results.push({ ticker, status: "updated", priceVND });
          summary.updated++;
        } catch (itemErr: any) {
          results.push({ ticker: item.ticker || "unknown", status: "failed", error: itemErr.message });
          summary.failed++;
        }
      }
    });

    // 4. Trigger Portfolio Snapshot
    let snapshotStatus = "skipped";
    if (summary.updated > 0) {
      const snapshotResult = await forcePortfolioSnapshot();
      snapshotStatus = snapshotResult.success ? "success" : "failed";
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
