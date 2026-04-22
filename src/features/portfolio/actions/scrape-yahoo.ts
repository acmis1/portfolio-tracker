'use server'
import * as cheerio from 'cheerio';

export async function scrapeYahooHistory() {
    const url = `https://finance.yahoo.com/quote/%5EVNINDEX.VN/history`;
    
    const res = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }
      });

    const html = await res.text();
    const $ = cheerio.load(html);
    
    const table = $('table[data-test="historical-prices"]');
    console.log("Table Found:", table.length > 0);
    
    if (table.length > 0) {
        const rows = table.find('tbody tr');
        console.log("Rows Found:", rows.length);
        if (rows.length > 0) {
            const firstRow = $(rows[0]).find('td');
            const lastRow = $(rows[rows.length - 1]).find('td');
            console.log("First Date:", $(firstRow[0]).text());
            console.log("Last Date:", $(lastRow[0]).text());
            console.log("First Close:", $(firstRow[4]).text());
            console.log("Last Close:", $(lastRow[4]).text());
        }
    }
}

if (require.main === module) {
    scrapeYahooHistory();
}
