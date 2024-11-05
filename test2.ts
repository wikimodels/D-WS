import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
// Replace with your Alpha Vantage API key
const { ALPHA_VANTAGE_API_KEY } = await load();

// Define the API endpoint and parameters
const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=SPX&outputsize=compact&apikey=${ALPHA_VANTAGE_API_KEY}`;

// Define a type for each entry in the intraday time series data
interface IntradayTimeSeriesData {
  "1. open": string;
  "2. high": string;
  "3. low": string;
  "4. close": string;
  "5. volume": string;
}

async function fetchSP500IntradayData() {
  try {
    // Fetch data from Alpha Vantage API
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Parse the JSON response
    const data = await response.json();

    if (!data["Time Series (15min)"]) {
      throw new Error(
        `Data not found. Error: ${data["Error Message"] || "Unknown error"}`
      );
    }

    // Extract and format the 15-minute interval time series data
    const timeSeries = data["Time Series (15min)"];

    const formattedData = Object.entries(timeSeries).map(
      ([datetime, values]) => {
        const entry = values as IntradayTimeSeriesData; // Cast values to IntradayTimeSeriesData

        return {
          datetime,
          open: parseFloat(entry["1. open"]),
          high: parseFloat(entry["2. high"]),
          low: parseFloat(entry["3. low"]),
          close: parseFloat(entry["4. close"]),
          volume: parseInt(entry["5. volume"], 10),
        };
      }
    );

    console.log(formattedData.slice(0, 5)); // Display the first 5 entries
  } catch (error) {
    console.error("Failed to fetch S&P 500 intraday data:", error);
  }
}

fetchSP500IntradayData();
