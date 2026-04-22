'use server'

export async function checkYahooVNIPriceless() {
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/^VNI?range=1y&interval=1d`;
    
    const res = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }
      });

    const data = await res.json();
    const result = data.chart?.result?.[0];
    console.log("Symbol:", result?.meta?.symbol);
    console.log("Price:", result?.meta?.regularMarketPrice);
}

if (require.main === module) {
    checkYahooVNIPriceless();
}
