export function designateLinks(coins: Coin[]) {
  coins.forEach((c) => {
    // Set tvLink based on the exchange type
    c.tvLink =
      c.coinExchange == "by" || c.coinExchange == "biby"
        ? `https://www.tradingview.com/chart?symbol=BYBIT:${c.symbol}.P`
        : `https://www.tradingview.com/chart?symbol=BINANCE:${c.symbol}.P`;

    // Set cgLink based on the exchange type
    c.cgLink =
      c.coinExchange == "bi" || c.coinExchange == "biby"
        ? `https://www.coinglass.com/tv/Binance_${c.symbol}`
        : `https://www.coinglass.com/tv/Bybit_${c.symbol}`;

    // Set exchange-specific links
    switch (c.coinExchange) {
      case "by":
        c.bybitExch = `https://www.bybit.com/trade/usdt/${c.symbol}`;
        break;
      case "bi":
        c.binanceExch = `https://www.binance.com/en/futures/${c.symbol}`;
        break;
      case "biby":
        c.bybitExch = `https://www.bybit.com/trade/usdt/${c.symbol}`;
        c.binanceExch = `https://www.binance.com/en/futures/${c.symbol}`;
        break;
    }
  });
  return coins;
}
