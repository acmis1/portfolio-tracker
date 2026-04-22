'use server'

import { unstable_cache } from 'next/cache';
import * as cheerio from 'cheerio';

/**
 * Fetches dynamic Vietnamese macro data with a 24-hour cache.
 * Includes VN-Index 10Y CAGR (Yahoo Finance) and HNX 10Y Government Bond Yield.
 */
export const getVietnamMacro = unstable_cache(
  async () => {
    const period2 = Math.floor(Date.now() / 1000);
    const period1 = period2 - (10 * 365 * 24 * 60 * 60) - (15 * 24 * 60 * 60); // 10 years + 15 day buffer

    let marketBaseline = 11.5; // Institutional fallback (10Y VN-Index CAGR)
    let riskFreeRate = 3.5; // Institutional fallback (VN 10Y Gov Bond Yield)

    // 1. Market Baseline (VN-Index 10Y CAGR via Yahoo Finance)
    try {
      const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/^VNINDEX.VN?period1=${period1}&period2=${period2}&interval=1mo`;
      const yahooRes = await fetch(yahooUrl, {
        next: { revalidate: 86400 },
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
          // Yahoo sometimes returns nulls for certain months. Find first and last valid entries.
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

            // Apply dynamic CAGR math based on exact timestamps returned
            const elapsedYears = (latestTime - oldestTime) / (365.25 * 24 * 60 * 60);
            if (elapsedYears > 0) {
              const rawCagr = Math.pow(latestClose / oldestClose, 1 / elapsedYears) - 1;
              marketBaseline = rawCagr * 100;
            }
          }
        }
      }
    } catch (e) {
      console.error("Yahoo Finance Error (CAGR):", e);
    }

    // 2. Risk-Free Rate (HNX 10Y Government Bond Yield)
    try {
      // Bypass SSL verification for HNX (known issue with their certificate chain)
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      const hnxUrl = 'https://www.hnx.vn/vi-vn/m-trai-phieu/duong-cong-loi-suat.html';
      const hnxRes = await fetch(hnxUrl, {
        next: { revalidate: 86400 },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
          'Referer': 'https://www.hnx.vn/'
        }
      });

      if (hnxRes.ok) {
        const html = await hnxRes.text();
        const $ = cheerio.load(html);
        $('tr').each((_, element) => {
          const cells = $(element).find('td');
          if (cells.length >= 2) {
            const term = $(cells[0]).text().trim();
            if (term === '10 năm') {
              for (let i = 1; i < cells.length; i++) {
                const text = $(cells[i]).text().trim().replace(',', '.');
                const val = parseFloat(text);
                if (!isNaN(val) && val > 0.5 && val < 15) {
                  riskFreeRate = val;
                  break; 
                }
              }
            }
          }
        });
      }
    } catch (e) {
      console.error("HNX Error:", e);
    }

    return { 
      riskFreeRate: Number(riskFreeRate.toFixed(2)), 
      marketBaseline: Number(marketBaseline.toFixed(2)) 
    };
  },
  ['vietnam-macro-v9'],
  { 
    revalidate: 86400, // 24 hours
    tags: ['macro'] 
  }
);
