// deno-lint-ignore-file no-explicit-any no-explicit-any no-explicit-any
import { _ } from "https://cdn.skypack.dev/lodash";
import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
import {
  MongoClient,
  Collection,
  Bson,
} from "https://deno.land/x/mongo@v0.31.1/mod.ts";
import { notifyAboutFailedFunction } from "../../functions/tg/notifications/failed-function.ts";

import type { SantimentId } from "../../models/shared/santiment-id.ts";
import type { CoinGeckoId } from "../../models/shared/coin-gecko-id.ts";
import { DColors } from "../../models/shared/colors.ts";
import { Coin } from "./../../models/shared/coin.ts";
import { Status } from "../../models/shared/status.ts";
import { designateCategories } from "./shared/designate-categories.ts";
import { notifyAboutCoinsRefresh } from "../../functions/tg/notifications/coin-refresh.ts";
import { designateLinks } from "./shared/designate-links.ts";
import { fetchCoinsBlackList } from "../../functions/kv-db/black-list/fetch-coins-black-list.ts";
import { addCoinToBlackList } from "../../functions/kv-db/black-list/add-coin-to-black-list.ts";
import { deleteCoinArrayFromBlackList } from "../../functions/kv-db/black-list/delete-coin-array-from-black-list.ts";
import { deleteCoinFromBlackList } from "../../functions/kv-db/black-list/delete-coin-from-black-list.ts";
import { addCoinArrayToBlackList } from "../../functions/kv-db/black-list/add-coin-array-to-black-list.ts";
import { saveCoinArrayToCoinGeckoMissing } from "../../functions/kv-db/coin-gecko/save-coin-array-to-coin-gecko-missing.ts";
import { fetchCoinGeckoMissingCoins } from "../../functions/kv-db/coin-gecko/fetch-coin-gecko-missing-coins.ts";
import { deleteAllFromCoinGeckoMissing } from "../../functions/kv-db/coin-gecko/delete-all-from-coin-gecko-missing.ts";
import { saveCoinArrayToSantimentMissing } from "../../functions/kv-db/santiment/save-coin-array-to-santiment-missing.ts";
import { fetchSantimentMissingCoins } from "../../functions/kv-db/santiment/fetch-santiment-missing-coins.ts";
import { deleteAllFromSantimentMissing } from "../../functions/kv-db/santiment/delete-all-from-santiment-missing.ts";
import type {
  InsertResult,
  DeleteResult,
} from "../../models/mongodb/operations.ts";

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
  MONGO_DB,
} = await load();

export class CoinProvider {
  private static instance: CoinProvider;
  private uniqueCoins: Map<string, Coin> = new Map();
  private static dbClient: MongoClient;
  private static providerCollection: Collection<Coin>;
  private static basicCollection: Collection<Coin>;

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
  private static MONGO_DB = MONGO_DB;

  private constructor(coins: Coin[]) {
    this.uniqueCoins = new Map(coins.map((coin) => [coin.symbol, coin]));
  }

  // #region UTIL FUNCTIONS
  public static async initializeFromDb(): Promise<void> {
    if (!CoinProvider.instance) {
      this.dbClient = new MongoClient();
      await this.dbClient.connect(this.MONGO_DB);
      const db = this.dbClient.database("general");
      this.providerCollection = db.collection<Coin>("coin-provider");
      this.basicCollection = db.collection<Coin>("coins");
      const providerCoins = await this.fetchCoinsFromDb();
      CoinProvider.instance = new CoinProvider(providerCoins);
      console.log(
        `%c${PROJECT_NAME}:CoinProvider ---> initialized...`,
        DColors.yellow
      );
    }
  }

  public static getInstance(): CoinProvider {
    if (!CoinProvider.instance) {
      throw new Error("CoinProvider has not been initialized yet.");
    }
    return CoinProvider.instance;
  }

