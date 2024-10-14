import { AlertObj } from "../../models/alerts/alert-obj.ts";
import { Coin } from "../../models/shared/coin.ts";
import { Exchange } from "../../models/shared/exchange.ts";

export function addCoinExchange(coins: Coin[], alertObjs: AlertObj[]) {
  coins.forEach((c) => {
    alertObjs.forEach((a) => {
      if (c.symbol == a.symbol && c.exchange == "by") {
        a.coinExchange = Exchange.By;
      }
      if (c.symbol == a.symbol && c.exchange == "bi") {
        a.coinExchange = Exchange.Bi;
      }
      if (c.symbol == a.symbol && c.exchange == "biby") {
        a.coinExchange = Exchange.BiBy;
      }
    });
  });
  return alertObjs;
}
