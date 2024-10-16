import { AlertObj } from "../../../../models/alerts/alert-obj.ts";
import { SpaceNames } from "../../../../models/shared/space-names.ts";

export async function updateAlertObj(obj: AlertObj) {
  try {
    const kv = await Deno.openKv();
    await kv.delete([SpaceNames.Alerts, obj.id]);
    const res = await kv.set([SpaceNames.Alerts, obj.id], obj);
    await kv.close();
    return res;
  } catch (e) {
    console.log(e);
  }
}
