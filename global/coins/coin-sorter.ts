// // deno-lint-ignore-file no-explicit-any no-explicit-any no-explicit-any
// import { _ } from "https://cdn.skypack.dev/lodash";
// import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
// import {
//   MongoClient,
//   Collection,
//   Bson,
// } from "https://deno.land/x/mongo@v0.31.1/mod.ts";
// import { notifyAboutFailedFunction } from "../../functions/tg/notifications/failed-function.ts";

// import type { SantimentId } from "../../models/shared/santiment-id.ts";
// import type { CoinGeckoId } from "../../models/shared/coin-gecko-id.ts";
// import { DColors } from "../../models/shared/colors.ts";
// import { Coin } from "./../../models/shared/coin.ts";
// import { SpaceNames } from "../../models/shared/space-names.ts";
// import { Status } from "../../models/shared/status.ts";
// import { designateCategories } from "./shared/designate-categories.ts";
// import { notifyAboutCoinsRefresh } from "../../functions/tg/notifications/coin-refresh.ts";
// import type {
//   DeleteResult,
//   InsertOneResult,
// } from "../../models/mongodb/operations.ts";
// import type { InsertManyResult } from "../../models/mongodb/operations.ts";

// const {
//   BYBIT_PERP_TICKETS_URL,
//   BINANCE_PERP_TICKETS_URL,
//   PROJECT_NAME,
//   COIN_GECKO_LIST,
//   COIN_GECKO_API_KEY,
//   COIN_GECKO_API,
//   SANTIMENT_API_URL,
//   SANTIMENT_API_KEY,
//   LOWEST_TURNOVER24H,
//   MONGO_DB,
// } = await load();

// export class CoinSorter {
//   private static instance: CoinSorter;
//   private sorterCoins: Map<string, Coin> = new Map();
//   private static dbClient: MongoClient;
//   private static sorterCollection: Collection<Coin>;
//   private static basicCollection: Collection<Coin>;

//   private readonly BYBIT_API_URL = BYBIT_PERP_TICKETS_URL;
//   private readonly BINANCE_API_URL = BINANCE_PERP_TICKETS_URL;
//   private readonly PROJECT = PROJECT_NAME;
//   private readonly CLASS_NAME = "CoinSorter";
//   private readonly COIN_GECKO_LIST = COIN_GECKO_LIST;
//   private readonly COIN_GECKO_API_KEY = COIN_GECKO_API_KEY;
//   private readonly COIN_GECKO_API = COIN_GECKO_API;
//   private readonly LOWEST_TURNOVER24H = parseFloat(LOWEST_TURNOVER24H);
//   private readonly SANTIMENT_API_URL = SANTIMENT_API_URL;
//   private readonly SANTIMENT_API_KEY = SANTIMENT_API_KEY;
//   private static MONGO_DB = MONGO_DB;

//   private constructor(coins: Coin[]) {
//     this.sorterCoins = new Map(coins.map((coin) => [coin.symbol, coin]));
//   }

//   // ✴️ #region UTIL FUNCTIONS
//   public static async initializeFromDb(): Promise<void> {
//     if (!CoinSorter.instance) {
//       this.dbClient = new MongoClient();
//       await this.dbClient.connect(this.MONGO_DB);
//       const db = this.dbClient.database("general");
//       this.sorterCollection = db.collection<Coin>("coin-sorter");
//       this.basicCollection = db.collection<Coin>("coins");
//       const providerCoins = await this.fetchCoinsFromDb();
//       CoinSorter.instance = new CoinSorter(providerCoins);
//       console.log(
//         `%c${PROJECT_NAME}:CoinSorter ---> initialized...`,
//         DColors.yellow
//       );
//     }
//   }

//   public static getInstance(): CoinSorter {
//     if (!CoinSorter.instance) {
//       throw new Error("CoinSorter has not been initialized yet.");
//     }
//     return CoinSorter.instance;
//   }

