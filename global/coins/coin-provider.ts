// deno-lint-ignore-file no-explicit-any no-explicit-any no-explicit-any no-explicit-any no-explicit-any no-explicit-any
import { _ } from "https://cdn.skypack.dev/lodash";
import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
import { notifyAboutFailedFunction } from "../../functions/tg/notifications/failed-function.ts";

import type { SantimentId } from "../../models/coin/santiment-id.ts";
import type { CoinGeckoId } from "../../models/coin/coin-gecko-id.ts";
import { DColors } from "../../models/shared/colors.ts";
import { Coin } from "../../models/coin/coin.ts";
import { Status } from "../../models/shared/status.ts";
import { notifyAboutCoinsRefresh } from "../../functions/tg/notifications/coin-refresh.ts";
import { CoinOperator } from "./coin-operator.ts";
import { CoinsCollections } from "../../models/coin/coins-collections.ts";
import type { RefreshmentResult } from "../../models/mongodb/operations.ts";

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
} = await load();

export class CoinProvider {
  private static instance: CoinProvider;
  private readonly BYBIT_API_URL = BYBIT_PERP_TICKETS_URL;
  private readonly BINANCE_API_URL = BINANCE_PERP_TICKETS_URL;
  private readonly PROJECT = PROJECT_NAME;
  private readonly CLASS_NAME = "CoinProvider";
  private readonly COIN_GECKO_LIST = COIN_GECKO_LIST;
  private readonly COIN_GECKO_API_KEY = COIN_GECKO_API_KEY;
  private readonly COIN_GECKO_API = COIN_GECKO_API;
  private readonly LOWEST_TURNOVER24H = parseFloat(LOWEST_TURNOVER24H);
  private readonly SANTIMENT_API_URL = SANTIMENT_API_URL;
  private readonly SANTIMENT_API_KEY = SANTIMENT_API_KEY;

  private constructor() {}

  public static initializeInstance(): CoinProvider {
    if (!CoinProvider.instance) {
      CoinProvider.instance = new CoinProvider();
      // Additional async setup or initialization if needed
    }
    console.log("%cCoinProvider ---> initialized...", DColors.magenta);
    return CoinProvider.instance;
  }

