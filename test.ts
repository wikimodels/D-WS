import { SantimentProvider } from "./global/santiment/santiment-provider.ts";
import {
  currentMonth,
  monthsAgo,
} from "./global/utils/santiment/santiment-dates.ts";

const fromData = monthsAgo(6);
const toDate = currentMonth();
console.log(fromData);
console.log(toDate);
// const santimentProvider = SantimentProvider.initializeInstance();
// const res = await SantimentProvider.getSantimentEChartsData(
//   "solana",
//   "SOLUSDT",
//   fromData,
//   toDate
// );
//
//console.log(res);
