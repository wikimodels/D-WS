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

const client = new MongoClient();
await client.connect(MONGO_DB);
const db = client.database("general"); // Database name
const collection = db.collection(CoinsCollections.CoinSantiment);

// Function to get unique symbols
const getUniqueSymbols = async () => {
  try {
    const uniqueSymbols = await collection.distinct("symbol", {});
    console.log("Unique symbols fetched:", uniqueSymbols);
    return uniqueSymbols;
  } catch (error) {
    console.error("Error fetching unique symbols:", error);
    return [];
  }
};

// Save symbols as a JSON file
const saveSymbolsAsJson = async (symbols: string[], filename: string) => {
  try {
    const jsonData = JSON.stringify(symbols, null, 2); // Beautify JSON with indentation
    await Deno.writeTextFile(filename, jsonData);
    console.log(`Symbols saved to ${filename}`);
  } catch (error) {
    console.error("Error saving symbols to JSON file:", error);
  }
};

// Main Execution
const uniqueSymbols = await getUniqueSymbols();
if (uniqueSymbols.length > 0) {
  await saveSymbolsAsJson(uniqueSymbols, "./uniqueSymbols.json");
}

// Close MongoDB connection
await client.close();
