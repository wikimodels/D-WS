import type { AlertObj } from "../../../models/alerts/alert-obj.ts";
import { formateTriggeredAlertsMsg } from "../formatters/alerts-msg/triggered-alerts-msg.ts";
import { sendTgGeneralMessage } from "../send-general-tg-msg.ts";

export async function notifyAboutTriggeredAlerts(alerts: AlertObj[]) {
  const msg = formateTriggeredAlertsMsg(alerts);
  await sendTgGeneralMessage(msg);
}
