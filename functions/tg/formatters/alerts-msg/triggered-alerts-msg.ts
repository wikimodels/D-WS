import { AlertObj } from "../../../../models/alerts/alert.ts";
import { UnixToNamedTimeRu } from "../../../utils/time-converter.ts";

export function formateTriggeredAlertsMsg(alertObjs: AlertObj[]) {
  let msg = "<b>✴️ TRIGGERED ALERTS</b>";
  alertObjs.forEach((a) => {
    msg =
      msg + `<b><a href = "${a.tvLink}">${a.symbol}</a>: ${a.keyLevelName}</b>`;
  });
  return (
    msg +
    `
  ⏰ ${UnixToNamedTimeRu(new Date().getTime())}
  `
  );
}
