// deno-lint-ignore-file no-explicit-any
import type { Exchange } from "../../models/shared/exchange.ts";
import { KlineObj } from "../../models/shared/kline.ts";

export function mapBiDataToKlineObj(data: any, exchange: Exchange) {
  const obj: KlineObj = {
    symbol: data.s,
    exchange: exchange,
    openTime: Number(data.k.T),
    closeTime: Number(data.k.t),
    open: Number(data.k.o),
    high: Number(data.k.h),
    low: Number(data.k.l),
    close: Number(data.k.c),
    baseVolume: Number(data.k.v),
    quoteVolume: Number(data.k.V) * Number(data.k.v),
    final: data.k.x,
  };
  return obj;
}
