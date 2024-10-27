import type { Exchange } from "./exchange.ts";

export interface ConnObj {
  symbol: string;
  connUrl: string;
  exchange: string;
  projectName: string;
  coinExchange: Exchange;
}
