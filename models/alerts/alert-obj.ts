import { Exchange } from "../shared/exchange.ts";

export interface AlertObj {
  symbol: string;
  creationTime?: number;
  activationTime?: number;
  coinExchange?: Exchange;
  price: number;
  high: number;
  low: number;
  keyLevelName?: string;
  description?: string;
  mainImgUrl?: string;
  imgUrls?: string[];
  action: string;
  isActive: boolean;
  tvLink?: string;
  cgLink?: string;
  exchBiLink?: string;
  exchByLink?: string;
}
