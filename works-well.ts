// deno-lint-ignore-file no-explicit-any
import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
import { notifyAboutCoinsRefresh } from "./functions/tg/notifications/coin-refresh.ts";
import { CoinRepository } from "./global/coins/coin-repository.ts";
import type { Coin } from "./models/shared/coin.ts";

const {
  BYBIT_PERP_TICKETS_URL,
  BINANCE_PERP_TICKETS_URL,
  PROJECT_NAME,
  COIN_GECKO_LIST,
  COIN_GECKO_API_KEY,
  COIN_GECKO_API,
} = await load();

export class CoinRefresh {
  private static instance: CoinRefresh;
  private uniqueCoins: Map<string, Coin> = new Map();
  private readonly BYBIT_API_URL = BYBIT_PERP_TICKETS_URL;
  private readonly BINANCE_API_URL = BINANCE_PERP_TICKETS_URL;
  private readonly PROJECT = PROJECT_NAME;
  private readonly COIN_GECKO_LIST = COIN_GECKO_LIST;
  private readonly COIN_GECKO_API_KEY = COIN_GECKO_API_KEY;
  private readonly COIN_GECKO_API = COIN_GECKO_API;
  // Private constructor for singleton pattern
  private constructor() {}

  // Singleton instance getter
  public static getInstance(): CoinRefresh {
    if (!CoinRefresh.instance) {
      CoinRefresh.instance = new CoinRefresh();
    }
    return CoinRefresh.instance;
  }

  // Function to assign a category based on turnover24h
  private assignCategory(turnover24h: number): string {
    if (turnover24h > 200 * 1000 * 1000) return "I";
    if (turnover24h >= 100 * 1000 * 1000) return "II";
    if (turnover24h >= 50 * 1000 * 1000) return "III";
    if (turnover24h >= 10 * 1000 * 1000) return "IV";
    return "V";
  }

  // Function to fetch Bybit data with error handling
  private async fetchBybitData() {
    try {
      const response = await fetch(this.BYBIT_API_URL);
      if (!response.ok) {
        console.error(`Failed to fetch Bybit data. Status: ${response.status}`);
        return [];
      }
      const data = await response.json();

      if (data && data.result && data.result.list) {
        return data.result.list
          .filter((item: any) => parseFloat(item.turnover24h) > 5000000)
          .map((item: any) => ({
            symbol: item.symbol,
            exchange: "by",
            turnover24h: parseFloat(item.turnover24h),
            category: this.assignCategory(parseFloat(item.turnover24h)),
          }));
      }
      console.warn("Bybit data format is unexpected.");
      return [];
    } catch (error) {
      console.error("Error fetching Bybit data:", error);
      return [];
    }
  }

  // Function to fetch Binance data with error handling
  private async fetchBinanceData() {
    try {
      const response = await fetch(this.BINANCE_API_URL);
      if (!response.ok) {
        console.error(
          `Failed to fetch Binance data. Status: ${response.status}`
        );
        return [];
      }
      const data = await response.json();

      if (Array.isArray(data)) {
        return data
          .filter(
            (item: any) =>
              item.symbol.endsWith("USDT") &&
              parseFloat(item.quoteVolume) > 5000000
          )
          .map((item: any) => ({
            symbol: item.symbol,
            exchange: "bi",
            turnover24h: parseFloat(item.quoteVolume),
            category: this.assignCategory(parseFloat(item.quoteVolume)),
          }));
      }
      console.warn("Binance data format is unexpected.");
      return [];
    } catch (error) {
      console.error("Error fetching Binance data:", error);
      return [];
    }
  }

  // Function to fetch and merge data
  private mergeData(binanceData: any[], bybitData: any[]) {
    const mergedData: {
      [symbol: string]: {
        symbol: string;
        exchange: string;
        turnover24h: number;
        category: string;
      };
    } = {};

    // Add Binance data initially
    bybitData.forEach((item: any) => {
      mergedData[item.symbol] = item; // Add Binance data
    });

    // Add Bybit data, handling duplicates
    binanceData.forEach((item: any) => {
      if (mergedData[item.symbol]) {
        // If symbol already exists (from Binance), mark as "biby"
        mergedData[item.symbol] = { ...item, exchange: "biby" };
      } else {
        // Otherwise, add as Bybit data
        mergedData[item.symbol] = item;
      }
    });

    // Convert mergedData back to an array format
    return Object.values(mergedData);
  }

  // Function to get unique coins compared to origin coins
  private getUniqueCoins(mergedData: any[]) {
    // Initialize CoinRepository and get origin coins
    const coinRepo = CoinRepository.getInstance();
    const originCoins = coinRepo.getAllCoins();

    // Create a Set of origin coin symbols for efficient lookup
    const originSymbols = new Set(originCoins.map((coin: any) => coin.symbol));

    // Filter mergedData to find coins not in originCoins
    const uniqueCoins = mergedData.filter(
      (item) => !originSymbols.has(item.symbol)
    );

    // Store unique items in the Map structure
    uniqueCoins.forEach((item) => {
      this.uniqueCoins.set(item.symbol, item);
    });

    return uniqueCoins;
  }

  // Fetch CoinGecko data to get coin IDs for unique coins
  private async fetchCoinGeckoIds() {
    try {
      const response = await fetch(this.COIN_GECKO_LIST);
      if (!response.ok) {
        console.error(
          `Failed to fetch CoinGecko data. Status: ${response.status}`
        );
        return [];
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching CoinGecko data:", error);
      return [];
    }
  }

  private assignCoinGeckoIds(
    coins: Coin[],
    coinGeckoIds: { id: string; name: string; symbol: string }[]
  ) {
    const coinGeckoIdMap = new Map(
      coinGeckoIds.map((item) => [item.symbol.toLowerCase(), item.id])
    );

    coins.forEach((c) => {
      const modifiedSymbol = c.symbol.replace("USDT", "").toLowerCase();
      const coinGeckoId = coinGeckoIdMap.get(modifiedSymbol);
      if (coinGeckoId) {
        c.coinGeckoId = coinGeckoId;
      }
    });
    return coins;
  }

  private async runRefreshmentPocedure() {
    const binanceData = await this.fetchBinanceData();
    const bybitData = await this.fetchBybitData();

    const mergedData = this.mergeData(binanceData, bybitData);
    let uniqueCoins = this.getUniqueCoins(mergedData);
    const coinGeckoIds = await this.fetchCoinGeckoIds();
    uniqueCoins = this.assignCoinGeckoIds(uniqueCoins, coinGeckoIds);

    // Store unique items in the Map structure
    uniqueCoins.forEach((item) => {
      this.uniqueCoins.set(item.symbol, item);
    });
    console.log(this.uniqueCoins);
  }
  // Function to schedule data refresh every three days
  public scheduleRefresh() {
    // Run the refresh once initially
    this.runRefreshmentPocedure().then(() => {
      // Set the interval to run the refresh every three days
      setInterval(async () => {
        await this.runRefreshmentPocedure();
      }, 3 * 24 * 60 * 60 * 1000); // 3 days in milliseconds
    });
  }
}

await CoinRepository.initializeFromDb();

const coinRefresh = CoinRefresh.getInstance();
coinRefresh.scheduleRefresh();
