import type { InsertResult } from "../../../models/mongodb/operations.ts";
import type { Coin } from "../../../models/shared/coin.ts";
import { SpaceNames } from "../../../models/shared/space-names.ts";

export async function addCoinToBlackList(coin: Coin): Promise<InsertResult> {
  let kv;
  try {
    kv = await Deno.openKv();
    await kv.set([SpaceNames.CoinBlackList, coin.symbol], coin);
    return { inserted: true, insertedCount: 1 } as InsertResult;
  } catch (error) {
    console.error("Error adding coin to blacklist:", error);
    throw error; // Re-throw to propagate the error
  } finally {
    if (kv) {
      await kv.close();
    }
  }
}
