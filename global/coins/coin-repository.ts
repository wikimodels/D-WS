import { InsertManyResult } from "./coin-provider";
// deno-lint-ignore-file no-explicit-any
import {
  MongoClient,
  Collection,
  Bson,
} from "https://deno.land/x/mongo@v0.31.1/mod.ts";
import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
import type { Coin } from "../../models/shared/coin.ts";
import { sendTgGeneralMessage } from "../../functions/tg/send-general-tg-msg.ts";
import { formatFailedDataNotificationMsg } from "../../functions/tg/formatters/coin-msg/failed-data-notification.ts";
import { formatFailedUpdatesNotificationMsg } from "../../functions/tg/formatters/coin-msg/failed-updates-notification.ts";

import { DColors } from "../../models/shared/colors.ts";
import { notifyAboutFailedFunction } from "../../functions/tg/notifications/failed-function.ts";
import { designateCategories } from "./shared/designate-categories.ts";
import { notifyAboutTurnover24hUpdateCompletion } from "../../functions/tg/notifications/turnover24h-update-complete.ts";
import type {
  DeleteResult,
  InsertOneResult,
  ModifyResult,
} from "../../models/mongodb/operations.ts";

const {
  MONGO_DB,
  PROJECT_NAME,
  BYBIT_FUTURES_KLINE,
  BINANCE_FUTURES_KLINE,
  LOWEST_TURNOVER24H,
} = await load();

type SuccessfulResult = {
  success: true;
  symbol: string;
  data: { symbol: string; turnover24h: number };
};

type FailedResult = {
  symbol: string;
  error: any;
};

type Result = {
  success: boolean;
  symbol: string;
  data?: any;
  error?: string;
};

type KlineData = {
  symbol: string;
  turnover24h: number;
};

type Updates = {
  successfullUpdates: string[];
  failedUpdates: string[];
};

export class CoinRepository {
  private static instance: CoinRepository;
  private coins: Map<string, Coin>;
  private static dbClient: MongoClient;
  private static readonly dbName = "general";
  private static readonly collectionName = "coins";
  private static collection: Collection<Coin>;
  private static readonly MONGO_DB = MONGO_DB;
  private readonly PROJECT_NAME = PROJECT_NAME;
  private readonly CLASS_NAME = "CoinRepository";
  private readonly BYBIT_FUTURES_KLINE = BYBIT_FUTURES_KLINE;
  private readonly BINANCE_FUTURES_KLINE = BINANCE_FUTURES_KLINE;
  private readonly LOWEST_TURNOVER24H = parseFloat(LOWEST_TURNOVER24H);

  // #region UTILS
  private constructor(coins: Coin[]) {
    this.coins = new Map(coins.map((coin) => [coin.symbol, coin]));
  }

  public static async initializeFromDb(): Promise<void> {
    if (!CoinRepository.instance) {
      this.dbClient = new MongoClient();
      await this.dbClient.connect(this.MONGO_DB);
      const db = this.dbClient.database(this.dbName);
      this.collection = db.collection<Coin>(this.collectionName);
      const coins = await this.fetchCoinsFromDb();
      CoinRepository.instance = new CoinRepository(coins);
      console.log("%cCoinRepository ---> initialized...", DColors.cyan);
    }
  }

  public static getInstance(): CoinRepository {
    if (!CoinRepository.instance) {
      throw new Error("CoinRepository has not been initialized yet.");
    }
    return CoinRepository.instance;
  }

  private async refreshRepository(): Promise<void> {
    const coins = await CoinRepository.fetchCoinsFromDb();
    this.coins = new Map(coins.map((coin) => [coin.symbol, coin]));
  }

  public getAllCoins(): Coin[] {
    return Array.from(this.coins.values());
  }

  public getBybitCoins(): Coin[] {
    return Array.from(this.coins.values()).filter(
      (coin) => coin.exchange === "by" || coin.exchange === "biby"
    );
  }

