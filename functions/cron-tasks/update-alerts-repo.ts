import { initializeAlertsRepo } from "../../global/alerts/initialize-alerts-repo.ts";
import { emptyKlineRepo } from "../../global/kline/kline-repo.ts";
import { KlineRepo } from "../../global/kline/kline-repo.ts";
import type { AlertObj } from "../../models/alerts/alert-obj.ts";
import { getAllAlertObjs } from "../kv-db/alerts-crud/alerts/get-all-alert-objs.ts";
import { sendTgKeyLevelBreakMessage } from "../tg/key-level-break/send-tg-key-level-break-msg.ts";

export function cronTaskUpdateAlertsRepo() {
  Deno.cron("Update Alerts Repo", { minute: { every: 1 } }, () => {
    setTimeout(async () => {
      const triggeredAlerts = await checkAlerts();
      emptyKlineRepo();
      if (triggeredAlerts.length > 0) {
        await sendTgKeyLevelBreakMessage(triggeredAlerts);
        console.log("CRON SHIT is DONE...");
      }
    }, 15000);
  });
}

export async function checkAlerts() {
  const alerts = await getAllAlertObjs();
  const triggeredAlerts: AlertObj[] = [];
  const aave = KlineRepo().find((r) => r.symbol == "AAVEUSDT");
  console.log("AAVE", aave);
  alerts.forEach((a) => {
    KlineRepo().forEach((r) => {
      if (a.symbol == r.symbol && a.price > r.low && a.price < r.high) {
        console.log("from inside loop ", a);
        a.high = r.high;
        a.low = r.low;
        triggeredAlerts.push(a);
      }
    });
  });
  return triggeredAlerts;
}
