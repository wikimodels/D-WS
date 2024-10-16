import { AlertObj } from "../../models/alerts/alert-obj.ts";
import { Coin } from "../../models/shared/coin.ts";

export function addCoinCategory(coins: Coin[], alertObj: AlertObj) {
  coins.forEach((c) => {
    if (c.symbol == alertObj.symbol) {
      alertObj.coinCategory == c.category;
    }
  });
  return alertObj;
}
