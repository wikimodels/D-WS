import { AlertObj } from "../../../../models/alerts/alert-obj.ts";
import { SpaceNames } from "../../../../models/shared/space-names.ts";

export async function getAlertObjById(id: string): Promise<AlertObj | null> {
  const kv = await Deno.openKv();
  const result = await kv.get([SpaceNames.Alerts, id]);
  await kv.close();

  if (result.value) {
    return result.value as AlertObj;
  } else {
    console.log(`No object found for id: ${id}`);
    return null;
  }
}
