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
  const from = to - (7 * 24 * 60 * 60); // 7 days to cover weekends and slow updates
  const url = `https://api.dnse.com.vn/chart-api/v2/ohlcs/stock?symbol=${symbol}&resolution=1&from=${from}&to=${to}`;
  
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "application/json",
      "Referer": "https://dnse.com.vn/"
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`🚨 [HTTP Error] Status: ${res.status}`);
    console.error(`🚨 [Headers]:`, Object.fromEntries(res.headers.entries()));
    throw new Error(`API failed. Response snippet: ${errorText.substring(0, 200)}`);
  }

  let data;
  try {
    data = await res.json();
  } catch (e) {
    console.error(`🚨 [Parse Error] Failed to parse JSON.`);
    throw new Error("API returned invalid JSON data.");
  }

  if (!data?.c || !Array.isArray(data.c) || data.c.length === 0) {
    throw new Error(`Invalid data from DNSE for ${symbol}`);
  }
  
  // Last close price * 1000 for true VND
  return data.c[data.c.length - 1] * 1000;
}

async function getUsdToVndRate(): Promise<number> {
  const FALLBACK_RATE = 25400;
  const URL = "https://open.er-api.com/v6/latest/USD";

  try {
    const res = await fetch(URL);
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    
    const data: any = await res.json();
    const rate = data.rates?.VND;

    if (typeof rate !== "number" || rate <= 0) {
      throw new Error("Invalid VND rate in response");
    }

    console.log(`✅ Live FX Rate Loaded: 1 USD = ${Math.round(rate).toLocaleString()} VND`);
    return Math.round(rate);
  } catch (err: any) {
    console.warn("************************************************************");
    console.warn("⚠️  WARNING: LIVE FX FETCH FAILED");
    console.warn(`⚠️  REASON: ${err.message}`);
    console.warn(`⚠️  FALLBACK: Using institutional rate of ${FALLBACK_RATE.toLocaleString()} VND`);
    console.warn("************************************************************");
    return FALLBACK_RATE;
  }
}

async function fetchCryptoPrice(symbol: string, fxRate: number) {
  const cgId = CRYPTO_MAP[symbol.toUpperCase()];
  if (!cgId) throw new Error(`No CoinGecko ID mapped for ${symbol}`);
  
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=usd`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko API failed: ${res.status}`);
  const data: any = await res.json();
  
  const usdPrice = data[cgId]?.usd;
  if (usdPrice === undefined) throw new Error(`USD price not found in CoinGecko response for ${cgId}`);
  
  const priceVnd = usdPrice * fxRate;
  return priceVnd;
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

async function fetchGoldPrice() {
  const url = "https://webgia.com/gia-vang/sjc/";
  
  // Use a modern browser User-Agent to ensure the request is accepted
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
  });
  
  if (!res.ok) throw new Error(`Gold data source (webgia) failed: ${res.status}`);
  const html = await res.text();
  
  /**
   * The page structure is a table with rows like:
   * <tr><td>Vàng SJC 1L, 10L, 1KG</td><td class="text-right">16.850.000</td>...</tr>
   * We need the "Mua vào" (Buy) price which is the first value after the asset name.
   */
  const regex = /Vàng SJC 1L[^<]*<\/td>\s*<td[^>]*>([\d.]+)<\/td>/i;
  const match = html.match(regex);
  
  if (match && match[1]) {
    // 1. Remove formatting dots: "16.850.000" -> 16850000 (VND per "Chỉ")
    const pricePerChi = parseInt(match[1].replace(/\./g, ""));
    
    // 2. Convert from "Chỉ" to "Lượng" (Tael) - 1 Lượng = 10 Chỉ
    // This returns the full VND value for 1 Lượng SJC.
    return pricePerChi * 10;
  }
  
  throw new Error("Could not parse SJC 1L Gold price from webgia.com HTML");
}


async function main() {
  console.log("Starting price sync...");
  
  await connectWithRetry();
  
  // Load central FX rate once per run
  const usdToVndRate = await getUsdToVndRate();
  
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
          price = await fetchCryptoPrice(asset.symbol, usdToVndRate);
          break;
        case "MUTUAL_FUND":
          price = await fetchMutualFundPrice(asset.symbol);
          break;
        case "GOLD":
          price = await fetchGoldPrice();
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
  
  // --- Term Deposit Maturity Automation ---
  console.log("\nChecking for matured Term Deposits...");
  try {
    const maturedDeposits = await prisma.termDeposit.findMany({
      where: {
        maturityDate: { lte: now },
      },
      include: {
        asset: true,
      }
    });

    for (const deposit of maturedDeposits) {
      const principal = deposit.principal;
      const interest = (principal * deposit.interestRate) / 100;
      const totalPayout = principal + interest;

      // Avoid double-processing: Check if a SELL transaction already exists for this asset with same amount on same date
      const existingSell = await prisma.transaction.findFirst({
        where: {
          assetId: deposit.assetId,
          type: "SELL",
          grossAmount: totalPayout,
          date: deposit.maturityDate
        }
      });

      if (existingSell) {
        // console.log(`ℹ️ Term Deposit ${deposit.asset.name} already processed.`);
        continue;
      }

      await prisma.$transaction(async (tx) => {
        // 1. Create Cash DEPOSIT for Principal + Interest
        const cashTx = await tx.cashTransaction.create({
          data: {
            userId: deposit.asset.userId,
            amount: totalPayout,
            date: deposit.maturityDate,
            type: "DEPOSIT",
            description: `Maturity: ${deposit.asset.name} (Principal: ${principal.toLocaleString()}, Interest: ${interest.toLocaleString()})`,
            currency: "VND",
          }
        });

        // 2. Create SELL Transaction to zero out the asset position
        await tx.transaction.create({
          data: {
            userId: deposit.asset.userId,
            assetId: deposit.assetId,
            date: deposit.maturityDate,
            type: "SELL",
            quantity: 1, // Quantity is always 1 for TD
            pricePerUnit: principal, // Asset tracks principal
            grossAmount: totalPayout,
            cashTransactionId: cashTx.id,
          }
        });
      });

      console.log(`✅ Matured Term Deposit [${deposit.asset.name}]: Principal + Interest returned to cash.`);
    }
  } catch (err: any) {
    console.error("❌ Failed to process matured term deposits:", err.message);
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