  public getBinanceCoins(): Coin[] {
    return Array.from(this.coins.values()).filter(
      (coin) => coin.exchange === "bi"
    );
  }

  private async sendFailedUpdatesNotification(
    projectName: string,
    className: string,
    fnName: string,
    data: string[]
  ) {
    const errorMsg = formatFailedUpdatesNotificationMsg(
      projectName,
      className,
      fnName,
      data
    );
    await sendTgGeneralMessage(errorMsg);
  }

  private async sendFailedDataNotification(
    projectName: string,
    className: string,
    fnName: string,
    symbols: string[]
  ) {
    const errorMsg = formatFailedDataNotificationMsg(
      projectName,
      className,
      fnName,
      symbols
    );
    await sendTgGeneralMessage(errorMsg);
  }

  private assignCategories(coins: Coin[], lowestTurnover24h: number) {
    return designateCategories(coins, lowestTurnover24h);
  }

  // #endregion

  // #region MONGO DB OPERATIONS
  private static async fetchCoinsFromDb(): Promise<Coin[]> {
    try {
      return await this.collection.find({}).toArray();
    } catch (error) {
      await notifyAboutFailedFunction(
        "D-WS",
        "CoinRepository",
        "fetchCoinsFromDb",
        error
      );
      console.error("Error in fetchCoinsFromDb:", error);
      throw new Error("Failed to fetch coins from the database");
    }
  }

  public async updateCoinInDb(
    symbol: string,
    updatedData: Partial<Coin>
  ): Promise<ModifyResult> {
    try {
      // Attempt to update the coin in the database
      const { modifiedCount } = await CoinRepository.collection.updateOne(
        { symbol },
        { $set: updatedData }
      );

      // Refresh the repository after updating the database
      await this.refreshRepository();

      // Return success response if any documents were modified
      if (modifiedCount > 0) {
        return { modified: true, modifiedCount };
      } else {
        return { modified: false, modifiedCount: 0 };
      }
    } catch (error) {
      // Log the error with context information
      console.error("Error in updateCoinInDb:", error);
      await notifyAboutFailedFunction(
        this.PROJECT_NAME,
        this.CLASS_NAME,
        "updateCoinInDb",
        error
      );
      // Rethrow the error so that the calling code can handle it
      throw new Error("Failed to update coin in the database");
    }
  }

  public async addCoinToDb(newCoin: Coin): Promise<InsertOneResult> {
    try {
      const res = (await CoinRepository.collection.insertOne(
        newCoin
      )) as Bson.ObjectId | null;
      await this.refreshRepository();
      if (res) {
        return { inserted: true, insertedId: parseInt(res.toJSON()) };
      } else {
        return { inserted: false };
      }
    } catch (error) {
      console.error("Error in addCoinToDb:", error);
      await notifyAboutFailedFunction(
        this.PROJECT_NAME,
        this.CLASS_NAME,
        "addCoinToDb",
        error
      );
      throw new Error("Failed to add coin to the database");
    }
  }

  public async addCoinArrayToDb(coins: Coin[]): Promise<InsertManyResult> {
    try {
      const res = await CoinRepository.collection.insertMany(coins);
      const insertedIds = Object.values(res.insertedIds).map((id) =>
        parseInt((id as Bson.ObjectId).toString(), 16)
      );
      await this.refreshRepository();

      console.log({ inserted: true, insertedIds });
      return { inserted: true, insertedIdsCount: insertedIds.length };
    } catch (error) {
      // Log the error with contextual information
      console.error("Failed to insert coins in addCoinArrayToDb:", error);

      // Optionally, notify monitoring system about the failed operation
      await notifyAboutFailedFunction(
        this.PROJECT_NAME,
        this.CLASS_NAME,
        "addCoinArrayToDb",
        error
      );

      // Return failure result
      return { inserted: false };
    }
  }

