// deno-lint-ignore-file no-explicit-any
import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
import Binance, { KlineInterval } from "npm:binance";
import { printConnectionErrorInfo } from "../../functions/utils/messages/print-conn-error-info.ts";
import { printConnectionRetriesOverInfo } from "../../functions/utils/messages/print-conn-retries-over-info.ts";
import { printOpenConnectionInfo } from "../../functions/utils/messages/print-open-conn-info.ts";
import { printRetryConnectionInfo } from "../../functions/utils/messages/print-retrying-conn-info.ts";
import { Colors } from "../../models/shared/colors.ts";
import { Exchange } from "../../models/shared/exchange.ts";
import { TF } from "../../models/shared/timeframes.ts";
import { mapBiDataToKlineObj } from "./map-bi-data-to-kline-obj.ts";
import { addToKlineRepo } from "../../global/kline/kline-repo.ts";

const env = await load();

const logger = {
  ...Binance.DefaultLogger,
  silly: () => {},
};

export function collectKlineData(
  symbol: string,
  coinExchange: Exchange,
  timeframe: TF
) {
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
    printConnectionErrorInfo(
      exchange,
      symbol,
      connectionType,
      Colors.red,
      error
    );
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

  ws.on("close", (data) => {
    console.log(
      `%c${exchange}:${symbol} ${connectionType} --> closed...`,
      "color:red"
    );
    printRetryConnectionInfo(exchange, symbol, connectionType, Colors.yellow);
    console.log(data);
    reconnectToWs(symbol, coinExchange, timeframe);
  });
}

function reconnectToWs(symbol: string, coinExchange: Exchange, timeframe: TF) {
  setTimeout(() => {
    collectKlineData(symbol, coinExchange, timeframe);
  }, 1000); // Reconnect after 5 seconds
}
