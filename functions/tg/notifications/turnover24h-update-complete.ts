import { formateTurnover24hUpdateNotificationMsg } from "../formatters/coin-msg/turnover24h-update.ts";
import { sendTgGeneralMessage } from "../send-general-tg-msg.ts";

export async function notifyAboutTurnover24hUpdateCompletion(
  projectName: string
) {
  const msg = formateTurnover24hUpdateNotificationMsg(projectName);
  await sendTgGeneralMessage(msg);
}
