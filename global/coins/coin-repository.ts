// deno-lint-ignore-file no-explicit-any
import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
import type { Coin } from "../../models/coin/coin.ts";
import { sendTgGeneralMessage } from "../../functions/tg/send-general-tg-msg.ts";
import { formatFailedDataNotificationMsg } from "../../functions/tg/formatters/coin-msg/failed-data-notification.ts";

import { DColors } from "../../models/shared/colors.ts";
import { notifyAboutFailedFunction } from "../../functions/tg/notifications/failed-function.ts";
import { notifyAboutTurnover24hUpdateCompletion } from "../../functions/tg/notifications/turnover24h-update-complete.ts";
import { CoinOperator } from "./coin-operator.ts";
import { CoinsCollections } from "../../models/coin/coins-collections.ts";
import type { ModifyResult } from "../../models/mongodb/operations.ts";

const {
  PROJECT_NAME,
  BYBIT_FUTURES_KLINE,
  BINANCE_FUTURES_KLINE,
  LOWEST_TURNOVER24H,
} = await load();

type SuccessResult = {
  success: true;
  symbol: string;
  data: { symbol: string; turnover24h: number };
};

type FailureResult = {
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

export class CoinRepository {
  private readonly PROJECT_NAME = PROJECT_NAME;
  private readonly CLASS_NAME = "CoinRepository";
  private readonly BYBIT_FUTURES_KLINE = BYBIT_FUTURES_KLINE;
  private readonly BINANCE_FUTURES_KLINE = BINANCE_FUTURES_KLINE;
  private readonly LOWEST_TURNOVER24H = parseFloat(LOWEST_TURNOVER24H);
  private static instance: CoinRepository;

  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  public static initializeInstance(): CoinRepository {
    if (!CoinRepository.instance) {
      CoinRepository.instance = new CoinRepository();
      // Additional async setup or initialization if needed
    }
    console.log("%cCoinOperator ---> initialized...", DColors.cyan);
    return CoinRepository.instance;
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
    successfulData: SuccessResult[];
    failedData: FailureResult[];
  }> {
    // Execute all promises
    const results = await Promise.all(promises);

    // Separate successful and failed results
    const successfulData = results
      .filter((result) => result.success)
      .map((result) => ({
        symbol: result.symbol,
        data: result.data,
      })) as SuccessResult[];

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

  private updateCoinsTurnover24h(
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

  private updateCoinsCategories(coins: Coin[], LOWEST_TURNOVER24H: number) {
    coins = CoinOperator.assignCategories(coins, LOWEST_TURNOVER24H);
    return coins;
  }

  private async saveUpdates(coins: Coin[]): Promise<ModifyResult> {
    const updateData = coins.map((c) => {
      return {
        symbol: c.symbol,
        updatedData: {
          turnover24h: c.turnover24h,
          category: c.category,
        },
      };
    });
    const modifyResult = await CoinOperator.updateManyCoins(
      CoinsCollections.CoinRepo,
      updateData
    );
    return modifyResult;
  }

  private async runBinanceTurnover24hUpdate(
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
    coins = this.updateCoinsTurnover24h(coins, turnover24hData);
    coins = this.updateCoinsCategories(coins, this.LOWEST_TURNOVER24H);
    const modifyResult = await this.saveUpdates(coins);

    if (result.failedData.length > 0) {
      const symbols = result.failedData.map((d) => d.symbol);
      this.sendFailedDataNotification(
        this.PROJECT_NAME,
        this.CLASS_NAME,
        "runBinanceTurnover24hUpdate",
        symbols
      );
    }

    console.log(
      `%c${this.PROJECT_NAME}:${this.CLASS_NAME} ---> Binance Successfull Kline Fetch: ${result.successfulData.length}`,
      DColors.cyan
    );
    console.log(
      `%c${this.PROJECT_NAME}:${this.CLASS_NAME} ---> Binance Successfull Turnover24h Updates:}`,
      DColors.green,
      modifyResult
    );
    return modifyResult;
  }

  private async runBybitTurnover24hUpdate(
    coins: Coin[],
    interval: string,
    limit: number
  ) {
    const bybitPromises = this.createBybitKlinePromises(coins, interval, limit);
    const result = await this.runPromiseBatch(bybitPromises);
    const turnover24hData = this.getTurnover24Data(result.successfulData);
    coins = this.updateCoinsTurnover24h(coins, turnover24hData);
    coins = this.updateCoinsCategories(coins, this.LOWEST_TURNOVER24H);
    const modifyResult = await this.saveUpdates(coins);

    if (result.failedData.length > 0) {
      const symbols = result.failedData.map((d) => d.symbol);
      this.sendFailedDataNotification(
        this.PROJECT_NAME,
        this.CLASS_NAME,
        "runBybitTurnover24hUpdate",
        symbols
      );
    }

    console.log(
      `%c${this.PROJECT_NAME}:${this.CLASS_NAME} ---> Bybit Successfull Kline Fetch: ${result.successfulData.length}`,
      DColors.cyan
    );
    console.log(
      `%c${this.PROJECT_NAME}:${this.CLASS_NAME} ---> Bybit Successfull Turnover24h Updates:}`,
      DColors.green,
      modifyResult
    );
    return modifyResult;
  }

  private async runTurnover24hUpdatePocedure() {
    try {
      const coins = await CoinOperator.getAllCoins(CoinsCollections.CoinRepo);

      const binanceCoins = coins.filter((c) => c.coinExchange == "bi");
      const bybitCoins = coins.filter(
        (c) => c.coinExchange == "bу" || c.coinExchange == "biby"
      );

      const binanceModifyResult = await this.runBinanceTurnover24hUpdate(
        binanceCoins,
        "1d",
        1
      );
      const bybitModifyResult = await this.runBybitTurnover24hUpdate(
        bybitCoins,
        "D",
        1
      );
      console.log(
        "%cTurnover24h Update Procedure ---> successfully done...",
        DColors.magenta
      );
      await notifyAboutTurnover24hUpdateCompletion(
        this.PROJECT_NAME,
        bybitModifyResult,
        binanceModifyResult
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
  }

  // Function to schedule data refresh every three days
  public scheduleRefresh() {
    this.runTurnover24hUpdatePocedure().then(() => {
      setInterval(async () => {
        await this.runTurnover24hUpdatePocedure();
      }, 20 * 24 * 60 * 60 * 1000); // 3 days in milliseconds
    });
  }
}
