// deno-lint-ignore-file
import { CoinProvider } from "../../global/coins/coin-provider.ts";

export const runRefreshmentProcedure = async (_req: any, res: any) => {
  try {
    const coinProvider = CoinProvider.initializeInstance();
    if (coinProvider) {
      const result = await coinProvider.runRefreshmentPocedure();
      res.status(200).send(result);
    } else {
      res.status(503).send("CoinProvider not initialized yet");
    }
  } catch (error) {
    console.error("Error retrieving coins:", error);
    res.status(500).send("An error occurred while fetching coins.");
  }
};
