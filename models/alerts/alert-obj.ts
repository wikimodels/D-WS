import { Exchange } from "../shared/exchange.ts";

export interface AlertObj {
  id: string;
  symbol: string;
  coinExchange?: Exchange;
  coinCategory?: string;
  action: string;
  keyLevelName: string;
  description?: string;
  creationTime?: number;
  activationTime?: number;
  activationTimeStr?: string;
  price: number;
  high: number;
  low: number;
  mainImgUrl?: string;
  imgUrls?: string[];
  isActive: boolean;
  isTv?: boolean;
  tvLink?: string;
  cgLink?: string;
  exchBiLink?: string;
  exchByLink?: string;
  logoLink?: string;
}
