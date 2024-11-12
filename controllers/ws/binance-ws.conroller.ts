// deno-lint-ignore-file no-explicit-any

import { BinanceWSConnManager } from "../../ws/binance/bi-ws-conn-manager.ts";

export const startBinanceWs = (_req: any, res: any) => {
  if (!BinanceWSConnManager.checkInitialization()) {
    return res
      .status(200)
      .send({ status: "Binance WebSocket Manager not initialized." });
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
    return res
      .status(200)
      .send({ status: "Binance WebSocket Manager not initialized." });
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
  if (!BinanceWSConnManager.checkInitialization()) {
    return res
      .status(200)
      .send({ status: "Binance WebSocket Manager not initialized." });
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
