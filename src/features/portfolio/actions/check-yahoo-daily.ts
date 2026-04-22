'use server'

export async function checkYahooDaily() {
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/^VNINDEX.VN?range=1y&interval=1d`;
    
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
}

if (require.main === module) {
    checkYahooDaily();
}
