import { AlertTvOperator } from "../global/alert/alert-tv-operator.ts";

const initializeAlertTvOperator = async () => {
  try {
    await AlertTvOperator.initializeInstance();
    AlertTvOperator.startLoggingAlerts();
  } catch (error) {
    console.error("Failed to initialize CoinOperator:", error);
    throw error;
  }
};

export default initializeAlertTvOperator;
