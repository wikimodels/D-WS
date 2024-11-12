// deno-lint-ignore-file no-explicit-any
import { BybitWSConnManager } from "../../ws/bybit/by-ws-conn-manager.ts";

export const startBybitWs = (_req: any, res: any) => {
  if (!BybitWSConnManager.checkInitialization()) {
    return res
      .status(200)
      .send({ status: "Bybit WebSocket Manager not initialized." });
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
  if (!BybitWSConnManager.checkInitialization()) {
    return res
      .status(200)
      .send({ status: "Bybit WebSocket Manager not initialized." });
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
  if (!BybitWSConnManager.checkInitialization()) {
    return res
      .status(200)
      .send({ status: "Bybit WebSocket Manager not initialized." });
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
