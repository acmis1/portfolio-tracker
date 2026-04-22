'use server'

export async function checkYahooWeekly() {
    const period2 = Math.floor(Date.now() / 1000);
    const period1 = period2 - (10 * 365 * 24 * 60 * 60);

    const url = `https://query2.finance.yahoo.com/v8/finance/chart/^VNINDEX.VN?period1=${period1}&period2=${period2}&interval=1wk`;
    
    const res = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }
      });

    const data = await res.json();
    const result = data.chart?.result?.[0];
    const timestamps = result?.timestamp;

    console.log("Symbol:", result?.meta?.symbol);
    console.log("Timestamps Count:", timestamps?.length);
    if (timestamps && timestamps.length > 0) {
        console.log("Oldest Date:", new Date(timestamps[0] * 1000).toISOString());
    }
}

if (require.main === module) {
    checkYahooWeekly();
}
