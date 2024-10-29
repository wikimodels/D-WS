import { deleteAlertsButchFromArchive } from "../functions/kv-db/alerts-crud/archived-alerts/delete-alert-butch-from-archive.ts";
import { deleteAllAlertsFromArchive } from "../functions/kv-db/alerts-crud/archived-alerts/delete-all-alerts-from-archive.ts";
import { fetchAllArchivedAlerts } from "../functions/kv-db/alerts-crud/archived-alerts/fetch-all-archived-alerts.ts";
import { moveAlertToArchive } from "../functions/kv-db/alerts-crud/archived-alerts/move-alert-to-archive.ts";
import { updateAlertInArchive } from "../functions/kv-db/alerts-crud/archived-alerts/update-archived-alert-obj.ts";
import type { AlertObj } from "../models/alerts/alert-obj.ts";

export const getAllArchivedAlerts = async (_req: any, res: any) => {
  try {
    const response = await fetchAllArchivedAlerts();
    res.status(201).send(response); // 201 indicates a successful creation
  } catch (error) {
    console.error("Error archiving alert:", error);
    res.status(500).send({ error: "Failed to archive alert." });
  }
};

export const sendAlertToArchive = async (req: any, res: any) => {
  try {
    const alert: AlertObj = req.body;
    const response = await moveAlertToArchive(alert);
    res.status(201).send(response); // 201 indicates a successful creation
  } catch (error) {
    console.error("Error archiving alert:", error);
    res.status(500).send({ error: "Failed to archive alert." });
  }
};

export const removeAlertButchFromArchive = async (req: any, res: any) => {
  try {
    const ids: string[] = req.body;
    const response = await deleteAlertsButchFromArchive(ids);
    res.status(200).send(response); // 200 for successful deletion
  } catch (error) {
    console.error("Error deleting alert batch from archive:", error);
    res
      .status(500)
      .send({ error: "Failed to delete alert batch from archive." });
  }
};

export const removeAllAlertsFromArchive = async (_req: any, res: any) => {
  try {
    const response = await deleteAllAlertsFromArchive();
    res.status(200).send(response);
  } catch (error) {
    console.error("Error deleting all alerts from archive:", error);
    res
      .status(500)
      .send({ error: "Failed to delete all alerts from archive." });
  }
};

export const updateArchivedAlert = async (req: any, res: any) => {
  try {
    const alert: AlertObj = req.body;
    const response = await updateAlertInArchive(alert);
    res.status(200).send(response); // 200 for successful update
  } catch (error) {
    console.error("Error updating archived alert:", error);
    res.status(500).send({ error: "Failed to update archived alert." });
  }
};
