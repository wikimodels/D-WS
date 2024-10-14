// deno-lint-ignore-file no-explicit-any
import { Exchange } from "../../models/shared/exchange.ts";
import { KlineObj } from "../../models/shared/kline.ts";

export function mapByDataToKlineObj(
  data: any,
  exchange: Exchange,
  symbol: string
) {
  const confirmedCandle = data.data[0];
  const obj: KlineObj = {
    symbol: symbol,
    exchange: exchange,
    openTime: Number(confirmedCandle.start),
    closeTime: Number(confirmedCandle.end),
    open: Number(confirmedCandle.open),
    high: Number(confirmedCandle.high),
    low: Number(confirmedCandle.low),
    close: Number(confirmedCandle.close),
    baseVolume: Number(confirmedCandle.volume),
    quoteVolume: Number(confirmedCandle.volume) * Number(confirmedCandle.close),
  };
  return obj;
}
