import { addCoinCategory } from "../../../../global/coins/add-coin-category.ts";
import { addCoinExchange } from "../../../../global/coins/add-coin-exchange.ts";
import { addLinks } from "../../../../global/coins/add-links.ts";
import type { AlertObj } from "../../../../models/alerts/alert-obj.ts";
import type { Coin } from "../../../../models/shared/coin.ts";
import { UnixToTime } from "../../../utils/time-converter.ts";
import { createAlertObj } from "./create-alert-obj.ts";

export async function createAlertButch(alerts: AlertObj[], coins: Coin[]) {
  try {
    let counter = 0;
    for (let alert of alerts) {
      alert.id = crypto.randomUUID();
      alert.creationTime = new Date().getTime();
      alert.isActive = true;
      alert = addCoinExchange(coins, alert);
      alert = addLinks(alert);
      alert = addCoinCategory(coins, alert);
      alert.activationTimeStr = UnixToTime(new Date().getTime());
      const res = await createAlertObj(alert);
      counter = res?.ok == true ? counter + 1 : counter;
    }

    return {
      uploaded: alerts.length,
      saved: counter,
    };
  } catch (e) {
    console.log(e);
  }
}
