import { AlertObj } from "../../models/alerts/alert-obj.ts";
import type { Coin } from "../../models/coin/coin.ts";

export function addCoinCategory(coins: Coin[], alertObj: AlertObj) {
  coins.forEach((c) => {
    if (c.symbol == alertObj.symbol) {
      alertObj.coinCategory = c.category;
    }
  });
  return alertObj;
}
