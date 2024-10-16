import { AlertObj } from "../../../../models/alerts/alert-obj.ts";
import { SpaceNames } from "../../../../models/shared/space-names.ts";

export async function getAllTriggeredAlertObjs() {
  try {
    const prefix = SpaceNames.TriggeredAlerts;
    const objs: AlertObj[] = [];
    const kv = await Deno.openKv();

    const prefixKey = [prefix];
    const iter = kv.list({ prefix: prefixKey });

    for await (const entry of iter) {
      objs.push(entry.value as AlertObj);
    }

    await kv.close();
    return objs;
  } catch (e) {
    console.log(e);
  }
  return [];
}
