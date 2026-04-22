'use server'

import { unstable_cache } from 'next/cache';
import * as cheerio from 'cheerio';

/**
 * DEBUG VERSION: Yahoo Finance CAGR Investigation
 */
export async function getVietnamMacro() {
    const period2 = Math.floor(Date.now() / 1000);
    const period1 = period2 - (10 * 365 * 24 * 60 * 60) - (15 * 24 * 60 * 60);

    let marketBaseline = 11.5;
    let riskFreeRate = 3.5;

    console.log("DEBUG: Starting Yahoo Finance macro fetch...");

    try {
      const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/^VNINDEX.VN?period1=${period1}&period2=${period2}&interval=1mo`;
      console.log("Yahoo URL:", yahooUrl);

      const yahooRes = await fetch(yahooUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }
      });

      if (yahooRes.ok) {
        const data = await yahooRes.json();
        const result = data.chart?.result?.[0];
        const timestamps = result?.timestamp;
        const closes = result?.indicators?.quote?.[0]?.close;

        if (timestamps && closes && Array.isArray(timestamps) && Array.isArray(closes)) {
          let oldestIdx = -1;
          let latestIdx = -1;

          for (let i = 0; i < closes.length; i++) {
            if (closes[i] !== null && closes[i] !== undefined) {
              oldestIdx = i;
              break;
            }
          }

          for (let i = closes.length - 1; i >= 0; i--) {
            if (closes[i] !== null && closes[i] !== undefined) {
              latestIdx = i;
              break;
            }
          }

          if (oldestIdx !== -1 && latestIdx !== -1 && oldestIdx < latestIdx) {
            const oldestClose = closes[oldestIdx];
            const latestClose = closes[latestIdx];
            const oldestTime = timestamps[oldestIdx];
            const latestTime = timestamps[latestIdx];

            console.log("--- CAGR DEBUG LOGS ---");
            console.log("Oldest Date:", new Date(oldestTime * 1000).toISOString());
            console.log("Latest Date:", new Date(latestTime * 1000).toISOString());
            console.log("Oldest Close:", oldestClose);
            console.log("Latest Close:", latestClose);
            
            const elapsedYears = (latestTime - oldestTime) / (365.25 * 24 * 60 * 60);
            console.log("Elapsed Years (Actual):", elapsedYears);
            
            const rawCagr = Math.pow(latestClose / oldestClose, 1 / elapsedYears) - 1;
            console.log("CAGR Calculated (Dynamic Years):", rawCagr);
            console.log("-----------------------");

            marketBaseline = rawCagr * 100;
          }
        }
      }
    } catch (e) {
      console.error("Yahoo Error:", e);
    }

    return { marketBaseline };
}

if (require.main === module) {
    getVietnamMacro().then(res => {
        console.log("FINAL RESULT:", res);
    });
}