  private async refreshRepository(): Promise<void> {
    this.uniqueCoins.clear();
    const coins = await CoinProvider.fetchCoinsFromDb();
    this.uniqueCoins = new Map(coins.map((coin) => [coin.symbol, coin]));
    //TODO
    console.log("%cCoinProvider:refreshRepository() --> done", DColors.magenta);
  }

  private rateLimitDelay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private assignCategories(coins: Coin[], lowestTurnover24h: number) {
    return designateCategories(coins, lowestTurnover24h);
  }

  private assignLinks(coins: Coin[]) {
    coins = designateLinks(coins);
    return coins;
  }

  public getAllCoins(): Coin[] {
    return Array.from(this.uniqueCoins.values()).sort((a, b) =>
      a.symbol.localeCompare(b.symbol)
    );
  }
  // #endregion

  //#region MONGO DB OPERATIONS
  private static async fetchCoinsFromDb(): Promise<Coin[]> {
    try {
      // Attempt to fetch all coins from the database
      return await this.providerCollection.find({}).toArray();
    } catch (error) {
      console.error("Failed to fetch coins from the database:", error);

      await notifyAboutFailedFunction(
        "D-WS",
        "CoinProvider",
        "fetchCoinsFromDb",
        error
      );

      return [];
    }
  }

  private static async fetchOriginCoinsFromDb(): Promise<Coin[]> {
    try {
      // Attempt to fetch all coins from the database
      return await this.basicCollection.find({}).toArray();
    } catch (error) {
      console.error("Failed to fetch coins from the database:", error);

      await notifyAboutFailedFunction(
        "D-WS",
        "CoinProvider",
        "fetchBasicCoinsFromDb",
        error
      );

      return [];
    }
  }

  public async addCoinToDb(newCoin: Coin): Promise<InsertResult> {
    try {
      const res = (await CoinProvider.providerCollection.insertOne(
        newCoin
      )) as Bson.ObjectId | null;

      if (res) {
        this.refreshRepository();
        return {
          inserted: true,
          insertedCount: 1,
        } as InsertResult;
      }

      return { inserted: false, insertedCount: 0 };
    } catch (error) {
      console.error("Failed to add coin to database:", error);
      await notifyAboutFailedFunction(
        this.PROJECT,
        this.CLASS_NAME,
        "addCoinToDb",
        error
      );
      return { inserted: false, insertedCount: 0 };
    }
  }

  public async addCoinArrayToDb(coins: Coin[]): Promise<InsertResult> {
    try {
      const res = await CoinProvider.providerCollection.insertMany(coins);
      const insertedIds = Object.values(res.insertedIds).map((id) =>
        (id as Bson.ObjectId).toString()
      );
      this.refreshRepository();
      return { inserted: true, insertedCount: insertedIds.length };
    } catch (error) {
      console.error("Failed to insert coins:", error);
      await notifyAboutFailedFunction(
        this.PROJECT,
        this.CLASS_NAME,
        "addCoinArrayToDb",
        error
      );
      return { inserted: false, insertedCount: 0 };
    }
  }

  public async addCoinsToCoinsColl(coins: Coin[]): Promise<InsertResult> {
    try {
      const res = await CoinProvider.basicCollection.insertMany(coins);
      const insertedIds = Object.values(res.insertedIds).map((id) =>
        (id as Bson.ObjectId).toString()
      );
      const insertResult = {
        inserted: true,
        insertedCount: insertedIds.length,
      };

      console.log("---- LOGGING ----");
      console.log(
        "%cCoinProvider:addCoinsToCoinsColl() insertion result",
        DColors.yellow,
        insertResult
      );
      return {
        inserted: true,
        insertedCount: insertedIds.length,
      } as InsertResult;
    } catch (error) {
      console.error("Failed to insert coins:", error);
      await notifyAboutFailedFunction(
        this.PROJECT,
        this.CLASS_NAME,
        "addCoinArrayToDb",
        error
      );
      return { inserted: false, insertedCount: 0 } as InsertResult;
    }
  }

