import { Coin } from "../models/shared/coin.ts";
import { TF } from "../models/shared/timeframes.ts";
import { biMain } from "./binance/bi-main.ts";
import { byMain } from "./bybit/by-main.ts";

export async function runWsMain(coins: Coin[], timeframe: TF) {
  const biCoins = coins.filter(
    (c) => c.exchange == "bi" || c.exchange == "biby"
  );
  const byCoins = coins.filter((c) => c.exchange == "by");

  //TODO: COMMENTED OUT biMain()
  biMain(biCoins, timeframe);
  //byMain(byCoins, timeframe);
}
