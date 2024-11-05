import type { DeleteResult } from "../../../models/mongodb/operations.ts";
import { SpaceNames } from "../../../models/shared/space-names.ts";

export async function deleteCoinFromBlackList(
  symbol: string
): Promise<DeleteResult> {
  let kv;
  try {
    kv = await Deno.openKv();

    // Try to delete the coin from the blacklist
    await kv.delete([SpaceNames.CoinBlackList, symbol]);
    return { deleted: true, deletedCount: 1 } as DeleteResult;
  } catch (error) {
    console.error(`Error deleting coin '${symbol}' from blacklist:`, error);
    throw error; // Re-throw to propagate the error
  } finally {
    // Ensure KV store is closed
    if (kv) {
      await kv.close();
    }
  }
}
