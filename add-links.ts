import type { Coin } from "./models/shared/coin.ts";

export function addLinks(coin: Coin) {
  coin.tvLink =
    coin.exchange == "by" || coin.exchange == "biby"
      ? `https://www.tradingview.com/chart?symbol=BYBIT:${coin.symbol}`
      : `https://www.tradingview.com/chart?symbol=BINANCE:${coin.symbol}`;

  coin.cgLink =
    coin.exchange == "bi" || coin.exchange == "biby"
      ? `https://www.coinglass.com/tv/Binance_${coin.symbol}`
      : `https://www.coinglass.com/tv/Bybit_${coin.symbol}`;

  if (coin.exchange == "biby") {
    coin.exchBiLink = `https://www.binance.com/en/futures/${coin.symbol}`;
    coin.exchByLink = `https://www.bybit.com/trade/usdt/${coin.symbol}`;
  }
  if (coin.exchange == "bi") {
    coin.exchBiLink = `https://www.binance.com/en/futures/${coin.symbol}`;
  }
  if (coin.exchange == "by") {
    coin.exchByLink = `https://www.bybit.com/trade/usdt/${coin.symbol}`;
  }
  // coin.exchLink =
  //   coin.exchange == "by" || coin.exchange == "biby"
  //     ? `https://www.bybit.com/trade/usdt/${coin.symbol}`
  //     : `https://www.binance.com/en/futures/${coin.symbol}`;

  return coin;
}
