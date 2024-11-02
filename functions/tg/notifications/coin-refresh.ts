import { formatCoinRefreshNotificationMsg } from "../formatters/coin-msg/coin-refresh-notification.ts";
import { sendTgGeneralMessage } from "../send-general-tg-msg.ts";

export async function notifyAboutCoinsRefresh(
  coins: any[],
  projectName: string,
  fnName: string
) {
  const msg = formatCoinRefreshNotificationMsg(coins, projectName, fnName);
  await sendTgGeneralMessage(msg);
}
