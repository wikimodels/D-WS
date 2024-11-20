import { CoinOperator } from "./global/coins/coin-operator.ts";
import { SantimentProvider } from "./global/santiment/santiment-provider.ts";
await CoinOperator.initializeInstance();
const res = await SantimentProvider.findCoinsWithSantimentDataMissing();
console.log(res.length);
