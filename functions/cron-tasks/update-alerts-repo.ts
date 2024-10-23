import { initializeAlertsRepo } from "../../global/alerts/initialize-alerts-repo.ts";
import { emptyKlineRepo } from "../../global/kline/kline-repo.ts";
import { KlineRepo } from "../../global/kline/kline-repo.ts";
import type { AlertObj } from "../../models/alerts/alert-obj.ts";
import { getAllAlertObjs } from "../kv-db/alerts-crud/alerts/get-all-alert-objs.ts";
import { sendTgGeneralInfoMessage } from "../tg/send-tg-info-msg.ts";

export function cronTaskUpdateAlertsRepo() {
  Deno.cron("Update Alerts Repo", { minute: { every: 1 } }, () => {
    setTimeout(async () => {
      const triggeredAlerts = await checkAlerts();
      const symbols = triggeredAlerts.map((a) => a.symbol);
      if (symbols && symbols.length > 0) {
        await sendTgGeneralInfoMessage(symbols[0]);
        emptyKlineRepo();
        console.log("CRON SHIT is DONE...");
      }
    }, 15000);
  });
}

export async function checkAlerts() {
  const alerts = await getAllAlertObjs();
  const triggeredAlerts: string[] = [];
  alerts.forEach((a) => {
    KlineRepo().forEach((r) => {
      if (a.symbol == r.symbol && a.price > r.low && a.price < r.high) {
        const msg = `${r.symbol} price: ${a.price} high: ${r.high} low: ${r.low} `;
        triggeredAlerts.push(msg);
      }
    });
  });
  return alerts;
}
