import { _ } from "https://cdn.skypack.dev/lodash";
import type { Coin } from "../../../models/shared/coin.ts";
import { SpaceNames } from "../../../models/shared/space-names.ts";

export async function fetchCoinsBlackList() {
  let coins: Coin[] = [];
  try {
    const kv = await Deno.openKv();

    try {
      const iter = kv.list({ prefix: [SpaceNames.CoinBlackList] });
      for await (const entry of iter) {
        coins.push(entry.value as Coin);
      }

      // Sort coins by symbol
      coins = _.orderBy(coins, "symbol", "asc");
    } catch (iterationError) {
      console.error("Error while iterating over KV entries:", iterationError);
      throw iterationError; // Re-throw to propagate the error further up
    } finally {
      kv.close(); // Ensure KV store is closed
    }
  } catch (kvError) {
    console.error("Error opening KV store:", kvError);
    throw kvError; // Re-throw to propagate the error further up
  }

  return coins;
}
