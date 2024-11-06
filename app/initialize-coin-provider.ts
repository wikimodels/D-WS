import { CoinProvider } from "../global/coins/coin-provider.ts";

const initializeCoinProvider = async () => {
  try {
    const coinProivder = await CoinProvider.initializeInstance();
    await coinProivder.scheduleRefresh();
  } catch (error) {
    console.error("Failed to initialize CoinRepository:", error);
    throw error;
  }
};

export default initializeCoinProvider;
