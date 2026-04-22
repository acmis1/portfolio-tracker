'use server'

export async function checkYahooFull() {
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/^VNINDEX.VN?range=10y&interval=1mo`;
    
    const res = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }
      });

    const data = await res.json();
    const result = data.chart?.result?.[0];
    const timestamps = result?.timestamp;
    const closes = result?.indicators?.quote?.[0]?.close;

    console.log("Symbol:", result?.meta?.symbol);
    console.log("Timestamps Count:", timestamps?.length);
    console.log("Closes Count:", closes?.length);
    if (timestamps && timestamps.length > 0) {
        console.log("Oldest Date:", new Date(timestamps[0] * 1000).toISOString());
        console.log("Latest Date:", new Date(timestamps[timestamps.length - 1] * 1000).toISOString());
    }
}

if (require.main === module) {
    checkYahooFull();
}
