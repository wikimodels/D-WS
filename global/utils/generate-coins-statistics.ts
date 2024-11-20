import type { Coin } from "../../models/coin/coin.ts";

export function generateCoinsStatistics(coins: Coin[]): Record<string, any> {
  const statistics: Record<string, any> = { total: 0 }; // Initialize with total

  coins.forEach((coin) => {
    const category = coin.category || "unknown"; // Fallback for undefined category
    const coinExchange = coin.coinExchange || "unknown"; // Fallback for undefined coinExchange

    // Initialize the category group if not already present
    if (!statistics[category]) {
      statistics[category] = { total: 0 };
    }

    // Initialize the coinExchange count if not already present
    if (!statistics[category][coinExchange]) {
      statistics[category][coinExchange] = 0;
    }

    // Increment counts
    statistics[category][coinExchange]++;
    statistics[category].total++;
    statistics.total++;
  });

  return statistics;
}
