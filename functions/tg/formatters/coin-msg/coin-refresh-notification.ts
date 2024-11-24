// import { UnixToNamedTimeRu } from "../../../utils/time-converter.ts";

import type {
  InsertResult,
  DeleteResult,
} from "../../../../models/mongodb/operations.ts";
import { UnixToNamedTimeRu } from "../../../utils/time-converter.ts";

// export function formatCoinRefreshNotificationMsg(
//   data: { symbol: string }[],
//   fnName: string,
//   projectName: string
// ) {
//   const txt = data.map((d) => d.symbol).join(", ");
//   const timestamp = UnixToNamedTimeRu(new Date().getTime());

//   const msg = `
//   <b>🔄 ${projectName}: <u>${fnName}()</u> Coin Refresh Complete!</b>
//   ━━━━━━━━━━━━━
//   🚀 <b>New santimentTickers:</b>
//   <i>${txt}</i>

//   🕒 <b>Updated:</b> <i>${timestamp}</i>
//   ━━━━━━━━━━━━━`;

//   return msg;
// }

export function formatCoinRefreshNotificationMsg(
  projectName: string,
  className: string,
  result: InsertResult
) {
  const timestamp = UnixToNamedTimeRu(new Date().getTime());

  const msg = `
  <b>🈯️ ${projectName}:${className} Coin Refreshment Done</b>
  
  <i>Procedure renewed the list of Coin-Provider Collection.</i>     
  <b>Inserted new Coins:</b>  ${result.insertedCount}
  ━━━━━━━━━━━━━    
  🕒 <b>Time:</b> <i>${timestamp}</i>
  `;
  return msg;
}
