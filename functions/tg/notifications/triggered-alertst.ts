import type { Alert } from "../../../models/alerts/alert.ts";
import { formatTriggeredAlertsMsg } from "../formatters/alerts-msg/triggered-alerts-msg.ts";

import { sendTgBusinessMessage } from "../tg-clients.ts";

export async function notifyAboutTriggeredAlerts(alerts: Alert[]) {
  const msg = formatTriggeredAlertsMsg(alerts);
  await sendTgBusinessMessage(msg);
}
