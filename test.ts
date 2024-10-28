// deno-lint-ignore-file no-explicit-any
import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
import { CoinRepository } from "./global/coins/coin-repository.ts";
import type { Coin } from "./models/shared/coin.ts";

const env = await load();
// Fetch kline data for all Bybit coins in parallel and update their categories
await CoinRepository.initializeFromDb();
const coinsRepo = CoinRepository.getInstance();
const byCoins = coinsRepo.ByCoins();

export async function updateAllBybitCoinCategories(
  interval = "D",
  limit = 1
): Promise<any> {
  let bybitCoins = coinsRepo.getAllCoins().filter((c) => c.exchange == "by");

  // Map over each coin symbol to create an array of promises for kline data
  const klinePromises = bybitCoins.map((coin) =>
    fetchKlineData(coin.symbol, interval, limit)
      .then((data) => ({
        success: true,
        symbol: coin.symbol,
        data,
      }))
      .catch((error) => {
        console.error(`Failed to fetch kline for ${coin.symbol}:`, error);
        return {
          success: false,
          symbol: coin.symbol,
          error: error.message,
        };
      })
  );

  const responseData = await Promise.all(klinePromises);

  // Separate successful and failed requests
  const successfulData = responseData.filter((result) => result.success);
  const failedData = responseData.filter((result) => !result.success);

  const turnover24hData = successfulData
    .filter(
      (
        result
      ): result is {
        success: true;
        symbol: string;
        data: { symbol: string; turnover24h: number };
      } => result.success
    )
    .map((s) => ({
      symbol: s.symbol,
      turnover24h: s.data.turnover24h, // Assuming turnover24h is a field in s.data
    }));

  //TODO:

  bybitCoins = updateCoinCategories(byCoins, turnover24hData);

  for (const coin of bybitCoins) {
    await this.updateCoinInDb(coin.symbol, { category: coin.category });
  }

  //Refresh the repository to sync local data with database
  await this.refreshRepository();
}

// Fetches kline data for a given symbol and returns the total volume
async function fetchKlineData(
  symbol: string,
  interval: string,
  limit: number
): Promise<{ symbol: string; turnover24h: number }> {
  const response = await fetch(
    env["BYBIT_FUTURES_KLINE"] +
      `?category=linear&symbol=${symbol}&interval=${interval}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch kline data: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.retMsg != "OK") {
    throw new Error("No kline data returned from Bybit");
  }

  // Calculate total volume from the kline data
  return { symbol: data.result.symbol, turnover24h: data.result.list[0][6] };
}

export function updateCoinCategories(
  coins: Coin[],
  turnover24hs: { symbol: string; turnover24h: number }[]
) {
  coins.forEach((c) => {
    turnover24hs.forEach((t) => {
      if (t.symbol == c.symbol) {
        //TODO:
        console.log("CHECKED", c.symbol);
        c.category = assignCategory(t.turnover24h);
      }
    });
  });
  return coins;
}

export function assignCategory(turnover24h: number) {
  if (turnover24h > 200 * 1000 * 1000) {
    return "I";
  }
  if (turnover24h < 200 * 1000 * 1000 && turnover24h >= 100 * 1000 * 1000) {
    return "II";
  }
  if (turnover24h < 100 * 1000 * 1000 && turnover24h >= 50 * 1000 * 1000) {
    return "III";
  }
  if (turnover24h < 50 * 1000 * 1000 && turnover24h >= 10 * 1000 * 1000) {
    return "IV";
  }
  if (turnover24h < 10 * 1000 * 1000) {
    return "V";
  }
  return "";
}

updateAllBybitCoinCategories();
