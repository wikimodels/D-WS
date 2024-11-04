import { SpaceNames } from "../../../models/shared/space-names.ts";

export async function deleteCoinArrayFromBlackList(
  symbols: string[]
): Promise<void> {
  let kv;
  try {
    kv = await Deno.openKv();

    for (const symbol of symbols) {
      try {
        // Attempt to delete each symbol
        await kv.delete([SpaceNames.CoinBlackList, symbol]);
        console.log(`Successfully deleted symbol: ${symbol}`);
      } catch (error) {
        // Log the error for the specific symbol but continue with the next
        console.error(`Error deleting symbol '${symbol}':`, error);
        throw error;
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
