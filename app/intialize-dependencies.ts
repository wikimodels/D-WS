import { CoinRepository } from "../global/coins/coin-repository.ts";
import { DColors } from "../models/shared/colors.ts";

const initializeCoinRepository = async () => {
  try {
    await CoinRepository.initializeFromDb();
    console.log("%cCoinRepository --> initialized", DColors.cyan);
  } catch (error) {
    console.error("Failed to initialize CoinRepository:", error);
    throw error;
  }
};

export default initializeCoinRepository;
