'use server'

export async function checkYahooRaw() {
    const period2 = Math.floor(Date.now() / 1000);
    const period1 = period2 - (10 * 365 * 24 * 60 * 60);

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/^VNINDEX.VN?period1=${period1}&period2=${period2}&interval=1mo`;
    console.log("URL:", url);

    const res = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }
      });

    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Data:", JSON.stringify(data, null, 2).substring(0, 1000));
}

if (require.main === module) {
    checkYahooRaw();
}
