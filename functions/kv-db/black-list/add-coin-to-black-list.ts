import type { Coin } from "../../../models/shared/coin.ts";
import { SpaceNames } from "../../../models/shared/space-names.ts";

export async function addCoinToBlackList(coin: Coin): Promise<void> {
  let kv;
  try {
    kv = await Deno.openKv();
    await kv.set([SpaceNames.CoinBlackList, coin.symbol], coin); // No meaningful return value
  } catch (error) {
    console.error("Error adding coin to blacklist:", error);
    throw error; // Re-throw to propagate the error
  } finally {
    if (kv) {
      await kv.close();
    }
  }
}
