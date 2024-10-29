// deno-lint-ignore-file no-explicit-any

import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
import { CoinRepository } from "../global/coins/coin-repository.ts";
import type { TF } from "../models/shared/timeframes.ts";
import { BybitWSConnManager } from "../ws/bybit/by-ws-conn-manager.ts";
import { DColors } from "../models/shared/colors.ts";

const { BYBIT_WS_TF } = await load();
let ws: BybitWSConnManager | null = null;

export const runBybitWSConnections = () => {
  // Define variables to hold instances
  const coinRepo = CoinRepository.getInstance();
  const coins = coinRepo.getBybitCoins();

  // Initialize BinanceWSConnManager with coins and timeframe
  ws = new BybitWSConnManager(coins, BYBIT_WS_TF as TF);
  ws.initializeConnections();
  console.log(
    "%cBybit WebSocket connections --> getting initialized...",
    DColors.magenta
  );
};

export const startBybitWs = (_req: any, res: any) => {
  if (!ws) {
    return res.status(500).send("Bybit WebSocket Manager not initialized.");
  }
  try {
    const result = ws.startConnections();
    res.status(200).send(result);
  } catch (error) {
    console.error("Error starting Bybit WebSocket connections:", error);
    res
      .status(500)
      .send("An error occurred while starting Bybit WebSocket connections.");
  }
};

export const closeBybitWs = (_req: any, res: any) => {
  if (!ws) {
    return res.status(500).send("Bybit WebSocket Manager not initialized.");
  }
  try {
    const result = ws.closeAllConnections();
    res.status(200).send(result);
  } catch (error) {
    console.error("Error closing Bybit WebSocket connections:", error);
    res
      .status(500)
      .send("An error occurred while closing Bybit WebSocket connections.");
  }
};

export const getBybitWsStatus = (_req: any, res: any) => {
  if (!ws) {
    return res.status(500).send("Bybit WebSocket Manager not initialized.");
  }
  try {
    const result = ws.getConnectionStatus();
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
