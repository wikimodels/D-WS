// deno-lint-ignore-file no-explicit-any
import { CoinOperator } from "../../global/coins/coin-operator.ts";
import type { Coin } from "../../models/shared/coin.ts";

export const getAllCoins = async (req: any, res: any) => {
  try {
    const collectionName = req.query.collectionName;
    const coins = await CoinOperator.getAllCoins(collectionName);
    if (coins) {
      res.status(200).send(coins);
    } else {
      res.status(503).send("CoinOperator not initialized yet");
    }
  } catch (error) {
    console.error("Error retrieving coins:", error);
    res.status(500).send("An error occurred while fetching coins.");
  }
};

export const deleteCoins = async (req: any, res: any) => {
  const symbols = req.body;
  const collectionName = req.query.collectionName;
  if (
    !symbols ||
    !collectionName ||
    !Array.isArray(symbols) ||
    symbols.some((symbol) => typeof symbol !== "string")
  ) {
    return res
      .status(400)
      .send(
        "Bad Request: 'symbols' must be an array of strings. 'collectionName' must be a string."
      );
  }

  try {
    const result = await CoinOperator.deleteCoins(collectionName, symbols);

    if (!result.deleted) {
      return res.status(404).send(`Something went wrong with deletion.`);
    }

    res.status(200).send(result);
  } catch (error) {
    console.error("Error deleting coin:", error);
    res
      .status(500)
      .send("An internal server error occurred while deleting the coin.");
  }
};

export const updateCoin = async (req: any, res: any) => {
  const coin: Coin = req.body;
  const collectionName = req.query.collectionName;
  if (!coin || !coin.symbol || !collectionName) {
    return res
      .status(400)
      .send(
        "Bad Request: Invalid update parameters (either 'coin' or 'collectionName')"
      );
  }

  try {
    const modiyResult = await CoinOperator.updateCoin(
      collectionName,
      coin.symbol,
      coin
    );
    res.status(200).send(modiyResult);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error saving the coin to the database");
  }
};

export const moveCoins = async (req: any, res: any) => {
  const coins = req.body;
  const sourceCollection = req.query.sourceCollection;
  const targetCollection = req.query.targetCollection;
  if (
    !coins ||
    !sourceCollection ||
    !targetCollection ||
    !Array.isArray(coins) ||
    coins.some((symbol) => typeof symbol !== "string")
  ) {
    return res
      .status(400)
      .send(
        "Bad Request: 'symbols' must be an array of strings. 'sourceCollection' must be a string. 'targetCollection' must be a string"
      );
  }

  try {
    const result = await CoinOperator.moveCoins(
      sourceCollection,
      targetCollection,
      coins
    );

    if (!result.moved) {
      return res.status(404).send(`Something went wrong with moving.`);
    }

    res.status(200).send(result);
  } catch (error) {
    console.error("Error deleting coin:", error);
    res
      .status(500)
      .send("An internal server error occurred while deleting the coin.");
  }
};
