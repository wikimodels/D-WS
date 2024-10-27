// deno-lint-ignore-file no-unused-vars no-explicit-any
import Binance, { KlineInterval, parseRawWsMessage } from "npm:binance";

import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
import { printConnectionClosedInfo } from "./functions/utils/messages/print-conn-closed-info.ts";
import { printConnectionErrorInfo } from "./functions/utils/messages/print-conn-error-info.ts";
import { printOpenConnectionInfo } from "./functions/utils/messages/print-open-conn-info.ts";
import { printReconnectingInfo } from "./functions/utils/messages/print-reconn-info.ts";
import { printReconnectedInfo } from "./functions/utils/messages/print-reconnected-info.ts";
import { addToKlineRepo } from "./global/kline/kline-repo.ts";
import { Colors } from "./models/shared/colors.ts";
import type { TF } from "./models/shared/timeframes.ts";
import { mapBiDataToKlineObj } from "./ws/binance/map-bi-data-to-kline-obj.ts";
import type { Exchange } from "./models/shared/exchange.ts";

const env = await load();

const logger = {
  ...Binance.DefaultLogger,
  silly: () => {},
};

const ws = new Binance.WebsocketClient(
  {
    api_key: env["BINANCE_API_KEY"],
    api_secret: env["BINANCE_SECRET_KEY"],
    beautify: true,
  },
  logger
);

export function collectBiKlineData(
  symbol: string,
  timeframe: TF,
  coinExchange: Exchange
) {
  const exchange = "BINANCE";
  const connectionType = "KLINE-" + timeframe;

  ws.subscribeKlines(symbol, timeframe as KlineInterval, "usdm", true);

  ws.on("open", (data: any) => {
    printOpenConnectionInfo(exchange, symbol, connectionType, Colors.magenta);
  });

  ws.on("message", (data: any) => {
    const kline = mapBiDataToKlineObj(data, coinExchange);
    if (kline.final) {
      addToKlineRepo(kline);
    }
  });

  ws.on("reconnecting", (data: any) => {
    printReconnectingInfo(exchange, symbol, connectionType, Colors.magenta);
  });

  ws.on("reconnected", (data: any) => {
    printReconnectedInfo(exchange, symbol, connectionType, Colors.magenta);
  });

  ws.on("error", (error: any) => {
    printConnectionErrorInfo(
      exchange,
      symbol,
      connectionType,
      Colors.red,
      error
    );
    reconnectToWs(symbol, timeframe, coinExchange);
  });

  ws.on("close", (data: any) => {
    printConnectionClosedInfo(exchange, symbol, connectionType, Colors.yellow);
    reconnectToWs(symbol, timeframe, coinExchange);
  });
}

function reconnectToWs(symbol: string, timeframe: TF, coinExchange: Exchange) {
  setTimeout(() => {
    collectBiKlineData(symbol, timeframe, coinExchange);
  }, 1000); // Reconnect after 5 seconds
}
