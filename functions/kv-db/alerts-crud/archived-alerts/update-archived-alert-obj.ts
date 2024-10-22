import { AlertObj } from "../../../../models/alerts/alert-obj.ts";
import { SpaceNames } from "../../../../models/shared/space-names.ts";

export async function updateArchivedAlertObj(obj: AlertObj) {
  try {
    const kv = await Deno.openKv();
    await kv.delete([SpaceNames.ArchivedAlerts, obj.id]);
    const setRes = await kv.set([SpaceNames.ArchivedAlerts, obj.id], obj);
    await kv.close();
    return setRes;
  } catch (e) {
    console.log(e);
  }
}
