import { SpaceNames } from "../../../models/shared/space-names.ts";

export async function removeAllCoinsFromWork() {
  try {
    let counter = 0;
    const kv = await Deno.openKv();
    const prefixKey = [SpaceNames.WorkingCoins];
    const iter = kv.list({ prefix: prefixKey });
    for await (const entry of iter) {
      await kv.delete(entry.key);
      counter++;
    }
    await kv.close();
    return { deleted: counter };
  } catch (e) {
    console.log(e);
  }
}