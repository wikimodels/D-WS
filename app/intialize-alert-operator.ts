import { AlertOperator } from "../global/alert/alert-operator.ts";

const initializeAlertOperator = async () => {
  try {
    await AlertOperator.initializeInstance();
  } catch (error) {
    console.error("Failed to initialize CoinOperator:", error);
    throw error;
  }
};

export default initializeAlertOperator;
