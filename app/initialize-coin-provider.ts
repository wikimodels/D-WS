import { CoinProvider } from "../global/coins/coin-provider.ts";

const initializeCoinProveider = async () => {
  try {
    await CoinProvider.initializeFromDb();
    const provider = CoinProvider.getInstance();
    await provider.scheduleRefresh();
  } catch (error) {
    console.error("Failed to initialize CoinRepository:", error);
    throw error;
  }
};

export default initializeCoinProveider;
