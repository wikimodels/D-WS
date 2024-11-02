import { CoinRepository } from "./global/coins/coin-repository.ts";

await CoinRepository.initializeFromDb();

const coinRefresh = CoinRefresh.getInstance();
coinRefresh.scheduleRefresh();
