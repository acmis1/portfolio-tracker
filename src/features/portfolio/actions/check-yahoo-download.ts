'use server'

export async function checkYahooDownload() {
    const period2 = Math.floor(Date.now() / 1000);
    const period1 = period2 - (10 * 365 * 24 * 60 * 60);

    const url = `https://query1.finance.yahoo.com/v7/finance/download/^VNINDEX.VN?period1=${period1}&period2=${period2}&interval=1d&events=history&includeAdjustedClose=true`;
    console.log("URL:", url);

    const res = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }
      });

    console.log("Status:", res.status);
    const text = await res.text();
    console.log("CSV Snippet:", text.substring(0, 500));
}

if (require.main === module) {
    checkYahooDownload();
}
