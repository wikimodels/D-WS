// coin-repository.ts
import {
  MongoClient,
  Collection,
} from "https://deno.land/x/mongo@v0.31.1/mod.ts";
import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
import type { Coin } from "../../models/shared/coin.ts";
import { sendTgGeneralMessage } from "../../functions/tg/send-general-tg-msg.ts";
import { formatFailedDataNotificationMsg } from "../../functions/tg/coin.ts/failed-data-notification.ts";
import { formatFailedUpdatesNotificationMsg } from "../../functions/tg/coin.ts/failed-updates-notification.ts";
import {
  fetchBinanceKlineData,
  fetchBybitKlineData,
} from "./coins-api-service.ts";

const { MONGO_DB, PROJECT_NAME } = await load();

type SuccessfulResult = {
  success: true;
  symbol: string;
  data: { symbol: string; turnover24h: number };
};

export class CoinRepository {
  private static instance: CoinRepository;
  private coins: Map<string, Coin>;

  private static dbClient: MongoClient;
  private static readonly dbName = "general";
  private static readonly collectionName = "coins";
  private static collection: Collection<Coin>;

  private constructor(coins: Coin[]) {
    this.coins = new Map(coins.map((coin) => [coin.symbol, coin]));
  }

  public static async initializeFromDb(): Promise<void> {
    if (!CoinRepository.instance) {
      this.dbClient = new MongoClient();
      await this.dbClient.connect(MONGO_DB);
      const db = this.dbClient.database(this.dbName);
      this.collection = db.collection<Coin>(this.collectionName);
      const coins = await this.fetchCoinsFromDb();
      CoinRepository.instance = new CoinRepository(coins);
    }
  }

  public static getInstance(): CoinRepository {
    if (!CoinRepository.instance) {
      throw new Error("CoinRepository has not been initialized yet.");
    }
    return CoinRepository.instance;
  }

  private static async fetchCoinsFromDb(): Promise<Coin[]> {
    return this.collection.find({}).toArray();
  }

  public async updateCoinInDb(
    symbol: string,
    updatedData: Partial<Coin>
  ): Promise<number> {
    const { modifiedCount } = await CoinRepository.collection.updateOne(
      { symbol },
      { $set: updatedData }
    );
    await this.refreshRepository();
    return modifiedCount;
  }

  public async addCoinToDb(newCoin: Coin): Promise<string> {
    const { insertedId } = (await CoinRepository.collection.insertOne(
      newCoin
    )) as { insertedId: string };
    await this.refreshRepository();
    return insertedId as string;
  }

  public async deleteCoinFromDb(symbol: string): Promise<number> {
    const { deletedCount } = (await CoinRepository.collection.deleteOne({
      symbol,
    })) as unknown as { deletedCount: number };
    await this.refreshRepository();
    return deletedCount;
  }

  private async refreshRepository(): Promise<void> {
    const coins = await CoinRepository.fetchCoinsFromDb();
    this.coins = new Map(coins.map((coin) => [coin.symbol, coin]));
  }

  public getAllCoins(): Coin[] {
    return Array.from(this.coins.values());
  }

  public ByCoins(): Coin[] {
    return Array.from(this.coins.values()).filter(
      (coin) => coin.exchange === "by" || coin.exchange === "biby"
    );
  }

  public BiCoins(): Coin[] {
    return Array.from(this.coins.values()).filter(
      (coin) => coin.exchange === "bi"
    );
  }

  public async updateAllBinanceCoinCategories(
    interval = "1d",
    limit = 1
  ): Promise<{ successfulUpdates: string[]; failedUpdates: string[] }> {
    const binanceCoins = this.getAllCoins()
      .filter((c) => c.exchange === "bi" || c.exchange == "biby")
      .slice(0, 2);

    const { successfulData, failedData } = await this.fetchBiKlineDataForCoins(
      binanceCoins,
      interval,
      limit
    );

    //SEND NOTIFICAION
    if (failedData.length > 0) {
      this.sendFailedDataNotification(
        failedData,
        "updateAllBinanceCoinCategories",
        PROJECT_NAME
      );
    }

    const turnover24hData = successfulData.map(
      ({ symbol, data: { turnover24h } }) => ({
        symbol,
        turnover24h,
      })
    );

    this.updateCoinCategories(binanceCoins, turnover24hData);
    const { successfulUpdates, failedUpdates } =
      await this.saveUpdatedCategories(binanceCoins);

    await this.refreshRepository();
    if (failedUpdates.length > 0) {
      this.sendFailedUpdatesNotification(
        failedUpdates,
        "updateAllBinanceCoinCategories",
        PROJECT_NAME
      );
    }
    return { successfulUpdates, failedUpdates };
  }