  public async deleteCoinFromDb(symbol: string): Promise<DeleteResult> {
    try {
      const deletedCount = await CoinProvider.providerCollection.deleteOne({
        symbol,
      });
      await this.refreshRepository();

      const deleteResult: DeleteResult = {
        deleted: deletedCount > 0 ? true : false,
        deletedCount: deletedCount,
      };
      return deleteResult;
    } catch (error) {
      console.error("Error in deleteCoinFromDb:", error);

      await notifyAboutFailedFunction(
        this.PROJECT,
        this.CLASS_NAME,
        "deleteCoinFromDb",
        error
      );
      return { deleted: false, deletedCount: 0 } as DeleteResult;
    }
  }

  public async deleteAllCoinsFromDb(): Promise<DeleteResult> {
    try {
      const deletedCount = (await CoinProvider.providerCollection.deleteMany(
        {}
      )) as number;

      if (deletedCount > 0) {
        this.refreshRepository();
      }
      return { deleted: false, deletedCount: 0 } as DeleteResult;
    } catch (error) {
      // Log the error message (you can use a logging library if preferred)
      console.error("Failed to delete coins from database:", error);
      await notifyAboutFailedFunction(
        this.PROJECT,
        this.CLASS_NAME,
        "deleteAllCoinsFromDb",
        error
      );
      // Return a consistent failure response
      return { deleted: false, deletedCount: 0 };
    }
  }

  public async deleteCoinArrayFromDb(symbols: string[]): Promise<DeleteResult> {
    try {
      // Delete multiple documents based on an array of symbols
      const deletedCount = await CoinProvider.providerCollection.deleteMany({
        symbol: { $in: symbols },
      });

      // Check if any documents were deleted
      console.log("%c---- LOGGING ----", DColors.cyan);
      console.log("CoinProivder: deleteCoinArrayFromDb()");
      console.log("%cSymbols To Delete: ", DColors.cyan, symbols);
      console.log("%cDeleted Count: ", DColors.cyan, deletedCount);
      //console.log("%cReturned Coins: ", DColors.cyan, symbols.length);
      const deleteResult: DeleteResult = {
        deleted: deletedCount > 0 ? true : false,
        deletedCount: deletedCount,
      };
      if (deletedCount && deletedCount > 0) {
        await this.refreshRepository();
      }
      return deleteResult;
    } catch (error) {
      await notifyAboutFailedFunction(
        this.PROJECT,
        this.CLASS_NAME,
        "deleteCoinArrayFromDb",
        error
      );
      console.error("Failed to delete coins:", error);
      return { deleted: false, deletedCount: 0 };
    }
  }
  // #endregion

  // #region COIN GECKO
  private async saveCoinArrayToCoinGeckoMissing(coins: Coin[]) {
    try {
      await saveCoinArrayToCoinGeckoMissing(coins);
    } catch (error) {
      console.error("Failed to save CoinGecko missing coins:", error);
      await notifyAboutFailedFunction(
        this.PROJECT,
        this.CLASS_NAME,
        "saveCoinArrayToCoinGeckoMissing",
        error
      );
    }
  }

  public async fetchCoinGeckoMissingCoins() {
    try {
      return await fetchCoinGeckoMissingCoins();
    } catch (error) {
      console.error("Failed to fetch CoinGeckoMissing coins:", error);
      await notifyAboutFailedFunction(
        this.PROJECT,
        this.CLASS_NAME,
        "fetchCoinGeckoMissing",
        error
      );
    }
  }

  public async deleteAllFromCoinGeckoMissing() {
    try {
      const res = await deleteAllFromCoinGeckoMissing();
      return res;
    } catch (error) {
      console.log(error);
      await notifyAboutFailedFunction(
        this.PROJECT,
        this.CLASS_NAME,
        "deleteAllFromCoinGeckoMissing",
        error
      );
    }
  }

  // #endregion

