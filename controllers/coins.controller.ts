// deno-lint-ignore-file no-unused-vars
import { CoinRepository } from "../global/coins/coin-repository.ts";
import type { Coin } from "../models/shared/coin.ts";

await CoinRepository.initializeFromDb();
const coinRepo = CoinRepository.getInstance();

export const getAllCoins = (req: any, res: any) => {
  try {
    const coins = coinRepo.getAllCoins(); // Await if this is an async function
    res.status(200).send(coins); // Send successful response with coins data
  } catch (error) {
    console.error("Error retrieving coins:", error);
    res.status(500).send("An error occurred while fetching coins.");
  }
};

export const addCoinToDb = async (req: any, res: any) => {
  const coin = req.body;
  // Validate the coin object
  if (!coin) {
    return res.status(400).send("Bad Request: Invalid coin structure");
  }
  // Add to the database if valid
  try {
    const result = await coinRepo.addCoinToDb(coin);
    res.status(200).send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error saving the coin to the database");
  }
};

export const deleteCoinFromDb = async (req: any, res: any) => {
  const { symbol } = req.body;

  // Validate the symbol
  if (!symbol || typeof symbol !== "string") {
    return res
      .status(400)
      .send("Bad Request: Missing or invalid 'symbol' parameter.");
  }

  try {
    const result = await coinRepo.deleteCoinFromDb(symbol);
    if (!result.deleted) {
      return res.status(404).send(`Coin with symbol '${symbol}' not found.`);
    }

    res.status(200).send({
      deleted: true,
      symbol: symbol,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting coin:", error);
    res
      .status(500)
      .send("An internal server error occurred while deleting the coin.");
  }
};

export const updateCoinInDb = async (req: any, res: any) => {
  const coin: Coin = req.body;
  // Validate the coin object
  if (!coin || !coin.symbol) {
    return res.status(400).send("Bad Request: Invalid coin structure");
  }
  // Add to the database if valid
  try {
    const result = await coinRepo.updateCoinInDb(coin.symbol, coin);
    res.status(200).send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error saving the coin to the database");
  }
};
