import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper for CoinGecko mapping
const CRYPTO_MAP: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  BNB: "binancecoin",
  SOL: "solana",
};

async function connectWithRetry(retries = 5, delayMs = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      console.log("✅ Database connected successfully.");
      return;
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`⚠️ Database sleeping or busy, waiting for wake up... (Attempt ${i + 1}/${retries})`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function fetchStockPrice(symbol: string) {
  const to = Math.floor(Date.now() / 1000);
  const from = to - 86400 * 2; // 2 days to be safe for weekends/holidays
  const url = `https://api.dnse.com.vn/chart-api/v2/ohlcs/stock?symbol=${symbol}&resolution=1&from=${from}&to=${to}`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`DNSE API failed: ${res.status}`);
  const data: any = await res.json();
  
  if (!data?.c || !Array.isArray(data.c) || data.c.length === 0) {
    throw new Error(`Invalid data from DNSE for ${symbol}`);
  }
  
  // Last close price * 1000 for true VND
  return data.c[data.c.length - 1] * 1000;
}

async function fetchCryptoPrice(symbol: string) {
  const cgId = CRYPTO_MAP[symbol.toUpperCase()];
  if (!cgId) throw new Error(`No CoinGecko ID mapped for ${symbol}`);
  
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=vnd`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko API failed: ${res.status}`);
  const data: any = await res.json();
  
  const price = data[cgId]?.vnd;
  if (price === undefined) throw new Error(`Price not found in CoinGecko response for ${cgId}`);
  
  return price;
}

async function fetchMutualFundPrice(symbol: string) {
  const url = "https://api.fmarket.vn/res/products/filter";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      searchField: symbol,
      pageSize: 1,
      types: ["NEW_FUND", "TRADING_FUND"],
    }),
  });
  
  if (!res.ok) throw new Error(`FMarket API failed: ${res.status}`);
  const data: any = await res.json();
  
  const nav = data?.data?.rows?.[0]?.nav;
  if (nav === undefined) throw new Error(`NAV not found in FMarket response for ${symbol}`);
  
  return nav;
}

async function main() {
  console.log("Starting price sync...");
  
  await connectWithRetry();
  
  const assets = await prisma.asset.findMany();
  const now = new Date();
  const todayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  let successCount = 0;
  let failCount = 0;

  for (const asset of assets) {
    try {
      let price: number | null = null;
      
      switch (asset.assetClass) {
        case "STOCK":
          price = await fetchStockPrice(asset.symbol);
          break;
        case "CRYPTO":
          price = await fetchCryptoPrice(asset.symbol);
          break;
        case "MUTUAL_FUND":
          price = await fetchMutualFundPrice(asset.symbol);
          break;
        default:
          console.log(`Skipping asset ${asset.symbol} (unsupported class: ${asset.assetClass})`);
          continue;
      }

      if (price !== null) {
        await prisma.dailyPrice.upsert({
          where: {
            assetId_date: {
              assetId: asset.id,
              date: todayMidnight,
            },
          },
          update: { closePrice: price, source: "actions-sync" },
          create: {
            assetId: asset.id,
            date: todayMidnight,
            closePrice: price,
            source: "actions-sync",
          },
        });
        console.log(`✅ Updated ${asset.symbol}: ${price.toLocaleString()} VND`);
        successCount++;
      }
    } catch (err: any) {
      console.error(`❌ Failed to sync ${asset.symbol}:`, err.message);
      failCount++;
    }
  }

  console.log(`\nSync finished. Success: ${successCount}, Failed: ${failCount}`);
}

main()
  .catch((e) => {
    console.error("Critical script error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
