import { AlertTvOperator } from "../global/alert/alert-tv-operator.ts";

const initializeAlertOperator = async () => {
  try {
    await AlertTvOperator.initializeInstance();
  } catch (error) {
    console.error("Failed to initialize CoinOperator:", error);
    throw error;
  }
};

export default initializeAlertOperator;
