// deno-lint-ignore-file no-explicit-any
import { CoinProvider } from "../../global/coins/coin-provider.ts";

export const getAllCoins = (_req: any, res: any) => {
  try {
    const coinProvider = CoinProvider.getInstance();
    if (coinProvider) {
      res.status(200).send(coinProvider.getAllCoins());
    } else {
      res.status(503).send("CoinProvider not initialized yet");
    }
  } catch (error) {
    console.error("Error retrieving coins:", error);
    res.status(500).send("An error occurred while fetching coins.");
  }
};

// #region BLACK LIST
export const getBlackListCoins = async (_req: any, res: any) => {
  try {
    const coinProvider = CoinProvider.getInstance();
    if (coinProvider) {
      res.status(200).send(await coinProvider.getCoinsBlackList());
    } else {
      res.status(503).send("Something wrong with CoinProvider");
    }
  } catch (error) {
    console.error("Error retrieving coins from Black List:", error);
    res
      .status(500)
      .send("An error occurred while fetching coins from Black List.");
  }
};

export const moveCoinToBlackList = async (req: any, res: any) => {
  const coin = req.body;
  if (!coin) {
    return res.status(400).send("Bad Request: Invalid coin structure");
  }
  try {
    const coinProvider = CoinProvider.getInstance();
    const result = await coinProvider!.addCoinToBlackList(coin);
    res.status(200).send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error saving the coin to Black List DB");
  }
};

export const moveCoinArrayToBlackList = async (req: any, res: any) => {
  const coins = req.body;
  if (!coins) {
    return res.status(400).send("Bad Request: Invalid coins array structure");
  }
  try {
    const coinProvider = CoinProvider.getInstance();
    const result = await coinProvider!.addCoinArrayToBlackList(coins);
    res.status(200).send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error saving the coins array to Black List DB");
  }
};

export const removeCoinFromBlackList = async (req: any, res: any) => {
  const coin = req.body;
  if (!coin) {
    return res.status(400).send("Bad Request: Invalid coin structure");
  }
  try {
    const coinProvider = CoinProvider.getInstance();
    const result = await coinProvider!.deleteCoinFromBlackList(coin);
    res.status(200).send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error removing the coin from Black List DB");
  }
};

export const removeCoinArrayFromBlackList = async (req: any, res: any) => {
  const coins = req.body;
  if (!coins) {
    return res.status(400).send("Bad Request: Invalid coins array structure");
  }
  try {
    const coinProvider = CoinProvider.getInstance();
    const result = await coinProvider!.deleteCoinArrayFromBlackList(coins);
    res.status(200).send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error removing the coin from Black List");
  }
};

// #endregion

// #region COIN GECKO MISSING
export const getCoinGeckoMissingCoins = async (_req: any, res: any) => {
  try {
    const coinProvider = CoinProvider.getInstance();
    if (coinProvider) {
      res.status(200).send(await coinProvider.fetchCoinGeckoMissingCoins());
    } else {
      res.status(503).send("Something wrong with CoinProvider");
    }
  } catch (error) {
    console.error("Error retrieving coins from Coin Gecko Missing Db:", error);
    res
      .status(500)
      .send(
        "An error occurred while fetching coins from Coin Gecko Missing Db."
      );
  }
};
// #endregion

// #region SANTIMENT MISSING
export const getSantimentMissingCoins = async (_req: any, res: any) => {
  try {
    const coinProvider = CoinProvider.getInstance();
    if (coinProvider) {
      res.status(200).send(await coinProvider.fetchSantimentMissingCoins());
    } else {
      res.status(503).send("Something wrong with CoinProvider");
    }
  } catch (error) {
    console.error("Error retrieving coins from Santiment Missing Db:", error);
    res
      .status(500)
      .send(
        "An error occurred while fetching coins from Santiment Missing Db."
      );
  }
};
// #endregion
