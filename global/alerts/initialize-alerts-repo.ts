import { Coin } from "../../models/shared/coin.ts";

import { KlineObj } from "../../models/shared/kline.ts";

import { AlertsRepo } from "../../models/alerts/alerts-repo.ts";
import { AlertObj } from "../../models/alerts/alert-obj.ts";
import { sendTgKeyLevelBreakMessage } from "../../functions/tg/key-level-break/send-tg-key-level-break-msg.ts";
import { getAllAlertObjs } from "../../functions/kv-db/alerts-crud/alerts/get-all-alert-objs.ts";
import { getCoinsRepo } from "../coins/coins-repo.ts";
import { saveTriggeredAlertObj } from "../../functions/kv-db/alerts-crud/triggered-alerts/save-triggered-alert-obj.ts";

export let alertsRepo: AlertsRepo[] = [];

export function getAlertsRepo() {
  const repo = alertsRepo;
  return repo;
}
export async function initializeAlertsRepo() {
  const coins = getCoinsRepo();
  const alerts = await getAllAlertObjs();

  coins.forEach((c) => {
    alertsRepo.push({
      symbol: c.symbol,
      alerts: [],
    });
  });

  alertsRepo.forEach((a) => {
    alerts.forEach((_a) => {
      if (a.symbol == _a.symbol) {
        a.alerts.push(_a);
      }
    });
  });
}

export function checkAlertsList(kline: KlineObj) {
  const triggeredAlerts: AlertObj[] = [];
  const data = alertsRepo.filter((a) => a.symbol == kline.symbol)[0];
  data.alerts.forEach((a) => {
    if (a.price >= kline.low && a.price < kline.high && a.isActive) {
      a.activationTime = new Date().getTime();
      a.low = kline.low;
      a.high = kline.high;
      triggeredAlerts.push(a);
    }
  });

  if (triggeredAlerts.length > 0) {
    triggeredAlerts.forEach(async (a) => {
      if (a.isActive) {
        await sendTgKeyLevelBreakMessage(a);
        await saveTriggeredAlertObj(a);
      }
    });

    console.log("Triggered Alerts: ", triggeredAlerts.length);
  }
}
