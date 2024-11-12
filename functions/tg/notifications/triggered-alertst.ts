import type { Alert } from "../../../models/alerts/alert.ts";
import { formateTriggeredAlertsMsg } from "../formatters/alerts-msg/triggered-alerts-msg.ts";
import { sendTgBusinessMessage } from "../tg-clients.ts";

export async function notifyAboutTriggeredAlerts(alerts: Alert[]) {
  const msg = formateTriggeredAlertsMsg(alerts);
  await sendTgBusinessMessage(msg);
}
