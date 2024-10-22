import { AlertObj } from "../../models/alerts/alert-obj.ts";
import { Exchange } from "../../models/shared/exchange.ts";

export function addLinks(alertObj: AlertObj) {
  alertObj.logoLink = `assets/logo/${alertObj.symbol
    .replace("USDT", "")
    .toLowerCase()}.svg`;
  alertObj.tvLink =
    alertObj.coinExchange == Exchange.By ||
    alertObj.coinExchange == Exchange.BiBy
      ? `https://www.tradingview.com/chart?symbol=BYBIT:${alertObj.symbol}.P`
      : `https://www.tradingview.com/chart?symbol=BINANCE:${alertObj.symbol}.P`;

  alertObj.cgLink =
    alertObj.coinExchange == Exchange.By ||
    alertObj.coinExchange == Exchange.BiBy
      ? `https://www.coinglass.com/tv/Bybit_${alertObj.symbol}`
      : `https://www.coinglass.com/tv/Binance_${alertObj.symbol}`;

  if (alertObj.coinExchange == Exchange.By) {
    alertObj.exchByLink = `https://www.bybit.com/trade/usdt/${alertObj.symbol}`;
  }

  if (alertObj.coinExchange == Exchange.Bi) {
    alertObj.exchBiLink = `https://www.binance.com/en/futures/${alertObj.symbol}`;
  }

  if (alertObj.coinExchange == Exchange.BiBy) {
    alertObj.exchBiLink = `https://www.binance.com/en/futures/${alertObj.symbol}`;
    alertObj.exchByLink = `https://www.bybit.com/trade/usdt/${alertObj.symbol}`;
  }

  return alertObj;
}
