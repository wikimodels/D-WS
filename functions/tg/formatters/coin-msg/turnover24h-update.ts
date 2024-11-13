import type { ModifyResult } from "../../../../models/mongodb/operations.ts";
import { UnixToNamedTimeRu } from "../../../utils/time-converter.ts";

export function formateTurnover24hUpdateNotificationMsg(
  projectName: string,
  bybitModifyResult: ModifyResult,
  binanceModifyResult: ModifyResult
) {
  const msg = `
<b>🔄 ${projectName} Turnover24h Update Done</b>

<i>Just finished updating turnover24h property for Bybit and Binance Working Coins</i>

<b>Bybit modified:</b>  ${bybitModifyResult.modifiedCount}
<b>Binance modified:</b>  ${binanceModifyResult.modifiedCount}
━━━━━━━━━━━━━    
🕒 <b>Time:</b> <i>${UnixToNamedTimeRu(new Date().getTime())}</i>
`;
  return msg;
}
