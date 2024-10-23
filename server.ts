// deno-lint-ignore-file no-explicit-any no-unused-vars
import express from "npm:express@4.18.2";
import cors from "npm:cors";
import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";

import { DColors } from "./models/shared/colors.ts";
import { runWsMain } from "./ws/ws-main.ts";
import {
  getAlertsRepo,
  initializeAlertsRepo,
} from "./global/alerts/initialize-alerts-repo.ts";
import { TF } from "./models/shared/timeframes.ts";
import { AlertObj } from "./models/alerts/alert-obj.ts";
import { deleteAllAlertObjs } from "./functions/kv-db/alerts-crud/alerts/delete-all-alert-objs.ts";
import { createAlertObj } from "./functions/kv-db/alerts-crud/alerts/create-alert-obj.ts";
import { getAllAlertObjs } from "./functions/kv-db/alerts-crud/alerts/get-all-alert-objs.ts";
import { updateAlertObj } from "./functions/kv-db/alerts-crud/alerts/update-alert-obj.ts";
import { deleteAlertsButch } from "./functions/kv-db/alerts-crud/alerts/delete-alerts-butch.ts";
import { cronTaskUpdateAlertsRepo } from "./functions/cron-tasks/update-alerts-repo.ts";
import { addCoinExchange } from "./global/coins/add-coin-exchange.ts";
import { addLinks } from "./global/coins/add-links.ts";
import {
  getCoinsRepo,
  initializeCoinsRepo,
} from "./global/coins/coins-repo.ts";
import { addCoinCategory } from "./global/coins/add-coin-category.ts";
import { deleteAllTriggeredAlertObjs } from "./functions/kv-db/alerts-crud/triggered-alerts/delete-all-triggered-alert-objs%20copy.ts";
import { deleteTriggeredAlertsButch } from "./functions/kv-db/alerts-crud/triggered-alerts/delete-triggered-alerts-butch.ts";
import { UnixToTime } from "./functions/utils/time-converter.ts";
import { createAlertButch } from "./functions/kv-db/alerts-crud/alerts/create-alert-butch.ts";
import { getAllArchivedAlertObjs } from "./functions/kv-db/alerts-crud/archived-alerts/get-all-archived-alert-objs.ts";
import { createArchivedAlertObj } from "./functions/kv-db/alerts-crud/archived-alerts/create-archived-alert-obj.ts";
import { deleteArchivedAlertsButch } from "./functions/kv-db/alerts-crud/archived-alerts/delete-archived-alerts-butch.ts";
import { deleteAllArchivedAlertObjs } from "./functions/kv-db/alerts-crud/archived-alerts/delete-all-archived-alert-objs.ts";
import { getAlertByKeyLevelName } from "./functions/kv-db/alerts-crud/alerts/get-alert-by-key-level-name.ts";
import { saveTriggeredAlertObj } from "./functions/kv-db/alerts-crud/triggered-alerts/save-triggered-alert-obj.ts";
import { sendTgKeyLevelBreakMessage } from "./functions/tg/key-level-break/send-tg-key-level-break-msg.ts";
import { Status } from "https://deno.land/std@0.92.0/http/http_status.ts";
import { getAllTriggeredAlertObjs } from "./functions/kv-db/alerts-crud/triggered-alerts/get-all-triggered-alert-objs.ts";

const env = await load();
export const app = express();
app.use(express.json());
const lastAlertTimestamps: { [key: string]: number } = {}; // Store timestamp of the last processed request
const cooldownTime = 20000; // Cooldown period in milliseconds (e.g., 10 seconds)
const allowedOrigins = [env["ORIGIN_I"], env["ORIGIN_II"]];

app.use(
  cors({
    origin: allowedOrigins,
  })
);

app.get("/get-all-coins", (req: any, res: any) => {
  const coins = getCoinsRepo();
  res.send(coins);
});

app.get("/get-alerts-repo", (req: any, res: any) => {
  const repo = getAlertsRepo();
  res.send(repo);
});

app.get("/update-coins-repo", async (req: any, res: any) => {
  await initializeCoinsRepo();
  res.send("OK");
});

