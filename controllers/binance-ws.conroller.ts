// deno-lint-ignore-file no-explicit-any
import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
import { CoinRepository } from "../global/coins/coin-repository.ts";
import { TF } from "../models/shared/timeframes.ts";
import { BinanceWSConnManager } from "../ws/binance/bi-ws-conn-manager.ts";

export const { BINANCE_WS_TF } = await load();
let ws: BinanceWSConnManager | null = null;

const runBinanceWSConnections = () => {
  // Define variables to hold instances
  const coinRepo = CoinRepository.getInstance();
  const coins = coinRepo.getBinanceCoins();

  // Initialize BinanceWSConnManager with coins and timeframe
  ws = new BinanceWSConnManager(coins, BINANCE_WS_TF as TF);
  ws.initializeConnections();
  console.log(
    "%cBinance WebSocket connections are getting initialized.",
    "color:blue"
  );
};

export default runBinanceWSConnections;

// Define handlers that will only work after initialization
export const startBinanceWs = (_req: any, res: any) => {
  if (!ws) {
    return res.status(500).send("Binance WebSocket Manager not initialized.");
  }
  try {
    const result = ws.startConnections();
    res.status(200).send(result);
  } catch (error) {
    console.error("Error starting Binance WebSocket connections:", error);
    res
      .status(500)
      .send("An error occurred while starting Binance WebSocket connections.");
  }
};

export const closeBinanceWs = (_req: any, res: any) => {
  if (!ws) {
    return res.status(500).send("Binance WebSocket Manager not initialized.");
  }
  try {
    const result = ws.closeAllConnections();
    res.status(200).send(result);
  } catch (error) {
    console.error("Error closing Binance WebSocket connections:", error);
    res
      .status(500)
      .send("An error occurred while closing Binance WebSocket connections.");
  }
};

export const getBinanceWsStatus = (_req: any, res: any) => {
  if (!ws) {
    return res.status(500).send("Binance WebSocket Manager not initialized.");
  }
  try {
    const result = ws.getConnectionStatus();
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