  public async deleteCoinFromDb(symbol: string): Promise<DeleteResult> {
    try {
      const deletedCount = await CoinRepository.collection.deleteOne({
        symbol,
      });
      await this.refreshRepository();

      if (deletedCount > 0) {
        return { deleted: true, deletedCount };
      } else {
        return { deleted: true };
      }
    } catch (error) {
      console.error("Error in deleteCoinFromDb:", error);

      await notifyAboutFailedFunction(
        this.PROJECT_NAME,
        this.CLASS_NAME,
        "deleteCoinFromDb",
        error
      );
      return { deleted: false };
    }
  }

  public async deleteCoinArrayFromDb(symbols: string[]): Promise<DeleteResult> {
    try {
      // Delete multiple documents based on an array of symbols
      const deletedCount = await CoinRepository.collection.deleteMany({
        symbol: { $in: symbols },
      });

      // Refresh the repository after deletion (if needed)
      await this.refreshRepository();

      // Check if any documents were deleted
      if (deletedCount && deletedCount > 0) {
        return { deleted: true, deletedCount };
      } else {
        return { deleted: true };
      }
    } catch (error) {
      console.error("Failed to delete coins:", error);
      await notifyAboutFailedFunction(
        this.PROJECT_NAME,
        this.CLASS_NAME,
        "deleteCoinFromDb",
        error
      );
      return { deleted: false };
    }
  }
  // #endregion

  // #region TURNOVER24H UDPDATE FUNCTIONS