  //UPDATE BYBIT COIN CATEGORIES
  public async updateAllBybitCoinCategories(
    interval = "D",
    limit = 1
  ): Promise<{ successfulUpdates: string[]; failedUpdates: string[] }> {
    const bybitCoins = this.getAllCoins().filter((c) => c.exchange === "by");
    const { successfulData, failedData } = await this.fetchByKlineDataForCoins(
      bybitCoins,
      interval,
      limit
    );

    //SEND NOTIFICAION
    if (failedData.length > 0) {
      this.sendFailedDataNotification(
        failedData,
        "updateAllBybitCoinCategories",
        PROJECT_NAME
      );
    }

    const turnover24hData = successfulData.map(
      ({ symbol, data: { turnover24h } }) => ({
        symbol,
        turnover24h,
      })
    );

    this.updateCoinCategories(bybitCoins, turnover24hData);
    const { successfulUpdates, failedUpdates } =
      await this.saveUpdatedCategories(bybitCoins);

    await this.refreshRepository();
    if (failedUpdates.length > 0) {
      this.sendFailedUpdatesNotification(
        failedUpdates,
        "updateAllBybitCoinCategories",
        PROJECT_NAME
      );
    }
    return { successfulUpdates, failedUpdates };
  }

  private async fetchByKlineDataForCoins(
    coins: Coin[],
    interval: string,
    limit: number
  ): Promise<{ successfulData: SuccessfulResult[]; failedData: any[] }> {
    const klinePromises = coins.map(async (coin) => {
      try {
        const data = await this.fetchByKlineData(coin.symbol, interval, limit);
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

    const responseData = await Promise.all(klinePromises);
    return {
      successfulData: responseData.filter(
        (result) => result.success
      ) as SuccessfulResult[],
      failedData: responseData.filter((result) => !result.success),
    };
  }

  private async fetchBiKlineDataForCoins(
    coins: Coin[],
    interval: string,
    limit: number
  ): Promise<{ successfulData: SuccessfulResult[]; failedData: any[] }> {
    const klinePromises = coins.map(async (coin) => {
      try {
        const data = await this.fetchBiKlineData(coin.symbol, interval, limit);

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

    const responseData = await Promise.all(klinePromises);
    return {
      successfulData: responseData.filter(
        (result) => result.success
      ) as SuccessfulResult[],
      failedData: responseData.filter((result) => !result.success),
    };
  }

  private async saveUpdatedCategories(
    coins: Coin[]
  ): Promise<{ successfulUpdates: string[]; failedUpdates: string[] }> {
    const successfulUpdates: string[] = [];
    const failedUpdates: string[] = [];

    for (const coin of coins) {
      try {
        await this.updateCoinInDb(coin.symbol, {
          category: coin.category,
          turnover24h: coin.turnover24h,
        });
        successfulUpdates.push(coin.symbol);
      } catch (error) {
        console.error(
          `Failed to update category in DB for ${coin.symbol}:`,
          error
        );
        failedUpdates.push(coin.symbol);
      }
    }

    return { successfulUpdates, failedUpdates };
  }

  private async fetchByKlineData(
    symbol: string,
    interval: string,
    limit: number
  ): Promise<{ symbol: string; turnover24h: number }> {
    return await fetchBybitKlineData(symbol, interval, limit);
  }

  private async fetchBiKlineData(
    symbol: string,
    interval: string,
    limit: number
  ): Promise<{ symbol: string; turnover24h: number }> {
    return await fetchBinanceKlineData(symbol, interval, limit);
  }

  private updateCoinCategories(
    coins: Coin[],
    turnover24hs: { symbol: string; turnover24h: number }[]
  ) {
    coins.forEach((c) => {
      const turnoverData = turnover24hs.find((t) => t.symbol === c.symbol);
      if (turnoverData) {
        c.category = this.assignCategory(turnoverData.turnover24h);
        c.turnover24h = turnoverData.turnover24h;
      }
    });
  }

  private assignCategory(turnover24h: number): string {
    if (turnover24h > 200 * 1000 * 1000) return "I";
    if (turnover24h >= 100 * 1000 * 1000) return "II";
    if (turnover24h >= 50 * 1000 * 1000) return "III";
    if (turnover24h >= 10 * 1000 * 1000) return "IV";
    return "V";
  }

  private async sendFailedUpdatesNotification(
    data: string[],
    fnName: string,
    projectName: string
  ) {
    const errorMsg = formatFailedUpdatesNotificationMsg(
      data,
      fnName,
      projectName
    );
    await sendTgGeneralMessage(errorMsg);
  }

  private async sendFailedDataNotification(
    data: { success: boolean; symbol: string; error: string }[],
    fnName: string,
    projectName: string
  ) {
    const errorMsg = formatFailedDataNotificationMsg(data, fnName, projectName);
    await sendTgGeneralMessage(errorMsg);
  }
}
