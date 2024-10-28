// deno-lint-ignore-file no-explicit-any no-unused-vars
import express from "npm:express@4.18.2";
import cors from "npm:cors";
import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";

import { DColors } from "./models/shared/colors.ts";
import { initializeAlertsRepo } from "./global/alerts/initialize-alerts-repo.ts";
import { TF } from "./models/shared/timeframes.ts";
import { AlertObj } from "./models/alerts/alert-obj.ts";
import { deleteAllAlertObjs } from "./functions/kv-db/alerts-crud/alerts/delete-all-alert-objs.ts";
import { createAlertObj } from "./functions/kv-db/alerts-crud/alerts/create-alert-obj.ts";
import { getAllAlertObjs } from "./functions/kv-db/alerts-crud/alerts/get-all-alert-objs.ts";
import { updateAlertObj } from "./functions/kv-db/alerts-crud/alerts/update-alert-obj.ts";
import { deleteAlertsButch } from "./functions/kv-db/alerts-crud/alerts/delete-alerts-butch.ts";

import { addCoinExchange } from "./global/coins/add-coin-exchange.ts";
import { addLinks } from "./global/coins/add-links.ts";

import { addCoinCategory } from "./global/coins/add-coin-category.ts";
import { deleteAllTriggeredAlertObjs } from "./functions/kv-db/alerts-crud/triggered-alerts/delete-all-triggered-alert-objs%20copy.ts";
import { deleteTriggeredAlertsButch } from "./functions/kv-db/alerts-crud/triggered-alerts/delete-triggered-alerts-butch.ts";
import { UnixToTime } from "./functions/utils/time-converter.ts";
import { createAlertButch } from "./functions/kv-db/alerts-crud/alerts/create-alert-butch.ts";
import { getAllArchivedAlertObjs } from "./functions/kv-db/alerts-crud/archived-alerts/get-all-archived-alert-objs.ts";
import { createArchivedAlertObj } from "./functions/kv-db/alerts-crud/archived-alerts/create-archived-alert-obj.ts";
import { deleteArchivedAlertsButch } from "./functions/kv-db/alerts-crud/archived-alerts/delete-archived-alerts-butch.ts";
import { deleteAllArchivedAlertObjs } from "./functions/kv-db/alerts-crud/archived-alerts/delete-all-archived-alert-objs.ts";

import { getAllTriggeredAlertObjs } from "./functions/kv-db/alerts-crud/triggered-alerts/get-all-triggered-alert-objs.ts";
import { getKlineRepoStateLog } from "./functions/kv-db/ws-health/get-kline-repo-state-log.ts";
import { cleanKlineRepoStateLog } from "./functions/kv-db/ws-health/clean-kline-repo-state-log.ts";
import { getAllWorkingCoins } from "./functions/kv-db/working-coins/get-all-working-coins.ts";
import { deleteAllWorkingCoins } from "./functions/kv-db/working-coins/delete-all-working-coins.ts";
import type { Coin } from "./models/shared/coin.ts";
import { addWorkingCoins } from "./functions/kv-db/working-coins/add-working-coins.ts";
import { deleteWorkingCoinsButch } from "./functions/kv-db/working-coins/delete-working-coins-butch.ts";
import { getMongoDb } from "./global/mongodb/initialize-mongodb.ts";

import { BinanceWSConnManager } from "./ws/binance/bi-ws-conn-manager.ts";
import { BybitWSConnManager } from "./ws/bybit/by-ws-conn-manager.ts";
import { CoinRepository } from "./global/coins/coin-repository.ts";
import { updateAllBybitCoinCategories } from "./test.ts";

//INSERT
//new ObjectId("671f5144c83dbc1b90b38ff1")

//UPDATE
// {
//   upsertedId: undefined,
//   upsertedCount: 0,
//   matchedCount: 1,
//   modifiedCount: 1
// }
//DELETE
//1

