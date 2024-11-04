import type { Coin } from "../../../models/shared/coin.ts";
import { SpaceNames } from "../../../models/shared/space-names.ts";

export async function addCoinArrayToBlackList(coins: Coin[]): Promise<void> {
  let kv;
  try {
    kv = await Deno.openKv();

    for (const coin of coins) {
      try {
        // Attempt to add each coin to the blacklist
        await kv.set([SpaceNames.CoinBlackList, coin.symbol], coin);
        console.log(`Successfully added coin to blacklist: ${coin.symbol}`);
      } catch (error) {
        // Log error for the specific coin but continue with the next
        console.error(
          `Error adding coin '${coin.symbol}' to blacklist:`,
          error
        );
      }
    }
  } catch (openKvError) {
    // Handle error if KV store fails to open
    console.error("Error opening KV store:", openKvError);
    throw openKvError;
  } finally {
    // Ensure KV store is closed
    if (kv) {
      await kv.close();
    }
  }
}
