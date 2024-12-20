import { AlertTvOperator } from "../global/alert/alert-tv-operator.ts";

const initializeAlertTvOperator = async () => {
  try {
    await AlertTvOperator.initializeInstance();
  } catch (error) {
    console.error("Failed to initialize AlertTvOperator:", error);
    throw error;
  }
};

export default initializeAlertTvOperator;
