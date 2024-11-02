// deno-lint-ignore-file no-explicit-any
import { contributeCoinsToWork } from "../functions/kv-db/working-coins/contirbute-coins-to-work.ts";
import { fetchAllCoinsAtWork } from "../functions/kv-db/working-coins/fetch-all-coins-at-work.ts";
import { removeAllCoinsFromWork } from "../functions/kv-db/working-coins/remove-all-coins-from-work.ts";
import { removeCoinBatchFromWork } from "../functions/kv-db/working-coins/remove-coin-batch-from-work.ts";

import type { Coin } from "../models/shared/coin.ts";

export const getAllCoinsAtWork = async (_req: any, res: any) => {
  try {
    const coins = await fetchAllCoinsAtWork();
    res.status(200).send(coins);
  } catch (error) {
    console.error("Error fetching coins at work:", error);
    res.status(500).send({ error: "Failed to fetch coins." });
  }
};

export const deleteAllCoinsFromWork = async (_req: any, res: any) => {
  try {
    const response = await removeAllCoinsFromWork();
    res.status(200).send(response);
  } catch (error) {
    console.error("Error deleting coins from work:", error);
    res.status(500).send({ error: "Failed to delete coins." });
  }
};

export const addCoinsToWork = async (req: any, res: any) => {
  const coins: Coin[] = req.body;
  try {
    const response = await contributeCoinsToWork(coins);
    res.status(201).send(response); // Use 201 for created resources
  } catch (error) {
    console.error("Error adding coins to work:", error);
    res.status(500).send({ error: "Failed to add coins." });
  }
};

export const deleteCoinBatchFromWork = async (req: any, res: any) => {
  const symbols: string[] = req.body;
  try {
    const response = await removeCoinBatchFromWork(symbols);
    res.status(200).send(response);
  } catch (error) {
    console.error("Error deleting coin batch from work:", error);
    res.status(500).send({ error: "Failed to delete coin batch." });
  }
};
