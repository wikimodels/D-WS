// deno-lint-ignore-file no-explicit-any
import { deleteTriggeredAlertBatch } from "../functions/kv-db/alerts-crud/triggered-alerts/delete-triggered-alert-Batch.ts";
import { fetchAllTriggeredAlert } from "../functions/kv-db/alerts-crud/triggered-alerts/fetch-all-triggered-alert.ts";

export const getAllTriggeredAlerts = () => async (_req: any, res: any) => {
  try {
    const response = await fetchAllTriggeredAlert();
    res.status(200).send(response);
  } catch (error) {
    console.error("Error fetching triggered alerts:", error);
    res.status(500).send({ error: "Failed to fetch triggered alerts." });
  }
};

export const removeTriggeredAlertBatch = () => async (req: any, res: any) => {
  try {
    const ids: string[] = req.body;
    const response = await deleteTriggeredAlertBatch(ids);
    res.status(200).send(response);
  } catch (error) {
    console.error("Error deleting triggered alert batch:", error);
    res.status(500).send({ error: "Failed to delete triggered alert batch." });
  }
};