//----------------------------------------
// ✅ Tv TRIGGERED LERTS
//----------------------------------------
app.post("/create-triggered-tv-alert", async (req: any, res: any) => {
  const currentTimestamp = Date.now();
  const data: { keyLevelName: string; symbol: string } = req.body;
  const symbol = data.symbol || "unknown";
  const alert = await getAlertByKeyLevelName(data);
  if (
    !lastAlertTimestamps[symbol] ||
    currentTimestamp - lastAlertTimestamps[symbol] > cooldownTime
  ) {
    // Update the last processed timestamp for this symbol
    lastAlertTimestamps[symbol] = currentTimestamp;
    if (alert) {
      alert.activationTime = new Date().getTime();
      alert.activationTimeStr = UnixToTime(new Date().getTime());
      console.log("TRIGGERED ALert", alert);
      await saveTriggeredAlertObj(alert);
      await sendTgKeyLevelBreakMessage(alert);
      // Assuming you're using Status.OK from an external library
      res.status(200).send("Alert processed successfully.");
    }
  } else {
    // Ignore this request if it's within the cooldown period
    console.log("Duplicate alert ignored.");
    res.status(200).send("Duplicate alert ignored.");
  }

  res.sendStatus(Status.BadRequest);
});

//----------------------------------------
// ✅ ALERTS
//----------------------------------------
app.post("/create-alert", async (req: any, res: any) => {
  const coins = getCoinsRepo();
  let alert: AlertObj = req.body;
  console.log(alert);
  alert.id = crypto.randomUUID();
  alert.creationTime = new Date().getTime();
  alert.isActive = true;
  alert.isTv = false;
  alert = addCoinExchange(coins, alert);
  alert = addLinks(alert);
  alert = addCoinCategory(coins, alert);
  alert.activationTimeStr = UnixToTime(new Date().getTime());

  const response = await createAlertObj(alert);
  res.send(response);
});

app.post("/create-alert-butch", async (req: any, res: any) => {
  const coins = getCoinsRepo();
  const alerts: AlertObj[] = req.body;
  const response = await createAlertButch(alerts, coins);
  res.send(response);
});

app.get("/get-all-alerts", async (req: any, res: any) => {
  const _res = await getAllAlertObjs();
  res.send(_res);
});

app.post("/update-alert", async (req: any, res: any) => {
  const obj: AlertObj = req.body;
  const _res = await updateAlertObj(obj);
  res.send(_res);
});

app.get("/delete-all-alerts", async (req: any, res: any) => {
  const _res = await deleteAllAlertObjs();
  res.send(_res);
});

app.post("/delete-alerts-butch", async (req: any, res: any) => {
  const ids: string[] = req.body;
  //TODO:
  console.log(ids);
  const _res = await deleteAlertsButch(ids);
  res.send(_res);
});

//----------------------------------------
// ✅ TRIGGERED ALERTS
//----------------------------------------
app.get("/get-all-triggered-alerts", async (req: any, res: any) => {
  const _res = await getAllTriggeredAlertObjs();
  res.send(_res);
});

app.post("/delete-triggered-alerts-butch", async (req: any, res: any) => {
  const ids: string[] = req.body;
  //TODO:
  console.log("delete-triggered-alerts-butch ========>", ids);
  const _res = await deleteTriggeredAlertsButch(ids);
  res.send(_res);
});

app.get("/delete-all-triggered-alerts", async (req: any, res: any) => {
  const _res = await deleteAllTriggeredAlertObjs();
  res.send(_res);
});

//----------------------------------------
// ✅ ARCHIVED ALERTS
//----------------------------------------
app.get("/get-all-archived-alerts", async (req: any, res: any) => {
  const _res = await getAllArchivedAlertObjs();
  res.send(_res);
});

app.post("/create-archived-alert", async (req: any, res: any) => {
  const alert: AlertObj = req.body;
  const response = await createArchivedAlertObj(alert);
  res.send(response);
});

app.post("/delete-archived-alerts-butch", async (req: any, res: any) => {
  const ids: string[] = req.body;
  const _res = await deleteArchivedAlertsButch(ids);
  res.send(_res);
});

app.get("/delete-all-archived-alerts", async (req: any, res: any) => {
  const _res = await deleteAllArchivedAlertObjs();
  res.send(_res);
});

//----------------------------------------
// ✅ INFRUSTRUCTURE
//----------------------------------------

app.listen({ port: 80 }, "0.0.0.0", async () => {
  await initializeCoinsRepo();

  const timeframe = TF.m1;
  console.log("%cServer ---> running...", DColors.green);
  runWsMain(timeframe);
  initializeAlertsRepo();
  cronTaskUpdateAlertsRepo();
});
