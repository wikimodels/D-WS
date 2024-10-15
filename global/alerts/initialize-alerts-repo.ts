import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
import { Coin } from "../../models/shared/coin.ts";

import { loadCSV } from "../../functions/utils/csv/load-csv.ts";
import { mapDataToAlerts } from "./map-data-to-alerts.ts";
import { KlineObj } from "../../models/shared/kline.ts";

import { AlertsRepo } from "../../models/alerts/alerts-repo.ts";
import { AlertObj } from "../../models/alerts/alert-obj.ts";
import { sendTgKeyLevelBreakMessage } from "../../functions/tg/key-level-break/send-tg-key-level-break-msg.ts";
import { addLinks } from "./add-links.ts";
import { addCoinExchange } from "./add-coin-exchange.ts";
import { ConsoleHandler } from "https://deno.land/std@0.195.0/log/handlers.ts";

export let alertsRepo: AlertsRepo[] = [];

export async function initializeAlertsRepo(coins: Coin[]) {
  let alerts = await getAlertsList();
  alerts = addCoinExchange(coins, alerts);
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
      a = addLinks(a);
      if (a.symbol == "SHIB1000USDT") {
        console.log("-------------------------");
        console.log(a);
      }
      triggeredAlerts.push(a);
    }
  });

  if (triggeredAlerts.length > 0) {
    triggeredAlerts.forEach(async (a) => {
      await sendTgKeyLevelBreakMessage(a);
    });

    console.log("Triggered Alerts: ", triggeredAlerts.length);
  }
  return triggeredAlerts;
}

export async function getAlertsList() {
  try {
    const data = await loadCSV("./alerts.csv");
    const alerts = mapDataToAlerts(data);
    return alerts;
  } catch (e) {
    console.log(e);
  }
  return [];
}
