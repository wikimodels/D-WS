import { CoinOperator } from "../global/coins/coin-operator.ts";
import type { Coin } from "../models/coin/coin.ts";
import { CoinsCollections } from "../models/coin/coins-collections.ts";
import { TF } from "../models/shared/timeframes.ts";
import { BinanceWSConnManager } from "../ws/binance/bi-ws-conn-manager.ts";
import { BybitWSConnManager } from "../ws/bybit/by-ws-conn-manager.ts";

const initializeWsConnManagers = async (timeframe: TF) => {
  try {
    const coins = await CoinOperator.getAllCoins(CoinsCollections.CoinRepo);
    const binanceCoins: Coin[] = coins.filter((c) => c.coinExchange == "bi");
    const bybitCoins: Coin[] = []; //coins.filter((c)=>c.coinExchange == "by" || c.coinExchange == "biby")
    BinanceWSConnManager.initializeInstance(binanceCoins, timeframe);
    BybitWSConnManager.initializeInstance(bybitCoins, timeframe);
  } catch (error) {
    console.error("Failed to initialize Ws Conn Managers:", error);
    throw error;
  }
};

export default initializeWsConnManagers;
