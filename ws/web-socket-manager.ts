import Binance, { KlineInterval, parseRawWsMessage } from "npm:binance";

import { url } from "inspector";
import { env } from "process";
import { printConnectionErrorInfo } from "../functions/utils/messages/print-conn-error-info.ts";
import { printConnectionRetriesOverInfo } from "../functions/utils/messages/print-conn-retries-over-info.ts";
import { printOpenConnectionInfo } from "../functions/utils/messages/print-open-conn-info.ts";
import { printRetryConnectionInfo } from "../functions/utils/messages/print-retrying-conn-info.ts";
import { addToKlineRepo } from "../global/kline/kline-repo.ts";
import { Colors } from "../models/shared/colors.ts";
import type { Exchange } from "../models/shared/exchange.ts";
import type { TF } from "../models/shared/timeframes.ts";
import { collectKlineData } from "./binance/collect-kline-data.ts";
import { mapBiDataToKlineObj } from "./binance/map-bi-data-to-kline-obj.ts";

const logger = {
  ...Binance.DefaultLogger,
  silly: () => {},
};

class WebSocketManager {
  private connections: WebSocket[] = [];

  createConnection(symbol: string, coinExchange: Exchange, timeframe: TF) {
    let retryCount = 0;
    const maxRetries = Number(env["WS_MAX_RETRY"]);
    const exchange = "BINANCE";
    const connectionType = "KLINE-" + timeframe;

    const ws = new Binance.WebsocketClient(
      {
        api_key: env["BINANCE_API_KEY"],
        api_secret: env["BINANCE_SECRET_KEY"],
        beautify: true,
      },
      logger
    );

    ws.subscribeKlines(symbol, timeframe as KlineInterval, "usdm", true);

    // notification when a connection is opened
    ws.on("open", (data) => {
      printOpenConnectionInfo(exchange, symbol, connectionType, Colors.magenta);
    });

    // receive raw events
    ws.on("message", (data) => {
      const kline = mapBiDataToKlineObj(data);
      if (kline.final) {
        addToKlineRepo(kline);
      }
    });

    // receive formatted events with beautified keys. Any "known" floats stored in strings as parsed as floats.
    ws.on("formattedMessage", (data) => {
      //Do nothing here for now
    });

    // read response to command sent via WS stream (e.g LIST_SUBSCRIPTIONS)
    ws.on("reply", (data) => {
      console.log("log reply: ", JSON.stringify(data, null, 2));
    });

    // receive notification when a ws connection is reconnecting automatically
    ws.on("reconnecting", (data) => {
      console.log("ws automatically reconnecting.... ", data?.wsKey);
    });

    // receive notification that a reconnection completed successfully (e.g use REST to check for missing data)
    ws.on("reconnected", (data) => {
      console.log("ws has reconnected ", data?.wsKey);
    });

    // Recommended: receive error events (e.g. first reconnection failed)
    ws.on("error", (error) => {
      printConnectionErrorInfo(exchange, symbol, connectionType, Colors.red);
      retryCount++;
      console.log(error);
      if (retryCount == maxRetries) {
        printConnectionRetriesOverInfo(
          exchange,
          symbol,
          connectionType,
          Colors.red
        );
      } else {
        this.reconnectToWs(symbol, coinExchange, timeframe);
      }
    });

    ws.on("close", (data) => {
      console.log(
        `%c${exchange}:${symbol} ${connectionType} --> closed...`,
        "color:red"
      );
      printRetryConnectionInfo(exchange, symbol, connectionType, Colors.yellow);
      console.log(data);
      this.reconnectToWs(symbol, coinExchange, timeframe);
    });
  }

  reconnectToWs(symbol: string, coinExchange: Exchange, timeframe: TF) {
    setTimeout(() => {
      collectKlineData(symbol, coinExchange, timeframe);
    }, 1000); // Reconnect after 5 seconds
  }

  // Create multiple WebSocket connections
  async createConnections(url: string, numConnections: number): Promise<void> {
    for (let i = 0; i < numConnections; i++) {
      const ws = new WebSocket(url);

      // Set up WebSocket event listeners for each connection
      ws.onopen = () => {
        console.log(`WebSocket ${i + 1} connected to: ${url}`);
      };

      ws.onmessage = (event: MessageEvent) => {
        console.log(`Message received from ${url} on WS ${i + 1}:`, event.data);
      };

      ws.onerror = (event: Event) => {
        console.error(`WebSocket ${i + 1} error from ${url}:`, event);
      };

      ws.onclose = (event: CloseEvent) => {
        console.log(`WebSocket ${i + 1} closed: ${url}`, event.reason);
      };

      // Track the connection
      this.connections.push(ws);
    }
  }

  // Close all WebSocket connections
  closeAllConnections(): void {
    this.connections.forEach((ws, index) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, `Closed by manager`);
        console.log(`Closing WebSocket connection ${index + 1} to: ${ws.url}`);
      }
    });

    // Clear the connections list
    this.connections = [];
  }

  // Recreate all WebSocket connections
  async recreateConnections(
    url: string,
    numConnections: number
  ): Promise<void> {
    // Close all current connections
    this.closeAllConnections();

    // Recreate the specified number of WebSocket connections
    await this.createConnections(url, numConnections);
    console.log(`${numConnections} WebSocket connections recreated.`);
  }

  // Optional: Close a specific WebSocket connection by index
  closeConnectionByIndex(index: number): void {
    if (index >= 0 && index < this.connections.length) {
      const ws = this.connections[index];
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, "Closed by manager");
        console.log(`Closed WebSocket connection ${index + 1} to: ${ws.url}`);
      }

      // Remove from the connections list
      this.connections.splice(index, 1);
    }
  }
}

export default WebSocketManager;
