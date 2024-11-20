// deno-lint-ignore-file no-explicit-any
import { SantimentProvider } from "../../global/santiment/santiment-provider.ts";

export const getSantimentEChartsData = async (req: any, res: any) => {
  try {
    const symbol = req.query.symbol;

    if (!symbol) {
      return res
        .status(400)
        .json({ message: "Bad Request: Invalid query parameters ('symbol')" });
    }

    const result = await SantimentProvider.getEChartOptionsBySymbol(symbol);

    if (result) {
      return res.status(200).json(result); // return as JSON response
    } else {
      // 404 Not Found is more appropriate if no data is found for the symbol
      return res
        .status(404)
        .json({ message: `Data for symbol '${symbol}' not found.` });
    }
  } catch (error) {
    console.error("Error retrieving Santiment EChart Options:", error);
    return res.status(500).json({
      message: "An error occurred while fetching data from Santiment.",
    });
  }
};

export const getSantimentDataMissingCoins = async (_req: any, res: any) => {
  try {
    const result = await SantimentProvider.findCoinsWithSantimentDataMissing();

    if (result) {
      return res.status(200).json(result); // return as JSON response
    } else {
      // 404 Not Found is more appropriate if no data is found for the symbol
      return res.status(404).json({ message: `Data not found.` });
    }
  } catch (error) {
    console.error("Error retrieving Santiment Data Missing Coins", error);
    return res.status(500).json({
      message: "An error occurred while fetching Santiment Data Missing Coins.",
    });
  }
};
