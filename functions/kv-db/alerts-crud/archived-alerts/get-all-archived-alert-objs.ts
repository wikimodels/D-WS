import { _TextDecoder } from "https://deno.land/std@0.92.0/node/_utils.ts";
import _ from "https://cdn.skypack.dev/lodash";
import { AlertObj } from "../../../../models/alerts/alert-obj.ts";
import { SpaceNames } from "../../../../models/shared/space-names.ts";

export async function getAllArchivedAlertObjs() {
  try {
    let objs: AlertObj[] = [];
    const kv = await Deno.openKv();

    const prefixKey = [SpaceNames.ArchivedAlerts];
    const iter = kv.list({ prefix: prefixKey });

    for await (const entry of iter) {
      objs.push(entry.value as AlertObj);
    }
    objs = _.orderBy(objs, "symbol", "asc");
    await kv.close(); // Close the KV connection
    return objs; // Return the list of objects
  } catch (e) {
    console.log(e);
  }
  return [];
}
