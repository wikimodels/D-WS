// deno-lint-ignore-file no-explicit-any
import { createAlertButch } from "../functions/kv-db/alerts-crud/alerts/create-alert-butch.ts";
import { createAlertObj } from "../functions/kv-db/alerts-crud/alerts/create-alert-obj.ts";
import { deleteAlertsButch } from "../functions/kv-db/alerts-crud/alerts/delete-alerts-butch.ts";
import { deleteAllAlert } from "../functions/kv-db/alerts-crud/alerts/delete-all-alert.ts";
import { fetchAllAlerts } from "../functions/kv-db/alerts-crud/alerts/fetch-all-alert.ts";

import { updateAlert } from "../functions/kv-db/alerts-crud/alerts/update-alert.ts";
import { UnixToTime } from "../functions/utils/time-converter.ts";
import { addCoinCategory } from "../global/coins/add-coin-category.ts";
import { addCoinExchange } from "../global/coins/add-coin-exchange.ts";
import { addLinks } from "../global/coins/add-links.ts";
import { CoinRepository } from "../global/coins/coin-repository.ts";
import type { AlertObj } from "../models/alerts/alert-obj.ts";
import type { Coin } from "../models/shared/coin.ts";

// export const addAlert = () => async (req: any, res: any) => {
//   try {
//     const coinsRepo = CoinRepository.getInstance();
//     const coins = coinsRepo.getAllCoins();

//     let alert: AlertObj = req.body;
//     alert.id = crypto.randomUUID();
//     alert.creationTime = new Date().getTime();
//     alert.isActive = true;
//     alert.isTv = false;
//     alert = addCoinExchange(coins, alert);
//     alert = addLinks(alert);
//     alert = addCoinCategory(coins, alert);
//     alert.activationTimeStr = UnixToTime(new Date().getTime());

//     const response = await createAlertObj(alert);
//     res.status(201).send(response); // Use 201 for created resource
//   } catch (error) {
//     console.error("Error adding alert:", error);
//     res.status(500).send({ error: "Failed to add alert." });
//   }
// };

// export const addAlertButch = () => async (req: any, res: any) => {
//   try {
//     const coins: Coin[] = [];
//     const alerts: AlertObj[] = req.body;
//     const response = await createAlertButch(alerts, coins);
//     res.status(201).send(response);
//   } catch (error) {
//     console.error("Error adding alert batch:", error);
//     res.status(500).send({ error: "Failed to add alert batch." });
//   }
// };

export const getAllAlerts = async (_req: any, res: any) => {
  try {
    //TODO:
    console.log("getAllAlerts.controller --> running");
    const result = await fetchAllAlerts();
    res.status(200).send(result);
  } catch (error) {
    console.error("Error fetching all alerts:", error);
    res.status(500).send({ error: "Failed to fetch alerts." });
  }
};

// export const modifyAlert = () => async (req: any, res: any) => {
//   try {
//     const obj: AlertObj = req.body;
//     const response = await updateAlert(obj);
//     res.status(200).send(response);
//   } catch (error) {
//     console.error("Error modifying alert:", error);
//     res.status(500).send({ error: "Failed to modify alert." });
//   }
// };

// export const removeAllAlerts = () => async (_req: any, res: any) => {
//   try {
//     const response = await deleteAllAlert();
//     res.status(200).send(response);
//   } catch (error) {
//     console.error("Error deleting all alerts:", error);
//     res.status(500).send({ error: "Failed to delete all alerts." });
//   }
// };

// export const removeAlertButch = () => async (req: any, res: any) => {
//   try {
//     const ids: string[] = req.body;
//     const response = await deleteAlertsButch(ids);
//     res.status(200).send(response);
//   } catch (error) {
//     console.error("Error deleting alert batch:", error);
//     res.status(500).send({ error: "Failed to delete alert batch." });
//   }
// };

// Exporting the functions
