import { _ } from "https://cdn.skypack.dev/lodash";
import type { Coin } from "../../../models/shared/coin.ts";
import { SpaceNames } from "../../../models/shared/space-names.ts";

export async function fetchSantimentMissingCoins(): Promise<Coin[]> {
  let kv;
  let coins: Coin[] = [];

  try {
    kv = await Deno.openKv();
    const iter = kv.list({ prefix: [SpaceNames.SantimentMissing] });

    for await (const entry of iter) {
      try {
        coins.push(entry.value as Coin);
      } catch (entryError) {
        console.error("Error processing entry from KV store:", entryError);
        throw entryError;
      }
    }
    // Sort the array after collecting all entries
    coins = _.orderBy(coins, "symbol", "asc");
  } catch (openKvError) {
    console.error("Error opening KV store or fetching entries:", openKvError);
    throw openKvError; // Re-throw to propagate error if needed
  } finally {
    if (kv) {
      await kv.close(); // Ensure the KV store is closed
    }
  }

  return coins;
}
