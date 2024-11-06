import { CoinRepository } from "../global/coins/coin-repository.ts";

const initializeCoinRepository = () => {
  try {
    const coinRepo = CoinRepository.initializeInstance();
    coinRepo.scheduleRefresh();
  } catch (error) {
    console.error("Failed to initialize CoinRepository:", error);
    throw error;
  }
};

export default initializeCoinRepository;
