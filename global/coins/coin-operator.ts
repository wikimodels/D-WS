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
import { CoinRepository } from "./coin-repository.ts";

const { MONGO_DB, PROJECT_NAME } = await load();

export class CoinOperator {
  private static instance: CoinOperator | null = null;
  private static coinsRepo = new Map<string, Coin>();
  private static dbClient: MongoClient | null = null;
  private static db: Database | null = null;
  private static collection: Collection<Coin> | null = null;
  private static readonly dbName = "general";
  private static readonly collectionName = CoinsCollections.CoinRepo;
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

        CoinOperator.collection = CoinOperator.db.collection(
          this.collectionName
        );

        await CoinOperator.initializeCoinsRepoFromDb();

        CoinOperator.instance = new CoinOperator();

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

  // Method to fetch all coins from the database
  private static async getAllCoinsFromDb(): Promise<Coin[]> {
    // Check if the collection is initialized
    if (!CoinOperator.collection) {
      const errorMsg = `${this.PROJECT_NAME}:${this.CLASS_NAME} ---> Database collection is not initialized.`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      // Perform the query to fetch all coins from the collection
      const coins = await CoinOperator.collection.find({}).toArray();

      if (coins.length > 0) {
        console.log(
          `%c${this.PROJECT_NAME}:${this.CLASS_NAME} ---> Retrieved ${coins.length} coins from the database.`,
          DColors.green
        );
      } else {
        console.warn(
          `%c${this.PROJECT_NAME}:${this.CLASS_NAME} ---> No coins found in the database.`,
          DColors.yellow
        );
      }

      return coins;
    } catch (error: any) {
      const errorMsg = `${this.PROJECT_NAME}:${this.CLASS_NAME}:getAllCoinsFromDb ---> Failed to retrieve coins from the database.`;
      console.error(errorMsg, error);

      // Notify about the error
      await notifyAboutFailedFunction(
        this.PROJECT_NAME,
        this.CLASS_NAME,
        "getAllCoinsFromDb",
        error
      );

      // Rethrow the error to propagate it further
      throw new Error(`${errorMsg} Error: ${error.message}`);
    }
  }

  public static getCoinsFromRepoByCollectionName(collectionName: string) {
    const coins = Array.from(this.coinsRepo.values());
    return coins.filter((c) => c.collection === collectionName);
  }

  public static getAllCoinsFromRepo() {
    return Array.from(this.coinsRepo.values());
  }

