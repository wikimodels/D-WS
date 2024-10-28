// coinApiService.ts
import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";

const { BYBIT_FUTURES_KLINE, BINANCE_FUTURES_KLINE } = await load();

export type KlineData = {
  symbol: string;
  turnover24h: number;
};

export async function fetchBybitKlineData(
  symbol: string,
  interval: string,
  limit: number
): Promise<KlineData> {
  const response = await fetch(
    `${BYBIT_FUTURES_KLINE}?category=linear&symbol=${symbol}&interval=${interval}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch Bybit kline data: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.retMsg !== "OK") {
    throw new Error("No kline data returned from Bybit");
  }

  return { symbol: data.result.symbol, turnover24h: data.result.list[0][6] };
}

export async function fetchBinanceKlineData(
  symbol: string,
  interval: string,
  limit: number
): Promise<KlineData> {
  const response = await fetch(
    `${BINANCE_FUTURES_KLINE}?symbol=${symbol}&interval=${interval}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Binance kline data: ${response.statusText}`
    );
  }

  const data = await response.json();

  return { symbol: symbol, turnover24h: parseFloat(data[0][7]) };
}
