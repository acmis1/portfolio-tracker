/**
 * Aegis Ledger Dynamic FX Engine
 * Orchestrates live exchange rate retrieval with institutional fallback.
 */

const FALLBACK_USD_VND_RATE = 25400;

/**
 * Fetches the current USD to VND exchange rate.
 * Uses Next.js data caching for 24-hour revalidation.
 */
export async function getLiveExchangeRate(): Promise<number> {
  try {
    const appId = process.env.OXR_APP_ID;
    if (!appId) {
      throw new Error('OXR_APP_ID is not defined in environment variables');
    }

    // Open Exchange Rates API - Official Latest Endpoint
    const url = `https://openexchangerates.org/api/latest.json?app_id=${appId}&symbols=VND`;
    
    const response = await fetch(url, {
      next: { 
        revalidate: 86400, // 24-hour cache for API quota optimization
        tags: ['usd-vnd-rate-v4'] 
      },
    });

    if (!response.ok) {
      throw new Error(`OXR API responded with status: ${response.status}`);
    }

    const data = await response.json();
    const rate = data.rates?.VND;

    if (typeof rate !== 'number' || rate <= 0) {
      throw new Error('OXR API returned invalid or missing VND rate');
    }

    // Return rounded rate for cleaner accounting and presentation
    // Note: We keep the full number (e.g. 26322) for correct currency conversions
    const liveRate = Math.round(rate);
    console.log("✅ FX STATUS: Live USD/VND fetched:", liveRate);
    return liveRate;
  } catch (error: any) {
    console.error("❌ FX STATUS: FX fetch failed. Triggering fallback. Error details:", error);
    console.error('CRITICAL: Dynamic FX fetch failed. Falling back to static rate.', error);
    return FALLBACK_USD_VND_RATE;
  }
}
