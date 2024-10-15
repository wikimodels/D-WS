import { Exchange } from "../shared/exchange.ts";

export interface AlertObj {
  id: string;
  symbol: string;
  action: string;
  keyLevelName: string;
  description?: string;
  creationTime?: number;
  activationTime?: number;
  coinExchange?: Exchange;
  price: number;
  high: number;
  low: number;
  mainImgUrl?: string;
  imgUrls?: string[];
  isActive: boolean;
  tvLink?: string;
  cgLink?: string;
  exchBiLink?: string;
  exchByLink?: string;
}
