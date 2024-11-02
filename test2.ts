import { Coin } from "./models/shared/coin.ts";
// deno-lint-ignore-file no-explicit-any
import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";

import { delay } from "https://deno.land/std@0.223.0/async/mod.ts";
import { CoinRepository } from "./global/coins/coin-repository.ts";
import { notifyAboutCoinsRefresh } from "./functions/tg/notifications/coin-refresh.ts";

const {
  BYBIT_PERP_TICKETS_URL,
  BINANCE_PERP_TICKETS_URL,
  PROJECT_NAME,
  COINGECKO_API_KEY,
} = await load();

export class CoinRefresh {
  private static instance: CoinRefresh;
  private uniqueCoins: Map<
    string,
    {
      symbol: string;
      exchange: string;
      turnover24h: number;
      category: string;
      coinGeckoId?: string;
      imageUrl?: string;
      marketData?: any;
    }
  > = new Map();
  private readonly BYBIT_API_URL = BYBIT_PERP_TICKETS_URL;
  private readonly BINANCE_API_URL = BINANCE_PERP_TICKETS_URL;
  private readonly PROJECT = PROJECT_NAME;
  private readonly COINGECKO_ID_URL = `https://api.coingecko.com/api/v3/coins/list?x_cg_demo_api_key=${COINGECKO_API_KEY}`;
  private readonly COINGECKO_DATA_URL = (id: string) =>
    `https://api.coingecko.com/api/v3/coins/${id}?x_cg_demo_api_key=${COINGECKO_API_KEY}`;

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
    if (turnover24h > 200_000_000) return "I";
    if (turnover24h >= 100_000_000) return "II";
    if (turnover24h >= 50_000_000) return "III";
    if (turnover24h >= 10_000_000) return "IV";
    return "V";
  }

  private async fetchCoinGeckoIds() {
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/list`);
    if (!response.ok) throw new Error("Failed to fetch CoinGecko coin list");
    const data = await response.json();
    const coinGeckoIdMap = new Map<string, string>();
    data.forEach((coin: any) =>
      coinGeckoIdMap.set(coin.symbol.toUpperCase(), coin.id)
    );
    return coinGeckoIdMap;
  }

  private async fetchCoinGeckoData(id: string) {
    await this.rateLimitDelay(2000);
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}?x_cg_demo_api_key=${COINGECKO_API_KEY}`
    );
    if (!response.ok) {
      console.error(
        `Failed to fetch CoinGecko data for ${id}. Status: ${response.status}`
      );
      return null;
    }
    const data = await response.json();
    return {
      market_cap_rank: data.market_cap_rank,
      market_cap_fdv_ratio: data.market_cap_fdv_ratio,
      facebook_likes: data.community_data?.facebook_likes,
      twitter_followers: data.community_data?.twitter_followers,
      reddit_average_posts_48h: data.community_data?.reddit_average_posts_48h,
      reddit_average_comments_48h:
        data.community_data?.reddit_average_comments_48h,
      reddit_subscribers: data.community_data?.reddit_subscribers,
      reddit_accounts_active_48h:
        data.community_data?.reddit_accounts_active_48h,
      telegram_channel_user_count:
        data.community_data?.telegram_channel_user_count,
      forks: data.developer_data?.forks,
      stars: data.developer_data?.stars,
      subscribers: data.developer_data?.subscribers,
      total_issues: data.developer_data?.total_issues,
      closed_issues: data.developer_data?.closed_issues,
      pull_requests_merged: data.developer_data?.pull_requests_merged,
      pull_request_contributors: data.developer_data?.pull_request_contributors,
      additions:
        data.developer_data?.code_additions_deletions_4_weeks.additions,
      deletions:
        data.developer_data?.code_additions_deletions_4_weeks.deletions,
      commit_count_4_weeks: data.developer_data?.commit_count_4_weeks,
      image_url: data.image?.large,
    };
  }

  private async enrichWithCoinGeckoData(mergedData: any[]) {
    const coinGeckoIdMap = await this.fetchCoinGeckoIds();

    for (const item of mergedData) {
      const baseSymbol = item.symbol.replace(/USDT$/, "");
      const coinGeckoId = coinGeckoIdMap.get(baseSymbol);
      if (coinGeckoId) {
        item.coinGeckoId = coinGeckoId;
        const geckoData = await this.fetchCoinGeckoData(coinGeckoId);
        if (geckoData) {
          item.marketData = geckoData;
          item.imageUrl = geckoData.image_url;
        }
      }
    }
    return mergedData;
  }

  private async getSentimentMetaData() {}
  private async getUniqueCoins() {
    const mergedData = await this.fetchAndMergeData();
    const coinRepo = CoinRepository.getInstance();
    const originCoins = coinRepo.getAllCoins();
    const originSymbols = new Set(originCoins.map((coin: any) => coin.symbol));

    const uniqueCoins = mergedData.filter(
      (item) => !originSymbols.has(item.symbol)
    );
    uniqueCoins.forEach((item) => this.uniqueCoins.set(item.symbol, item));

    return this.enrichWithCoinGeckoData(uniqueCoins);
  }

  public async refreshData() {
    const uniqueCoins = await this.getUniqueCoins();
    console.log(
      "Unique Coins stored in memory:",
      Array.from(this.uniqueCoins.values())
    );
    await notifyAboutCoinsRefresh(uniqueCoins, this.PROJECT, "CoinRefresh");
  }

  public scheduleRefresh() {
    this.refreshData().then(() => {
      setInterval(async () => {
        await this.refreshData();
      }, 3 * 24 * 60 * 60 * 1000);
    });
  }

  private async rateLimitDelay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
await CoinRepository.initializeFromDb();
// Import and initialize CoinRefresh instance
const coinRefresh = CoinRefresh.getInstance();

// Schedule periodic refresh (every 3 days) or perform a one-time refresh
// Uncomment one of the lines below depending on your needs:

// To start the periodic refresh (recommended for ongoing updates):

// OR, if you want to manually refresh once:
await coinRefresh.refreshData();
