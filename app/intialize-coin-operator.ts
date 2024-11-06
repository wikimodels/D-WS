import { CoinOperator } from "./../global/coins/coin-operator.ts";

const initializeCoinOperator = async () => {
  try {
    await CoinOperator.initializeInstance();
  } catch (error) {
    console.error("Failed to initialize CoinOperator:", error);
    throw error;
  }
};

export default initializeCoinOperator;