//   private async refreshRepository(): Promise<void> {
//     this.sorterCoins.clear();
//     const coins = await CoinSorter.fetchCoinsFromDb();
//     this.sorterCoins = new Map(coins.map((coin) => [coin.symbol, coin]));
//   }
//   // #endregion

//   // #region MONGO DB OPERATIONS
//   private static async fetchCoinsFromDb(): Promise<Coin[]> {
//     try {
//       // Attempt to fetch all coins from the database
//       return await this.sorterCollection.find({}).toArray();
//     } catch (error) {
//       console.error("Failed to fetch coins from the database:", error);

//       await notifyAboutFailedFunction(
//         "D-WS",
//         "CoinSorter",
//         "fetchCoinsFromDb",
//         error
//       );

//       return [];
//     }
//   }

//   public async addCoinToDb(newCoin: Coin): Promise<InsertOneResult> {
//     try {
//       // Attempt to insert the new coin into the database
//       const res = (await CoinSorter.sorterCollection.insertOne(
//         newCoin
//       )) as Bson.ObjectId | null;

//       // Check if the coin was successfully inserted
//       if (res) {
//         return {
//           inserted: true,
//           insertedId: (res as Bson.ObjectId).toString(),
//         };
//       }
//       this.refreshRepository();
//       // If the insertion failed, return a failure response
//       return { inserted: false };
//     } catch (error) {
//       // Log the error message (you can use a logging library here if preferred)
//       console.error("Failed to add coin to database:", error);
//       await notifyAboutFailedFunction(
//         this.PROJECT,
//         this.CLASS_NAME,
//         "addCoinToDb",
//         error
//       );
//       // Return a failure response
//       return { inserted: false };
//     }
//   }

//   public async addCoinArrayToDb(coins: Coin[]): Promise<InsertManyResult> {
//     try {
//       // Insert multiple documents using insertMany
//       const res = await CoinSorter.sorterCollection.insertMany(coins);
//       // Convert insertedIds from the returned object to an array
//       const insertedIds = Object.values(res.insertedIds).map((id) =>
//         (id as Bson.ObjectId).toString()
//       );
//       this.refreshRepository();
//       return { inserted: true, insertedCount: insertedIds.length };
//     } catch (error) {
//       console.error("Failed to insert coins:", error);
//       await notifyAboutFailedFunction(
//         this.PROJECT,
//         this.CLASS_NAME,
//         "addCoinArrayToDb",
//         error
//       );
//       return { inserted: false };
//     }
//   }

//   public async deleteAllCoinsFromDb(): Promise<DeleteResult> {
//     try {
//       // Attempt to delete the coin with the specified symbol
//       const deletedCount = (await CoinSorter.sorterCollection.deleteMany(
//         {}
//       )) as number;

//       // Check if any document was deleted
//       if (deletedCount > 0) {
//         return { deleted: true, deletedCount };
//       }
//       this.refreshRepository();
//       // If no documents were deleted, return a failure response
//       return { deleted: false };
//     } catch (error) {
//       // Log the error message (you can use a logging library if preferred)
//       console.error("Failed to delete coins from database:", error);
//       await notifyAboutFailedFunction(
//         this.PROJECT,
//         this.CLASS_NAME,
//         "deleteAllCoinsFromDb",
//         error
//       );
//       // Return a consistent failure response
//       return { deleted: false };
//     }
//   }

//   public async deleteCoinArrayFromDb(symbols: string[]): Promise<DeleteResult> {
//     try {
//       // Delete multiple documents based on an array of symbols
//       const deletedCount = await CoinSorter.sorterCollection.deleteMany({
//         symbol: { $in: symbols },
//       });

//       // Check if any documents were deleted
//       if (deletedCount && deletedCount > 0) {
//         this.refreshRepository();
//         return { deleted: true, deletedCount };
//       }
//     } catch (error) {
//       await notifyAboutFailedFunction(
//         this.PROJECT,
//         this.CLASS_NAME,
//         "deleteCoinArrayFromDb",
//         error
//       );
//       console.error("Failed to delete coins:", error);
//     }

//     return { deleted: false };
//   }
//   // #endregion
// }
