import type { InsertResult } from "../../../models/mongodb/operations.ts";
import { formatCoinRefreshNotificationMsg } from "../formatters/coin-msg/coin-refresh-notification.ts";
import { sendTgTechMessage } from "../tg-clients.ts";

export async function notifyAboutCoinsRefresh(
  projectName: string,
  className: string,
  result: InsertResult
) {
  const msg = formatCoinRefreshNotificationMsg(projectName, className, result);
  await sendTgTechMessage(msg);
}
