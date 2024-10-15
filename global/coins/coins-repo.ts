import { Coin } from "../../models/shared/coin.ts";
import { getAllCoins } from "./get-all-coins.ts";

export let coins: Coin[] = [];
export async function initializeCoinsRepo() {
  coins = await getAllCoins();
}
export function getCoinsRepo() {
  const _coins = coins;
  return _coins;
}
