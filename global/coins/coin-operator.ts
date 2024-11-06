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
import type { Coin } from "../../models/shared/coin.ts";
import { DColors } from "../../models/shared/colors.ts";
import { designateCategories } from "./shared/designate-categories.ts";
import { designateLinks } from "./shared/designate-links.ts";

const { MONGO_DB, PROJECT_NAME } = await load();

export class CoinOperator {
  private static instance: CoinOperator | null = null;
  private static dbClient: MongoClient | null = null;
  private static db: Database | null = null;
  private static readonly dbName = "general";
  private static readonly MONGO_DB = MONGO_DB;
  private static readonly PROJECT_NAME = PROJECT_NAME;
  private static readonly CLASS_NAME = "CoinOperator";

  public static async initializeInstance(): Promise<CoinOperator> {
    if (!CoinOperator.instance) {
      this.dbClient = new MongoClient();
      await this.dbClient.connect(this.MONGO_DB);
      this.db = this.dbClient.database(this.dbName);
      CoinOperator.instance = new CoinOperator();
      console.log("%cCoinOperator ---> initialized...", DColors.yellow);
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

  public static async addCoins(
    collectionName: string,
    coins: Coin[]
  ): Promise<InsertResult> {
    try {
      const collection = this.getCollection(collectionName);
      const res = await collection.insertMany(coins);

      // Extract and convert ObjectIds to strings
      const insertedIds = Object.values(res.insertedIds).map((id) =>
        (id as Bson.ObjectId).toString()
      );

      // Return a successful InsertResult object
      return {
        inserted: true,
        insertedCount: insertedIds.length,
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

      return { deleted: deletedCount > 0, deletedCount };
    } catch (error: any) {
      const errorMsg =
        "CoinOperator:deleteCoins() ---> Failed to delete documents";
      console.error(errorMsg, error);

      await this.notifyAboutError("deleteCoins", error);

      throw new Error(errorMsg);
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

  public static async updateCoin(
    collectionName: string,
    symbol: string,
    updatedData: Partial<Coin>
  ): Promise<ModifyResult> {
    try {
      const collection = this.getCollection(collectionName);
      const { modifiedCount } = await collection.updateOne(
        { symbol },
        { $set: updatedData }
      );

      return {
        modified: modifiedCount > 0,
        modifiedCount: modifiedCount,
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
  ): Promise<{ modifiedCount: number; modified: boolean }> {
    try {
      const collection = this.getCollection(collectionName);
      let modifiedCount = 0;

      for (const coin of coins) {
        const filter = { symbol: coin.symbol };
        const update = { $set: coin.updatedData };

        const { modifiedCount: count } = await collection.updateOne(
          filter,
          update
        );
        modifiedCount += count;
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
}
