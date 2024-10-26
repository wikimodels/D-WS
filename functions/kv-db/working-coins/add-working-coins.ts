import type { Coin } from "../../../models/shared/coin.ts";
import { SpaceNames } from "../../../models/shared/space-names.ts";

export async function addWorkingCoins(coins: Coin[]) {
  try {
    const kv = await Deno.openKv();
    let counter = 0;
    for (const coin of coins) {
      const res = await kv.set([SpaceNames.WorkingCoins, coin.symbol], coin);
      if (res.ok == true) {
        counter++;
      }
    }
    return {
      inserted: counter,
    };
  } catch (e) {
    console.log(e);
  }
}
