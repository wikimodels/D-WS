// deno-lint-ignore-file no-explicit-any
import { StandardWebSocketClient } from "https://deno.land/x/websocket@v0.1.4/mod.ts";
import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
import { printConnectionClosedInfo } from "../../functions/utils/messages/print-conn-closed-info.ts";
import { printConnectionErrorInfo } from "../../functions/utils/messages/print-conn-error-info.ts";
import { printMaxRetriesReachedInfo } from "../../functions/utils/messages/print-max-retries-reached-info.ts";
import { printRetryingConnectionInfo } from "../../functions/utils/messages/print-retrying-conn-info.ts";
import { UnixToTime } from "../../functions/utils/time-converter.ts";
import { Colors } from "../../models/shared/colors.ts";
import type { ConnObj } from "../../models/shared/conn-obj.ts";
import type { ConnectionStatus } from "../../models/shared/conn-status.ts";
import type { Exchange } from "../../models/shared/exchange.ts";
import type { TF } from "../../models/shared/timeframes.ts";
import { mapBiDataToKlineObj } from "./map-bi-data-to-kline-obj.ts";
import { printOpenConnectionInfo } from "../../functions/utils/messages/print-open-conn-info.ts";
import { failedConnectionManager } from "../../global/error-handling/failed-connections.ts";
import { saveCandle } from "../../global/kline/kline-repo.ts";
import type { Coin } from "../../models/coin/coin.ts";

const env = await load();

export class BinanceWSConnManager {
  private static connections: Map<string, StandardWebSocketClient> = new Map();
  private static retryCounts: Map<string, number> = new Map();
  private static maxRetries = 10;
  private static allSymbols: Set<string>;
  private static exchange = "BINANCE";
  private static baseUrl = env["BINANCE_FWS_BASE"];
  private static connObjs: ConnObj[] = [];
  private static connectionType = "";
  private static timeframe: TF;
  private static projectName = env["PROJECT_NAME"];
  private static shouldReconnect = true;
  private static isStarted = false;
  private static isInitialized = false;

  public static initializeInstance(coins: Coin[], timeframe: TF) {
    if (this.isInitialized) {
      console.log("BinanceWSConnManager is already initialized.");
      return;
    }

    this.connObjs = this.getConnObjs(coins, timeframe);
    this.connectionType = "KLINE-" + timeframe;
    this.timeframe = timeframe;
    this.allSymbols = new Set(coins.map((coin) => coin.symbol));

    this.isInitialized = true; // Mark as initialized
  }

  static startConnections() {
    if (!this.isInitialized) {
      console.log("BinanceWSConnManager has not been initialized.");
      return { status: "Initialization required before starting connections" };
    }

    if (this.isStarted) {
      return { status: "Binance WS Connections already running" };
    }

    this.isStarted = true;
    this.shouldReconnect = true; // Enable reconnection
    console.log("Starting Binance WS connections...");
    this.initializeConnections();
    return { status: "Binance WS Connections started" };
  }

  static initializeConnections() {
    if (!this.shouldReconnect) {
      console.log("Reconnection disabled. Skipping connection initialization.");
      return;
    }
    for (const connObj of this.connObjs) {
      this.createWsConnection(connObj);
    }
    this.isStarted = true;
  }

  private static createWsConnection(connObj: ConnObj) {
    const ws = new StandardWebSocketClient(this.baseUrl + connObj.connUrl);

    ws.on("open", () => {
      printOpenConnectionInfo(
        this.exchange,
        connObj.symbol,
        this.connectionType,
        Colors.magenta
      );
      this.connections.set(connObj.symbol, ws);
      this.retryCounts.set(connObj.symbol, 0);
    });

    ws.on("message", (message) => {
      const data = JSON.parse(message.data);
      if (data.k && data.k.x) {
        const kline = mapBiDataToKlineObj(
          data,
          connObj.coinExchange as Exchange
        );
        saveCandle(kline);
      }
    });

    ws.on("error", async (error: any) => {
      printConnectionErrorInfo(
        this.exchange,
        connObj.symbol,
        this.connectionType,
        Colors.red,
        error
      );
      this.connections.delete(connObj.symbol);
      if (this.shouldReconnect) {
        await this.reconnectToWs(connObj);
      }
    });

    ws.on("close", async () => {
      if (this.shouldReconnect) {
        printConnectionClosedInfo(
          this.exchange,
          connObj.symbol,
          this.connectionType,
          Colors.yellow
        );
        await this.reconnectToWs(connObj);
      } else {
        console.log(
          `Connection for ${connObj.symbol} closed and will not reconnect.`
        );
      }
      this.connections.delete(connObj.symbol);
    });
  }

  private static getConnObjs(coins: Coin[], timeframe: TF): ConnObj[] {
    return coins.map((c) => ({
      exchange: this.exchange,
      projectName: this.projectName,
      symbol: c.symbol,
      coinExchange: c.exchange as Exchange,
      connUrl: `${c.symbol.toLowerCase()}@kline_${timeframe.toUpperCase()}`,
    }));
  }

  static getConnectionStatus() {
    if (!this.isInitialized) {
      return { status: "BinanceWSConnManager has not been initialized." };
    }

    const status: ConnectionStatus = {
      coinsLen: this.allSymbols.size,
      activeConnLen: this.connections.size,
      inactiveConn: Array.from(this.allSymbols).filter(
        (symbol) => !this.connections.has(symbol)
      ),
      timestamp: new Date().getTime(),
      timestampStr: UnixToTime(new Date().getTime()),
    };
    return status;
  }

  static closeAllConnections() {
    if (!this.isStarted) {
      return { status: "Binance WS Connections already closed" };
    }
    this.isStarted = false;
    this.shouldReconnect = false;
    this.connections.forEach((ws, symbol) => {
      console.log("Closing connection:", symbol);
      ws.close();
    });
    this.connections.clear();
    return { status: "Binance WS Connections closed" };
  }

  private static reconnectToWs(connObj: ConnObj) {
    const retryCount = this.retryCounts.get(connObj.symbol) ?? 0;
    if (retryCount < this.maxRetries && this.shouldReconnect) {
      printRetryingConnectionInfo(
        this.exchange,
        connObj.symbol,
        this.connectionType,
        retryCount + 1,
        Colors.yellow
      );

      this.retryCounts.set(connObj.symbol, retryCount + 1);
      setTimeout(() => {
        this.createWsConnection(connObj);
      }, 1000 * (retryCount + 1));
    } else if (retryCount >= this.maxRetries) {
      printMaxRetriesReachedInfo(
        this.exchange,
        connObj.symbol,
        this.connectionType,
        retryCount,
        Colors.red
      );
      failedConnectionManager.addFailedConnection(
        connObj.symbol,
        connObj.exchange,
        retryCount
      );
    }
  }

  static checkInitialization() {
    return this.isInitialized;
  }
}
