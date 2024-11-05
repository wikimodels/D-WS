import type { Coin } from "../../../models/shared/coin.ts";
import { SpaceNames } from "../../../models/shared/space-names.ts";

export async function fetchCoinsBlackList(): Promise<Coin[]> {
  const coins: Coin[] = [];
  let kv;

  try {
    kv = await Deno.openKv();
    const iter = kv.list({ prefix: [SpaceNames.CoinBlackList] });

    for await (const entry of iter) {
      coins.push(entry.value as Coin);
    }

    // Sort coins by symbol
    coins.sort((a, b) => a.symbol.localeCompare(b.symbol));
  } catch (error) {
    console.error("Error in fetchCoinsBlackList:", error);
    throw error; // Propagate the error further
  } finally {
    if (kv) kv.close(); // Ensure KV store is closed if it was opened
  }

  return coins;
}
