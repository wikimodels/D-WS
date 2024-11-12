import { _ } from "https://cdn.skypack.dev/lodash";
import type { KlineObj } from "../../models/shared/kline.ts";
const MAX_CANDLES = 1;

const klineRepo = new Map<string, KlineObj[]>();

export function saveCandle(obj: KlineObj) {
  if (!klineRepo.has(obj.symbol)) {
    klineRepo.set(obj.symbol, []);
  }
  const candles = klineRepo.get(obj.symbol)!;

  candles.push(obj);

  // Limit the array length
  if (candles.length > MAX_CANDLES) {
    candles.shift(); // Remove the oldest candle
  }
}

export function getLatestDataFromKlineRepo(symbol: string): KlineObj | null {
  const candles = klineRepo.get(symbol);
  return candles ? candles[candles.length - 1] : null;
}

export function clearKlineRepo() {
  klineRepo.clear();
}
