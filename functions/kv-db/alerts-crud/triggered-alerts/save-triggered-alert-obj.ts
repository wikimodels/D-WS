import { AlertObj } from "../../../../models/alerts/alert-obj.ts";
import { SpaceNames } from "../../../../models/shared/space-names.ts";

export async function saveTriggeredAlertObj(alertObj: AlertObj) {
  try {
    const kv = await Deno.openKv();
    await kv.set([SpaceNames.TriggeredAlerts, alertObj.id], alertObj);
    await kv.close();
  } catch (e) {
    console.log(e);
  }
}
