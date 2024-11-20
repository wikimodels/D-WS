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

import {
  Database,
  MongoClient,
} from "https://deno.land/x/mongo@v0.31.1/mod.ts";
const client = new MongoClient();
await client.connect(MONGO_DB);
const db = client.database("general"); // Database name

const updateFields = async (db: Database, collectionName: string) => {
  const collection = db.collection(collectionName);

  try {
    // Replace `coinGeckoMissing: true` with `coinGeckoAvailable: false`
    const updateCoinGeckoTrue = await collection.updateMany(
      { coinGeckoMissing: true },
      { $unset: { coinGeckoMissing: "" }, $set: { coinGeckoAvailable: false } }
    );
    console.log(
      `Updated ${updateCoinGeckoTrue.modifiedCount} documents for coinGeckoMissing: true`
    );

    // Replace `santimentMissing: true` with `santimentAvailable: false`
    const updateSantimentTrue = await collection.updateMany(
      { santimentMissing: true },
      { $unset: { santimentMissing: "" }, $set: { santimentAvailable: false } }
    );
    console.log(
      `Updated ${updateSantimentTrue.modifiedCount} documents for santimentMissing: true`
    );

    // Replace `coinGeckoMissing: false` with `coinGeckoAvailable: true`
    const updateCoinGeckoFalse = await collection.updateMany(
      { coinGeckoMissing: false },
      { $unset: { coinGeckoMissing: "" }, $set: { coinGeckoAvailable: true } }
    );
    console.log(
      `Updated ${updateCoinGeckoFalse.modifiedCount} documents for coinGeckoMissing: false`
    );

    // Replace `santimentMissing: false` with `santimentAvailable: true`
    const updateSantimentFalse = await collection.updateMany(
      { santimentMissing: false },
      { $unset: { santimentMissing: "" }, $set: { santimentAvailable: true } }
    );
    console.log(
      `Updated ${updateSantimentFalse.modifiedCount} documents for santimentMissing: false`
    );
  } catch (error) {
    console.error("Error updating fields:", error);
  }
};

updateFields(db, CoinsCollections.CoinAtWork);
updateFields(db, CoinsCollections.CoinBlackList);
updateFields(db, CoinsCollections.CoinProvider);
updateFields(db, CoinsCollections.CoinRepo);
