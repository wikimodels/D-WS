import type { Coin } from "../../../models/shared/coin.ts";
import { SpaceNames } from "../../../models/shared/space-names.ts";

export async function removeCoinButchFromWork(coins: Coin[]) {
  try {
    const kv = await Deno.openKv();
    let counter = 0;
    for (const coin of coins) {
      await kv.delete([SpaceNames.WorkingCoins, coin.symbol]);
      counter++;
    }
    await kv.close();
    return { deleted: counter };
  } catch (e) {
    console.log(e);
  }
}
