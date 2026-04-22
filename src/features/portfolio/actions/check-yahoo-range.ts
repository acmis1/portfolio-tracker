'use server'

export async function checkYahooRange() {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/^VNINDEX.VN?range=10y&interval=1mo`;
    console.log("URL:", url);

    const res = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }
      });

    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Data Snippet:", JSON.stringify(data, null, 2).substring(0, 2000));
}

if (require.main === module) {
    checkYahooRange();
}
