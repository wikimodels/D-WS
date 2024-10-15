import { AlertObj } from "../../models/alerts/alert-obj.ts";
import { Coin } from "../../models/shared/coin.ts";
import { Exchange } from "../../models/shared/exchange.ts";

export function addCoinExchange(coins: Coin[], alertObj: AlertObj) {
  coins.forEach((c) => {
    if (c.symbol == alertObj.symbol && c.exchange == "by") {
      alertObj.coinExchange = Exchange.By;
    }
    if (c.symbol == alertObj.symbol && c.exchange == "bi") {
      alertObj.coinExchange = Exchange.Bi;
    }
    if (c.symbol == alertObj.symbol && c.exchange == "biby") {
      alertObj.coinExchange = Exchange.BiBy;
    }
  });
  return alertObj;
}
