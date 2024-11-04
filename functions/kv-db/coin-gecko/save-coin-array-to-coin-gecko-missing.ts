import type { Coin } from "../../../models/shared/coin.ts";
import { SpaceNames } from "../../../models/shared/space-names.ts";

export async function saveCoinArrayToCoinGeckoMissing(
  coins: Coin[]
): Promise<void> {
  let kv;
  try {
    kv = await Deno.openKv();

    for (const coin of coins) {
      try {
        // Attempt to save each coin to the "CoinGeckoMissing" space
        await kv.set([SpaceNames.CoinGeckoMissing, coin.symbol], coin);
        console.log(
          `Successfully saved coin to CoinGeckoMissing: ${coin.symbol}`
        );
      } catch (error) {
        // Log any error for this specific coin but continue with the next
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
