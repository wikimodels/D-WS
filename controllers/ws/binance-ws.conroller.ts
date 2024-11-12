// deno-lint-ignore-file no-explicit-any
import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
import { TF } from "../../models/shared/timeframes.ts";

import { DColors } from "../../models/shared/colors.ts";
import { CoinOperator } from "../../global/coins/coin-operator.ts";
import { CoinsCollections } from "../../models/coin/coins-collections.ts";
import { BinanceWSConnManager } from "../../ws/binance/bi-ws-conn-manager.ts";

export const { BINANCE_WS_TF } = await load();

const runBinanceWSConnections = async () => {
  // Define variables to hold instances
  const coins = await CoinOperator.getAllCoins(CoinsCollections.CoinRepo);
  const binanceCoins = coins.filter((c) => c.coinExchange == "bi");

  // Initialize BinanceWSConnManager with coins and timeframe
  await BinanceWSConnManager.initialize(binanceCoins, BINANCE_WS_TF as TF);
  await BinanceWSConnManager.initializeConnections();

  console.log(
    "%cBinance WebSocket connections --> getting initialized...",
    DColors.yellow
  );
};

export default runBinanceWSConnections;

// Define handlers that will only work after initialization
export const startBinanceWs = (_req: any, res: any) => {
  if (!BinanceWSConnManager.checkInitialization()) {
    return res.status(500).send("Binance WebSocket Manager not initialized.");
  }
  try {
    const result = BinanceWSConnManager.startConnections();
    res.status(200).send(result);
  } catch (error) {
    console.error("Error starting Binance WebSocket connections:", error);
    res
      .status(500)
      .send("An error occurred while starting Binance WebSocket connections.");
  }
};

export const closeBinanceWs = (_req: any, res: any) => {
  if (!BinanceWSConnManager.checkInitialization()) {
    return res.status(500).send("Binance WebSocket Manager not initialized.");
  }
  try {
    const result = BinanceWSConnManager.closeAllConnections();
    res.status(200).send(result);
  } catch (error) {
    console.error("Error closing Binance WebSocket connections:", error);
    res
      .status(500)
      .send("An error occurred while closing Binance WebSocket connections.");
  }
};

export const getBinanceWsStatus = (_req: any, res: any) => {
  if (BinanceWSConnManager.checkInitialization()) {
    return res.status(500).send("Binance WebSocket Manager not initialized.");
  }
  try {
    const result = BinanceWSConnManager.getConnectionStatus();
    res.status(200).send(result);
  } catch (error) {
    console.error(
      "Error retrieving Binance WebSocket connection status:",
      error
    );
    res
      .status(500)
      .send(
        "An error occurred while retrieving Binance WebSocket connection status."
      );
  }
};
