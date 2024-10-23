import { SpaceNames } from "../../../../models/shared/space-names.ts";

export async function deleteAllTriggeredAlertObjs() {
  try {
    const prefix = SpaceNames.TriggeredAlerts;
    let counter = 0;
    const kv = await Deno.openKv();
    const prefixKey = [prefix];
    const iter = kv.list({ prefix: prefixKey });
    for await (const entry of iter) {
      await kv.delete(entry.key);
      counter++;
    }
    await kv.close(); // Close the KV connection

    return { deleted: 1 };
  } catch (e) {
    console.log(e);
  }
}
