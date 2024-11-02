import { AlertObj } from "../../../../models/alerts/alert-obj.ts";
import { SpaceNames } from "../../../../models/shared/space-names.ts";

export async function updataAlertFromTriggered(alertObj: AlertObj) {
  try {
    const kv = await Deno.openKv();
    const res = await kv.set([SpaceNames.Alerts, alertObj.id], alertObj);
    await kv.close();
    return res;
  } catch (e) {
    console.log(e);
  }
}
