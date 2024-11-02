import { CoinRepository } from "../global/coins/coin-repository.ts";

const initializeCoinRepository = async () => {
  try {
    await CoinRepository.initializeFromDb();
  } catch (error) {
    console.error("Failed to initialize CoinRepository:", error);
    throw error;
  }
};

export default initializeCoinRepository;