  public static async addCoin(coin: Coin): Promise<InsertResult> {
    // Ensure the collection is initialized
    if (!CoinOperator.collection) {
      const errorMsg = `${this.PROJECT_NAME}:${this.CLASS_NAME} ---> Database collection is not initialized.`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      const res = await CoinOperator.collection.insertOne(coin);

      // Extract and convert ObjectIds to strings
      const insertedId = (res as Bson.ObjectId).toString();

      this.coinsRepo.clear();
      await this.initializeCoinsRepoFromDb();

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

  public static async addCoins(coins: Coin[]): Promise<InsertResult> {
    // Ensure the collection is initialized
    if (!CoinOperator.collection) {
      const errorMsg = `${this.PROJECT_NAME}:${this.CLASS_NAME} ---> Database collection is not initialized.`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    try {
      const batchSize = 50;
      const totalBatches = Math.ceil(coins.length / batchSize);

      let insertedCount = 0;

      for (let i = 0; i < totalBatches; i++) {
        const batch = coins.slice(i * batchSize, (i + 1) * batchSize);

        try {
          const res = await CoinOperator.collection.insertMany(batch);

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

      this.coinsRepo.clear();
      await this.initializeCoinsRepoFromDb();

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

  public static async deleteCoins(symbols?: string[]): Promise<DeleteResult> {
    // Ensure the collection is initialized
    if (!CoinOperator.collection) {
      const errorMsg = `${this.PROJECT_NAME}:${this.CLASS_NAME} ---> Database collection is not initialized.`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    try {
      const filter =
        symbols && symbols.length > 0 ? { symbol: { $in: symbols } } : {};

      const deletedCount = await CoinOperator.collection.deleteMany(filter);

      this.coinsRepo.clear();
      await this.initializeCoinsRepoFromDb();

      return { deleted: deletedCount > 0, deletedCount };
    } catch (error: any) {
      const errorMsg =
        "CoinOperator:deleteCoins() ---> Failed to delete documents";
      console.error(errorMsg, error);

      await this.notifyAboutError("deleteCoins", error);

      throw new Error(errorMsg);
    }
  }

  public static async updateCoin(updateData: {
    symbol: string;
    propertiesToUpdate: Partial<Coin>;
  }): Promise<ModifyResult> {
    // Ensure the collection is initialized
    if (!CoinOperator.collection) {
      const errorMsg = `${this.PROJECT_NAME}:${this.CLASS_NAME} ---> Database collection is not initialized.`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    try {
      const filteredData = filterUpdateData(updateData.propertiesToUpdate);
      const filter = { symbol: updateData.symbol };
      const update = { $set: filteredData };
      const res = await CoinOperator.collection.updateOne(filter, update);

      this.coinsRepo.clear();
      await this.initializeCoinsRepoFromDb();

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

  public static async updateCoins(
    updateData: Array<{
      symbol: string;
      propertiesToUpdate: Partial<Coin>;
    }>
  ): Promise<ModifyResult> {
    if (!CoinOperator.collection) {
      throw new Error(
        `${this.PROJECT_NAME}:${this.CLASS_NAME} ---> Database collection not initialized. Call initializeInstance() first.`
      );
    }

    if (!updateData || updateData.length === 0) {
      throw new Error(
        `${this.PROJECT_NAME}:${this.CLASS_NAME} ---> No coins provided for updateCoins.`
      );
    }

    let matchedCount = 0;
    let modifiedCount = 0;

    try {
      // Step 1: Iterate through coins and update individually
      for (const data of updateData) {
        const filteredData = filterUpdateData(data.propertiesToUpdate);

        const result = await CoinOperator.collection.updateOne(
          { symbol: data.symbol }, // Filter by symbol
          { $set: filteredData } // Update specified fields
        );

        // Accumulate counts
        matchedCount += result.matchedCount ?? 0;
        modifiedCount += result.modifiedCount ?? 0;
      }

      // Step 2: Log the results
      console.log(
        `%c${this.PROJECT_NAME}:${this.CLASS_NAME} ---> Update completed. Matched: ${matchedCount}, Modified: ${modifiedCount}`,
        DColors.green
      );

      // Step 3: Refresh repository
      this.coinsRepo.clear();
      await this.initializeCoinsRepoFromDb();

      return {
        modified: modifiedCount > 0,
        modifiedCount,
      } as ModifyResult;
    } catch (error: any) {
      const errorMsg = `${this.PROJECT_NAME}:${this.CLASS_NAME}:updateCoins ---> Failed to update coins`;
      console.error(errorMsg, error);

      // Notify about the error
      await notifyAboutFailedFunction(
        this.PROJECT_NAME,
        this.CLASS_NAME,
        "updateCoins",
        error
      );

      // Rethrow the error with additional context
      throw new Error(`${errorMsg} Error: ${error.message}`);
    }
  }

  public static assignCategories(coins: Coin[], lowestTurnover24h: number) {
    return designateCategories(coins, lowestTurnover24h);
  }

  public static assingLinks(coins: Coin[]) {
    coins = designateLinks(coins);
    return coins;
  }

  // Method to retrieve coins from the database and populate the coins map
  private static async initializeCoinsRepoFromDb(): Promise<void> {
    try {
      const coins = await this.getAllCoinsFromDb();
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
        `%c${this.PROJECT_NAME}:${this.CLASS_NAME}:initializeCoinsRepoFromDb ---> failed to fetch coins `,
        DColors.red,
        error
      );
      await this.notifyAboutError("initializeCoinsRepoFromDb", error);
    }
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

  public static async getCoinsRepoStatistics() {
    const coins =
      (await CoinOperator.collection
        ?.find({ collection: CoinsCollections.CoinRepo })
        .toArray()) || [];
    return generateCoinsStatistics(coins);
  }
}
