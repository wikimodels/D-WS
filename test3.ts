const yahooFinanceUrl =
  "https://query1.finance.yahoo.com/v8/finance/chart/^GSPC?interval=15m&range=1d";

async function fetchYahooFinanceSP500Data() {
  try {
    const response = await fetch(yahooFinanceUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    // Check for valid data in response
    if (!data.chart || !data.chart.result) {
      throw new Error("Data not found.");
    }

    // Parse and format the data
    const result = data.chart.result[0];
    const timestamps = result.timestamp;
    const indicators = result.indicators.quote[0];

    const formattedData = timestamps.map(
      (timestamp: number, index: number) => ({
        datetime: new Date(timestamp * 1000).toISOString(),
        open: indicators.open[index],
        high: indicators.high[index],
        low: indicators.low[index],
        close: indicators.close[index],
        volume: indicators.volume[index],
      })
    );

    console.log(formattedData.slice(0, 5)); // Display the first 5 entries
  } catch (error) {
    console.error(
      "Failed to fetch S&P 500 data from Yahoo Finance:",
      error.message
    );
  }
}

fetchYahooFinanceSP500Data();
