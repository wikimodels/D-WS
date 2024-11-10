import { SantimentProvider } from "../global/santiment/santiment-provider.ts";

const initializeSantimentProvider = async () => {
  try {
    await SantimentProvider.initializeInstance();
  } catch (error) {
    console.error("Failed to initialize CoinOperator:", error);
    throw error;
  }
};

export default initializeSantimentProvider;
