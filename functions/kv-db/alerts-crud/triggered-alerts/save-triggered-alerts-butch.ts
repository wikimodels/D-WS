import { AlertObj } from "../../../../models/alerts/alert-obj.ts";
import { SpaceNames } from "../../../../models/shared/space-names.ts";
import { UnixToTime } from "../../../utils/time-converter.ts";

export async function saveTriggeredAlertsButch(alertObjs: AlertObj[]) {
  try {
    const kv = await Deno.openKv();
    for (const alertObj of alertObjs) {
      const activeationTime = new Date().getTime();
      alertObj.id = crypto.randomUUID();
      alertObj.activationTime = activeationTime;
      alertObj.activationTimeStr = UnixToTime(activeationTime);
      await kv.set([SpaceNames.TriggeredAlerts, alertObj.id], alertObj);
    }
    await kv.close();
  } catch (e) {
    console.log(e);
  }
}
