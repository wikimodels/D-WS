import { MongoClient } from "https://deno.land/x/mongo@v0.31.1/mod.ts";
import { metrics } from "./pro-metrics.ts";

import { getSantimentQuery } from "./global/utils/santiment/santiment-query.ts";
import { CoinsCollections } from "./models/coin/coins-collections.ts";
import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
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
// MongoDB connection setup
const client = new MongoClient();
await client.connect(MONGO_DB);
const db = client.database("general"); // Database name
const santimentCollection = db.collection(CoinsCollections.CoinSantiment); // Collection where results will be saved

const filter = { symbol: "CFXUSDT" };
const update = { metric: "FUCK" };
const result = await santimentCollection.updateOne(
  filter, // Filter to find the document (symbol: "CFXUSDT")
  { $set: update } // Update the document by setting the 'metric' field to "DUCK"
);

if (result.modifiedCount > 0) {
  console.log("Document updated successfully.");
} else {
  console.log("No document was updated.");
}
