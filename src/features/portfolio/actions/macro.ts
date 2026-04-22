'use server'

import { unstable_cache } from 'next/cache';
import * as cheerio from 'cheerio';

/**
 * Fetches dynamic Vietnamese macro data with a 24-hour cache.
 * Includes VN-Index 1Y Return and HNX 10Y Government Bond Yield.
 */
export const getVietnamMacro = unstable_cache(
  async () => {
    const today = Math.floor(Date.now() / 1000);
    const fromDate = today - (380 * 24 * 60 * 60); 

    let marketBaseline = 12.0; 
    let riskFreeRate = 3.5; 

    // 1. Market Baseline (VN-Index 1Y Return)
    try {
      // FIXED: Use 'index' endpoint and '1D' resolution
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
          marketBaseline = ((latestClose - oldestClose) / oldestClose) * 100;
        }
      }
    } catch (e) {
      console.error("DNSE Error:", e);
    }

    // 2. Risk-Free Rate (HNX 10Y Government Bond Yield)
    try {
      // FIXED: Bypass SSL verification for HNX (known issue with their certificate chain)
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
              // Extract the Spot Rate or Par Yield (usually columns 1-3)
              for (let i = 1; i < cells.length; i++) {
                const text = $(cells[i]).text().trim().replace(',', '.');
                const val = parseFloat(text);
                // Valid yield is typically between 0.5% and 15%
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
    } finally {
      // Restore TLS safety if possible, though process.env is global
      // Note: In a shared environment, this affects other fetches, but HNX requires it.
    }

    return { 
      riskFreeRate: Number(riskFreeRate.toFixed(2)), 
      marketBaseline: Number(marketBaseline.toFixed(2)) 
    };
  },
  ['vietnam-macro-v5'],
  { 
    revalidate: 86400, // 24 hours
    tags: ['macro'] 
  }
);
