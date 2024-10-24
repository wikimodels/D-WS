import { AlertObj } from "../../../../models/alerts/alert-obj.ts";
import { SpaceNames } from "../../../../models/shared/space-names.ts";

export async function updateAlertObj(obj: AlertObj) {
  try {
    const kv = await Deno.openKv();
    const deleteRes = await kv.delete([SpaceNames.Alerts, obj.id]);
    console.log("DelRes ", deleteRes);
    const setRes = await kv.set([SpaceNames.Alerts, obj.id], obj);
    console.log("SetRes ", setRes);

    await kv.close();
    return setRes;
  } catch (e) {
    console.log(e);
  }
}
