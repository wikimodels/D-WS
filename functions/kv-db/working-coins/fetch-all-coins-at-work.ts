import _ from "https://cdn.skypack.dev/lodash";

import type { Coin } from "../../../models/shared/coin.ts";
import { SpaceNames } from "../../../models/shared/space-names.ts";

export async function fetchAllCoinsAtWork() {
  try {
    let objs: Coin[] = [];
    const kv = await Deno.openKv();

    const prefixKey = [SpaceNames.WorkingCoins];
    const iter = kv.list({ prefix: prefixKey });
    for await (const entry of iter) {
      objs.push(entry.value as Coin);
    }
    await kv.close(); // Close the KV connection
    objs = _.orderBy(objs, "symbol", "asc");
    return objs; // Return the list of objects
  } catch (e) {
    console.log(e);
  }
  return [];
}
