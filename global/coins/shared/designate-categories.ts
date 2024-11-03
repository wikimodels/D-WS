import type { Coin } from "../../../models/shared/coin.ts";

export function designateCategories(coins: Coin[], LOWEST_TURNOVER24H: number) {
  coins.forEach((c) => {
    if (c.turnover24h > 200 * 1000 * 1000) {
      c.category = "I";
    } else if (c.turnover24h >= 100 * 1000 * 1000) {
      c.category = "II";
    } else if (c.turnover24h >= 50 * 1000 * 1000) {
      c.category = "III";
    } else if (c.turnover24h >= 10 * 1000 * 1000) {
      c.category = "IV";
    } else if (c.turnover24h >= 5 * 1000 * 1000) {
      c.category = "V";
    } else if (c.turnover24h >= LOWEST_TURNOVER24H) {
      c.category = "VI";
    }
  });
  return coins;
}
