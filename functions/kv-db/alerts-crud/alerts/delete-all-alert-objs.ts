import { SpaceNames } from "../../../../models/shared/space-names.ts";

export async function deleteAllAlertObjs() {
  try {
    let counter = 0;
    const kv = await Deno.openKv();
    const prefixKey = [SpaceNames.Alerts];
    const iter = kv.list({ prefix: prefixKey });
    for await (const entry of iter) {
      await kv.delete(entry.key);
      counter++;
    }
    await kv.close(); // Close the KV connection

    const msg = `${prefix}: deleted ${counter} object(s)`;
    console.log(msg);
    return msg;
  } catch (e) {
    console.log(e);
  }
}
