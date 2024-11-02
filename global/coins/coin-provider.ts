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
import { CoinRepository } from "./coin-repository.ts";
import { Exchange } from "../../models/shared/exchange.ts";
import { SpaceNames } from "../../models/shared/space-names.ts";
import { Status } from "../../models/shared/status.ts";

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
  private static collection: Collection<Coin>;
  private static readonly dbName = "general";
  private static readonly collectionName = "coin-provider";

  private readonly BYBIT_API_URL = BYBIT_PERP_TICKETS_URL;
  private readonly BINANCE_API_URL = BINANCE_PERP_TICKETS_URL;
  private readonly PROJECT = PROJECT_NAME;
  private readonly CLASS_NAME = "CoinProvider";
  private readonly COIN_GECKO_LIST = COIN_GECKO_LIST;
  private readonly COIN_GECKO_API_KEY = COIN_GECKO_API_KEY;
  private readonly COIN_GECKO_API = COIN_GECKO_API;
  private readonly LOWEST_TURNOVER24H = LOWEST_TURNOVER24H;
  private readonly SANTIMENT_API_URL = SANTIMENT_API_URL;
  private readonly SANTIMENT_API_KEY = SANTIMENT_API_KEY;
  private static MONGO_DB = MONGO_DB;

  private constructor(coins: Coin[]) {
    this.uniqueCoins = new Map(coins.map((coin) => [coin.symbol, coin]));
  }

  // ✴️ #region UTIL FUNCTIONS
  public static async initializeFromDb(): Promise<void> {
    if (!CoinProvider.instance) {
      this.dbClient = new MongoClient();
      await this.dbClient.connect(this.MONGO_DB);
      const db = this.dbClient.database(this.dbName);
      this.collection = db.collection<Coin>(this.collectionName);
      const coins = await this.fetchCoinsFromDb();
      CoinProvider.instance = new CoinProvider(coins);
      console.log("%cCoinProvder ---> initialized...", DColors.yellow);
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
  }

  private rateLimitDelay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private assignCategory(coins: Coin[]) {
    coins.forEach((c) => {
      if (c.turnover24h > 200 * 1000 * 1000) {
        c.category = "I";
      } else if (c.turnover24h >= 100 * 1000 * 1000) {
        c.category = "II";
      } else if (c.turnover24h >= 50 * 1000 * 1000) {
        c.category = "III";
      } else if (c.turnover24h >= 10 * 1000 * 1000) {
        c.category = "IV";
      } else if (c.turnover24h >= 5 * 1000 * 1000) {
        c.category = "V";
      } else if (c.turnover24h >= parseFloat(this.LOWEST_TURNOVER24H)) {
        c.category = "VI";
      }
    });
    return coins;
  }

  private assignLinks(coins: Coin[]) {
    coins.forEach((c) => {
      // Set tvLink based on the exchange type
      c.tvLink =
        c.coinExchange == "by" || c.coinExchange == "biby"
          ? `https://www.tradingview.com/chart?symbol=BYBIT:${c.symbol}.P`
          : `https://www.tradingview.com/chart?symbol=BINANCE:${c.symbol}.P`;

      // Set cgLink based on the exchange type
      c.cgLink =
        c.coinExchange == "bi" || c.coinExchange == "biby"
          ? `https://www.coinglass.com/tv/Binance_${c.symbol}`
          : `https://www.coinglass.com/tv/Bybit_${c.symbol}`;

      // Set exchange-specific links
      switch (c.coinExchange) {
        case "by":
          c.bybitExch = `https://www.bybit.com/trade/usdt/${c.symbol}`;
          break;
        case "bi":
          c.binanceExch = `https://www.binance.com/en/futures/${c.symbol}`;
          break;
        case "biby":
          c.bybitExch = `https://www.bybit.com/trade/usdt/${c.symbol}`;
          c.binanceExch = `https://www.binance.com/en/futures/${c.symbol}`;
          break;
      }
    });
    return coins;
  }

  // #endregion

  // ✴️ #region MONGO DB OPERATIONS
  private static async fetchCoinsFromDb(): Promise<Coin[]> {
    try {
      // Attempt to fetch all coins from the database
      return await this.collection.find({}).toArray();
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

  public async addCoinToDb(
    newCoin: Coin
  ): Promise<{ inserted: boolean; insertedId?: string }> {
    try {
      // Attempt to insert the new coin into the database
      const res = (await CoinProvider.collection.insertOne(
        newCoin
      )) as Bson.ObjectId | null;

      // Check if the coin was successfully inserted
      if (res) {
        return {
          inserted: true,
          insertedId: (res as Bson.ObjectId).toString(),
        };
      }

      // If the insertion failed, return a failure response
      return { inserted: false };
    } catch (error) {
      // Log the error message (you can use a logging library here if preferred)
      console.error("Failed to add coin to database:", error);
      await notifyAboutFailedFunction(
        this.PROJECT,
        this.CLASS_NAME,
        "addCoinToDb",
        error
      );
      // Return a failure response
      return { inserted: false };
    }
  }

  public async addCoinsToDb(
    coins: Coin[]
  ): Promise<{ inserted: boolean; insertedCount?: number }> {
    try {
      // Insert multiple documents using insertMany
      const res = await CoinProvider.collection.insertMany(coins);
      // Convert insertedIds from the returned object to an array
      const insertedIds = Object.values(res.insertedIds).map((id) =>
        (id as Bson.ObjectId).toString()
      );

      return { inserted: true, insertedCount: insertedIds.length };
    } catch (error) {
      console.error("Failed to insert coins:", error);
      await notifyAboutFailedFunction(
        this.PROJECT,
        this.CLASS_NAME,
        "addCoinsToDb",
        error
      );
      return { inserted: false };
    }
  }

  public async deleteAllCoinsFromDb(): Promise<{
    deleted: boolean;
    deletedCount?: number;
  }> {
    try {
      // Attempt to delete the coin with the specified symbol
      const deletedCount = (await CoinProvider.collection.deleteMany(
        {}
      )) as number;

      // Check if any document was deleted
      if (deletedCount > 0) {
        return { deleted: true, deletedCount };
      }

      // If no documents were deleted, return a failure response
      return { deleted: false };
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
      return { deleted: false };
    }
  }

  public async deleteCoinsFromDb(
    symbols: string[]
  ): Promise<{ deleted: boolean; deletedCount?: number }> {
    try {
      // Delete multiple documents based on an array of symbols
      const deletedCount = await CoinProvider.collection.deleteMany({
        symbol: { $in: symbols },
      });

      // Check if any documents were deleted
      if (deletedCount && deletedCount > 0) {
        return { deleted: true, deletedCount };
      }
    } catch (error) {
      await notifyAboutFailedFunction(
        this.PROJECT,
        this.CLASS_NAME,
        "deleteCoinsFromDb",
        error
      );
      console.error("Failed to delete coins:", error);
    }

    return { deleted: false };
  }
  // #endregion

  // ✴️#region KVDB
  private async saveCoinGeckoMissing(coins: Coin[]) {
    try {
      const kv = await Deno.openKv();
      for (const coin of coins) {
        await kv.set([SpaceNames.CoinGeckoMissing, coin.symbol], coin);
      }
      kv.close();
    } catch (error) {
      console.error("Failed to save CoinGecko missing coins:", error);
      await notifyAboutFailedFunction(
        this.PROJECT,
        this.CLASS_NAME,
        "saveCoinGeckoMissing",
        error
      );
    }
  }

  private async saveSantimentMissing(coins: Coin[]) {
    try {
      const kv = await Deno.openKv();
      for (const coin of coins) {
        await kv.set([SpaceNames.SantimentMissing, coin.symbol], coin);
      }
      kv.close();
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

  public async fetchCoinGeckoMissing() {
    try {
      let coins: Coin[] = [];
      const kv = await Deno.openKv();
      const iter = kv.list({ prefix: [SpaceNames.CoinGeckoMissing] });

      for await (const entry of iter) {
        coins.push(entry.value as Coin);
      }
      coins = _.orderBy(coins, "symbol", "asc");
      kv.close();
      return coins;
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

  public async fetchSantimentMissing() {
    try {
      let coins: Coin[] = [];
      const kv = await Deno.openKv();
      const iter = kv.list({ prefix: [SpaceNames.SantimentMissing] });

      for await (const entry of iter) {
        coins.push(entry.value as Coin);
      }
      coins = _.orderBy(coins, "symbol", "asc");
      kv.close();
      return coins;
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

  public async fetchCoinBlackList() {
    try {
      let coins: Coin[] = [];
      const kv = await Deno.openKv();
      const iter = kv.list({ prefix: [SpaceNames.CoinBlackList] });

      for await (const entry of iter) {
        coins.push(entry.value as Coin);
      }
      coins = _.orderBy(coins, "symbol", "asc");
      kv.close();
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
      const kv = await Deno.openKv();
      const res = await kv.set([SpaceNames.CoinBlackList, coin.symbol], coin);
      await kv.close();
      return res;
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

  public async deleteCoinFromBlackList(symbol: string) {
    try {
      const kv = await Deno.openKv();
      await kv.delete([SpaceNames.CoinBlackList, symbol]);
      await kv.close();
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

  public async deleteAllFromCoinGeckoMissing() {
    try {
      const prefix = SpaceNames.CoinGeckoMissing;
      let counter = 0;
      const kv = await Deno.openKv();
      const prefixKey = [SpaceNames.CoinGeckoMissing];
      const iter = kv.list({ prefix: prefixKey });
      for await (const entry of iter) {
        await kv.delete(entry.key);
        counter++;
      }
      await kv.close();
      const msg = `${prefix}: deleted ${counter} object(s)`;
      console.log(msg);
      return { deleted: counter };
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

  public async deleteAllFromSantimentMissing() {
    try {
      const prefix = SpaceNames.SantimentMissing;
      let counter = 0;
      const kv = await Deno.openKv();
      const prefixKey = [SpaceNames.SantimentMissing];
      const iter = kv.list({ prefix: prefixKey });
      for await (const entry of iter) {
        await kv.delete(entry.key);
        counter++;
      }
      await kv.close();
      const msg = `${prefix}: deleted ${counter} object(s)`;
      console.log(msg);
      return { deleted: counter };
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

  // ✴️ #region PROCEDURE FUNCTIONS

  private async fetchBybitData() {
    try {
      const response = await fetch(this.BYBIT_API_URL);
      if (!response.ok) {
        console.error(`Failed to fetch Bybit data. Status: ${response.status}`);
        return [];
      }
      const data = await response.json();

      if (data && data.result && data.result.list) {
        console.log("%cBybit Data ---> received...", DColors.cyan);
        return data.result.list
          .filter(
            (item: any) =>
              parseFloat(item.turnover24h) > parseFloat(this.LOWEST_TURNOVER24H)
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
        console.log("%cBinance Data ---> received...", DColors.magenta);
        return data
          .filter(
            (item: any) =>
              item.symbol.endsWith("USDT") &&
              parseFloat(item.quoteVolume) > parseFloat(this.LOWEST_TURNOVER24H)
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
    const coinRepo = CoinRepository.getInstance();
    const originCoins: Coin[] = await coinRepo.getAllCoins();
    console.log("Origin Coins ---> ", originCoins.length);
    const blackListCoins: Coin[] = await this.fetchCoinBlackList();

    const originSymbols = new Set(originCoins.map((coin: Coin) => coin.symbol));
    const blackListSymbols = new Set(
      blackListCoins.map((coin: Coin) => coin.symbol)
    );

    const sortedCoins = coins.filter(
      (item) =>
        !originSymbols.has(item.symbol) && !blackListSymbols.has(item.symbol)
    );
    //TODO
    console.log("SORTED COINS done ---> ", sortedCoins.length);
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
        "%cSantiment Data ---> received successfully...",
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
    console.log("UniqueCoins from AssingCoinGecko ", coins.length);
    const coinGeckoIds: CoinGeckoId[] = await this.fetchCoinGeckoIds();

    const coinGeckoIdMap = new Map(
      coinGeckoIds.map((item) => [item.symbol.toLowerCase(), item.id])
    );

    coins.forEach((c) => {
      const modifiedSymbol = c.symbol.replace("USDT", "").toLowerCase();
      const coinGeckoId = coinGeckoIdMap.get(modifiedSymbol);
      if (coinGeckoId) {
        c.coinGeckoId = coinGeckoId;
      } else {
        coinGeckoMissing.push(c);
      }
    });

    await this.saveCoinGeckoMissing(coinGeckoMissing);
    console.log(
      "CoinGecko Missing --> ",
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
      } else {
        // Add to missing list if no match is found
        santimentMissing.push(coin);
      }
    });

    // Log missing Santiment entries
    if (santimentMissing.length > 0) {
      console.log(
        "Santiment Missing ---> ",
        santimentMissing.map((s) => s.symbol)
      );
    }

    // Attempt to save missing entries with error handling
    try {
      await this.saveSantimentMissing(santimentMissing);
    } catch (error) {
      console.error("Failed to save missing Santiment data:", error);
      return coins;
    }

    return coins;
  }

  private async enrischWithCoinGeckoData(coins: Coin[]) {
    for (const [index, coin] of coins.entries()) {
      await this.rateLimitDelay(2000);
      console.log(
        `Enriching with CoinGecko Data --> ${index + 1} of ${coins.length}`
      );
      if (coin.coinGeckoId) {
        const url = `${this.COIN_GECKO_API}/coins/${coin.coinGeckoId}?x_cg_demo_api_key=${this.COIN_GECKO_API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();
        if (data.error) {
          console.error(data.error);
          await notifyAboutFailedFunction(
            this.PROJECT,
            this.CLASS_NAME,
            "enrischWithCoinGeckoData",
            data.error
          );
          return coins;
        }

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
      }
    }

    console.log(
      "%cUniqueCoins  ---> enriched with CoinGecko & Satiment...",
      DColors.yellow
    );

    return coins;
  }

  private async saveUniqueCoinsToDb(coins: Coin[]) {
    const deletedRes = await this.deleteAllCoinsFromDb();
    const addedRes = await this.addCoinsToDb(coins);
    await this.refreshRepository();
    console.log("%cFinal Saving: Clean Db Res ---> ", DColors.cyan, deletedRes);
    console.log(
      "%cFinal Saving: Insertion into Db Res ---> ",
      DColors.green,
      addedRes
    );
  }
  // #endregion

  //----------------------------
  // ✅ REFRESHMENT PROCEDURE
  //----------------------------
  private async runRefreshmentPocedure() {
    let coins: Coin[] = [];
    const binanceData = await this.fetchBinanceData();
    const bybitData = await this.fetchBybitData();
    coins = this.mergeData(binanceData, bybitData);
    coins = await this.sortOutUniqueCoins(coins);
    coins = await this.assignCoinGeckoIds(coins);
    coins = await this.assignSantimentIds(coins);
    coins = await this.enrischWithCoinGeckoData(coins);
    coins = this.assignCategory(coins);
    coins = this.assignLinks(coins);
    await this.saveUniqueCoinsToDb(coins);
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
