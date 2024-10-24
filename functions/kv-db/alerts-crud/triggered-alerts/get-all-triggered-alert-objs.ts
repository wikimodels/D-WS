import { _ } from "https://cdn.skypack.dev/-/lodash@v4.17.21-K6GEbP02mWFnLA45zAmi/dist=es2019,mode=imports/optimized/lodash.js";
import { AlertObj } from "../../../../models/alerts/alert-obj.ts";
import { SpaceNames } from "../../../../models/shared/space-names.ts";

export async function getAllTriggeredAlertObjs() {
  try {
    const prefix = SpaceNames.TriggeredAlerts;
    let objs: AlertObj[] = [];
    const kv = await Deno.openKv();

    const prefixKey = [prefix];
    const iter = kv.list({ prefix: prefixKey });

    for await (const entry of iter) {
      objs.push(entry.value as AlertObj);
    }

    await kv.close();
    objs = _.orderBy(objs, ["activationTime"], ["desc"]);
    return objs;
  } catch (e) {
    console.log(e);
  }
  return [];
}
