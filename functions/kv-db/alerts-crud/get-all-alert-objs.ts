import { AlertObj } from "../../../models/alerts/alert-obj.ts";

export async function getAllAlertObjs(prefix: string) {
  try {
    const objs: AlertObj[] = [];
    const kv = await Deno.openKv();

    const prefixKey = [prefix];
    const iter = kv.list({ prefix: prefixKey });

    for await (const entry of iter) {
      objs.push(entry.value as AlertObj);
    }

    await kv.close(); // Close the KV connection
    return objs; // Return the list of objects
  } catch (e) {
    console.log(e);
  }
  return [];
}
