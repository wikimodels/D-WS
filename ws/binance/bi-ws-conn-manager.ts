// deno-lint-ignore-file no-explicit-any
import Binance, { KlineInterval } from "npm:binance";

import { StandardWebSocketClient } from "https://deno.land/x/websocket@v0.1.4/mod.ts";
import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
import { sendTgWsErrorMessage } from "../../functions/tg/send-tg-ws-error-msg.ts";
import { printConnectionClosedInfo } from "../../functions/utils/messages/print-conn-closed-info.ts";
import { printConnectionErrorInfo } from "../../functions/utils/messages/print-conn-error-info.ts";
import { printMaxRetriesReachedInfo } from "../../functions/utils/messages/print-max-retries-reached-info.ts";

import { printRetryingConnectionInfo } from "../../functions/utils/messages/print-retrying-conn-info.ts";
import { UnixToTime } from "../../functions/utils/time-converter.ts";
import { addToKlineRepo } from "../../global/kline/kline-repo.ts";
import type { Coin } from "../../models/shared/coin.ts";
import { Colors } from "../../models/shared/colors.ts";
import type { ConnObj } from "../../models/shared/conn-obj.ts";
import type { ConnectionStatus } from "../../models/shared/conn-status.ts";
import type { Exchange } from "../../models/shared/exchange.ts";
import type { TF } from "../../models/shared/timeframes.ts";
import { mapBiDataToKlineObj } from "./map-bi-data-to-kline-obj.ts";
import { printOpenConnectionInfo } from "../../functions/utils/messages/print-open-conn-info.ts";

const env = await load();

export class BinanceWSConnManager {
  private connections: Map<string, StandardWebSocketClient> = new Map();
  private retryCounts: Map<string, number> = new Map();
  private maxRetries = 10;
  private allSymbols: Set<string>;
  private exchange: string;
  private baseUrl = "wss://stream.binance.com:9443/ws/";
  private connObjs: ConnObj[];
  private connectionType = "";
  private timeframe: TF;
  private projectName = env["PROJECT_NAME"];
  private shouldReconnect = true;

  constructor(coins: Coin[], timeframe: TF) {
    this.connObjs = this.getConnObjs(coins, timeframe);
    this.connectionType = "KLINE-" + timeframe;
    this.exchange = "BINANCE";
    this.timeframe = timeframe;
    this.allSymbols = new Set(coins.map((coin) => coin.symbol));
  }

  initializeConnections() {
    if (!this.shouldReconnect) {
      console.log("Reconnection disabled. Skipping connection initialization.");
      return;
    }
    for (const connObj of this.connObjs) {
      this.createWsConnection(connObj);
    }
  }

  // Method to start connections manually
  startConnections() {
    this.shouldReconnect = true; // Enable reconnection attempts
    console.log("Starting connections manually...");
    this.initializeConnections(); // Initialize all connections
  }

  private createWsConnection(connObj: ConnObj) {
    const ws = new StandardWebSocketClient(this.baseUrl + connObj.connUrl);
    ws.on("open", () => {
      printOpenConnectionInfo(
        this.exchange,
        connObj.symbol,
        this.connectionType,
        Colors.green
      );
      this.connections.set(connObj.symbol, ws);
      this.retryCounts.set(connObj.symbol, 0);
    });

    // receive raw events
    ws.on("message", (message) => {
      const data = JSON.parse(message.data);
      if (data.k.x == true) {
        const kline = mapBiDataToKlineObj(
          data,
          connObj.coinExchange as Exchange
        );
        console.log(kline.symbol);
        //checkAlertsList(kline);
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

      // Attempt to reconnect only if shouldReconnect is true
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

  private getConnObjs(coins: Coin[], timeframe: TF): ConnObj[] {
    return coins.map((c) => ({
      exchange: this.exchange,
      projectName: this.projectName,
      symbol: c.symbol,
      coinExchange: c.exchange as Exchange,
      connUrl: `${c.symbol.toLowerCase()}@kline_${timeframe.toUpperCase()}`,
    }));
  }

  private async reconnectToWs(connObj: ConnObj) {
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
      const errorMsg = `Connection closed after ${retryCount} retries`;
      await sendTgWsErrorMessage(connObj, errorMsg);
    }
  }

  getConnectionStatus() {
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

  closeAllConnections() {
    this.shouldReconnect = false;
    this.connections.forEach((ws, symbol) => {
      console.log("Closing connection:", symbol);
      ws.close();
    });
    this.connections.clear();
  }
}
