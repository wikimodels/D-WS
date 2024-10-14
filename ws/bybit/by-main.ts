import { Coin } from "../../models/shared/coin.ts";
import { Exchange } from "../../models/shared/exchange.ts";
import { TF } from "../../models/shared/timeframes.ts";
import { collectKlineData } from "./collect-kline-data.ts";

export function byMain(coins: Coin[], timeframe: TF) {
  coins.forEach((c) => {
    collectKlineData(c.symbol, c.exchange as Exchange, timeframe);
  });
}
