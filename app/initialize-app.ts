// initialize-app.ts
import express, { Application } from "npm:express@4.18.2";
import cors from "npm:cors";
import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts"; //

import binanceWsRoutes from "../routes/ws/binance-ws.routes.ts";
import bybitWsRoutes from "../routes/ws/bybit-ws.routes.ts";
import alertsRoutes from "../routes/alerts/alerts-operator.routes.ts";
import alertsTvRoutes from "../routes/alerts/alerts-tv-operator.routes.ts";
import coinsOperatorRoutes from "../routes/coins/coins-operator.routes.ts";
import coinsProviderRoutes from "../routes/coins/coins-provider.routes.ts";

const { ORIGIN_I, ORIGIN_II } = await load();
const allowedOrigins = [ORIGIN_I, ORIGIN_II];

const initializeApp = (): Promise<Application> => {
  const app = express();

  app.use(express.json());
  app.use(
    cors({
      origin: allowedOrigins,
    })
  );

  // Register routes
  app.use("/api", binanceWsRoutes);
  app.use("/api", bybitWsRoutes);
  app.use("/api", alertsRoutes);
  app.use("/api", coinsProviderRoutes);
  app.use("/api", coinsOperatorRoutes);
  app.use("/api", alertsTvRoutes);

  return app;
};

export default initializeApp;
