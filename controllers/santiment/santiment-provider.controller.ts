import { SantimentProvider } from "../../global/santiment/santiment-provider.ts";

export const getSantimentEChartsData = async (req: any, res: any) => {
  try {
    const { slug, symbol, fromDate, toDate } = req.query;

    if (!slug || !symbol || !fromDate || !toDate) {
      return res
        .status(400)
        .send(
          "Bad Request: Invalid query parameters ('slug', 'symbol', 'fromDate', 'toDate')"
        );
    }
    const result = await SantimentProvider.getSantimentEChartsData(
      slug,
      symbol,
      fromDate,
      toDate
    );
    if (result) {
      res.status(200).send(result);
    } else {
      res.status(503).send("Seems like SantimentProvider has problems");
    }
  } catch (error) {
    console.error("Error retrieving Santiment EChart Options:", error);
    res.status(500).send("An error occurred while fetching coins.");
  }
};
