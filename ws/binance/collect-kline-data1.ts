import {
  WebSocketClient,
  StandardWebSocketClient,
} from "https://deno.land/x/websocket@v0.1.4/mod.ts";
import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
import { TF } from "../../models/shared/timeframes.ts";
import { printOpenConnectionInfo } from "../../functions/utils/messages/print-open-conn-info.ts";
import { Colors } from "../../models/shared/colors.ts";
import { printRetryConnectionInfo } from "../../functions/utils/messages/print-retry-conn-info.ts";
import { printConnectionErrorInfo } from "../../functions/utils/messages/print-conn-error-info.ts";
import { printConnectionRetriesOverInfo } from "../../functions/utils/messages/print-conn-retries-over-info.ts";
import { Exchange } from "../../models/shared/exchange.ts";
import { mapBiDataToKlineObj } from "./map-bi-data-to-kline-obj.ts";
import { checkAlertsList } from "../../global/alerts/initialize-alerts-repo.ts";

const env = await load();

export function collectKlineData(
  symbol: string,
  coinExchange: Exchange,
  timeframe: TF
) {
  let retryCount = 0;
  const maxRetries = Number(env["WS_MAX_RETRY"]);
  const exchange = "BINANCE";
  const connectionType = "KLINE-" + timeframe;

  //const url = env["BINANCE_FS_WS"];
  const url =
    "wss://stream.binance.com:9443/ws/" +
    `${symbol.toLowerCase()}@kline_${timeframe.toUpperCase()}`;

  const ws: WebSocketClient = new StandardWebSocketClient(url);
  ws.on("open", function () {
    printOpenConnectionInfo(exchange, symbol, connectionType, Colors.magenta);
  });

  ws.on("message", function (message: any) {
    const data = JSON.parse(message.data);
    if (data.k.x == true) {
      const kline = mapBiDataToKlineObj(data);
      checkAlertsList(kline);
    }
  });

  ws.on("ping", (data: Uint8Array) => {
    console.log(`%c${exchange}:${symbol} liq ---> ping`, "color:green");
    ws.send(data);
  });

  ws.on("error", function (error: any) {
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
      reconnectToWs(symbol, coinExchange, timeframe);
    }
  });

  ws.on("close", function () {
    console.log(
      `%c${exchange}:${symbol} ${connectionType} --> closed...`,
      "color:red"
    );
    printRetryConnectionInfo(exchange, symbol, connectionType, Colors.yellow);
    reconnectToWs(symbol, coinExchange, timeframe);
  });
}

function reconnectToWs(symbol: string, coinExchange: Exchange, timeframe: TF) {
  setTimeout(() => {
    collectKlineData(symbol, coinExchange, timeframe);
  }, 1000); // Reconnect after 5 seconds
}
