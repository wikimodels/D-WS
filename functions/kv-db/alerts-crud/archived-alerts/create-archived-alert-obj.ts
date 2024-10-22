import { AlertObj } from "../../../../models/alerts/alert-obj.ts";
import { SpaceNames } from "../../../../models/shared/space-names.ts";

export async function createArchivedAlertObj(alertObj: AlertObj) {
  try {
    const kv = await Deno.openKv();
    alertObj.isActive = false;
    await kv.delete([SpaceNames.Alerts, alertObj.id]);
    const res = await kv.set(
      [SpaceNames.ArchivedAlerts, alertObj.id],
      alertObj
    );
    await kv.close();
    return res;
  } catch (e) {
    console.log(e);
  }
}
