// deno-lint-ignore-file no-explicit-any
import express from "npm:express@4.18.2";
import cors from "npm:cors";
import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";

import { DColors } from "./models/shared/colors.ts";
import { runWsMain } from "./ws/ws-main.ts";
import { getAllCoins } from "./global/coins/get-all-coins.ts";
import { initializeAlertsRepo } from "./global/alerts/initialize-alerts-repo.ts";
import { TF } from "./models/shared/timeframes.ts";

const env = await load();
export const app = express();
app.use(express.json());

const allowedOrigins = [env["ORIGIN_I"], env["ORIGIN_II"]];

app.use(
  cors({
    origin: allowedOrigins,
  })
);

app.listen({ port: 80 }, async () => {
  const timeframe = TF.m1;
  console.log("%cServer ---> running...", DColors.green);
  const coins = await getAllCoins();
  runWsMain(coins, timeframe);
  initializeAlertsRepo(coins);
});
