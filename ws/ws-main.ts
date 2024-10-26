import { getCoinsRepo } from "../global/coins/coins-repo.ts";
import { TF } from "../models/shared/timeframes.ts";
import { biMain } from "./binance/bi-main.ts";
import { byMain } from "./bybit/by-main.ts";

export async function runWsMain(timeframe: TF) {
  const coins = getCoinsRepo();
  const biCoins = coins.filter((c) => c.exchange == "bi");
  const byCoins = coins.filter(
    (c) => c.exchange == "by" || c.exchange == "biby"
  );

  //TODO: COMMENTED OUT biMain()
  //biMain(biCoins, timeframe);
  byMain(byCoins, timeframe);
}
