async function fetchKlineData() {
  try {
    const response = await fetch(
      "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=15m"
    );

    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.statusText}`);
    }

    // Access response headers
    const usedWeight = response.headers.get("X-MBX-USED-WEIGHT");
    const usedWeight1m = response.headers.get("X-MBX-USED-WEIGHT-1M");

    console.log(`Used Weight (current): ${usedWeight}`);
    console.log(`Used Weight (1 minute): ${usedWeight1m}`);

    // Parse JSON data
    const data = await response.json();
    //console.log(data);

    // Process data as needed
  } catch (error) {
    console.error(error);
  }
}

fetchKlineData();