  private async fetchBybitKlineData(
    symbol: string,
    interval: string,
    limit: number
  ): Promise<KlineData> {
    try {
      const response = await fetch(
        `${this.BYBIT_FUTURES_KLINE}?category=linear&symbol=${symbol}&interval=${interval}&limit=${limit}`
      );

      // Check if response is successful
      if (!response.ok) {
        throw new Error(
          `${this.PROJECT_NAME}:${this.CLASS_NAME}:${symbol} ---> Failed to fetch Bybit kline data: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Check if Bybit's response contains the expected "OK" message
      if (data.retMsg !== "OK") {
        throw new Error(
          `${this.PROJECT_NAME}:${this.CLASS_NAME}:${symbol}---> Unexpected response from Bybit: ${data.retMsg}`
        );
      }

      // Validate that data structure is as expected before accessing it
      if (
        !data.result ||
        !data.result.list ||
        !data.result.list[0] ||
        data.result.list[0][6] === undefined
      ) {
        throw new Error(
          "Bybit kline data format is invalid or missing expected fields"
        );
      }

      // Return the parsed kline data
      return {
        symbol: data.result.symbol,
        turnover24h: data.result.list[0][6],
      };
    } catch (error) {
      // Log the error with additional context
      console.error("Error in fetchBybitKlineData:", error);

      await notifyAboutFailedFunction(
        this.PROJECT_NAME,
        this.CLASS_NAME + `:${symbol}`,
        "fetchBybitKlineData",
        error
      );

      // Rethrow the error to allow calling code to handle it
      throw new Error(
        `${this.PROJECT_NAME}:${this.CLASS_NAME}:${symbol} ---> Failed to fetch and process Bybit kline data for ${symbol}`
      );
    }
  }

  private async fetchBinanceKlineData(
    symbol: string,
    interval: string,
    limit: number
  ): Promise<KlineData> {
    try {
      const url = `${this.BINANCE_FUTURES_KLINE}?symbol=${symbol}&interval=${interval}&limit=${limit}`;
      const response = await fetch(url);

      // Check if response is successful
      if (!response.ok) {
        throw new Error(
          `${this.PROJECT_NAME}:${this.CLASS_NAME}:${symbol} ---> Failed to fetch Binance kline data: ${response.status} ${response.statusText} ${url}`
        );
      }

      const data = await response.json();

      // Validate data structure to ensure expected format
      if (
        !Array.isArray(data) ||
        !data[0] ||
        typeof data[0][7] === "undefined"
      ) {
        throw new Error(
          "Binance kline data format is invalid or missing expected fields"
        );
      }

      // Return the parsed kline data, converting turnover24h to a float
      return { symbol, turnover24h: parseFloat(data[0][7]) };
    } catch (error) {
      // Log the error with additional context
      console.error(
        `${this.PROJECT_NAME}:${this.CLASS_NAME}:${symbol}---> Error in fetchBinanceKlineData:`,
        error
      );

      await notifyAboutFailedFunction(
        this.PROJECT_NAME,
        this.CLASS_NAME + `:${symbol}`,
        "fetchBinanceKlineData",
        error
      );
      // Rethrow the error to allow calling code to handle it
      throw new Error(
        `${this.PROJECT_NAME}:${this.CLASS_NAME}:${symbol} ---> Failed to fetch and process Bybit kline data for ${symbol}`
      );
    }
  }

  private createBinanceKlinePromises(
    coins: Coin[],
    interval: string,
    limit: number
  ): Promise<Result>[] {
    return coins.map(async (coin) => {
      try {
        const data = await this.fetchBinanceKlineData(
          coin.symbol,
          interval,
          limit
        );
        return { success: true, symbol: coin.symbol, data };
      } catch (error) {
        console.error(`Failed to fetch kline for ${coin.symbol}:`, error);
        return {
          success: false,
          symbol: coin.symbol,
          error: (error as Error).message,
        };
      }
    });
  }

  private createBybitKlinePromises(
    coins: Coin[],
    interval: string,
    limit: number
  ): Promise<Result>[] {
    return coins.map(async (coin) => {
      try {
        const data = await this.fetchBybitKlineData(
          coin.symbol,
          interval,
          limit
        );
        return { success: true, symbol: coin.symbol, data };
      } catch (error) {
        console.error(`Failed to fetch kline for ${coin.symbol}:`, error);
        return {
          success: false,
          symbol: coin.symbol,
          error: (error as Error).message,
        };
      }
    });
  }

  private async runPromiseBatch(promises: Promise<Result>[]): Promise<{
    successfulData: SuccessfulResult[];
    failedData: FailedResult[];
  }> {
    // Execute all promises
    const results = await Promise.all(promises);

    // Separate successful and failed results
    const successfulData = results
      .filter((result) => result.success)
      .map((result) => ({
        symbol: result.symbol,
        data: result.data,
      })) as SuccessfulResult[];

    const failedData = results
      .filter((result) => !result.success)
      .map((result) => ({
        symbol: result.symbol,
        error: result.error,
      }));

    return { successfulData, failedData };
  }

  private getTurnover24Data(successfulData: any[]) {
    return successfulData.map(({ symbol, data: { turnover24h } }) => ({
      symbol,
      turnover24h,
    }));
  }

  private updateCoinCategories(
    coins: Coin[],
    turnover24hs: { symbol: string; turnover24h: number }[]
  ) {
    coins.forEach((c) => {
      const turnoverData = turnover24hs.find((t) => t.symbol === c.symbol);
      if (turnoverData) {
        c.turnover24h = turnoverData.turnover24h;
      }
    });
    return coins;
  }

  private async saveUpdatedCategories(coins: Coin[]): Promise<Updates> {
    const successfullUpdates: string[] = [];
    const failedUpdates: string[] = [];

    for (const coin of coins) {
      try {
        await this.updateCoinInDb(coin.symbol, {
          category: coin.category,
          turnover24h: coin.turnover24h,
        });
        successfullUpdates.push(coin.symbol);
      } catch (error) {
        console.error(
          `Failed to update category in DB for ${coin.symbol}:`,
          error
        );
        failedUpdates.push(coin.symbol);
      }
    }

    return { successfullUpdates, failedUpdates };
  }

  // #endregion

  // #region ✅ BINANCE TURNOVER24H UPDATE

  public async runBinanceTurnover24hUpdate(
    coins: Coin[],
    interval: string,
    limit: number
  ) {
    const binancePromises = this.createBinanceKlinePromises(
      coins,
      interval,
      limit
    );
    const result = await this.runPromiseBatch(binancePromises);
    const turnover24hData = this.getTurnover24Data(result.successfulData);
    coins = this.updateCoinCategories(coins, turnover24hData);
    coins = this.assignCategories(coins, this.LOWEST_TURNOVER24H);
    const updates = await this.saveUpdatedCategories(coins);

    if (result.failedData.length > 0) {
      const symbols = result.failedData.map((d) => d.symbol);
      this.sendFailedDataNotification(
        this.PROJECT_NAME,
        this.CLASS_NAME,
        "runBinanceTurnover24hUpdate",
        symbols
      );
    }
    if (updates.failedUpdates.length > 0) {
      this.sendFailedUpdatesNotification(
        this.PROJECT_NAME,
        this.CLASS_NAME,
        "runBinanceTurnover24hUpdate",
        updates.failedUpdates
      );
    }
    console.log(
      `%c${this.PROJECT_NAME}:${this.CLASS_NAME} ---> Binance Successfull Kline Fetch: ${result.successfulData.length}`,
      DColors.cyan
    );
    console.log(
      `%c${this.PROJECT_NAME}:${this.CLASS_NAME} ---> Binance Successfull Turnover24h Updates: ${updates.successfullUpdates.length}`,
      DColors.green
    );
  }
  // #endregion

  // #region ✅ BYBIT TURNOVER UPDATE

  public async runBybitTurnover24hUpdate(
    coins: Coin[],
    interval: string,
    limit: number
  ) {
    const bybitPromises = this.createBybitKlinePromises(coins, interval, limit);
    const result = await this.runPromiseBatch(bybitPromises);
    const turnover24hData = this.getTurnover24Data(result.successfulData);
    coins = this.updateCoinCategories(coins, turnover24hData);
    coins = this.assignCategories(coins, this.LOWEST_TURNOVER24H);
    const updates = await this.saveUpdatedCategories(coins);

    if (result.failedData.length > 0) {
      const symbols = result.failedData.map((d) => d.symbol);
      this.sendFailedDataNotification(
        this.PROJECT_NAME,
        this.CLASS_NAME,
        "runBybitTurnover24hUpdate",
        symbols
      );
    }
    if (updates.failedUpdates.length > 0) {
      this.sendFailedUpdatesNotification(
        this.PROJECT_NAME,
        this.CLASS_NAME,
        "runBybitTurnover24hUpdate",
        updates.failedUpdates
      );
    }
    console.log(
      `%c${this.PROJECT_NAME}:${this.CLASS_NAME} ---> Bybit Successfull Kline Fetch: ${result.successfulData.length}`,
      DColors.cyan
    );
    console.log(
      `%c${this.PROJECT_NAME}:${this.CLASS_NAME} ---> Bybit Successfull Turnover24h Updates: ${updates.successfullUpdates.length}`,
      DColors.green
    );
  }
  // #endregion

  // #region UPDATE PROCEDURE
  public async runTurnover24hUpdatePocedure() {
    try {
      const binanceCoins = this.getBinanceCoins();
      const bybitCoins = this.getBybitCoins();
      await this.runBinanceTurnover24hUpdate(binanceCoins, "1d", 1);
      await this.runBybitTurnover24hUpdate(bybitCoins, "D", 1);
      console.log(
        "%cTurnover24h Update Procedure ---> successfully done...",
        DColors.magenta
      );
    } catch (error) {
      console.log(error);
      await notifyAboutFailedFunction(
        this.PROJECT_NAME,
        this.CLASS_NAME,
        "runTurnover24hUpdatePocedure",
        error
      );
    }
    await notifyAboutTurnover24hUpdateCompletion(this.PROJECT_NAME);
  }
  // #endregion

  // Function to schedule data refresh every three days
  public scheduleRefresh() {
    this.runTurnover24hUpdatePocedure().then(() => {
      setInterval(async () => {
        await this.runTurnover24hUpdatePocedure();
      }, 20 * 24 * 60 * 60 * 1000); // 3 days in milliseconds
    });
  }
}
