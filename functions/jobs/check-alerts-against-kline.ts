import { getLatestKline } from "../../global/kline/kline-repo.ts";
import type { AlertObj } from "../../models/alerts/alert-obj.ts";
import { fetchAllAlerts } from "../kv-db/alerts-crud/alerts/fetch-all-alert.ts";
import { saveTriggeredAlertsBatch } from "../kv-db/alerts-crud/triggered-alerts/save-triggered-alerts-batch.ts";

export async function checkAlertsAgainstKline() {
  const alerts = await fetchAllAlerts();
  const triggeredAlerts: AlertObj[] = [];

  alerts.forEach((alert) => {
    const candle = getLatestKline(alert.symbol);
    if (candle) {
      if (candle.low <= alert.price && candle.high >= alert.price) {
        triggeredAlerts.push(alert);
      }
    }
  });
  await saveTriggeredAlertsBatch(triggeredAlerts);
  await notifyAboutTriggeredAlerts(triggeredAlerts);
}
