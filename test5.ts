import { CoinOperator } from "./global/coins/coin-operator.ts";
import { CoinsCollections } from "./models/coin/coins-collections.ts";

await CoinOperator.initializeInstance();

// Fetch all coins from the CoinRepo collection
const coins = await CoinOperator.getAllCoins(CoinsCollections.CoinRepo);

// Define the symbols array
const symbols: string[] = [
  "10000COQUSDT",
  "1000LUNCUSDT",
  "1000XECUSDT",
  "1CATUSDT",
  "1INCHUSDT",
  "ACEUSDT",
  "ACHUSDT",
  "ARKUSDT",
  "BNXUSDT",
  "CFXUSDT",
  "COWUSDT",
  "CTKUSDT",
  "DYMUSDT",
  "ENJUSDT",
  "FLOWUSDT",
  "GASUSDT",
  "GMXUSDT",
  "IDUSDT",
  "KAIAUSDT",
  "KSMUSDT",
  "LAIUSDT",
  "LSKUSDT",
  "LUMIAUSDT",
  "MAGICUSDT",
  "MANAUSDT",
  "MASAUSDT",
  "MYRIAUSDT",
  "ONGUSDT",
  "ORCAUSDT",
  "PHAUSDT",
  "PIRATEUSDT",
  "PIXELUSDT",
  "POWRUSDT",
  "QNTUSDT",
  "QTUMUSDT",
  "RDNTUSDT",
  "SAFEUSDT",
  "SCAUSDT",
  "SLFUSDT",
  "SLPUSDT",
  "SNTUSDT",
  "SNXUSDT",
  "SPELLUSDT",
  "SSVUSDT",
  "SUPERUSDT",
  "TNSRUSDT",
  "TOKENUSDT",
  "VANRYUSDT",
  "VELOUSDT",
  "VRAUSDT",
  "WOOUSDT",
  "WUSDT",
  "XVGUSDT",
  "ZKUSDT",
  "AIUSDT",
  "FIDAUSDT",
  "HOOKUSDT",
  "MBOXUSDT",
  "SYNUSDT",
  "WAXPUSDT",
  "APTUSDT",
  "AEVOUSDT",
  "ALTUSDT",
  "AXLUSDT",
  "BAKEUSDT",
  "BBUSDT",
  "MAVIAUSDT",
  "MAVUSDT",
  "MEMEUSDT",
  "MOBILEUSDT",
  "MONUSDT",
  "PORTALUSDT",
  "ALPACAUSDT",
  "ALPHAUSDT",
  "API3USDT",
  "ARPAUSDT",
  "AUCTIONUSDT",
  "BELUSDT",
  "BICOUSDT",
  "C98USDT",
  "CELRUSDT",
  "DASHUSDT",
  "DODOUSDT",
  "ICXUSDT",
  "IOTAUSDT",
  "JOEUSDT",
  "LINAUSDT",
  "MBLUSDT",
  "MINAUSDT",
  "MTLUSDT",
  "ORBSUSDT",
  "RAREUSDT",
  "RVNUSDT",
  "SKLUSDT",
  "SUSHIUSDT",
  "UMAUSDT",
  "XEMUSDT",
  "YGGUSDT",
  "ZILUSDT",
  "BATUSDT",
  "CAKEUSDT",
  "ILVUSDT",
  "ANKRUSDT",
  "CELOUSDT",
  "DARUSDT",
  "STGUSDT",
  "SXPUSDT",
  "LPTUSDT",
  "ONTUSDT",
  "STEEMUSDT",
];

// Filter coins where category is "V" and the symbol is not in the symbols array
const coinsToBlacklist = coins.filter(
  (coin) => coin.category === "VI" && !symbols.includes(coin.symbol)
);

// Assign `collection = "coin-black-list"` to the filtered coins
const updatedCoins = coinsToBlacklist.map((coin) => ({
  ...coin,
  collection: "coin-black-list",
}));

// Update these coins back in the database
for (const coin of updatedCoins) {
  await CoinOperator.updateCoin(CoinsCollections.CoinRepo, coin.symbol, {
    collection: "coin-black-list",
  });
}

console.log(`${updatedCoins.length} coins moved to "coin-black-list".`);
