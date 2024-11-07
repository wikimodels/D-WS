import { _ } from "https://cdn.skypack.dev/lodash";
import type { KlineObj } from "../../models/shared/kline.ts";
const MAX_CANDLES = 1;

const candleData = new Map<string, KlineObj[]>();

export function saveCandle(obj: KlineObj) {
  if (!candleData.has(obj.symbol)) {
    candleData.set(obj.symbol, []);
  }
  const candles = candleData.get(obj.symbol)!;

  candles.push(obj);

  // Limit the array length
  if (candles.length > MAX_CANDLES) {
    candles.shift(); // Remove the oldest candle
  }
}

export function getLatestKline(symbol: string): KlineObj | null {
  const candles = candleData.get(symbol);
  return candles ? candles[candles.length - 1] : null;
}
