import { formatCoinRefreshNotificationMsg } from "../formatters/coin-msg/coin-refresh-notification.ts";
import { sendTgGeneralMessage } from "../send-general-tg-msg.ts";

export async function notifyAboutCoinsRefresh(
  projectName: string,
  className: string,
  fnName: string
) {
  const msg = formatCoinRefreshNotificationMsg(projectName, className, fnName);
  await sendTgGeneralMessage(msg);
}
