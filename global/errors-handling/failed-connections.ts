// connectionStatus.ts

import { UnixToTime } from "../../functions/utils/time-converter.ts";

class FailedConnectionManager {
  private static instance: FailedConnectionManager;
  private failedConnections: Map<
    string,
    { exchange: string; retryCount: number; lastFailed: string }
  > = new Map();

  private constructor() {}

  static getInstance(): FailedConnectionManager {
    if (!FailedConnectionManager.instance) {
      FailedConnectionManager.instance = new FailedConnectionManager();
    }
    return FailedConnectionManager.instance;
  }

  addFailedConnection(symbol: string, exchange: string, retryCount: number) {
    this.failedConnections.set(symbol, {
      retryCount,
      exchange,
      lastFailed: UnixToTime(new Date().getTime()),
    });
  }

  removeFailedConnection(symbol: string) {
    this.failedConnections.delete(symbol);
  }

  getFailedConnection(symbol: string) {
    return this.failedConnections.get(symbol);
  }

  // New method to collect all failed connections in one object
  getAllFailedConnections(): Record<
    string,
    { retryCount: number; exchange: string; lastFailed: string }
  > {
    const allFailedConnections: Record<
      string,
      { retryCount: number; exchange: string; lastFailed: string }
    > = {};

    for (const [symbol, info] of this.failedConnections) {
      allFailedConnections[symbol] = info;
    }

    return allFailedConnections;
  }
}

export const failedConnectionManager = FailedConnectionManager.getInstance();
