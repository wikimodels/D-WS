// deno-lint-ignore-file no-explicit-any

import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
import type { TF } from "../../models/shared/timeframes.ts";
import { BybitWSConnManager } from "../../ws/bybit/by-ws-conn-manager.ts";
import { DColors } from "../../models/shared/colors.ts";
import { CoinOperator } from "../../global/coins/coin-operator.ts";
import { CoinsCollections } from "../../models/coin/coins-collections.ts";

const { BYBIT_WS_TF } = await load();

export const runBybitWSConnections = async () => {
  // Define variables to hold instances

  const coins = await CoinOperator.getAllCoins(CoinsCollections.CoinRepo);
  const bybitceCoins = coins.filter(
    (c) => c.coinExchange == "by" || c.coinExchange == "biby"
  );

  // Initialize BinanceWSConnManager with coins and timeframe
  BybitWSConnManager.initialize(bybitceCoins, BYBIT_WS_TF as TF);
  BybitWSConnManager.initializeConnections();
  console.log(
    "%cBybit WebSocket connections --> getting initialized...",
    DColors.magenta
  );
};

export const startBybitWs = (_req: any, res: any) => {
  if (BybitWSConnManager.checkInitialization()) {
    return res.status(500).send("Bybit WebSocket Manager not initialized.");
  }
  try {
    const result = BybitWSConnManager.startConnections();
    res.status(200).send(result);
  } catch (error) {
    console.error("Error starting Bybit WebSocket connections:", error);
    res
      .status(500)
      .send("An error occurred while starting Bybit WebSocket connections.");
  }
};

export const closeBybitWs = (_req: any, res: any) => {
  if (BybitWSConnManager.checkInitialization()) {
    return res.status(500).send("Bybit WebSocket Manager not initialized.");
  }
  try {
    const result = BybitWSConnManager.closeAllConnections();
    res.status(200).send(result);
  } catch (error) {
    console.error("Error closing Bybit WebSocket connections:", error);
    res
      .status(500)
      .send("An error occurred while closing Bybit WebSocket connections.");
  }
};

export const getBybitWsStatus = (_req: any, res: any) => {
  if (BybitWSConnManager.checkInitialization()) {
    return res.status(500).send("Bybit WebSocket Manager not initialized.");
  }
  try {
    const result = BybitWSConnManager.getConnectionStatus();
    res.status(200).send(result);
  } catch (error) {
    console.error("Error retrieving Bybit WebSocket connection status:", error);
    res
      .status(500)
      .send(
        "An error occurred while retrieving Bybit WebSocket connection status."
      );
  }
};
