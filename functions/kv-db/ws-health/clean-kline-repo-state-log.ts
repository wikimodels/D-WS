import { SpaceNames } from "../../../models/shared/space-names.ts";

export async function cleanKlineRepoStateLog() {
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

    return { deleted: counter };
  } catch (e) {
    console.log(e);
  }
}