  private rateLimitDelay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async fetchBybitData() {
    try {
      const response = await fetch(this.BYBIT_API_URL);
      if (!response.ok) {
        console.error(`Failed to fetch Bybit data. Status: ${response.status}`);
        return [];
      }
      const data = await response.json();

      if (data && data.result && data.result.list) {
        console.log(
          `%c${this.PROJECT}:${this.CLASS_NAME} ---> Bybit Data received...`,
          DColors.cyan
        );
        return data.result.list
          .filter(
            (item: any) =>
              parseFloat(item.turnover24h) > this.LOWEST_TURNOVER24H
          )
          .map((item: any) => ({
            symbol: item.symbol,
            exchange: "by",
            turnover24h: parseFloat(item.turnover24h),
          }));
      }
      console.warn("Bybit data format is unexpected.");
      return [];
    } catch (error) {
      console.error("Error fetching Bybit data:", error);
      await notifyAboutFailedFunction(
        this.PROJECT,
        this.CLASS_NAME,
        "fetchBybitData",
        error
      );
      return [];
    }
  }

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
        console.log(
          `%c${this.PROJECT}:${this.CLASS_NAME} ---> Binance Data received...`,
          DColors.magenta
        );
        return data
          .filter(
            (item: any) =>
              item.symbol.endsWith("USDT") &&
              parseFloat(item.quoteVolume) > this.LOWEST_TURNOVER24H
          )
          .map((item: any) => ({
            symbol: item.symbol,
            exchange: "bi",
            turnover24h: parseFloat(item.quoteVolume),
          }));
      }
      console.warn("Binance data format is unexpected.");
      return [];
    } catch (error) {
      console.error("Error fetching Binance data:", error);
      await notifyAboutFailedFunction(
        this.PROJECT,
        this.CLASS_NAME,
        "fetchBinanceData",
        error
      );
      return [];
    }
  }

  private mergeData(binanceData: any[], bybitData: any[]) {
    const mergedData: {
      [symbol: string]: Coin;
    } = {};

    // Add Binance data initially
    bybitData.forEach((item: Coin) => {
      mergedData[item.symbol] = {
        ...item,
        coinExchange: "by",
        status: Status.Undefined,
      }; // Add Binance data
    });

    // Add Bybit data, handling duplicates
    binanceData.forEach((item: Coin) => {
      if (mergedData[item.symbol]) {
        // If symbol already exists (from Binance), mark as "biby"
        mergedData[item.symbol] = {
          ...item,
          coinExchange: "biby",
          status: Status.Undefined,
        };
      } else {
        // Otherwise, add as Bybit data
        mergedData[item.symbol] = {
          ...item,
          coinExchange: "bi",
          status: Status.Undefined,
        };
      }
    });

    return Object.values(mergedData) || [];
  }

  private async sortOutUniqueCoins(coins: Coin[]) {
    const originCoins: Coin[] = await CoinOperator.getAllCoins(
      CoinsCollections.CoinRepo
    );
    console.log(
      `${this.PROJECT}:${this.CLASS_NAME} Origin Coins ---> `,
      originCoins.length
    );

    const blackListCoins: Coin[] = await CoinOperator.getAllCoins(
      CoinsCollections.CoinBlackList
    );

    const originSymbols = new Set(originCoins.map((coin: Coin) => coin.symbol));
    const blackListSymbols = new Set(
      blackListCoins.map((coin: Coin) => coin.symbol)
    );

    const sortedCoins = coins.filter(
      (item) =>
        !originSymbols.has(item.symbol) && !blackListSymbols.has(item.symbol)
    );
    return sortedCoins;
  }

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
      await notifyAboutFailedFunction(
        this.PROJECT,
        this.CLASS_NAME,
        "fetchCoinGeckoIds",
        error
      );
      return [];
    }
  }

  private async fetchSantimentIds() {
    const headers = {
      Authorization: `Basic ${this.SANTIMENT_API_KEY}`,
      "Content-Type": "application/json",
    };

    const query = `
        query {
          allProjects {
            slug
            name
            ticker     
          } 
    }`;

    try {
      const response = await fetch(this.SANTIMENT_API_URL, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        console.error(`Error: ${response.status} - ${response.statusText}`);
        const errorText = await response.text();
        await notifyAboutFailedFunction(
          this.PROJECT,
          this.CLASS_NAME,
          "fetchSantimentIds",
          errorText
        );
        console.error("Error details:", errorText);
        return [];
      }

      const data = await response.json();
      console.log(
        `%c${this.PROJECT}:${this.CLASS_NAME} ---> Santiment Data received successfully`,
        DColors.cyan
      );
      if (data.data.allProjects) {
        return data.data.allProjects as SantimentId[];
      }
      return [];
    } catch (error) {
      console.error("Request failed:", error);
      await notifyAboutFailedFunction(
        this.PROJECT,
        this.CLASS_NAME,
        "fetchSantimentIds",
        error
      );
      return [];
    }
  }

  private async assignCoinGeckoIds(coins: Coin[]) {
    //TODO;
    console.log(
      `%c${this.PROJECT}:${this.CLASS_NAME} ---> Unique Coins from CoinGecko `,
      DColors.magenta,
      coins.length
    );
    const coinGeckoIds: CoinGeckoId[] = await this.fetchCoinGeckoIds();

    const coinGeckoIdMap = new Map(
      coinGeckoIds.map((item) => [item.symbol.toLowerCase(), item.id])
    );

    coins.forEach((c) => {
      const modifiedSymbol = c.symbol.replace("USDT", "").toLowerCase();
      const coinGeckoId = coinGeckoIdMap.get(modifiedSymbol);
      if (coinGeckoId) {
        c.coinGeckoId = coinGeckoId;
        c.coinGeckoMissing = false;
      } else {
        c.coinGeckoMissing = true;
      }
    });

    return coins;
  }

  private async assignSantimentIds(coins: Coin[]): Promise<Coin[]> {
    if (!coins || coins.length === 0) return [];

    let santimentIds: SantimentId[] = [];

    try {
      // Fetch the Santiment IDs with error handling
      santimentIds = await this.fetchSantimentIds();
    } catch (error) {
      console.error("Failed to fetch Santiment IDs:", error);
      return coins; // Return original coins if fetching fails
    }

    // Create a map for efficient lookup
    const santimentIdMap = new Map(
      santimentIds.map((item) => [item.ticker, item])
    );

    // Iterate over each coin and assign Santiment ID data if available
    coins.forEach((coin) => {
      const modifiedSymbol = coin.symbol.replace("USDT", ""); // Remove "USDT" suffix
      const santimentItem = santimentIdMap.get(modifiedSymbol);

      if (santimentItem) {
        // Update coin with Santiment information if a match is found
        coin.santimentName = santimentItem.name;
        coin.santimentTicker = santimentItem.ticker;
        coin.slug = santimentItem.slug;
        coin.santimentMissing = false;
      } else {
        coin.santimentMissing = true;
      }
    });

    return coins;
  }

  private async enrichWithCoinGeckoData(coins: Coin[]): Promise<Coin[]> {
    for (const [index, coin] of coins.entries()) {
      await this.rateLimitDelay(2000);
      console.log(
        `${this.PROJECT}:${
          this.CLASS_NAME
        } ---> Enriching with CoinGecko Data ${index + 1} of ${coins.length}`
      );

      if (coin.coinGeckoId) {
        const url = `${this.COIN_GECKO_API}/coins/${coin.coinGeckoId}?x_cg_demo_api_key=${this.COIN_GECKO_API_KEY}`;

        try {
          const response = await fetch(url);

          // Check if the response is not okay
          if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
          }

          const data = await response.json();

          // Check if CoinGecko returned an error
          if (data.error) {
            throw new Error(data.error);
          }

          // Update coin data with CoinGecko response
          coin.market_cap_rank = data.market_cap_rank;
          coin.market_cap_fdv_ratio = data.market_cap_fdv_ratio;
          coin.facebook_likes = data.community_data?.facebook_likes;
          coin.twitter_followers = data.community_data?.twitter_followers;
          coin.reddit_subscribers = data.community_data?.reddit_subscribers;
          coin.telegram_channel_user_count =
            data.community_data?.telegram_channel_user_count;
          coin.gh_forks = data.developer_data?.forks;
          coin.gh_stars = data.developer_data?.stars;
          coin.gh_subscribers = data.developer_data?.subscribers;
          coin.gh_total_issues = data.developer_data?.total_issues;
          coin.gh_closed_issues = data.developer_data?.closed_issues;
          coin.gh_pull_requests_merged =
            data.developer_data?.pull_requests_merged;
          coin.gh_pull_request_contributors =
            data.developer_data?.pull_request_contributors;
          coin.gh_additions =
            data.developer_data?.code_additions_deletions_4_weeks.additions;
          coin.gh_deletions =
            data.developer_data?.code_additions_deletions_4_weeks.deletions;
          coin.gh_commit_count_4_weeks =
            data.developer_data?.commit_count_4_weeks;
          coin.image_url = data.image?.large;
        } catch (error) {
          // Log the error without stopping the loop
          console.error(`Error fetching data for ${coin.symbol}:`, error);
          await notifyAboutFailedFunction(
            this.PROJECT,
            this.CLASS_NAME,
            "enrichWithCoinGeckoData",
            (error as Error).message
          );
        }
      }
    }

    console.log(
      `%c${this.PROJECT}:${this.CLASS_NAME} UniqueCoins successfully enriched with CoinGecko & Santiment...`,
      DColors.yellow
    );

    return coins;
  }

  private async saveUniqueCoinsToDb(coins: Coin[]): Promise<RefreshmentResult> {
    const deleteResult = await CoinOperator.deleteCoins(
      CoinsCollections.CoinProvider
    );
    const insertResult = await CoinOperator.addCoins(
      CoinsCollections.CoinProvider,
      coins
    );
    console.log(
      `%c${this.PROJECT}:${this.CLASS_NAME} ---> Final Saving: Clean Db Res `,
      DColors.cyan,
      deleteResult
    );
    console.log(
      `%c${this.PROJECT}:${this.CLASS_NAME} ---> Final Saving: Insertion into Db Res `,
      DColors.green,
      insertResult
    );
    return { insertResult, deleteResult };
  }

  //----------------------------
  // ✅ REFRESHMENT PROCEDURE
  //----------------------------
  public async runRefreshmentPocedure(): Promise<RefreshmentResult> {
    try {
      let coins: Coin[] = [];
      const binanceData = await this.fetchBinanceData();
      const bybitData = await this.fetchBybitData();
      coins = this.mergeData(binanceData, bybitData);
      coins = await this.sortOutUniqueCoins(coins);
      coins = await this.assignCoinGeckoIds(coins);
      coins = await this.assignSantimentIds(coins);
      coins = await this.enrichWithCoinGeckoData(coins);
      coins = CoinOperator.assignCategories(coins, this.LOWEST_TURNOVER24H);
      coins = CoinOperator.assingLinks(coins);
      const result = await this.saveUniqueCoinsToDb(coins);
      await notifyAboutCoinsRefresh(this.PROJECT, this.CLASS_NAME, result);
      return result;
    } catch (error: any) {
      console.log(error);
      await notifyAboutFailedFunction(
        this.PROJECT,
        this.CLASS_NAME,
        "runRefreshmentPocedure",
        error
      );
      throw Error("CoinProvider:runRefreshmentProcedure --> Error ", error);
    }
  }
  // Function to schedule data refresh every three days
  public scheduleRefresh() {
    this.runRefreshmentPocedure().then(() => {
      setInterval(async () => {
        await this.runRefreshmentPocedure();
      }, 3 * 24 * 60 * 60 * 1000); // 3 days in milliseconds
    });
  }
}
