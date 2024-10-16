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
import { saveAlertObj } from "./functions/kv-db/alerts-crud/alerts/save-alert-obj.ts";
import { getAllAlertObjs } from "./functions/kv-db/alerts-crud/alerts/get-all-alert-objs.ts";
import { getAlertObjById } from "./functions/kv-db/alerts-crud/alerts/get-alert-obj-by-id.ts";
import { updateAlertObj } from "./functions/kv-db/alerts-crud/alerts/update-alert-obj.ts";
import { deleteAlertObj } from "./functions/kv-db/alerts-crud/alerts/delete-alert-obj.ts";
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

const env = await load();
export const app = express();
app.use(express.json());

const allowedOrigins = [env["ORIGIN_I"], env["ORIGIN_II"]];

app.use(
  cors({
    origin: allowedOrigins,
  })
);

app.post("/create-alert", async (req: any, res: any) => {
  const coins = getCoinsRepo();
  let alert: AlertObj = req.body;

  alert.id = crypto.randomUUID();
  alert.creationTime = new Date().getTime();
  alert = addCoinExchange(coins, alert);
  alert = addLinks(alert);
  alert = addCoinCategory(coins, alert);

  await saveAlertObj(alert);
  res.send(alert);
});

app.get("/get-all-alerts", async (req: any, res: any) => {
  const _res = await getAllAlertObjs();
  res.send(_res);
});

app.get("/get-all-triggered-alerts", async (req: any, res: any) => {
  const _res = await getAllAlertObjs();
  res.send(_res);
});

app.post("/get-alert-by-id", async (req: any, res: any) => {
  const id = req.body.id;
  const _res = await getAlertObjById(id);
  res.send(_res);
});

app.get("/get-alerts-repo", (req: any, res: any) => {
  const repo = getAlertsRepo();
  res.send(repo);
});

app.post("/update-alert", async (req: any, res: any) => {
  const obj: AlertObj = req.body;
  const _res = await updateAlertObj(obj);
  res.send(_res);
});

app.get("/update-coins-repo", async (req: any, res: any) => {
  await initializeCoinsRepo();
  res.send("OK");
});

app.post("/delete-alert-by-id", async (req: any, res: any) => {
  const id = req.body.id;
  const _res = await deleteAlertObj(id);
  res.send(_res);
});

app.get("/delete-all-alerts", async (req: any, res: any) => {
  const _res = await deleteAllAlertObjs("Alerts");
  res.send(_res);
});

app.get("/delete-all-triggered-alerts", async (req: any, res: any) => {
  const _res = await deleteAllTriggeredAlertObjs();
  res.send(_res);
});

app.post("/delete-alerts-butch", async (req: any, res: any) => {
  const ids: string[] = req.body;
  const _res = await deleteAlertsButch(ids);
  res.send(_res);
});

app.post("/delete-triggered-alerts-butch", async (req: any, res: any) => {
  const ids: string[] = req.body;
  const _res = await deleteTriggeredAlertsButch(ids);
  res.send(_res);
});

app.listen({ port: 80 }, async () => {
  await initializeCoinsRepo();

  const timeframe = TF.m1;
  console.log("%cServer ---> running...", DColors.green);
  runWsMain(timeframe);
  initializeAlertsRepo();
  cronTaskUpdateAlertsRepo();
});
