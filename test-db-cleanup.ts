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

// Define the fields that determine uniqueness
const uniqueFields = ["symbol", "slug", "metric"];

// Remove duplicates
const removeDuplicates = async () => {
  const records = await collection.find({}).toArray(); // Fetch all records

  // Create a Set to track unique combinations
  const uniqueSet = new Set<string>();
  const duplicates = [];

  for (const record of records) {
    // Generate a unique key based on the uniqueFields
    const uniqueKey = uniqueFields.map((field) => record[field]).join("|");

    if (uniqueSet.has(uniqueKey)) {
      duplicates.push(record._id); // Track duplicate _id for removal
    } else {
      uniqueSet.add(uniqueKey); // Add unique key to the Set
    }
  }

  if (duplicates.length > 0) {
    console.log(`Found ${duplicates.length} duplicate records. Removing...`);

    // Remove duplicate records
    const res = await collection.deleteMany({ _id: { $in: duplicates } });
    console.log("RES ", res);

    console.log("Duplicates successfully removed.");
  } else {
    console.log("No duplicates found.");
  }
};

// Run the duplicate removal process
await removeDuplicates();

// Close MongoDB connection
await client.close();
