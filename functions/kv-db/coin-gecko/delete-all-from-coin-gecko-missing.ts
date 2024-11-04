import { SpaceNames } from "../../../models/shared/space-names.ts";

export async function deleteAllFromCoinGeckoMissing() {
  let counter = 0;
  let kv;
  try {
    kv = await Deno.openKv();
    const prefixKey = [SpaceNames.CoinGeckoMissing];
    const iter = kv.list({ prefix: prefixKey });

    for await (const entry of iter) {
      try {
        await kv.delete(entry.key);
        counter++;
      } catch (deleteError) {
        console.error(`Failed to delete key ${entry.key}:`, deleteError);
        throw deleteError;
      }
    }
    return { deleted: counter };
  } catch (error) {
    console.error("An error occurred while processing the KV store:", error);
    throw error;
  } finally {
    if (kv) {
      await kv.close;
    }
  }
}
