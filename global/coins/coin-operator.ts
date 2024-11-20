// deno-lint-ignore-file no-explicit-any
import {
  MongoClient,
  Database,
  Collection,
  Bson,
} from "https://deno.land/x/mongo@v0.31.1/mod.ts";
import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
import { notifyAboutFailedFunction } from "../../functions/tg/notifications/failed-function.ts";
import type {
  ModifyResult,
  InsertResult,
  DeleteResult,
  MoveResult,
} from "../../models/mongodb/operations.ts";
import type { Coin } from "../../models/coin/coin.ts";
import { DColors } from "../../models/shared/colors.ts";
import { designateCategories } from "../utils/designate-categories.ts";
import { designateLinks } from "../utils/designate-links.ts";
import { CoinsCollections } from "../../models/coin/coins-collections.ts";
import { filterUpdateData } from "../utils/filter-update-data.ts";
import { generateCoinsStatistics } from "../utils/generate-coins-statistics.ts";

const { MONGO_DB, PROJECT_NAME } = await load();

export class CoinOperator {
  private static instance: CoinOperator | null = null;
  private static coinsRepo = new Map<string, Coin>();
  private static dbClient: MongoClient | null = null;
  private static db: Database | null = null;
  private static readonly dbName = "general";
  private static readonly MONGO_DB = MONGO_DB;
  private static readonly PROJECT_NAME = PROJECT_NAME;
  private static readonly CLASS_NAME = "CoinOperator";

  // Static method to connect with retry logic
  private static async connectWithRetry(): Promise<MongoClient> {
    const maxRetries = 15; // Number of retry attempts
    const retryDelay = 2000; // Delay between retries (in ms)

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const newClient = new MongoClient();
        await newClient.connect(CoinOperator.MONGO_DB); // Use the class constant
        console.log(
          `%c${this.PROJECT_NAME}:${this.CLASS_NAME} ---> connected to db`,
          DColors.magenta
        );
        return newClient; // Return the connected client
      } catch (err) {
        console.error(`Connection attempt ${attempt} failed:`, err);

        // If all attempts fail, throw an error
        if (attempt === maxRetries) {
          throw new Error(
            "Failed to connect to MongoDB after multiple attempts"
          );
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }

    throw new Error("Unable to establish connection to MongoDB"); // Fallback error
  }

  // Singleton method to initialize the instance
  public static async initializeInstance(): Promise<CoinOperator> {
    if (!CoinOperator.instance) {
      try {
        // Use the connectWithRetry function to connect to MongoDB
        CoinOperator.dbClient = await CoinOperator.connectWithRetry(); // Connect with retry logic
        CoinOperator.db = CoinOperator.dbClient.database(CoinOperator.dbName);

        // Explicitly call initializeCoinsFromDb after the database is ready
        await CoinOperator.initializeCoinsFromDb(CoinsCollections.CoinAtWork); // Example method to load coins

        CoinOperator.instance = new CoinOperator(); // Create the singleton instance
        console.log(
          `%c${CoinOperator.PROJECT_NAME}:${CoinOperator.CLASS_NAME} ---> initialized...`,
          "color: magenta"
        );
      } catch (error) {
        console.error("CoinOperator initialization failed:", error);
        throw error; // Re-throw the error to notify that the initialization failed
      }
    }
    return CoinOperator.instance;
  }

  public static getCollection(collectionName: string): Collection<Coin> {
    if (!CoinOperator.db) {
      throw new Error(
        "CoinOperator --> Database not initialized. Call initializeFromDb() first."
      );
    }
    return CoinOperator.db.collection(collectionName);
  }

  public static async getAllCoins(collectionName: string): Promise<Coin[]> {
    try {
      const collection = this.getCollection(collectionName);
      return await collection.find({}).toArray();
    } catch (error) {
      const errorMsg =
        "CoinOperator:getAllCoins() ---> Failed to insert documents";
      console.error(errorMsg, error);

      // Notify about the failed function with context
      await notifyAboutFailedFunction(
        this.PROJECT_NAME,
        this.CLASS_NAME,
        "getAllCoins",
        error
      );
      // Return a failed InsertResult object
      throw new Error(errorMsg);
    }
  }