  // #region SANTIMENT
  private async saveCoinArrayToSantimentMissing(coins: Coin[]) {
    try {
      await saveCoinArrayToSantimentMissing(coins);
    } catch (error) {
      console.error("Failed to save Santiment missing coins:", error);
      await notifyAboutFailedFunction(
        this.PROJECT,
        this.CLASS_NAME,
        "saveSantimentMissing",
        error
      );
    }
  }

  public async fetchSantimentMissingCoins() {
    try {
      return await fetchSantimentMissingCoins();
    } catch (error) {
      console.error("Failed to fetch SantimentMissing coins:", error);
      await notifyAboutFailedFunction(
        this.PROJECT,
        this.CLASS_NAME,
        "fetchSantimentMissing",
        error
      );
    }
  }

  public async deleteAllFromSantimentMissing() {
    try {
      await deleteAllFromSantimentMissing();
    } catch (error) {
      console.log(error);
      await notifyAboutFailedFunction(
        this.PROJECT,
        this.CLASS_NAME,
        "deleteAllFromSantimentMissing",
        error
      );
    }
  }

  // #endregion

  // #region BLACK LIST
  public async getCoinsBlackList() {
    try {
      const coins = await fetchCoinsBlackList();
      return coins;
    } catch (error) {
      console.error("Failed to save CoinGecko missing coins:", error);
      await notifyAboutFailedFunction(
        this.PROJECT,
        this.CLASS_NAME,
        "fetchCoinBlackList",
        error
      );
      return [];
    }
  }

  public async addCoinToBlackList(coin: Coin) {
    try {
      await addCoinToBlackList(coin);
      await this.deleteCoinFromDb(coin.symbol);
    } catch (error) {
      console.log(error);
      await notifyAboutFailedFunction(
        this.PROJECT,
        this.CLASS_NAME,
        "addCoinToBlackList",
        error
      );
    }
  }

  public async addCoinArrayToBlackList(coins: Coin[]) {
    try {
      const insertionResult = await addCoinArrayToBlackList(coins);
      const symbols = coins.map((c) => c.symbol);
      const deletionResult = await this.deleteCoinArrayFromDb(symbols);
      return { insertionResult, deletionResult };
    } catch (error) {
      console.log(error);
      await notifyAboutFailedFunction(
        this.PROJECT,
        this.CLASS_NAME,
        "addCoinArrayToBlackList",
        error
      );
    }
  }

  public async deleteCoinFromBlackList(symbol: string) {
    try {
      const result = await deleteCoinFromBlackList(symbol);
      return result;
    } catch (error) {
      console.log(error);
      await notifyAboutFailedFunction(
        this.PROJECT,
        this.CLASS_NAME,
        "deleteCoinFromBlackList",
        error
      );
    }
  }

  public async deleteCoinArrayFromBlackList(symbols: string[]) {
    try {
      const result = await deleteCoinArrayFromBlackList(symbols);
      return result;
    } catch (error) {
      console.log(error);
      await notifyAboutFailedFunction(
        this.PROJECT,
        this.CLASS_NAME,
        "deleteCoinsFromBlackList",
        error
      );
    }
  }

  // #endregion

  // #region PROCEDURE FUNCTIONS

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
    const originCoins: Coin[] = await CoinProvider.fetchOriginCoinsFromDb();
    console.log(
      `${this.PROJECT}:${this.CLASS_NAME} Origin Coins ---> `,
      originCoins.length
    );
    const blackListCoins: Coin[] = await this.getCoinsBlackList();

    const originSymbols = new Set(originCoins.map((coin: Coin) => coin.symbol));
    const blackListSymbols = new Set(
      blackListCoins.map((coin: Coin) => coin.symbol)
    );

