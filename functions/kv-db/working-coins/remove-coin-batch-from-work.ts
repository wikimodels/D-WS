import type { Coin } from "../../../models/shared/coin.ts";
import { SpaceNames } from "../../../models/shared/space-names.ts";

export async function removeCoinBatchFromWork(symbols: string[]) {
  try {
    const kv = await Deno.openKv();
    let counter = 0;
    for (const symbol of symbols) {
      await kv.delete([SpaceNames.WorkingCoins, symbol]);
      counter++;
    }
    await kv.close();
    return { deleted: counter };
  } catch (e) {
    console.log(e);
  }
}
