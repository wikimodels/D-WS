// deno-lint-ignore-file no-explicit-any

import { AlertOperator } from "../../global/alert/alert-operator.ts";
import type { Alert } from "../../models/alerts/alert.ts";

export const getAllAlerts = async (req: any, res: any) => {
  try {
    const collectionName = req.query.collectionName;
    const alerts = await AlertOperator.getAllAlerts(collectionName);
    if (alerts) {
      res.status(200).send(alerts);
    } else {
      res.status(503).send("AlertOperator not initialized yet");
    }
  } catch (error) {
    console.error("Error retrieving alerts:", error);
    res.status(500).send("An error occurred while fetching alerts.");
  }
};

export const deleteAlerts = async (req: any, res: any) => {
  const { ids } = req.body;
  const { collectionName } = req.query;
  if (!ids || !collectionName || !Array.isArray(ids)) {
    return res
      .status(400)
      .send(
        "Bad Request: 'ids' must be an array of strings. 'collectionName' must be a string."
      );
  }

  try {
    const result = await AlertOperator.deleteAlerts(collectionName, ids);
    if (!result.deleted) {
      return res.status(404).send(`Something went wrong with deletion.`);
    }

    res.status(200).send(result);
  } catch (error) {
    console.error("Error deleting alerts:", error);
    res
      .status(500)
      .send("An internal server error occurred while deleting the alerts.");
  }
};

export const addAlert = async (req: any, res: any) => {
  const alert: Alert = req.body;
  const collectionName = req.query.collectionName;
  if (!alert || !collectionName) {
    return res
      .status(400)
      .send(
        "Bad Request: Invalid update parameters (either 'alert' or 'collectionName')"
      );
  }

  try {
    const insertResult = await AlertOperator.addAlert(collectionName, alert);
    res.status(200).send(insertResult);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error saving the alert to the database");
  }
};

export const updateAlert = async (req: any, res: any) => {
  const alert: Alert = req.body;
  const collectionName = req.query.collectionName;

  if (!alert || !alert.id || !collectionName) {
    return res
      .status(400)
      .send(
        "Bad Request: Invalid update parameters (either 'alert' or 'collectionName')"
      );
  }

  try {
    const modiyResult = await AlertOperator.updateAlert(collectionName, alert);
    res.status(200).send(modiyResult);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error saving the alert to the database");
  }
};

export const moveAlerts = async (req: any, res: any) => {
  const alerts = req.body;
  const sourceCollection = req.query.sourceCollection;
  const targetCollection = req.query.targetCollection;
  if (
    !alerts ||
    !sourceCollection ||
    !targetCollection ||
    !Array.isArray(alerts)
  ) {
    return res
      .status(400)
      .send(
        "Bad Request: 'alerts' must be an array of alert object. 'sourceCollection' must be a string. 'targetCollection' must be a string"
      );
  }

  try {
    const result = await AlertOperator.moveAlerts(
      sourceCollection,
      targetCollection,
      alerts
    );

    if (!result.moved) {
      return res.status(404).send(`Something went wrong with moving.`);
    }

    res.status(200).send(result);
  } catch (error) {
    console.error("Error deleting alert:", error);
    res
      .status(500)
      .send("An internal server error occurred while deleting the alert.");
  }
};
