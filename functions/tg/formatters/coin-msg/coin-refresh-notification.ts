// import { UnixToNamedTimeRu } from "../../../utils/time-converter.ts";

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
  fnName: string
) {
  const timestamp = UnixToNamedTimeRu(new Date().getTime());

  const msg = `
<b>🔄 ${projectName}:${className} Coin Refresh Done 🔄</b>
━━━━━━━━━━━━━ 
🕒 <b>Time:</b> <i>${timestamp}</i>`;
  return msg;
}
