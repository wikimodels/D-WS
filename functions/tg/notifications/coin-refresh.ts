import type {
  DeleteResult,
  InsertResult,
} from "../../../models/mongodb/operations.ts";
import { formatCoinRefreshNotificationMsg } from "../formatters/coin-msg/coin-refresh-notification.ts";
import { sendTgGeneralMessage } from "../send-general-tg-msg.ts";

export async function notifyAboutCoinsRefresh(
  projectName: string,
  className: string,
  result: { insertResult: InsertResult; deleteResult: DeleteResult }
) {
  const msg = formatCoinRefreshNotificationMsg(projectName, className, result);
  await sendTgGeneralMessage(msg);
}
