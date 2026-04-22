'use server'

import { unstable_cache } from 'next/cache';
import * as cheerio from 'cheerio';

/**
 * Fetches dynamic Vietnamese macro data with a 24-hour cache.
 * Includes VN-Index 10Y CAGR and HNX 10Y Government Bond Yield.
 */
export const getVietnamMacro = unstable_cache(
  async () => {
    const today = Math.floor(Date.now() / 1000);
    // 10 years ago + 15 day buffer to guarantee we hit a valid trading day
    const fromDate = today - (10 * 365 * 24 * 60 * 60) - (15 * 24 * 60 * 60);

    let marketBaseline = 11.5; // Institutional fallback (10Y VN-Index CAGR)
    let riskFreeRate = 3.5; // Institutional fallback (VN 10Y Gov Bond Yield)

    // 1. Market Baseline (VN-Index 10Y CAGR)
    try {
      // Use 'index' endpoint and '1D' resolution for historical accuracy over 10 years
      const vnIndexUrl = `https://api.dnse.com.vn/chart-api/v2/ohlcs/index?symbol=VNINDEX&resolution=1D&from=${fromDate}&to=${today}`;
      const vnRes = await fetch(vnIndexUrl, {
        next: { revalidate: 86400 },
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json",
          "Referer": "https://dnse.com.vn/"
        }
      });

      if (vnRes.ok) {
        const data = await vnRes.json();
        if (data?.c && Array.isArray(data.c) && data.c.length > 1) {
          const latestClose = data.c[data.c.length - 1];
          const oldestClose = data.c[0];
          
          // Apply CAGR formula: (Ending / Beginning)^(1/Years) - 1
          const rawCagr = Math.pow(latestClose / oldestClose, 1 / 10) - 1;
          marketBaseline = rawCagr * 100;
        }
      }
    } catch (e) {
      console.error("DNSE Error (10Y CAGR):", e);
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
  ['vietnam-macro-v7'],
  { 
    revalidate: 86400, // 24 hours
    tags: ['macro'] 
  }
);
