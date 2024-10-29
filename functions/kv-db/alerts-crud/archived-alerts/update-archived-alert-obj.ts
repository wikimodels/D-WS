import { AlertObj } from "../../../../models/alerts/alert-obj.ts";
import { SpaceNames } from "../../../../models/shared/space-names.ts";

export async function updateAlertInArchive(obj: AlertObj) {
  try {
    const kv = await Deno.openKv();
    const setRes = await kv.set([SpaceNames.ArchivedAlerts, obj.id], obj);
    await kv.close();
    return setRes;
  } catch (e) {
    console.log(e);
  }
}
