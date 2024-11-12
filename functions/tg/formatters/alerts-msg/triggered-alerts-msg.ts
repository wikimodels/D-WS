import { UnixToNamedTimeRu } from "../../../utils/time-converter.ts";

export function formatTriggeredAlertsMsg(alertObjs: Alert[]) {
  let msg = "<b>✴️ TRIGGERED ALERTS</b>\n\n";

  alertObjs.forEach((a, index) => {
    msg += `
<b>${index + 1}. <a href="${a.tvLink}">${a.symbol}</a></b>
📌 <i>${a.alertName}</i> 
`;
  });

  msg += `
⏰ <b>Report Generated:</b> ${UnixToNamedTimeRu(new Date().getTime())}
`;

  return msg;
}
