import type { ModifyResult } from "../../../models/mongodb/operations.ts";
import { formateTurnover24hUpdateNotificationMsg } from "../formatters/coin-msg/turnover24h-update.ts";
import { sendTgTechMessage } from "../tg-clients.ts";

export async function notifyAboutTurnover24hUpdateCompletion(
  projectName: string,
  bybitModifyResult: ModifyResult,
  binanceModifyResult: ModifyResult
) {
  const msg = formateTurnover24hUpdateNotificationMsg(
    projectName,
    bybitModifyResult,
    binanceModifyResult
  );
  await sendTgTechMessage(msg);
}