  public static async addCoin(
    collectionName: string,
    coin: Coin
  ): Promise<InsertResult> {
    try {
      const collection = this.getCollection(collectionName);
      const res = await collection.insertOne(coin);

      // Extract and convert ObjectIds to strings
      const insertedId = (res as Bson.ObjectId).toString();

      if (collectionName == CoinsCollections.CoinRepo) {
        this.coinsRepo.clear();
        await this.initializeCoinsFromDb(CoinsCollections.CoinRepo);
      }
      // Return a successful InsertResult object
      return {
        inserted: insertedId != undefined,
        insertedCount: 1,
      } as InsertResult;
    } catch (error) {
      const errorMsg = "CoinOperator:addCoin() ---> Failed to insert document";
      console.error(errorMsg, error);

      // Notify about the failed function with context
      await notifyAboutFailedFunction(
        this.PROJECT_NAME,
        this.CLASS_NAME,
        "addCoins",
        error
      );

      // Return a failed InsertResult object
      throw new Error(errorMsg);
    }
  }

  public static async addCoins(
    collectionName: string,
    coins: Coin[]
  ): Promise<InsertResult> {
    try {
      const collection = this.getCollection(collectionName);
      const batchSize = 50;
      const totalBatches = Math.ceil(coins.length / batchSize);

      let insertedCount = 0;

      for (let i = 0; i < totalBatches; i++) {
        const batch = coins.slice(i * batchSize, (i + 1) * batchSize);

        try {
          const res = await collection.insertMany(batch);

          // Extract and convert ObjectIds to strings
          const insertedIds = Object.values(res.insertedIds).map((id) =>
            (id as Bson.ObjectId).toString()
          );

          insertedCount += insertedIds.length;

          console.log(
            `${this.PROJECT_NAME}:${this.CLASS_NAME}:AddCoins() ---> Batch ${
              i + 1
            }/${totalBatches} inserted: ${insertedIds.length} records`
          );
        } catch (batchError) {
          console.error(
            `${this.PROJECT_NAME}:${
              this.CLASS_NAME
            }:AddCoins() ---> Failed to insert batch ${i + 1}/${totalBatches}`,
            batchError
          );
          throw batchError;
        }
      }

      if (collectionName === CoinsCollections.CoinRepo) {
        this.coinsRepo.clear();
        await this.initializeCoinsFromDb(CoinsCollections.CoinRepo);
      }

      return {
        inserted: true,
        insertedCount,
      } as InsertResult;
    } catch (error) {
      const errorMsg =
        "CoinOperator:addCoins() ---> Failed to insert documents";
      console.error(errorMsg, error);

      // Notify about the failed function with context
      await notifyAboutFailedFunction(
        this.PROJECT_NAME,
        this.CLASS_NAME,
        "addCoins",
        error
      );

      // Return a failed InsertResult object
      throw new Error(errorMsg);
    }
  }

  public static async deleteCoins(
    collectionName: string,
    symbols?: string[]
  ): Promise<DeleteResult> {
    try {
      const collection = this.getCollection(collectionName);
      const filter =
        symbols && symbols.length > 0 ? { symbol: { $in: symbols } } : {};

      const deletedCount = await collection.deleteMany(filter);

      if (collectionName == CoinsCollections.CoinRepo) {
        this.coinsRepo.clear();
        await this.initializeCoinsFromDb(CoinsCollections.CoinRepo);
      }

      return { deleted: deletedCount > 0, deletedCount };
    } catch (error: any) {
      const errorMsg =
        "CoinOperator:deleteCoins() ---> Failed to delete documents";
      console.error(errorMsg, error);

      await this.notifyAboutError("deleteCoins", error);

      throw new Error(errorMsg);
    }
  }

  public static async updateCoin(
    collectionName: string,
    symbol: string,
    updatedData: Partial<Coin>
  ): Promise<ModifyResult> {
    try {
      const filteredData = filterUpdateData(updatedData);
      const collection = this.getCollection(collectionName);
      const filter = { symbol: symbol };
      const update = { $set: filteredData };
      const res = await collection.updateOne(filter, update);

      if (collectionName == CoinsCollections.CoinRepo) {
        this.coinsRepo.clear();
        await this.initializeCoinsFromDb(CoinsCollections.CoinRepo);
      }

      return {
        modified: res.modifiedCount > 0,
        modifiedCount: res.modifiedCount,
      } as ModifyResult;
    } catch (error) {
      const errorMsg =
        "CoinOperator:updateCoin() ---> Failed to update document";
      console.error(errorMsg, error);
      await notifyAboutFailedFunction(
        this.PROJECT_NAME,
        this.CLASS_NAME,
        "updateCoin",
        error
      );
      // Rethrow the error so that the calling code can handle it
      throw new Error(errorMsg);
    }
  }

