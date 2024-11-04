import type { Coin } from "../../../models/shared/coin.ts";
import { SpaceNames } from "../../../models/shared/space-names.ts";

export async function saveCoinArrayToSantimentMissing(
  coins: Coin[]
): Promise<void> {
  let kv;
  try {
    kv = await Deno.openKv();

    for (const coin of coins) {
      try {
        await kv.set([SpaceNames.SantimentMissing, coin.symbol], coin);
      } catch (error) {
        console.error(
          `Error saving coin '${coin.symbol}' to CoinGeckoMissing:`,
          error
        );
        throw error;
      }
    }
  } catch (openKvError) {
    // Handle any error that occurs when opening the KV store
    console.error("Error opening KV store:", openKvError);
    throw openKvError; // Re-throw if opening the KV store fails
  } finally {
    // Ensure KV store is closed
    if (kv) {
      await kv.close();
    }
  }
}
