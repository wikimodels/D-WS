import type { DeleteResult } from "../../../models/mongodb/operations.ts";
import { SpaceNames } from "../../../models/shared/space-names.ts";

export async function deleteCoinArrayFromBlackList(
  symbols: string[]
): Promise<DeleteResult> {
  let kv;
  let deletedCount = 0;

  try {
    kv = await Deno.openKv();

    for (const symbol of symbols) {
      try {
        // Attempt to delete each symbol
        await kv.delete([SpaceNames.CoinBlackList, symbol]);
        deletedCount++;
        console.log(`Successfully deleted symbol: ${symbol}`);
      } catch (error) {
        // Log the error for the specific symbol but continue with the next
        console.error(`Error deleting symbol '${symbol}':`, error);
      }
    }

    return {
      deleted: deletedCount > 0,
      deletedCount,
    } as DeleteResult;
  } catch (openKvError) {
    // Handle error if KV store fails to open, and propagate it upwards
    console.error("Error opening KV store:", openKvError);
    throw openKvError;
  } finally {
    // Ensure KV store is closed
    if (kv) {
      await kv.close();
    }
  }
}