    const sortedCoins = coins.filter(
      (item) =>
        !originSymbols.has(item.symbol) && !blackListSymbols.has(item.symbol)
    );
    //TODO
    console.log(
      `%c${this.PROJECT}:${this.CLASS_NAME} ---> SORTED COINS done `,
      DColors.cyan,
      sortedCoins.length
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
    const coinGeckoMissing: Coin[] = [];
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
        coinGeckoMissing.push(c);
      }
    });

    await this.deleteAllFromCoinGeckoMissing();
    await this.saveCoinArrayToCoinGeckoMissing(coinGeckoMissing);
    console.log(
      `%c${this.PROJECT}:${this.CLASS_NAME} ---> CoinGecko Missing `,
      DColors.white,
      coinGeckoMissing.map((c) => c.symbol)
    );
    return coins;
  }

  private async assignSantimentIds(coins: Coin[]): Promise<Coin[]> {
    if (!coins || coins.length === 0) return [];

    const santimentMissing: Coin[] = [];
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
        // Add to missing list if no match is found
        santimentMissing.push(coin);
        coin.santimentMissing = true;
      }
    });

    // Log missing Santiment entries
    if (santimentMissing.length > 0) {
      console.log(
        `%c${this.PROJECT}:${this.CLASS_NAME} ---> Santiment Missing `,
        DColors.green,
        santimentMissing.map((s) => s.symbol)
      );
    }

    // Attempt to save missing entries with error handling
    try {
      await this.deleteAllFromSantimentMissing();
      await this.saveCoinArrayToSantimentMissing(santimentMissing);
    } catch (error) {
      console.error("Failed to save missing Santiment data:", error);
      return coins;
    }

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

  private async saveUniqueCoinsToDb(coins: Coin[]) {
    const deletedRes = await this.deleteAllCoinsFromDb();
    const addedRes = await this.addCoinArrayToDb(coins);
    await this.refreshRepository();
    console.log(
      `%c${this.PROJECT}:${this.CLASS_NAME} ---> Final Saving: Clean Db Res `,
      DColors.cyan,
      deletedRes
    );
    console.log(
      `%c${this.PROJECT}:${this.CLASS_NAME} ---> Final Saving: Insertion into Db Res `,
      DColors.green,
      addedRes
    );
  }
  // #endregion

  // #region BUSINESS LOGIC
  public async moveSelectionToCoins(coins: Coin[]) {
    try {
      const symbols = coins.map((c) => c.symbol);
      const insertionResult = await this.addCoinsToCoinsColl(coins);
      const deletionResult = await this.deleteCoinArrayFromDb(symbols);
      await this.refreshRepository();
      const originCoins = Object.values(this.uniqueCoins.values);
      console.log("---- LOGGING ----");
      console.log(
        "%cCoinProvider:moveSelectionToCoins coins after moving",
        DColors.cyan,
        originCoins.length
      );
      return { insertionResult, deletionResult };
    } catch (error) {
      await notifyAboutFailedFunction(
        this.PROJECT,
        this.CLASS_NAME,
        "moveSelectionToCoins",
        error
      );
      return [];
    }
  }
  // #endregion

  //----------------------------
  // ✅ REFRESHMENT PROCEDURE
  //----------------------------
  public async runRefreshmentPocedure() {
    try {
      let coins: Coin[] = [];
      const binanceData = await this.fetchBinanceData();
      const bybitData = await this.fetchBybitData();
      coins = this.mergeData(binanceData, bybitData);
      coins = await this.sortOutUniqueCoins(coins);
      coins = await this.assignCoinGeckoIds(coins);
      coins = await this.assignSantimentIds(coins);
      coins = await this.enrichWithCoinGeckoData(coins);
      coins = this.assignCategories(coins, this.LOWEST_TURNOVER24H);
      coins = this.assignLinks(coins);
      await this.saveUniqueCoinsToDb(coins);
      await notifyAboutCoinsRefresh(this.PROJECT, this.CLASS_NAME, "");
      return { finish: true };
    } catch (error) {
      console.log(error);
      await notifyAboutFailedFunction(
        this.PROJECT,
        this.CLASS_NAME,
        "runRefreshmentPocedure",
        error
      );
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
