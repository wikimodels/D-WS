import { CoinOperator } from "../global/coins/coin-operator.ts";
import type { Coin } from "../models/coin/coin.ts";
import { CoinsCollections } from "../models/coin/coins-collections.ts";
import { TF } from "../models/shared/timeframes.ts";
import { BinanceWSConnManager } from "../ws/binance/bi-ws-conn-manager.ts";
import { BybitWSConnManager } from "../ws/bybit/by-ws-conn-manager.ts";

const initializeWsConnManagers = async (timeframe: TF) => {
  try {
    const coins = (await CoinOperator.getAllCoinsFromRepo()).filter(
      (c) => c.collection == CoinsCollections.CoinRepo
    );
    const binanceCoins: Coin[] = coins.filter((c) => c.coinExchange == "bi");
    const bybitCoins: Coin[] = coins
      .filter((c) => c.coinExchange == "by" || c.coinExchange == "biby")
      .slice(0, 10);
    BinanceWSConnManager.initializeInstance(binanceCoins, timeframe);
    BinanceWSConnManager.checkConnectionsHealth(60);
    BybitWSConnManager.initializeInstance(bybitCoins, timeframe);
    BybitWSConnManager.checkConnectionsHealth(60);
  } catch (error) {
    console.error("Failed to initialize Ws Conn Managers:", error);
    throw error;
  }
};

export default initializeWsConnManagers;
