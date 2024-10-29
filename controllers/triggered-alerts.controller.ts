import { deleteTriggeredAlertButch } from "../functions/kv-db/alerts-crud/triggered-alerts/delete-triggered-alert-butch.ts";
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

export const removeTriggeredAlertButch = () => async (req: any, res: any) => {
  try {
    const ids: string[] = req.body;
    const response = await deleteTriggeredAlertButch(ids);
    res.status(200).send(response);
  } catch (error) {
    console.error("Error deleting triggered alert batch:", error);
    res.status(500).send({ error: "Failed to delete triggered alert batch." });
  }
};
