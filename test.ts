import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
import { CoinsCollections } from "./models/coin/coins-collections.ts";
import type { Coin } from "./models/coin/coin.ts";
import { DColors } from "./models/shared/colors.ts";
const {
  BYBIT_PERP_TICKETS_URL,
  BINANCE_PERP_TICKETS_URL,
  PROJECT_NAME,
  COIN_GECKO_LIST,
  COIN_GECKO_API_KEY,
  COIN_GECKO_API,
  SANTIMENT_API_URL,
  SANTIMENT_API_KEY,
  LOWEST_TURNOVER24H,
  IMG_FALLBACL_URL,
  MONGO_DB,
} = await load();

import { MongoClient } from "https://deno.land/x/mongo@v0.31.1/mod.ts";
import { metrics } from "./pro-metrics.ts";

import { getSantimentQuery } from "./global/utils/santiment/santiment-query.ts";
import type { SantimentItem } from "./models/santiment/santiment-item.ts";
import { printInline } from "./global/utils/print-in-line.ts";
import { yellow } from "https://deno.land/std@0.154.0/fmt/colors.ts";
import { coinsDone } from "./test5.fetch.sent.data.ts";

// MongoDB connection setup
const client = new MongoClient();
await client.connect(MONGO_DB);
const db = client.database("general"); // Database name
const santimentCollection = db.collection(CoinsCollections.CoinSantiment); // Collection where results will be saved
const coinCollection = db.collection(CoinsCollections.CoinRepo); // Collection where results will be saved
let coins = (await coinCollection
  .find({ santimentAvailable: false })
  .toArray()) as Coin[];

console.log("COINS Left", coins.length);
coins = coins.filter((c) => !coinsDone.includes(c.symbol));
console.log("COINS MINUS DONe", coins.length);

// Mock function to fetch data from Santiment API (replace with actual fetch logic)
async function fetchMetricData(
  slug: string,
  metric: string,
  fromTime: string,
  toTime: string
) {
  try {
    const headers = {
      Authorization: `Basic ${SANTIMENT_API_KEY}`,
      "Content-Type": "application/json",
    };
    const query = getSantimentQuery(slug, metric, fromTime, toTime);

    const response = await fetch(SANTIMENT_API_URL, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      console.error(`Error: ${response.status} - ${response.statusText}`);
      const errorText = await response.text();
      console.error("Error details:", errorText);
      return null; // Explicitly return null
    }

    const data = await response.json();
    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
      return null;
    }

    const timeseriesData = data?.data?.getMetric?.timeseriesData;
    if (timeseriesData) {
      return timeseriesData; // Return or further process this data as needed
    } else {
      console.error("Timeseries data not found in the response.");
      return null;
    }
  } catch (error) {
    console.error("Request failed:", error);
    return null; // Ensure null is returned on error
  }
}

// deno-lint-ignore no-explicit-any
const processAndSaveMetricsForCoin = async (coin: Coin, metrics: any[]) => {
  try {
    // Map over the metrics to fetch data for the single coin
    const metricPromises = metrics.map(async (metric) => {
      const fromTime = new Date("2024-05-12T00:00:00Z").toISOString();
      const toTime = new Date("2024-11-13T23:59:59Z").toISOString();

      const data = await fetchMetricData(
        coin.slug || "",
        metric.metric,
        fromTime,
        toTime
      );

      if (!data) {
        console.error(
          `No data for metric: ${metric.metric} and coin: ${coin.slug}`
        );
        return null; // Skip if no data
      }

      const timestamp = new Date().toISOString();

      return {
        data: [...data],
        metric: metric.metric,
        lineStyle: metric.lineStyle,
        areaStyle: metric.areaStyle,
        label: metric.label,
        symbol: coin.symbol,
        slug: coin.slug,
        timestamp,
      };
    });

    // Fetch all metrics for the coin
    const results = await Promise.all(metricPromises);

    // Filter out null results and empty data
    const filteredResults = results.filter(
      (result) => result !== null && result.data.length > 0
    ) as SantimentItem[];

    // Save to MongoDB
    if (filteredResults.length > 0) {
      try {
        await santimentCollection.insertMany(filteredResults);
        console.log("%cData successfully saved to MongoDB.", DColors.cyan);
      } catch (dbError) {
        console.error("Error saving data to MongoDB:", dbError);
      }
    } else {
      console.warn(`No valid data to save for coin: ${coin.slug}`);
    }
  } catch (error) {
    console.error("Error processing and saving data:", error);
  }
};

// Call the function to process the coins and metrics
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const processCoinsWithDelay = async (coins: Coin[], metrics: any[]) => {
  const done: string[] = [];
  try {
    for (const [index, coin] of coins.entries()) {
      console.log(`Processing coin: ${coin.symbol}`);
      await processAndSaveMetricsForCoin(coin, metrics);
      printInline(`Santiment ---> ${index}`, yellow);
      done.push(coin.symbol);
      //const jsonString = JSON.stringify(done, null, 2); // Pretty print with indentation
      //await Deno.writeTextFile("./shit-done.json", jsonString);
      await delay(10 * 1000);
    }
    console.log("All coins have been processed.");
  } catch (error) {
    console.error("Error processing coins:", error);
  }
};

// Call the function with the coins and metrics
if (coins) {
  processCoinsWithDelay(coins.slice(0, 15), metrics);
}
