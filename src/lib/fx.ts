/**
 * Aegis Ledger Dynamic FX Engine
 * Orchestrates live exchange rate retrieval with institutional fallback.
 */

const FALLBACK_USD_VND_RATE = 25400;

/**
 * Fetches the current USD to VND exchange rate.
 * Uses Next.js data caching for 1-hour revalidation.
 */
export async function getLiveExchangeRate(): Promise<number> {
  try {
    // Open Exchange Rates API (no key required for latest v6)
    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { 
        revalidate: 0, // Force fresh fetch for audit
        tags: ['fx-rate-v2'] 
      },
    });

    if (!response.ok) {
      throw new Error(`FX API responded with status: ${response.status}`);
    }

    const data = await response.json();
    const rate = data.rates?.VND;

    if (typeof rate !== 'number' || rate <= 0) {
      throw new Error('FX API returned invalid or missing VND rate');
    }

    // Return rounded rate for cleaner accounting and presentation
    const liveRate = Math.round(rate);
    console.log("✅ FX STATUS: Live USD/VND successfully fetched:", liveRate);
    return liveRate;
  } catch (error: any) {
    console.error("❌ FX STATUS: FX fetch failed. Triggering fallback. Error details:", error);
    console.error('CRITICAL: Dynamic FX fetch failed. Falling back to static rate.', error);
    return FALLBACK_USD_VND_RATE;
  }
}
