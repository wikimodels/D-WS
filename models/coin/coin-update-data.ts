import type { Coin } from "./coin.ts";

export interface CoinUpdateData {
  propertiesToUpdate: Partial<Coin>;
  symbol: string;
}
