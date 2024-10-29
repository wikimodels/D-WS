import { _ } from "https://cdn.skypack.dev/-/lodash@v4.17.21-K6GEbP02mWFnLA45zAmi/dist=es2019,mode=imports/optimized/lodash.js";
import { emptyKlineRepo } from "../../global/kline/kline-repo.ts";
import { KlineRepo } from "../../global/kline/kline-repo.ts";
import type { AlertObj } from "../../models/alerts/alert-obj.ts";
import { getAllAlertObjs } from "../kv-db/alerts-crud/alerts/fetch-all-alert.ts";
import { saveTriggeredAlertsButch } from "../kv-db/alerts-crud/triggered-alerts/save-triggered-alerts-butch.ts";
import { sendTgKeyLevelBreakMessage } from "../tg/key-level-break/send-tg-key-level-break-msg.ts";

export function cronTaskUpdateAlertsRepo() {
  Deno.cron("Update Alerts Repo", { minute: { every: 1 } }, () => {
    setTimeout(async () => {
      const triggeredAlerts = await checkAlerts();
      emptyKlineRepo();
      if (triggeredAlerts.length > 0) {
        await saveTriggeredAlertsButch(triggeredAlerts);
        await sendTgKeyLevelBreakMessage(triggeredAlerts);
        console.log("CRON SHIT is DONE...");
      }
    }, 15000);
  });
}

export async function checkAlerts() {
  const alerts = await getAllAlertObjs();
  let triggeredAlerts: AlertObj[] = [];
  alerts.forEach((a) => {
    KlineRepo().forEach((r) => {
      if (
        a.isActive &&
        a.symbol == r.symbol &&
        a.price > r.low &&
        a.price < r.high
      ) {
        a.high = r.high;
        a.low = r.low;
        triggeredAlerts.push(a);
      }
    });
  });
  triggeredAlerts = _.uniqBy(triggeredAlerts, "keyLevelName");
  return triggeredAlerts;
}
