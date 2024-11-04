// deno-lint-ignore-file no-explicit-any no-unused-vars
import express from "npm:express@4.18.2";
import cors from "npm:cors";
import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";

import coinRoutes from "./routes/coins/coins.routes.ts";
import binanceWsRoutes from "./routes/binance-ws.routes.ts";
import bybitWsRoutes from "./routes/bybit-ws.routes.ts";

import { DColors } from "./models/shared/colors.ts";
import { initializeAlertsRepo } from "./global/alerts/initialize-alerts-repo.ts";
import { TF } from "./models/shared/timeframes.ts";
import { AlertObj } from "./models/alerts/alert-obj.ts";
import { deleteAllAlertObjs } from "./functions/kv-db/alerts-crud/alerts/delete-all-alert.ts";
import { createAlertObj } from "./functions/kv-db/alerts-crud/alerts/create-alert-obj.ts";
import { getAllAlertObjs } from "./functions/kv-db/alerts-crud/alerts/fetch-all-alert.ts";
import { updateAlertObj } from "./functions/kv-db/alerts-crud/alerts/update-alert.ts";
import { deleteAlertsBatch } from "./functions/kv-db/alerts-crud/alerts/delete-alerts-Batch.ts";

import { addCoinExchange } from "./global/coins/add-coin-exchange.ts";
import { addLinks } from "./global/coins/add-links.ts";

import { addCoinCategory } from "./global/coins/add-coin-category.ts";
import { deleteAllTriggeredAlertObjs } from "./functions/kv-db/alerts-crud/triggered-alerts/delete-all-triggered-alert-ob.ts";
import { deleteTriggeredAlertsBatch } from "./functions/kv-db/alerts-crud/triggered-alerts/delete-triggered-alert-Batch.ts";
import { UnixToTime } from "./functions/utils/time-converter.ts";
import { createAlertBatch } from "./functions/kv-db/alerts-crud/alerts/create-alert-Batch.ts";
import { getAllArchivedAlertObjs } from "./functions/kv-db/alerts-crud/archived-alerts/fetch-all-archived-alerts.ts";
import { createArchivedAlertObj } from "./functions/kv-db/alerts-crud/archived-alerts/move-alert-to-archive.ts";
import { deleteArchivedAlertsBatch } from "./functions/kv-db/alerts-crud/archived-alerts/delete-alert-Batch-from-archive.ts";
import { deleteAllArchivedAlertObjs } from "./functions/kv-db/alerts-crud/archived-alerts/delete-all-alerts-from-archive.ts";

import { getAllTriggeredAlertObjs } from "./functions/kv-db/alerts-crud/triggered-alerts/fetch-all-triggered-alert.ts";
import { getKlineRepoStateLog } from "./functions/kv-db/ws-health/get-kline-repo-state-log.ts";
import { cleanKlineRepoStateLog } from "./functions/kv-db/ws-health/clean-kline-repo-state-log.ts";
import { getAllWorkingCoins } from "./functions/kv-db/working-coins/fetch-all-coins-at-work.ts";
import { deleteAllWorkingCoins } from "./functions/kv-db/working-coins/remove-all-coins-from-work.ts";
import type { Coin } from "./models/shared/coin.ts";
import { addWorkingCoins } from "./functions/kv-db/working-coins/contirbute-coins-to-work.ts";
import { deleteWorkingCoinsBatch } from "./functions/kv-db/working-coins/remove-coin-Batch-from-work.ts";
import { CoinRepository } from "./global/coins/coin-repository.ts";

const { ORIGIN_I, ORIGIN_II } = await load();
const allowedOrigins = [ORIGIN_I, ORIGIN_II];

export const app = express();

async function initializeApp() {
  await CoinRepository.initializeFromDb();
  console.log("CoinRepository successfully initialized");
  app.use(express.json());
  app.use(
    cors({
      origin: allowedOrigins,
    })
  );
  app.use("/api", coinRoutes);
  app.use("/api", binanceWsRoutes);
  app.use("/api", bybitWsRoutes);

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
}

initializeApp();