const coin: Coin = {
  symbol: "SHITUSDT",
  turnover24h: 0,
  exchange: "by",
  category: "I",
  logo: "shit.svg",
  devAct: "www.shit.com",
  devActUrl: "www.shit.com",
  minQty: 1,
  minNotional: 2,
  tickSize: 3,
};
await CoinRepository.initializeFromDb();
const coinRepo = CoinRepository.getInstance();
const res = await coinRepo.addCoinToDb(coin);
console.log(res);
//const bybitWs = new BybitWSConnManager(coinRepo.getByCoins(), TF.m1);
//bybitWs.initializeConnections();

//const binanceWs = new BinanceWSConnManager(coinRepo.getBiCoins(), TF.m1);
//binanceWs.initializeConnections();

const env = await load();
export const app = express();
app.use(express.json());

const allowedOrigins = [env["ORIGIN_I"], env["ORIGIN_II"]];

app.use(
  cors({
    origin: allowedOrigins,
  })
);

app.get("/get-shit", async (req: any, res: any) => {
  const result = await coinRepo.updateAllBinanceCoinCategories();
  res.send(result);
});

//--------------------------------------
//  ✨ BYBIT WS
//--------------------------------------
app.get("/start-bybit-ws", (req: any, res: any) => {
  //bybitWs.startConnections();
  res.send("Bybit WS Connections started");
});

app.get("/close-bybit-ws", (req: any, res: any) => {
  //bybitWs.closeAllConnections();
  res.send("Bybit WS Connections closed");
});

app.get("/get-bybit-ws-status", (req: any, res: any) => {
  const status = bybitWs.getConnectionStatus();
  res.send(status);
});

//--------------------------------------
//  ✨ BINANCE WS
//--------------------------------------
app.get("/start-binance-ws", (req: any, res: any) => {
  //binanceWs.startConnections();
  //const status = binanceWs.getConnectionStatus();
  res.send("Binance WS Connections started");
});

app.get("/close-binance-ws", (req: any, res: any) => {
  //binanceWs.closeAllConnections();
  res.send("Binance WS Connections closed");
});

app.get("/get-binance-ws-status", (req: any, res: any) => {
  //const status = binanceWs.getConnectionStatus();
  res.send("OK");
});

//--------------------------------------
//  ✨ COINS REPO
//--------------------------------------

app.get("/get-all-coins", (req: any, res: any) => {
  const coins = getCoinsRepo();
  res.send(coins);
});

app.get("/update-coins-repo", async (req: any, res: any) => {
  res.send("CoinsRepo updated");
});

//----------------------------------------
// ✅ ALERTS
//----------------------------------------
app.post("/create-alert", async (req: any, res: any) => {
  const coins = [];
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
  const coins = [];
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
// ✅ WORKING COINS
//----------------------------------------
app.get("/get-all-working-coins", async (req: any, res: any) => {
  const _res = await getAllWorkingCoins();
  res.send(_res);
});

app.get("/delete-all-working-coins", async (req: any, res: any) => {
  const response = await deleteAllWorkingCoins();
  res.send(response);
});

app.post("/add-working-coins", async (req: any, res: any) => {
  const coins: Coin[] = req.body;
  const _res = await addWorkingCoins(coins);
  res.send(_res);
});

app.post("/delete-working-coins-butch", async (req: any, res: any) => {
  const coins: Coin[] = req.body;
  const _res = await deleteWorkingCoinsButch(coins);
  res.send(_res);
});

//----------------------------------------
// ✅ UTILS
//----------------------------------------
app.get("/get-kline-repo-state-log", async (req: any, res: any) => {
  const _res = await getKlineRepoStateLog();
  res.send(_res);
});

app.get("/clean-kline-repo-state-log", async (req: any, res: any) => {
  const _res = await cleanKlineRepoStateLog();
  res.send(_res);
});

//----------------------------------------
// ✅ INFRUSTRUCTURE
//----------------------------------------

app.listen({ port: 80 }, "0.0.0.0", async () => {
  const timeframe = TF.m1;
  console.log("%cServer ---> running...", DColors.green);
  //runWsMain(timeframe);
  initializeAlertsRepo();
  //cronTaskUpdateAlertsRepo();
});
