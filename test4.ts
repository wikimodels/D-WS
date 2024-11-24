import { CoinOperator } from "./global/coins/coin-operator.ts";
import { CoinsCollections } from "./models/coin/coins-collections.ts";
const symbols: string[] = [
  "WAXPUSDT",
  "VIRTUALUSDT",
  "VANRYUSDT",
  "SPECUSDT",
  "PENGUSDT",
  "PRIMEUSDT",
  "QNTUSDT",
  "RDNTUSDT",
  "REZUSDT",
  "MAVIAUSDT",
  "MERLUSDT",
  "LUCEUSDT",
  "HPOS10IUSDT",
  "GUSDT",
  "DBRUSDT",
  "CLOUDUSDT",
  "BENDOGUSDT",
  "ALTUSDT",
  "1000LUNCUSDT",
  "STEEMUSDT",
  "ACEUSDT",
  "ALEOUSDT",
  "DOP1USDT",
  "DYMUSDT",
  "TOKENUSDT",
  "CELOUSDT",
  "CELRUSDT",
  "CETUSUSDT",
  "FLOWUSDT",
  "FXSUSDT",
  "GMXUSDT",
  "IDUSDT",
  "SLPUSDT",
  "SNXUSDT",
  "SUPERUSDT",
  "SUSHIUSDT",
  "SXPUSDT",
  "TUSDT",
  "WOOUSDT",
  "YGGUSDT",
  "ZILUSDT",
  "1INCHUSDT",
  "COREUSDT",
  "BEAMXUSDT",
  "RENUSDT",
  "NMRUSDT",
];
await CoinOperator.initializeInstance();
const coins = await CoinOperator.getAllCoins(CoinsCollections.CoinSorter);
// Filter coins based on the blacklist
// const blacklistedCoins = coins.filter((coin) => symbols.includes(coin.symbol));
const blacklistedCoins = coins.filter((coin) => coin.status != "undefined");
// const res = await CoinOperator.moveCoins(
//   CoinsCollections.CoinRepo,
//   CoinsCollections.CoinSorter,
//   blacklistedCoins
// );
const sym = blacklistedCoins.map((c) => c.symbol);
console.log(blacklistedCoins);
