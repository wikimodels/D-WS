// deno-lint-ignore-file no-explicit-any no-explicit-any
import { CoinOperator } from "../../global/coins/coin-operator.ts";
import type { CoinUpdateData } from "../../models/coin/coin-update-data.ts";
import type { Coin } from "../../models/coin/coin.ts";

export const getAllCoins = (_req: any, res: any) => {
  try {
    const coins = CoinOperator.getAllCoinsFromRepo();
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

export const getCoinsByCollectionName = (req: any, res: any) => {
  try {
    const collectionName = req.query.collectionName;
    if (!collectionName) {
      return res
        .status(400)
        .send("Bad Request: 'collectionName' must be a string.");
    }
    const coins = CoinOperator.getAllCoinsFromRepo().filter(
      (c) => c.collection == collectionName
    );
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
  const { symbols } = req.body;

  if (!symbols || !Array.isArray(symbols)) {
    return res
      .status(400)
      .send("Bad Request: 'symbols' must be an array of strings.");
  }

  try {
    const result = await CoinOperator.deleteCoins(symbols);

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

export const addCoin = async (req: any, res: any) => {
  const coin: Coin = req.body;

  if (!coin || !coin.symbol) {
    return res
      .status(400)
      .send(
        "Bad Request: Invalid update parameters (either 'coin' or 'collectionName')"
      );
  }

  try {
    const insertResult = await CoinOperator.addCoin(coin);
    res.status(200).send(insertResult);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error saving the coin to the database");
  }
};

export const addCoins = async (req: any, res: any) => {
  const coins: Coin[] = req.body;

  if (!coins || !Array.isArray(coins)) {
    return res
      .status(400)
      .send("Bad Request: Invalid update parameters ('coins')");
  }

  try {
    const insertResult = await CoinOperator.addCoins(coins);
    res.status(200).send(insertResult);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error saving the coin to the database");
  }
};

export const updateCoin = async (req: any, res: any) => {
  const updateData: CoinUpdateData = req.body;
  if (!updateData || !updateData.symbol) {
    return res
      .status(400)
      .send("Bad Request: Invalid update parameters ('updateData')");
  }

  try {
    const modiyResult = await CoinOperator.updateCoin(updateData);
    res.status(200).send(modiyResult);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error saving the coin to the database");
  }
};

export const updateCoins = async (req: any, res: any) => {
  const updateData: Array<CoinUpdateData> = req.body;
  if (!updateData || !Array.isArray(updateData)) {
    return res
      .status(400)
      .send("Bad Request: Invalid update parameters ('coin')");
  }

  try {
    const modiyResult = await CoinOperator.updateCoins(updateData);
    res.status(200).send(modiyResult);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error saving the coin to the database");
  }
};

export const getCoinsRepoStatistics = async (_req: any, res: any) => {
  try {
    const result = await CoinOperator.getCoinsRepoStatistics();
    if (result) {
      res.status(200).send(result);
    } else {
      res.status(503).send("CoinOperator not initialized yet");
    }
  } catch (error) {
    console.error("Error retrieving working coins statistics:", error);
    res.status(500).send("An error occurred while fetching coins statistics.");
  }
};