  public static async updateManyCoins(
    collectionName: string,
    coins: Array<{ symbol: string; updatedData: Partial<Coin> }>
  ): Promise<ModifyResult> {
    try {
      const collection = this.getCollection(collectionName);
      let modifiedCount = 0;

      for (const coin of coins) {
        const filteredData = filterUpdateData(coin.updatedData);

        const { modifiedCount: count } = await collection.updateOne(
          { symbol: coin.symbol },
          { $set: filteredData }
        );
        modifiedCount += count;
      }

      if (collectionName == CoinsCollections.CoinRepo) {
        this.coinsRepo.clear();
        await this.initializeCoinsFromDb(CoinsCollections.CoinRepo);
      }

      return {
        modified: modifiedCount > 0,
        modifiedCount,
      };
    } catch (error: any) {
      const errorMsg =
        "CoinOperator:updateManyCoins() ---> Failed to update documents";
      console.error(errorMsg, error);

      await this.notifyAboutError("updateManyCoins", error);

      throw new Error(`${errorMsg}: ${error.message}`);
    }
  }

  public static async moveCoins(
    sourceCollection: string,
    targetCollection: string,
    coins: Coin[]
  ): Promise<MoveResult> {
    const source = this.getCollection(sourceCollection);
    const target = this.getCollection(targetCollection);

    // Initialize a default MoveResult for error handling
    const result: MoveResult = {
      deleteCount: 0,
      insertCount: 0,
      moved: false,
    };

    if (coins.length === 0) {
      console.warn("No documents provided to move.");
      return result; // No documents to move, return a default result
    }

    try {
      // Insert documents into target collection
      const insertRes = await target.insertMany(coins);
      const insertCount = insertRes.insertedCount;

      // Delete documents from source collection
      const deleteCount = await source.deleteMany({
        symbol: { $in: coins.map((doc) => doc.symbol) },
      });

      // Set the result based on the outcome
      result.insertCount = insertCount;
      result.deleteCount = deleteCount;
      result.moved =
        insertCount === deleteCount && deleteCount === coins.length;

      if (
        sourceCollection == CoinsCollections.CoinRepo ||
        targetCollection == CoinsCollections.CoinRepo
      ) {
        this.coinsRepo.clear();
        await this.initializeCoinsFromDb(CoinsCollections.CoinRepo);
      }

      return result;
    } catch (error) {
      const errorMsg = "CoinOperator:moveCoins() ---> Error moving documents";
      console.error(errorMsg, error);

      // Notify about the failed function with context
      await notifyAboutFailedFunction(
        this.PROJECT_NAME,
        this.CLASS_NAME,
        "moveCoins",
        error
      );
      // Return the default failure result
      throw new Error(errorMsg);
    }
  }

  public static assignCategories(coins: Coin[], lowestTurnover24h: number) {
    return designateCategories(coins, lowestTurnover24h);
  }

  public static assingLinks(coins: Coin[]) {
    coins = designateLinks(coins);
    return coins;
  }

  private static async notifyAboutError(
    functionName: string,
    error: Error
  ): Promise<void> {
    await notifyAboutFailedFunction(
      this.PROJECT_NAME,
      this.CLASS_NAME,
      functionName,
      error
    );
  }

  // Method to retrieve coins from the database and populate the coins map
  private static async initializeCoinsFromDb(
    collectionName: string
  ): Promise<void> {
    try {
      const coins = await this.getAllCoins(collectionName);
      // Populate the coins map with a single Coin per key
      coins.forEach((coin) => {
        const key = coin.symbol; // Use symbol as the unique key
        this.coinsRepo.set(key, coin);
      });

      console.log(
        `%c${this.PROJECT_NAME}:${this.CLASS_NAME} ---> coins loaded from DB...`,
        DColors.green
      );
    } catch (error: any) {
      console.error(
        `%c${this.PROJECT_NAME}:${this.CLASS_NAME}:initializeCoinsFromDb ---> failed to fetch coins `,
        DColors.red,
        error
      );
      await this.notifyAboutError("initializeCoinsFromDb", error);
    }
  }

  public static getAllWorkingCoinsFromRepo() {
    return Array.from(this.coinsRepo.values());
  }

  public static async getCoinsRepoStatistics() {
    const coins = await CoinOperator.getAllCoins(CoinsCollections.CoinRepo);
    return generateCoinsStatistics(coins);
  }
}
